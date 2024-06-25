using System;
using System.Reflection;
//using FMS.WebClient.Signal;
//using FMS.Application.Models;
using FMS.Infrastructure.DependancyInjection;
using MediatR;
using AutoMapper;
using System.Diagnostics;
using FMS.Persistence.DataAccess;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
//using FMS.Application.MappingProfile;
using Autofac.Core;
using System.Security.Cryptography.Xml;
using System.Text.Json.Serialization;
using FMS.Infrastructure.Webservice.GPSService;
using NLog.Web;
using NLog;
using Microsoft.Extensions.Logging;
using FMS.Domain.Entities;
using FMS.Persistence.DataAccess.Nafta;
using FMS.ATGClient.Controllers;
using FMS.Application.MappingProfile;
using FMS.ATGClient.RabbitMQ;
using AutoMapper.Configuration.Annotations;
using FMS.Application.FuelDispensing.Commands;
using Autofac.Extensions.DependencyInjection;
using Autofac;
using FMS.ATGClient;
using Microsoft.AspNetCore.WebSockets;
using System.Net.WebSockets;
using FMS.ATGClient.Util;


var logger = NLog.LogManager.Setup().LoadConfigurationFromAppSettings().GetCurrentClassLogger();

try
{

    logger.Info(" Log ATG Application started");

    var builder = WebApplication.CreateBuilder(args);

    //configure Nlog For ASp.Net Core 
    builder.Logging.ClearProviders();
    builder.Logging.SetMinimumLevel(Microsoft.Extensions.Logging.LogLevel.Trace);
    builder.Host.UseNLog();

    builder.Services.AddControllers().AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
        options.JsonSerializerOptions.MaxDepth = 0;
    });

    builder.Services.AddSignalR();

    builder.Services.AddMediatR(cfg =>
    {
        cfg.RegisterServicesFromAssemblyContaining<Program>();
        cfg.RegisterServicesFromAssembly(typeof(FMS.Application.Command.DatabaseCommand.ATGCommands.AlertRecordCommand.CreateAlertRecordCommand).Assembly);
        cfg.RegisterServicesFromAssembly(typeof(PTSController).Assembly);
        cfg.RegisterServicesFromAssembly(typeof(SendPumpAuthorizeCommandHandler).Assembly);
    });

    //  builder.Services.AddSingleton<PtsStatusService>();

    builder.Configuration.AddJsonFile("appsettings.json", optional: false, reloadOnChange: true);
    var connectionString = builder.Configuration.GetConnectionString("ATGConnection");

    var rabbitmqConnectionString = builder.Configuration.GetConnectionString("RabbitMQConnection");
    if (!string.IsNullOrEmpty(connectionString))
    {
        builder.Services.AddDbContext<NaftaContext>(options =>
                      options.UseMySQL(connectionString));
    }
    else
    {
        logger.Error("Connectionstring is Empty");
        throw new Exception("ConnectionString is Empty");
    }



    builder.Host.UseServiceProviderFactory(new AutofacServiceProviderFactory()).ConfigureContainer<ContainerBuilder>(ContainerBuilder =>
    {
        ContainerBuilder.RegisterModule(new AutofacModule());
    });

    builder.Services.AddAutoMapper(typeof(ATGMappingProfile).Assembly);
    //rabbitMQ startup
    builder.Services.AddSingleton<RabbitMQService>(sp => new RabbitMQService(rabbitmqConnectionString));

    builder.Services.AddHostedService<UploadStatusWorker>();


    //WebSocket Config
    builder.Services.AddWebSockets(options =>
    {
        options.KeepAliveInterval = TimeSpan.FromSeconds(120);

    });


    var config = builder.Configuration;
    var port = config.GetValue<int>("WebSocket:Port");
    // Kestrel configuration should be here
    builder.WebHost.ConfigureKestrel(options =>
    {
        options.Listen(System.Net.IPAddress.Any, builder.Configuration.GetValue<int>("WebSocket:Port"));
    });
    builder.Services.AddCors(options =>
       {
           options.AddPolicy("AllowSpecificOrigin",
               builder => builder.AllowAnyMethod()
               .AllowAnyHeader()
               .WithOrigins("http://localhost:4200")
               .AllowCredentials());
       });

    var app = builder.Build();

    if (!app.Environment.IsDevelopment())
    {
        app.UseHsts();
        app.UseExceptionHandler("/Home/Error");

    }


    //websockets service 

    app.UseWebSockets();


    app.Use(async (context, next) =>
 {
     if (context.WebSockets.IsWebSocketRequest && context.Request.Path == "/jsonPTS")
     {
         WebSocket webSocket = await context.WebSockets.AcceptWebSocketAsync();
         await new WebSocketService().HandleConnectionAsync(webSocket,context);
     }
     else
     {
         await next();
     }



 });
    app.UseHttpsRedirection();
    app.UseStaticFiles();
    app.UseRouting();

    app.UseEndpoints(endpoints =>
  {
      endpoints.MapControllers();
      //  endpoints.MapHub<PtsStatusHub>("/ptsstatushub");

  });

    app.MapControllerRoute(
       name: "default",
       pattern: "{controller}/{action=Index}/{id?}");
    app.Run();

}
catch (Exception ex)
{
    logger.Error(ex, "Stopped program because of exception");

}
finally
{
    logger.Info("Application Stopped");
    NLog.LogManager.Shutdown();
}

