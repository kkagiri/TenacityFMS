/**
 * File: FmsApplicationBuilderExtensions.cs
 * Purpose: Configures the ASP.NET Core middleware pipeline and endpoint mappings for FMS WebClient.
 * Dependencies: ASP.NET Core hosting pipeline, SignalR hubs, DevExpress, Serilog
 * Last Modified: 2026-03-09
 *
 * Key Functions:
 * - UseFmsPipeline(): Applies middleware, diagnostics, and endpoint mappings.
 */
using System.Diagnostics;
using System.IO;
using Serilog;
using Serilog.Context;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Options;
using Microsoft.AspNetCore.Routing;
using Microsoft.AspNetCore.Http;
using FMS.Application.Communication.SignalR;
using FMS.Application.Configuration;
using FMS.WebClient.Util;
using DevExpress.AspNetCore;
using DevExpress.XtraReports.Web.Extensions;
using FMS.WebClient.Diagnostics;

namespace FMS.WebClient.Extensions;

public static class FmsApplicationBuilderExtensions
{
    public static WebApplication UseFmsPipeline(this WebApplication app)
    {
        var env = app.Environment;

        if (env.IsDevelopment())
        {
            app.UseDeveloperExceptionPage();
        }

        // Global exception handler - CRITICAL for logging unhandled exceptions
        app.UseExceptionHandler(errorApp =>
        {
            errorApp.Run(async context =>
            {
                var exceptionHandlerPathFeature = context.Features.Get<Microsoft.AspNetCore.Diagnostics.IExceptionHandlerPathFeature>();
                var exception = exceptionHandlerPathFeature?.Error;

                if (exception != null)
                {
                    Log.Error(exception, "UNHANDLED EXCEPTION: {Method} {Path} - {Message}",
                        context.Request.Method,
                        context.Request.Path,
                        exception.Message);
                }

                context.Response.StatusCode = 500;
                context.Response.ContentType = "application/json";

                var response = new
                {
                    success = false,
                    message = "An internal server error occurred.",
                    error = env.IsDevelopment() ? exception?.Message : null,
                    stackTrace = env.IsDevelopment() ? exception?.StackTrace : null
                };

                await context.Response.WriteAsJsonAsync(response);
            });
        });

        // Correlation + structured request logging
        app.Use(async (context, next) =>
        {
            var correlationId = context.Request.Headers["X-Correlation-ID"].FirstOrDefault() ?? Guid.NewGuid().ToString("n");
            LogContext.PushProperty("CorrelationId", correlationId);
            context.Response.Headers["X-Correlation-ID"] = correlationId;
            if (context.User?.Identity?.IsAuthenticated == true)
            {
                LogContext.PushProperty("UserId", context.User.FindFirst("sub")?.Value ?? context.User.Identity?.Name);
            }
            var sw = Stopwatch.StartNew();
            try
            {
                await next();

                // Log successful and error responses
                var level = context.Response.StatusCode >= 500 ? Serilog.Events.LogEventLevel.Error :
                           context.Response.StatusCode >= 400 ? Serilog.Events.LogEventLevel.Warning :
                           Serilog.Events.LogEventLevel.Information;

                Log.Write(level, "REQ {Method} {Path} -> {Status} {Elapsed}ms",
                    context.Request.Method,
                    context.Request.Path,
                    context.Response.StatusCode,
                    sw.ElapsedMilliseconds);
            }
            catch (Exception ex)
            {
                Log.Error(ex, "REQ {Method} {Path} failed after {Elapsed}ms - Exception: {ExceptionType} - {ErrorMessage}",
                    context.Request.Method,
                    context.Request.Path,
                    sw.ElapsedMilliseconds,
                    ex.GetType().Name,
                    ex.Message);
                throw;
            }
        });

        // Serve uploaded files from external storage (C:\FMSData\uploads) via static file middleware.
        // This is a secondary serving path at /uploads/ for direct access (e.g., during development).
        // Primary file access is through /api/v1/files/{path} (FileStorageController) which works
        // with IIS ARR reverse proxy that only routes /api/* requests to the backend.
        var fileStorageSettings = app.Services.GetService<IOptions<FileStorageSettings>>()?.Value;
        if (fileStorageSettings != null && Directory.Exists(fileStorageSettings.BasePath))
        {
            app.UseStaticFiles(new StaticFileOptions
            {
                FileProvider = new PhysicalFileProvider(fileStorageSettings.BasePath),
                RequestPath = "/uploads",
                ServeUnknownFileTypes = false,
                OnPrepareResponse = ctx =>
                {
                    // Require authentication for file access
                    if (ctx.Context.User?.Identity?.IsAuthenticated != true)
                    {
                        ctx.Context.Response.StatusCode = 401;
                        ctx.Context.Response.ContentLength = 0;
                        ctx.Context.Response.Body = Stream.Null;
                    }
                }
            });
            Log.Information("File storage serving enabled at /uploads from {BasePath}", fileStorageSettings.BasePath);
        }
        else
        {
            Log.Warning("File storage path not available: {BasePath}. Uploaded files will not be served.",
                fileStorageSettings?.BasePath ?? "(not configured)");
        }

        // Enable WebSockets for SignalR
        var webSocketOptions = new WebSocketOptions
        {
            KeepAliveInterval = TimeSpan.FromMinutes(2)
        };
        app.UseWebSockets(webSocketOptions);

        app.UseRouting();

        // DevExpress Web Reporting diagnostics (Development only)
        if (env.IsDevelopment())
        {
            app.UseMiddleware<DevExpressReportingDiagnosticsMiddleware>();
        }

        // DevExpress Reporting
        app.UseDevExpressControls();

        // CORS must be AFTER UseRouting() but BEFORE UseEndpoints() for SignalR hubs
        if (env.IsDevelopment())
        {
            Log.Information("Using DevelopmentCorsPolicy");
            app.UseCors("DevelopmentCorsPolicy");
        }
        else
        {
            Log.Information("Using ProductionCorsPolicy");
            app.UseCors("ProductionCorsPolicy");
        }

        // Handle preflight OPTIONS requests
        app.Use(async (ctx, next) =>
        {
            if (ctx.Request.Method == "OPTIONS")
            {
                ctx.Response.StatusCode = 200;
                await ctx.Response.CompleteAsync();
                return;
            }
            await next();
        });

        // Ensure CORS headers on all responses (including errors and successes)
        app.Use(async (ctx, next) =>
        {
            await next();

            // Add CORS headers if missing (for both error and success responses)
            if (!ctx.Response.HasStarted && !ctx.Response.Headers.ContainsKey("Access-Control-Allow-Origin"))
            {
                var origin = ctx.Request.Headers["Origin"].ToString();
                if (!string.IsNullOrEmpty(origin))
                {
                    ctx.Response.Headers.Append("Access-Control-Allow-Origin", origin);
                    ctx.Response.Headers.Append("Access-Control-Allow-Credentials", "true");
                    ctx.Response.Headers.Append("Access-Control-Allow-Headers", "*");
                    ctx.Response.Headers.Append("Access-Control-Allow-Methods", "*");
                    ctx.Response.Headers.Append("Access-Control-Expose-Headers", "X-Correlation-ID");

                    Log.Debug("Added CORS headers manually for {Path} (Status: {Status})",
                        ctx.Request.Path, ctx.Response.StatusCode);
                }
            }
        });

        app.UseAuthentication();
        app.UseAuthorization();
        app.UseUserActivity(); // extension on IApplicationBuilder

        // Map endpoints with explicit CORS
        app.UseEndpoints(endpoints =>
        {
            // Map API controllers (attribute-routed)
            endpoints.MapControllers();

            // Map default MVC controller route for DevExpress Reporting controllers
            // DevExpress controllers use conventional MVC routing pattern
            endpoints.MapControllerRoute(
                name: "default",
                pattern: "{controller=Home}/{action=Index}/{id?}");

            // Map SignalR hubs with CORS enabled
            var corsPolicy = env.IsDevelopment() ? "DevelopmentCorsPolicy" : "ProductionCorsPolicy";

            endpoints.MapHub<DashboardHub>("/dashboardHub")
                .RequireAuthorization()
                .RequireCors(corsPolicy);

            endpoints.MapHub<PTSHub>("/ptsHub")
                .RequireAuthorization()
                .RequireCors(corsPolicy);

            endpoints.MapHub<FrontEndHub>("/frontendHub")
                .RequireAuthorization()
                .RequireCors(corsPolicy);

            // Vehicle Tracking Hub - Real-time GPS updates from GPSGate RabbitMQ
            endpoints.MapHub<VehicleTrackingHub>("/vehicleTrackingHub")
                .RequireAuthorization()
                .RequireCors(corsPolicy);
        });

        return app;
    }
}
