using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Domain.Entities;
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
    /// Creates a DI scope per checker to properly resolve scoped services (e.g. GpsdataContext).
    /// </summary>
    public class AutoCloseCheckerFactory : IAutoCloseCheckerFactory
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<AutoCloseCheckerFactory> _logger;
        private readonly Dictionary<string, Type> _checkerTypes;

        public AutoCloseCheckerFactory(
            IServiceScopeFactory scopeFactory,
            ILogger<AutoCloseCheckerFactory> logger)
        {
            _scopeFactory = scopeFactory;
            _logger = logger;

            // Register known checker types
            _checkerTypes = new Dictionary<string, Type>(StringComparer.OrdinalIgnoreCase)
            {
                { NormalizeCheckerType("Online"), typeof(OnlineChecker) },
                { NormalizeCheckerType("DeviceOnline"), typeof(OnlineChecker) },
                { NormalizeCheckerType("OnlineChecker"), typeof(OnlineChecker) },
                { NormalizeCheckerType("AlarmCleared"), typeof(AlarmClearedChecker) },
                { NormalizeCheckerType("ActiveAlarm"), typeof(AlarmClearedChecker) },
                { NormalizeCheckerType("Status"), typeof(StatusChecker) },
                { NormalizeCheckerType("DeviceStatus"), typeof(StatusChecker) },
                { NormalizeCheckerType("Timeout"), typeof(TimeoutChecker) },
                { NormalizeCheckerType("AutoTimeout"), typeof(TimeoutChecker) },
                { NormalizeCheckerType("ManualOnly"), typeof(ManualOnlyChecker) },
                { NormalizeCheckerType("FuelActivity"), typeof(FuelActivityChecker) },
                { NormalizeCheckerType("NoFuelActivity"), typeof(FuelActivityChecker) }
            };
        }

        public IAutoCloseChecker? CreateChecker(string? checkerType)
        {
            if (string.IsNullOrWhiteSpace(checkerType))
            {
                _logger.LogWarning("Checker type is null or empty, returning null");
                return null;
            }

            var normalizedCheckerType = NormalizeCheckerType(checkerType);

            if (_checkerTypes.TryGetValue(normalizedCheckerType, out var type))
            {
                try
                {
                    // Create a DI scope so scoped services (e.g. GpsdataContext) can be resolved.
                    // The ScopedAutoCloseChecker wrapper ensures the scope is disposed after use.
                    var scope = _scopeFactory.CreateScope();
                    var innerChecker = (IAutoCloseChecker)ActivatorUtilities.CreateInstance(scope.ServiceProvider, type);
                    return new ScopedAutoCloseChecker(innerChecker, scope);
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

        private static string NormalizeCheckerType(string checkerType)
        {
            return new string(checkerType
                .Trim()
                .ToLowerInvariant()
                .Where(char.IsLetterOrDigit)
                .ToArray());
        }
    }

    /// <summary>
    /// Wrapper that delegates IAutoCloseChecker calls to an inner checker while
    /// owning a DI scope. Disposing this wrapper disposes the scope and its scoped services.
    /// </summary>
    internal sealed class ScopedAutoCloseChecker : IAutoCloseChecker, IDisposable
    {
        private readonly IAutoCloseChecker _inner;
        private readonly IServiceScope _scope;

        public ScopedAutoCloseChecker(IAutoCloseChecker inner, IServiceScope scope)
        {
            _inner = inner;
            _scope = scope;
        }

        /// <summary>
        /// The underlying checker instance (for type checks like OnlineChecker).
        /// </summary>
        public IAutoCloseChecker InnerChecker => _inner;

        public string CheckerType => _inner.CheckerType;

        public Task<bool> ShouldAutoCloseAsync(
            Issuetracker issue,
            Issueautocloseconfig config,
            CancellationToken cancellationToken)
            => _inner.ShouldAutoCloseAsync(issue, config, cancellationToken);

        public string GetCloseReason() => _inner.GetCloseReason();

        public void Dispose() => _scope.Dispose();
    }
}
