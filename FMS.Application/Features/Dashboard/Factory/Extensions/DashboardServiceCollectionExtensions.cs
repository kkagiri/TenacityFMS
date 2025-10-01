using FMS.Application.Services.Dashboard.WidgetFactories;
using Microsoft.Extensions.DependencyInjection;

namespace FMS.Application.Services.Dashboard.Extensions {
    /// <summary>
    /// Service collection extensions for registering dashboard widget services
    /// </summary>
    public static class DashboardServiceCollectionExtensions {
        /// <summary>
        /// Register all dashboard widget factories and related services
        /// </summary>
        public static IServiceCollection AddDashboardWidgetServices (this IServiceCollection services) {
            // Register individual widget factories
            services.AddScoped<ChartWidgetFactory> ();
            services.AddScoped<StatCardWidgetFactory> ();
            services.AddScoped<TableWidgetFactory> ();

            // Register the main coordinator
            services.AddScoped<WidgetFactoryCoordinator> ();

            // Register the enhanced widget factory service that bridges factory and data source manager
            services.AddScoped<IWidgetFactoryService, WidgetFactoryService> ();

            return services;
        }
    }
}