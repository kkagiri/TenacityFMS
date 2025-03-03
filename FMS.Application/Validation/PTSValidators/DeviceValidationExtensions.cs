

using FMS.Application.Validation.PTSValidators.Common;
using Microsoft.Extensions.DependencyInjection;

namespace FMS.Application.Validation.PTSValidators
{
    public static class DeviceValidationExtensions
    {
        public static IServiceCollection AddDeviceValidation(this IServiceCollection services)
        {
            services.AddScoped<IDeviceValidator, DeviceValidator>();

            // Register validation related services
            services.AddMemoryCache(); // Optional: for caching validation results

            return services;
        }
    }
}