using System.Net.WebSockets;
using FMS.Application;
using FMS.Application.Command.DatabaseCommand.Common;
using FMS.Application.MappingProfile;
using FMS.Application.PTSServices.PumpService;
using FMS.Domain.Entities;
using FMS.Persistence.DataAccess;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Win32;

namespace FMS.Shared;

public static class ServiceCollectionExtensions {
    public static IServiceCollection AddCoreServices (this IServiceCollection services) {
        services.AddMemoryCache (); // core caching service
        // Add other core services common to both projects here.
        return services;
    }

    // Registers communication services(e.g., SignalR, WebSocket listeners, etc.).
    public static IServiceCollection AddCommunicationServices (this IServiceCollection services) {
        services.AddSignalR (); // adding SignalR for real-time communications
        // Register additional communication services (e.g., HTTP clients, WebSocket listeners) here.
        return services;
    }

    //: Registers database-related services including DbContext and Identity.
    public static IServiceCollection AddDatabaseServices (this IServiceCollection services, IConfiguration configuration) {
        // Retrieve the connection string (ensure it is defined in your appsettings)
        var connectionString = configuration.GetConnectionString ("FMSConnection");
        if (string.IsNullOrEmpty (connectionString)) {
            throw new Exception ("FMSConnection string is missing in configuration.");
        }

        // Add MySQL specific parameters to handle DateTime issues
        if (!connectionString.Contains ("AllowZeroDateTime") && !connectionString.Contains ("ConvertZeroDateTime")) {
            connectionString += connectionString.Contains ("?") ? "&" : ";";
            connectionString += "AllowZeroDateTime=True;ConvertZeroDateTime=True";
        }

        //: Registering the main DbContext using MySQL.
        services.AddDbContext<GpsdataContext> (options =>
            options.UseMySql (connectionString, new MySqlServerVersion (new Version (5, 5, 61))),
            ServiceLifetime.Scoped);

        //chatgpt: Register Identity services after the DbContext.
        services.AddIdentity<User, Role> ().AddEntityFrameworkStores<GpsdataContext> ().AddDefaultTokenProviders ();

        return services;
    }
    public static IServiceCollection AddAppServices (this IServiceCollection services, IConfiguration configuration) {
        // Example MediatR registration. Adjust the assembly references as needed.
        // services.AddMediatR(cfg =>
        //     {
        //         cfg.RegisterServicesFromAssemblyContaining<Program>(); // assuming Program is in a shared assembly or adjust accordingly
        //     });

        // Example AutoMapper registration; add your mapping profiles as needed.
        // services.AddAutoMapper(typeof(MainMappingProfile), typeof(PTSMappingProfile));

        //chatgpt: Register any other application-specific services here.
        return services;
    }

    // Groups all dependency registrations into one method for simpler usage in startup code.
    public static IServiceCollection AddFMSDependencies (this IServiceCollection services, IConfiguration configuration) {
        services.AddCoreServices ();
        services.AddCommunicationServices ();
        services.AddDatabaseServices (configuration);
        services.AddAppServices (configuration);
        //chatgpt: If you have additional categories (e.g., Reporting, External APIs), add them here.
        return services;
    }

}