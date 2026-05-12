using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using FMS.Application.Features.Dashboard;
using FMS.Domain.Entities.Dashboard;

namespace FMS.Application.Services.Dashboard {

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