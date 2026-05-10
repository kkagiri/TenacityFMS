using System;
using System.Diagnostics;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;

namespace FMS.WebClient.Middleware {
    /// <summary>
    /// Middleware for tracking requests with unique IDs and correlation IDs
    /// Adds request tracking headers to all API responses
    /// </summary>
    public class RequestTrackingMiddleware {
        private readonly RequestDelegate _next;
        private readonly ILogger<RequestTrackingMiddleware> _logger;

        public RequestTrackingMiddleware (RequestDelegate next, ILogger<RequestTrackingMiddleware> logger) {
            _next = next ?? throw new ArgumentNullException (nameof (next));
            _logger = logger ?? throw new ArgumentNullException (nameof (logger));
        }

        public async Task InvokeAsync (HttpContext context) {
            if (context == null) {
                throw new ArgumentNullException (nameof (context));
            }

            // Generate or extract Request ID
            var requestId = context.Request.Headers["X-Request-ID"].ToString ();
            if (string.IsNullOrEmpty (requestId)) {
                requestId = Guid.NewGuid ().ToString ();
            }

            // Generate or extract Correlation ID
            var correlationId = context.Request.Headers["X-Correlation-ID"].ToString ();
            if (string.IsNullOrEmpty (correlationId)) {
                correlationId = requestId; // Use requestId if no correlationId provided
            }

            // Store in HttpContext.Items for access in controllers/handlers
            context.Items["RequestId"] = requestId;
            context.Items["CorrelationId"] = correlationId;

            // Add to response headers
            context.Response.OnStarting (() => {
                context.Response.Headers["X-Request-ID"] = requestId;
                context.Response.Headers["X-Correlation-ID"] = correlationId;
                return Task.CompletedTask;
            });

            // Start tracking request timing
            var stopwatch = Stopwatch.StartNew ();

            try {
                // Log request start
                _logger.LogInformation (
                    "Request started: {Method} {Path} | RequestId: {RequestId} | CorrelationId: {CorrelationId}",
                    context.Request.Method,
                    context.Request.Path,
                    requestId,
                    correlationId
                );

                // Call the next middleware in the pipeline
                await _next (context);

                stopwatch.Stop ();

                // Log request completion
                _logger.LogInformation (
                    "Request completed: {Method} {Path} | StatusCode: {StatusCode} | Duration: {Duration}ms | RequestId: {RequestId}",
                    context.Request.Method,
                    context.Request.Path,
                    context.Response.StatusCode,
                    stopwatch.ElapsedMilliseconds,
                    requestId
                );
            } catch (Exception ex) {
                stopwatch.Stop ();

                // Log request error
                _logger.LogError (
                    ex,
                    "Request failed: {Method} {Path} | Duration: {Duration}ms | RequestId: {RequestId} | Error: {ErrorMessage}",
                    context.Request.Method,
                    context.Request.Path,
                    stopwatch.ElapsedMilliseconds,
                    requestId,
                    ex.Message
                );

                throw; // Re-throw to let other error handling middleware process it
            }
        }
    }

    /// <summary>
    /// Extension methods for registering the RequestTrackingMiddleware
    /// </summary>
    public static class RequestTrackingMiddlewareExtensions {
        /// <summary>
        /// Adds request tracking middleware to the application pipeline
        /// Should be added early in the pipeline to track all requests
        /// </summary>
        public static IApplicationBuilder UseRequestTracking (this IApplicationBuilder builder) {
            return builder.UseMiddleware<RequestTrackingMiddleware> ();
        }
    }
}
