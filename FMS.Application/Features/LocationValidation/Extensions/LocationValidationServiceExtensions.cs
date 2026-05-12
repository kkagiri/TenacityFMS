using FMS.Application.Features.LocationValidation.Services;
using Microsoft.Extensions.DependencyInjection;

namespace FMS.Application.Features.LocationValidation.Extensions;

/// <summary>
/// Extension methods for registering location validation services
/// </summary>
public static class LocationValidationServiceExtensions
{
    /// <summary>
    /// Adds location validation services to the service collection
    /// </summary>
    /// <param name="services">The service collection</param>
    /// <returns>The service collection for chaining</returns>
    public static IServiceCollection AddLocationValidationServices(this IServiceCollection services)
    {
        services.AddScoped<ILocationValidationService, LocationValidationService>();
        return services;
    }
}
