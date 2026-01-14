using Microsoft.Extensions.DependencyInjection;

namespace FMS.BackgroundServices.IssueTracker
{
    /// <summary>
    /// Extension methods for registering Issue Tracker background services.
    /// </summary>
    public static class IssueTrackerServiceExtensions
    {
        /// <summary>
        /// Adds Issue Tracker background services to the service collection.
        /// </summary>
        /// <param name="services">The service collection</param>
        /// <returns>The service collection for chaining</returns>
        public static IServiceCollection AddIssueTrackerBackgroundServices(this IServiceCollection services)
        {
            // Register the checker factory
            services.AddSingleton<IAutoCloseCheckerFactory, AutoCloseCheckerFactory>();

            // Register individual checkers as transient (created per check)
            services.AddTransient<OnlineChecker>();
            services.AddTransient<AlarmClearedChecker>();
            services.AddTransient<StatusChecker>();
            services.AddTransient<TimeoutChecker>();
            services.AddTransient<ManualOnlyChecker>();

            // Register background services as hosted services
            services.AddHostedService<IssueAutoCloseService>();
            services.AddHostedService<IssueMonitoringService>();

            return services;
        }
    }
}
