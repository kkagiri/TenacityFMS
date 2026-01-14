using System;
using System.Collections.Generic;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace FMS.BackgroundServices.IssueTracker
{
    /// <summary>
    /// Factory interface for creating auto-close checkers based on type.
    /// </summary>
    public interface IAutoCloseCheckerFactory
    {
        /// <summary>
        /// Creates a checker instance for the given type.
        /// </summary>
        /// <param name="checkerType">The checker type name</param>
        /// <returns>The checker instance or null if type is unknown</returns>
        IAutoCloseChecker? CreateChecker(string? checkerType);
    }

    /// <summary>
    /// Factory implementation for creating auto-close checkers.
    /// Resolves checkers from the service provider based on the checker type name.
    /// </summary>
    public class AutoCloseCheckerFactory : IAutoCloseCheckerFactory
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<AutoCloseCheckerFactory> _logger;
        private readonly Dictionary<string, Type> _checkerTypes;

        public AutoCloseCheckerFactory(
            IServiceProvider serviceProvider,
            ILogger<AutoCloseCheckerFactory> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;

            // Register known checker types
            _checkerTypes = new Dictionary<string, Type>(StringComparer.OrdinalIgnoreCase)
            {
                { "Online", typeof(OnlineChecker) },
                { "DeviceOnline", typeof(OnlineChecker) },
                { "AlarmCleared", typeof(AlarmClearedChecker) },
                { "ActiveAlarm", typeof(AlarmClearedChecker) },
                { "Status", typeof(StatusChecker) },
                { "DeviceStatus", typeof(StatusChecker) },
                { "Timeout", typeof(TimeoutChecker) },
                { "AutoTimeout", typeof(TimeoutChecker) },
                { "ManualOnly", typeof(ManualOnlyChecker) }
            };
        }

        public IAutoCloseChecker? CreateChecker(string? checkerType)
        {
            if (string.IsNullOrWhiteSpace(checkerType))
            {
                _logger.LogWarning("Checker type is null or empty, returning null");
                return null;
            }

            if (_checkerTypes.TryGetValue(checkerType, out var type))
            {
                try
                {
                    return (IAutoCloseChecker)ActivatorUtilities.CreateInstance(_serviceProvider, type);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to create checker of type {CheckerType}", checkerType);
                    return null;
                }
            }

            _logger.LogWarning("Unknown checker type: {CheckerType}", checkerType);
            return null;
        }
    }
}
