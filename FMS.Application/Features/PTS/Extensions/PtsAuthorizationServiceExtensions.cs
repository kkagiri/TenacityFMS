using FMS.Application.Features.PTS.Services;
using FMS.Application.Validation.PTSValidators.PumpAuthorization;
using Microsoft.Extensions.DependencyInjection;

namespace FMS.Application.Features.PTS.Extensions
{
    /// <summary>
    /// Extension methods for registering PTS authorization services.
    /// </summary>
    public static class PtsAuthorizationServiceExtensions
    {
        /// <summary>
        /// Adds PTS pump authorization services to the service collection.
        /// </summary>
        /// <param name="services">The service collection</param>
        /// <returns>The service collection for chaining</returns>
        public static IServiceCollection AddPtsAuthorizationServices(this IServiceCollection services)
        {
            // Validator
            services.AddScoped<IPumpAuthorizationValidator, PumpAuthorizationValidator>();

            // Pre-check services (nozzle state, stuck transactions, location)
            services.AddScoped<IPumpAuthorizationPreCheckService, PumpAuthorizationPreCheckService>();

            // Transaction context service (Redis storage)
            services.AddScoped<ITransactionContextService, TransactionContextService>();

            // Fuel price service
            services.AddScoped<IFuelPriceService, FuelPriceService>();

            // Logging service
            services.AddScoped<IPumpAuthorizationLoggingService, PumpAuthorizationLoggingService>();

            // Device connection type service
            services.AddScoped<IDeviceConnectionTypeService, DeviceConnectionTypeService>();

            return services;
        }
    }
}
