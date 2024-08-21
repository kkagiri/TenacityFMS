using System;
using System.Text;
using System.Reflection;
using System.Diagnostics;
using System.Security.Cryptography.Xml;
using System.Text.Json.Serialization;


using Microsoft.Extensions.Logging;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.AspNetCore.Authentication.JwtBearer;

using AutoMapper;
using Autofac.Core;

using NLog;
using NLog.Web;

using MediatR;

using FMS.WebClient.Signal;
using FMS.WebClient.Controllers;
// using FMS.WebClient.ReportViewer;
using FMS.WebClient.MappingProfile;

using FMS.Infrastructure.DependancyInjection;
using FMS.Infrastructure.Webservice.GPSService;

using FMS.Persistence.DataAccess;
using FMS.Persistence.DataAccess.Nafta;

using FMS.PTS;
using FMS.Domain.Entities;

using FMS.Application;
using FMS.Application.MappingProfile;
using FMS.Application.FuelDispensing.Commands;
using FMS.Application.Command.DatabaseCommand.TagCmd;
using FMS.Application.Queries.GPSGATEServer.GetconsumptionReport;
using FMS.Application.Queries.Database.FMSQuery.UserManagement.Permissions;

// using DevExpress.AspNetCore;
// using DevExpress.AspNetCore.Reporting;
// using DevExpress.AspNetCore.Reporting.WebDocumentViewer;
// using DevExpress.AspNetCore.Reporting.ReportDesigner;
// using DevExpress.XtraReports.Web.Extensions;
using Microsoft.Extensions.FileProviders;
using FMS.Application.Util;
using FMS.WebClient.Util;
using FMS.Application.ModelsDTOs.FMS.UserManagement;
using Pomelo.EntityFrameworkCore.MySql.Internal;
using FMS.BackgroundServices.FMS;



// Add services to the container.
var logger = NLog.LogManager.Setup().LoadConfigurationFromAppSettings().GetCurrentClassLogger();


try
{
    Console.WriteLine("ApplicationStarting....");
    logger.Info("Application Starting Up");
    var builder = WebApplication.CreateBuilder(args);
    // Configure NLog for ASP.NET Core
    builder.Logging.ClearProviders();
    builder.Logging.SetMinimumLevel(Microsoft.Extensions.Logging.LogLevel.Trace);
    builder.Host.UseNLog();


    builder.Services.AddControllersWithViews().AddJsonOptions(
        options =>
        {
            // options.JsonSerializerOptions.ReferenceHandler  = ReferenceHandler.Preserve;
            options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
            options.JsonSerializerOptions.MaxDepth = 0;
        });

    builder.Services.AddSignalR();



    builder.Services.AddHttpContextAccessor();
    //builder.Services.AddMediatR(typeof(ConsumptionController).GetTypeInfo().Assembly);


    //dependancy Register 


    builder.Services.AddMediatR(cfg =>

    {
        cfg.RegisterServicesFromAssemblyContaining<Program>();
        cfg.RegisterServicesFromAssembly(typeof(ConsumptionController).Assembly);
        cfg.RegisterServicesFromAssemblies(typeof(VehicleController).Assembly);
        cfg.RegisterServicesFromAssembly(typeof(GetConsumptionReportQueryHandler).Assembly);
        cfg.RegisterServicesFromAssembly(typeof(SendPumpAuthorizeCommandHandler).Assembly);
        cfg.RegisterServicesFromAssembly(typeof(TagCreateCmd).Assembly);
    });
    builder.Services.AddSingleton<PtsStatusService>();
    builder.Services.AddSingleton<PTSCommunicationService>();
    builder.Services.AddSingleton<FMS.PTS.Device>();
    builder.Services.AddTransient<TagCreateCmd>();
    builder.Services.AddScoped<IAuthorizationHandler, PermissionAuthorization>();
    builder.Services.AddScoped<IGPSGateDirectoryWebservice, GPSGateDirectoryWebservice>();

    builder.Services.AddTransient<RoleManager<Role>>();
    builder.Services.AddScoped<RoleManager<Role>>();
    builder.Services.AddScoped<UserManager<User>>();
    builder.Services.AddScoped<IAuthorizationHandler, PermissionHandler>();
    builder.Services.AddTransient(typeof(IPipelineBehavior<,>), typeof(TransactionMiddleware<,>));
    //Configration files loading

    builder.Configuration.AddJsonFile("appsettings.json", optional: false, reloadOnChange: true);

    var connectionString = builder.Configuration.GetConnectionString("FMSConnection");
    var naftaConnectionString = builder.Configuration.GetConnectionString("ATGConnection");
    builder.Services.AddIdentity<User, Role>().AddEntityFrameworkStores<GpsdataContext>()
       .AddDefaultTokenProviders();

    if (!string.IsNullOrEmpty(connectionString))
    {
        builder.Services.AddDbContext<GpsdataContext>(options =>
                options.UseMySql(connectionString, new MySqlServerVersion(new Version(5, 5, 61))), ServiceLifetime.Scoped) ;
    }
    else
    {
        logger.Error("GPSData Connectionstring was not found");
        throw new Exception("ConnectionString is Empty");
    }

    if (!string.IsNullOrEmpty(naftaConnectionString))
    {
        builder.Services.AddDbContext<NaftaContext>(options =>
                  options.UseMySQL(naftaConnectionString));
    }
    else
    {
        logger.Error("Nafta Connectionstring was not found");
        throw new Exception("ConnectionString is Empty");
    }
    //Devexpress Reporting
    // builder.Services.AddDevExpressControls();
    // builder.Services.ConfigureReportingServices(config =>
    // {
    //     config.ConfigureReportDesigner(designerconfig =>
    //     {
    //         //configure the report designer here 
    //         designerconfig.RegisterDataSourceWizardConfigFileConnectionStringsProvider();

    //     });
    //     config.ConfigureWebDocumentViewer(webviewerconfig =>
    //     {

    //         //configure the web document viewer here
    //         webviewerconfig.UseCachedReportSourceBuilder();
    //         webviewerconfig.UseFileDocumentStorage(System.IO.Path.Combine(builder.Environment.ContentRootPath, "ReportsDocumentStorage"));
    //     });


    // });

    // builder.Services.AddScoped<ReportStorageWebExtension, CustomReportStorageWebExtension>();


    builder.Services.Configure<JwtSettings>(builder.Configuration.GetSection("JwtSettings"));
    builder.Services.AddHostedService<AutomatedClosingStockService>();
    

    builder.Services.AddAuthentication(options =>
    {
        options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
        options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    }).AddJwtBearer(options =>
    {
        var jwtSettings = builder.Configuration.GetSection("JwtSettings").Get<JwtSettings>();

        // var jwtKey = builder.Configuration["Jwt:Key"];
        //   if (string.IsNullOrEmpty(jwtKey))
        //  {
        //     throw new ArgumentNullException(nameof(jwtKey), "JWT Key cannot be null or empty");
        // }

        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings.SecretKey)),
            ValidIssuer = jwtSettings.Issuer,
            ValidAudience = jwtSettings.Audience
        };

    });

    builder.Services.AddAuthorization(options =>
    {
        //load permisoin dynamically from the database

        using (var scope = builder.Services.BuildServiceProvider().CreateScope())
        {
            var serviceProvider = scope.ServiceProvider;
            var mediator = serviceProvider.GetRequiredService<IMediator>();
            List<PermissionDTO> permissions;
            try
            {
                permissions = mediator.Send(new GetPermissionQuery()).Result;
            }
            catch (Exception ex)
            {
                permissions = new List<PermissionDTO>(); // or load default permissions
            }

            foreach (var permission in permissions)
            {
                options.AddPolicy(permission.Name, policy =>
                {
                    policy.Requirements.Add(new PermissionRequirement(permission.Name));
                });
            }
        }

    });

    builder.Services.AddMemoryCache();
    //Auto mapper profiles
    builder.Services.AddAutoMapper(typeof(VehicleMappingProfile));
    builder.Services.AddAutoMapper(typeof(MappingProfile).Assembly);

    builder.Services.AddCors(options =>
    {
        options.AddPolicy("DevelopmentCorsPolicy", builder =>
        {
            builder.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod();
        });

        options.AddPolicy("ProductionCorsPolicy", builder =>
        {
              builder.WithOrigins(
                "http://10.0.10.153", "https://10.0.10.153",
                "http://197.254.33.227", "https://197.254.33.227",
                "http://localhost", "https://localhost"
            )
                   .AllowAnyHeader()
                   .AllowAnyMethod();
        });

    });
    builder.Services.AddTransient<IJwtGenerator, JwtGenerator>();
    builder.Services.AddTransient<RoleManager<Role>>();
    var app = builder.Build();


    //  using(var scope = app.Services.CreateScope())
    //  {
    //     var services = scope.ServiceProvider;
    //     await SeedRoles(services);
    //  }

    // Configure the HTTP request pipeline.
     if (!app.Environment.IsDevelopment())
    {
        app.UseHsts();
        app.UseCors("ProductionCorsPolicy");
    }
    else
    {
        app.UseDeveloperExceptionPage();
        app.UseCors("DevelopmentCorsPolicy");
    }


    app.UseHttpsRedirection();
     app.UseStaticFiles();
    app.UseMiddleware<UserActivityMiddleware>();
    app.UseRouting();
    //app.UseCors("AllowSpecificOrigin");
    // app.UseDevExpressControls();
    app.UseAuthentication();
    app.UseAuthorization();
    app.Use(async (context, next) =>
    {
        //log request information here 


        logger.Info("Handling request: {RequestMethod} {RequestPath}", context.Request.Method, context.Request.Path);
        try
        {
            await next.Invoke();
            //log response information here

            logger.Info("Finished handling request. Response status code: {ResponseStatusCode}", context.Response.StatusCode);
        }
        catch (Exception ex)
        {
            logger.Error(ex, "An unhandled exception has occurred while executing the request. Response status code: {ResponseStatusCode}", context.Response.StatusCode);
            throw;
        }


    });



    app.UseEndpoints(endpoints =>
    {
        endpoints.MapControllers();

    });



    app.MapControllerRoute(
        name: "default",
        pattern: "{controller}/{action=Index}/{id?}");

    //app.MapFallbackToFile("index.html");
        Console.WriteLine("app....",app);

    try
    {
      var value =   app.Environment.IsDevelopment();
        app.Run();
    }
    catch (Exception ex)
    {
        Console.WriteLine("App error",ex.Message);
        logger.Error("App Err", ex.Message);
    }




}
catch (Exception ex)
{
    Console.WriteLine($"Application stopped: {ex.Message}");
        logger.Error(ex, "Stopped program because of exception");
        throw;

}
finally
{
    NLog.LogManager.Shutdown();

}