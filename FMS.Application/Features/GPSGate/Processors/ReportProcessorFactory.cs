using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.GPSGate.Processors
{
    /// <summary>
    /// Factory for creating appropriate report processors based on report ID
    /// </summary>
    public interface IReportProcessorFactory
    {
        /// <summary>
        /// Gets a processor for the specified report ID with a disposable scope.
        /// IMPORTANT: Caller should use the returned scope and dispose it when done.
        /// </summary>
        /// <typeparam name="T">The expected return type for the report data</typeparam>
        /// <param name="reportId">The GPSGate report ID</param>
        /// <returns>Tuple of (processor, scope) - dispose scope when done</returns>
        (IReportProcessor<T> Processor, IServiceScope Scope) GetProcessorWithScope<T>(int reportId) where T : class;

        /// <summary>
        /// Gets a processor for the specified report ID.
        /// Creates an internal scope that's NOT disposed - use GetProcessorWithScope for better lifecycle management.
        /// </summary>
        IReportProcessor<T> GetProcessor<T>(int reportId) where T : class;

        /// <summary>
        /// Checks if a processor exists for the given report ID
        /// </summary>
        /// <param name="reportId">The GPSGate report ID</param>
        /// <returns>True if processor exists</returns>
        bool HasProcessor(int reportId);

        /// <summary>
        /// Gets all supported report IDs
        /// </summary>
        /// <returns>List of supported report IDs</returns>
        List<int> GetSupportedReportIds();

        /// <summary>
        /// Gets report name for a given report ID
        /// </summary>
        /// <param name="reportId">The GPSGate report ID</param>
        /// <returns>Report name or null if not found</returns>
        string? GetReportName(int reportId);
    }

    /// <summary>
    /// Factory implementation for creating report processors
    /// </summary>
    public class ReportProcessorFactory : IReportProcessorFactory
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<ReportProcessorFactory> _logger;
        private readonly Dictionary<int, Type> _processorRegistry;

        public ReportProcessorFactory(
            IServiceScopeFactory scopeFactory,
            ILogger<ReportProcessorFactory> logger)
        {
            _scopeFactory = scopeFactory;
            _logger = logger;
            _processorRegistry = new Dictionary<int, Type>();

            // Register all available processors
            RegisterProcessors();
        }

        private void RegisterProcessors()
        {
            // Register Fuel Consumption Report Processor (208)
            RegisterProcessor<FuelConsumptionReportProcessor>(208);

            // Register Refueling Report Processor (212)
            RegisterProcessor<RefuelingReportProcessor>(212);

            // Add more processors here as they are created
            // RegisterProcessor<NewReportProcessor>(reportId);

            _logger.LogInformation($"Registered {_processorRegistry.Count} report processors");
        }

        private void RegisterProcessor<TProcessor>(int reportId) where TProcessor : class
        {
            _processorRegistry[reportId] = typeof(TProcessor);
            _logger.LogDebug($"Registered processor {typeof(TProcessor).Name} for report ID {reportId}");
        }

        public (IReportProcessor<T> Processor, IServiceScope Scope) GetProcessorWithScope<T>(int reportId) where T : class
        {
            if (!_processorRegistry.TryGetValue(reportId, out var processorType))
            {
                throw new NotSupportedException(
                    $"No processor registered for report ID {reportId}. " +
                    $"Supported report IDs: {string.Join(", ", _processorRegistry.Keys)}");
            }

            IServiceScope? scope = null;
            try
            {
                scope = _scopeFactory.CreateScope();
                var processor = scope.ServiceProvider.GetRequiredService(processorType);

                var typedProcessor = processor as IReportProcessor<T>;
                if (typedProcessor == null)
                {
                    scope.Dispose();
                    throw new InvalidOperationException(
                        $"Processor {processorType.Name} does not implement IReportProcessor<{typeof(T).Name}>");
                }

                _logger.LogDebug($"Created processor {processorType.Name} for report ID {reportId}");
                return (typedProcessor, scope);
            }
            catch (Exception ex)
            {
                scope?.Dispose();
                _logger.LogError(ex, $"Error creating processor for report ID {reportId}");
                throw;
            }
        }

        public IReportProcessor<T> GetProcessor<T>(int reportId) where T : class
        {
            // This method creates a scope but doesn't return it - caller cannot dispose
            // Use GetProcessorWithScope for better lifecycle management
            var (processor, _) = GetProcessorWithScope<T>(reportId);
            return processor;
        }

        public bool HasProcessor(int reportId)
        {
            return _processorRegistry.ContainsKey(reportId);
        }

        public List<int> GetSupportedReportIds()
        {
            return _processorRegistry.Keys.OrderBy(k => k).ToList();
        }

        public string? GetReportName(int reportId)
        {
            if (!_processorRegistry.TryGetValue(reportId, out var processorType))
            {
                return null;
            }

            try
            {
                using var scope = _scopeFactory.CreateScope();
                var processor = scope.ServiceProvider.GetService(processorType);
                var reportProcessor = processor as dynamic;
                return reportProcessor?.ReportName;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, $"Could not get report name for ID {reportId}");
                return null;
            }
        }
    }
}
