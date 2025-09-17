using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Features.Dashboard;
using FMS.Application.Services.Dashboard;
using FMS.Domain.Entities.Dashboard;
using FMS.Persistence.DataAccess;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace FMS.BackgroundServices.Dashboard {
    /// <summary>
    /// Phase 2: Enhanced Live Data Broadcast Service
    /// Background service that broadcasts live data updates to subscribed clients
    /// with streaming capabilities and intelligent change detection
    /// </summary>
    public class LiveDataBroadcastService : BackgroundService {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<LiveDataBroadcastService> _logger;
        private readonly Dictionary<string, DateTime> _lastBroadcastTimes = new ();
        private readonly Dictionary<string, object> _lastKnownValues = new ();
        private readonly Dictionary<string, int> _consecutiveFailures = new ();
        private readonly Dictionary<string, List<string>> _activeSubscriptions = new (); // Track active connections per data source

        // Phase 2 configuration
        private readonly int _defaultBroadcastIntervalSeconds = 30;
        private readonly int _maxConsecutiveFailures = 3;
        private readonly double _significantChangeThreshold = 0.01; // 1% change threshold

        public LiveDataBroadcastService (
            IServiceProvider serviceProvider,
            ILogger<LiveDataBroadcastService> logger) {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync (CancellationToken stoppingToken) {
            _logger.LogInformation ("Phase 2: Enhanced Live Data Broadcast Service started");

            while (!stoppingToken.IsCancellationRequested) {
                try {
                    await BroadcastLiveDataUpdates (stoppingToken);
                } catch (Exception ex) {
                    _logger.LogError (ex, "Error in live data broadcast cycle");
                }

                // Use configurable broadcast interval
                await Task.Delay (TimeSpan.FromSeconds (_defaultBroadcastIntervalSeconds), stoppingToken);
            }

            _logger.LogInformation ("Phase 2: Enhanced Live Data Broadcast Service stopped");
        }

        private async Task BroadcastLiveDataUpdates (CancellationToken cancellationToken) {
            using var scope = _serviceProvider.CreateScope ();
            var dataSourceManager = scope.ServiceProvider.GetRequiredService<IDataSourceManager> ();
            var context = scope.ServiceProvider.GetRequiredService<GpsdataContext> ();

            try {
                // Phase 2: Enhanced data source management
                var liveDataSources = await GetActiveLiveDataSources (context, cancellationToken);

                _logger.LogDebug ("Phase 2: Processing {Count} active live data sources", liveDataSources.Count);

                foreach (var dataSourceInfo in liveDataSources) {
                    try {
                        if (ShouldBroadcastDataSource (dataSourceInfo.DataSource, dataSourceInfo.RefreshInterval)) {
                            await BroadcastDataSourceUpdateEnhanced (dataSourceManager, context, dataSourceInfo, cancellationToken);
                            _lastBroadcastTimes[dataSourceInfo.DataSource] = DateTime.UtcNow;

                            // Reset failure counter on success
                            _consecutiveFailures.Remove (dataSourceInfo.DataSource);
                        }
                    } catch (Exception ex) {
                        await HandleDataSourceError (dataSourceInfo.DataSource, ex);
                    }
                }

                _logger.LogDebug ("Phase 2: Completed enhanced live data broadcast cycle for {DataSourceCount} data sources", liveDataSources.Count);
            } catch (Exception ex) {
                _logger.LogError (ex, "Error in enhanced live data broadcast cycle");
            }
        }

        // ========================================
        // PHASE 2: ENHANCED METHODS
        // ========================================

        private async Task<List<DataSourceInfo>> GetActiveLiveDataSources (GpsdataContext context, CancellationToken cancellationToken) {
            var liveDataSources = new [] {
                WidgetTypeDefinitions.DataSources.FUEL_DISPENSE,
                WidgetTypeDefinitions.DataSources.ENGINE_HOURS,
                WidgetTypeDefinitions.DataSources.KM_TRAVEL
            };

            var activeWidgets = await context.DashboardWidgetInstances
                .Include (w => w.Template)
                .Where (w => w.IsVisible)
                .Where (w => liveDataSources.Contains (w.Template.DataSource))
                .GroupBy (w => w.Template.DataSource)
                .ToListAsync (cancellationToken);

            var dataSourceInfos = new List<DataSourceInfo> ();

            foreach (var group in activeWidgets) {
                using var scope = _serviceProvider.CreateScope ();
                var dataSourceManager = scope.ServiceProvider.GetRequiredService<IDataSourceManager> ();

                if (dataSourceManager.IsLiveDataSource (group.Key)) {
                    var metadata = dataSourceManager.GetDataSourceMetadata (group.Key);
                    dataSourceInfos.Add (new DataSourceInfo {
                        DataSource = group.Key,
                            Widgets = group.ToList (),
                            RefreshInterval = metadata.RefreshIntervalSeconds,
                            SupportsLiveData = metadata.SupportsLiveData,
                            Category = metadata.Category
                    });
                }
            }

            return dataSourceInfos;
        }

        private async Task BroadcastDataSourceUpdateEnhanced (
            IDataSourceManager dataSourceManager,
            GpsdataContext context,
            DataSourceInfo dataSourceInfo,
            CancellationToken cancellationToken) {
            try {
                _logger.LogDebug ("Broadcasting enhanced update for data source: {DataSource}", dataSourceInfo.DataSource);

                // Create a generic live data request
                var liveRequest = new DashboardMetricRequestDto {
                    MetricType = dataSourceInfo.DataSource,
                    Mode = "live",
                    DatePreset = "today"
                };

                // Get live data
                var liveData = await dataSourceManager.GetLiveDataAsync (dataSourceInfo.DataSource, liveRequest);

                // Phase 2: Enhanced change detection
                if (!HasSignificantDataChange (dataSourceInfo.DataSource, liveData)) {
                    _logger.LogDebug ("No significant change in {DataSource}, skipping broadcast", dataSourceInfo.DataSource);
                    return;
                }

                // Store the new value for change detection
                _lastKnownValues[dataSourceInfo.DataSource] = liveData;

                // Phase 2: Broadcast to data source subscribers directly
                await dataSourceManager.BroadcastDataUpdateAsync (dataSourceInfo.DataSource, liveData);

                // Broadcast to individual widgets with transformed data
                foreach (var widget in dataSourceInfo.Widgets) {
                    await BroadcastToWidget (dataSourceManager, widget, liveData);
                }

                _logger.LogInformation ("Phase 2: Broadcasted enhanced live data for {DataSource} to {WidgetCount} widgets",
                    dataSourceInfo.DataSource, dataSourceInfo.Widgets.Count);

            } catch (Exception ex) {
                _logger.LogError (ex, "Error in enhanced data source broadcast for {DataSource}", dataSourceInfo.DataSource);
                throw;
            }
        }

        private async Task BroadcastToWidget (IDataSourceManager dataSourceManager, DashboardWidgetInstance widget, object liveData) {
            try {
                // Parse widget configuration
                var configuration = ParseWidgetConfiguration (widget.ConfigurationJson);

                // Transform data for specific widget type
                var transformedData = await dataSourceManager.TransformDataForWidgetType (
                    widget.Template.WidgetType, liveData, configuration);

                // Create enhanced widget update data
                var widgetUpdateData = new {
                    widgetInstanceId = widget.Id,
                    widgetType = widget.Template.WidgetType,
                    dataSource = widget.Template.DataSource,
                    data = transformedData,
                    isLiveUpdate = true,
                    isEnhancedUpdate = true, // Phase 2 marker
                    userId = widget.UserId,
                    timestamp = DateTime.UtcNow,
                    metadata = dataSourceManager.GetDataSourceMetadata (widget.Template.DataSource)
                };

                // Broadcast widget-specific update
                await dataSourceManager.BroadcastDataUpdateAsync ($"widget_{widget.Id}", widgetUpdateData);

                _logger.LogDebug ("Broadcasted enhanced widget update for widget {WidgetId} ({DataSource})",
                    widget.Id, widget.Template.DataSource);

            } catch (Exception ex) {
                _logger.LogError (ex, "Error broadcasting to widget {WidgetId}", widget.Id);
            }
        }

        private Dictionary<string, object> ParseWidgetConfiguration (string configurationJson) {
            var configuration = new Dictionary<string, object> ();

            if (!string.IsNullOrEmpty (configurationJson)) {
                try {
                    configuration = System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, object>> (
                        configurationJson) ?? new Dictionary<string, object> ();
                } catch (Exception ex) {
                    _logger.LogWarning (ex, "Failed to parse widget configuration, using defaults");
                }
            }

            return configuration;
        }

        private Task HandleDataSourceError (string dataSource, Exception ex) {
            var failureCount = _consecutiveFailures.GetValueOrDefault (dataSource, 0) + 1;
            _consecutiveFailures[dataSource] = failureCount;

            _logger.LogError (ex, "Error broadcasting data source {DataSource} (failure {Count}/{Max})",
                dataSource, failureCount, _maxConsecutiveFailures);

            if (failureCount >= _maxConsecutiveFailures) {
                _logger.LogWarning ("Data source {DataSource} has failed {Count} consecutive times, temporarily disabling",
                    dataSource, failureCount);

                // Could implement temporary disable logic here
                // For now, just extend the broadcast interval
                _lastBroadcastTimes[dataSource] = DateTime.UtcNow.AddMinutes (5); // Skip for 5 minutes
            }

            return Task.CompletedTask;
        }

        private bool ShouldBroadcastDataSource (string dataSource, int refreshIntervalSeconds) {
            // Check if data source is temporarily disabled due to failures
            var failureCount = _consecutiveFailures.GetValueOrDefault (dataSource, 0);
            if (failureCount >= _maxConsecutiveFailures) {
                return false;
            }

            return ShouldBroadcast (dataSource, refreshIntervalSeconds);
        }

        private bool HasSignificantDataChange (string dataSource, object newData) {
            if (!_lastKnownValues.TryGetValue (dataSource, out var lastValue))
                return true; // First time, consider it changed

            try {
                // Enhanced numeric value change detection
                if (TryExtractNumericValue (lastValue, out var lastNum) &&
                    TryExtractNumericValue (newData, out var newNum)) {

                    var absoluteChange = Math.Abs (newNum - lastNum);
                    var percentChange = lastNum != 0 ? Math.Abs ((newNum - lastNum) / lastNum) : 1.0;

                    // Phase 2: Configurable thresholds
                    var significantAbsoluteChange = absoluteChange > 1.0;
                    var significantPercentChange = percentChange > _significantChangeThreshold;

                    var isSignificant = significantAbsoluteChange || significantPercentChange;

                    if (isSignificant) {
                        _logger.LogDebug ("Significant change detected for {DataSource}: {Last} -> {New} (abs: {Abs}, %: {Percent})",
                            dataSource, lastNum, newNum, absoluteChange, percentChange * 100);
                    }

                    return isSignificant;
                }

                // Fallback to JSON comparison for non-numeric data
                var lastJson = System.Text.Json.JsonSerializer.Serialize (lastValue);
                var newJson = System.Text.Json.JsonSerializer.Serialize (newData);
                return lastJson != newJson;

            } catch (Exception ex) {
                _logger.LogDebug (ex, "Error comparing data for {DataSource}, assuming changed", dataSource);
                return true;
            }
        }

        // ========================================
        // HELPER CLASSES AND EXISTING METHODS
        // ========================================

        private class DataSourceInfo {
            public required string DataSource { get; set; }
            public required List<DashboardWidgetInstance> Widgets { get; set; }
            public int RefreshInterval { get; set; }
            public bool SupportsLiveData { get; set; }
            public required string Category { get; set; }
        }

        private async Task BroadcastDataSourceUpdate (
            IDataSourceManager dataSourceManager,
            string dataSource,
            IGrouping<string, DashboardWidgetInstance> widgets,
            CancellationToken cancellationToken) {
            try {
                // Create a generic live data request
                var liveRequest = new DashboardMetricRequestDto {
                    MetricType = dataSource,
                    Mode = "live",
                    DatePreset = "today"
                };

                // Get live data
                var liveData = await dataSourceManager.GetLiveDataAsync (dataSource, liveRequest);

                // Check if data has changed significantly
                if (!HasDataChanged (dataSource, liveData)) {
                    _logger.LogDebug ("No significant change in {DataSource}, skipping broadcast", dataSource);
                    return;
                }

                // Store the new value for change detection
                _lastKnownValues[dataSource] = liveData;

                // Broadcast to each widget that uses this data source
                foreach (var widget in widgets) {
                    try {
                        // Parse widget configuration
                        var configuration = new Dictionary<string, object> ();
                        if (!string.IsNullOrEmpty (widget.ConfigurationJson)) {
                            try {
                                configuration = System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, object>> (
                                    widget.ConfigurationJson) ?? new Dictionary<string, object> ();
                            } catch (Exception ex) {
                                _logger.LogWarning (ex, "Failed to parse configuration for widget {WidgetId}", widget.Id);
                            }
                        }

                        // Transform data for specific widget type
                        var transformedData = await dataSourceManager.TransformDataForWidgetType (
                            widget.Template.WidgetType, liveData, configuration);

                        // Broadcast the update
                        await dataSourceManager.BroadcastDataUpdateAsync (dataSource, new {
                            widgetInstanceId = widget.Id,
                                widgetType = widget.Template.WidgetType,
                                dataSource = dataSource,
                                data = transformedData,
                                isLiveUpdate = true,
                                userId = widget.UserId,
                                timestamp = DateTime.UtcNow
                        });

                        _logger.LogDebug ("Broadcasted live update for widget {WidgetId} ({DataSource})",
                            widget.Id, dataSource);
                    } catch (Exception ex) {
                        _logger.LogError (ex, "Error broadcasting to widget {WidgetId}", widget.Id);
                    }
                }

                _logger.LogInformation ("Broadcasted live data update for {DataSource} to {WidgetCount} widgets",
                    dataSource, widgets.Count ());
            } catch (Exception ex) {
                _logger.LogError (ex, "Error broadcasting data source update for {DataSource}", dataSource);
            }
        }

        private bool ShouldBroadcast (string dataSource, int refreshIntervalSeconds) {
            if (!_lastBroadcastTimes.TryGetValue (dataSource, out var lastBroadcast))
                return true; // First time, always broadcast

            var timeSinceLastBroadcast = DateTime.UtcNow - lastBroadcast;
            return timeSinceLastBroadcast.TotalSeconds >= refreshIntervalSeconds;
        }

        private bool HasDataChanged (string dataSource, object newData) {
            if (!_lastKnownValues.TryGetValue (dataSource, out var lastValue))
                return true; // First time, consider it changed

            try {
                // Simple JSON comparison for change detection
                var lastJson = System.Text.Json.JsonSerializer.Serialize (lastValue);
                var newJson = System.Text.Json.JsonSerializer.Serialize (newData);

                // For numeric values, check if change is significant (>1% or absolute change >1)
                if (TryExtractNumericValue (lastValue, out var lastNum) &&
                    TryExtractNumericValue (newData, out var newNum)) {
                    var absoluteChange = Math.Abs (newNum - lastNum);
                    var percentChange = lastNum != 0 ? Math.Abs ((newNum - lastNum) / lastNum) : 1.0;

                    // Consider significant if absolute change > 1 or percent change > 1%
                    return absoluteChange > 1.0 || percentChange > 0.01;
                }

                // Fallback to JSON comparison
                return lastJson != newJson;
            } catch {
                // If comparison fails, assume data changed
                return true;
            }
        }

        private bool TryExtractNumericValue (object data, out double value) {
            value = 0;
            try {
                if (data == null) return false;

                // Try to extract value from common data structures
                var json = System.Text.Json.JsonSerializer.Serialize (data);
                using var doc = System.Text.Json.JsonDocument.Parse (json);

                if (doc.RootElement.TryGetProperty ("value", out var valueElement)) {
                    return valueElement.TryGetDouble (out value);
                }

                // Try direct conversion
                return double.TryParse (data.ToString (), out value);
            } catch {
                return false;
            }
        }
    }
}