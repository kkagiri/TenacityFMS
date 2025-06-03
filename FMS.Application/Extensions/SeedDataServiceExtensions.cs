using FMS.Application.Services;
using Microsoft.Extensions.DependencyInjection;

namespace FMS.Application.Extensions
{
    public static class SeedDataServiceExtensions
    {
        public static IServiceCollection AddSeedDataServices(this IServiceCollection services)
        {
            // Register the seed data service
            services.AddScoped<ISeedDataService, SeedDataService>();

            // Register the hosted service that will run on startup
            services.AddHostedService<DatabaseSeedingHostedService>();

            return services;
        }
    }
}