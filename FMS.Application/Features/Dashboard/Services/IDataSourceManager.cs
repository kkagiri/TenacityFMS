using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using FMS.Application.Features.Dashboard;
using FMS.Domain.Entities.Dashboard;

namespace FMS.Application.Services.Dashboard {
    /// <summary>
    /// Unified data source manager that handles both historical and live data for dashboard widgets
    /// </summary>
    public interface IDataSourceManager {
        /// <summary>
        /// Get initial historical data for a widget
        /// </summary>
        /// <param name="dataSource">Data source type (fuel_dispense, engine_hours, etc.)</param>
        /// <param name="request">Metric request parameters</param>
        /// <returns>Initial data set</returns>
        Task<object> GetInitialDataAsync (string dataSource, DashboardMetricRequestDto request);

        /// <summary>
        /// Get current live data point for a data source
        /// </summary>
        /// <param name="dataSource">Data source type</param>
        /// <param name="request">Metric request parameters</param>
        /// <returns>Current live data point</returns>
        Task<object> GetLiveDataAsync (string dataSource, DashboardMetricRequestDto request);

        /// <summary>
        /// Get aggregated data for specific time ranges (used for charts/graphs)
        /// </summary>
        /// <param name="dataSource">Data source type</param>
        /// <param name="request">Metric request parameters</param>
        /// <param name="aggregationInterval">Aggregation interval (hourly, daily, etc.)</param>
        /// <returns>Time-series aggregated data</returns>
        Task<object> GetAggregatedDataAsync (string dataSource, DashboardMetricRequestDto request, string aggregationInterval = "hourly");

        /// <summary>
        /// Broadcast live data update to all subscribed clients
        /// </summary>
        /// <param name="dataSource">Data source type</param>
        /// <param name="data">Data to broadcast</param>
        /// <param name="connectionId">Optional specific connection ID, null for all clients</param>
        Task BroadcastDataUpdateAsync (string dataSource, object data, string connectionId = null);

        /// <summary>
        /// Check if a data source supports live data streaming
        /// </summary>
        /// <param name="dataSource">Data source type</param>
        /// <returns>True if supports live data</returns>
        bool IsLiveDataSource (string dataSource);

        /// <summary>
        /// Check if a data source supports historical aggregation
        /// </summary>
        /// <param name="dataSource">Data source type</param>
        /// <returns>True if supports historical data</returns>
        bool IsHistoricalDataSource (string dataSource);

        /// <summary>
        /// Get supported aggregation methods for a data source
        /// </summary>
        /// <param name="dataSource">Data source type</param>
        /// <returns>List of supported aggregation methods (sum, avg, count, etc.)</returns>
        List<string> GetSupportedAggregations (string dataSource);

        /// <summary>
        /// Get data source metadata (units, display name, etc.)
        /// </summary>
        /// <param name="dataSource">Data source type</param>
        /// <returns>Data source metadata</returns>
        DataSourceMetadata GetDataSourceMetadata (string dataSource);

        /// <summary>
        /// Get metadata for all available data sources
        /// </summary>
        /// <returns>Enumerable of data source identifiers with metadata</returns>
        IEnumerable<KeyValuePair<string, DataSourceMetadata>> GetAllDataSources ();

        /// <summary>
        /// Transform raw metric data based on widget type requirements
        /// </summary>
        /// <param name="widgetType">Widget type from WidgetTypeDefinitions</param>
        /// <param name="rawData">Raw metric data</param>
        /// <param name="configuration">Widget configuration</param>
        /// <returns>Transformed data ready for widget consumption</returns>
        Task<object> TransformDataForWidgetType (string widgetType, object rawData, Dictionary<string, object> configuration);
    }

    /// <summary>
    /// Data source metadata
    /// </summary>
    public class DataSourceMetadata {
        public string DisplayName { get; set; }
        public string Unit { get; set; }
        public List<string> SupportedUnits { get; set; } = new List<string> ();
        public string Description { get; set; }
        public bool SupportsLiveData { get; set; }
        public bool SupportsHistoricalData { get; set; }
        public List<string> SupportedModes { get; set; } = new List<string> ();
        public List<string> SupportedAggregations { get; set; } = new List<string> ();
        // Categorical grouping capabilities for comparative widgets (bar/pie/table/progress)
        public List<string> SupportedGroupBy { get; set; } = new List<string> ();
        public string DefaultGroupBy { get; set; } = "none";
        public string DefaultAggregation { get; set; }
        public List<string> SupportedGranularities { get; set; } = new List<string> ();
        public string DefaultGranularity { get; set; }
        public string DefaultMode { get; set; }
        public List<string> RecommendedUnits { get; set; } = new List<string> ();
        public TimeSpan? MinWindow { get; set; }
        public TimeSpan? MaxWindow { get; set; }
        public bool SupportsCompareMode { get; set; }
        public DataSourceRecommendations Recommendations { get; set; } = new DataSourceRecommendations ();
        public List<string> CompatibleWidgetTypes { get; set; } = new List<string> ();
        public bool RequiresSiteFilter { get; set; }
        public bool RequiresVehicleFilter { get; set; }
        public Dictionary<string, object> DefaultConfiguration { get; set; } = new Dictionary<string, object> ();
        public string Category { get; set; }
        public int RefreshIntervalSeconds { get; set; } = 30;
        public bool IsCatalogVisible { get; set; } = true;
        // Defaults for categorical views
        public bool IncludeTotalDefault { get; set; } = true;
        public int? TopKDefault { get; set; }
    }

    public class DataSourceRecommendations {
        public string DatePreset { get; set; }
        public string Granularity { get; set; }
        public bool CumulativeDefault { get; set; }
        public string SmoothingDefault { get; set; }
    }

    /// <summary>
    /// Data update event arguments for live broadcasting
    /// </summary>
    public class DataUpdateEventArgs : EventArgs {
        public string DataSource { get; set; }
        public object Data { get; set; }
        public DateTime Timestamp { get; set; }
        public string MetricType { get; set; }
        public Dictionary<string, object> Metadata { get; set; } = new Dictionary<string, object> ();
    }
}