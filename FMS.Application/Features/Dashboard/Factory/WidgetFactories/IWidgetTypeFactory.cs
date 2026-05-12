using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using FMS.Application.Features.Dashboard;

namespace FMS.Application.Services.Dashboard.WidgetFactories {
    // Widget type factory interface for processing different widget types
    public interface IWidgetTypeFactory {
        Task<WidgetDataProcessingResult> ProcessWidgetDataAsync (
            string widgetType,
            string category,
            string dataSource,
            Dictionary<string, object> filters,
            Dictionary<string, object> settings,
            string timeRange,
            string mode);

        bool SupportsWidgetType (string widgetType);
        WidgetTypeConfiguration GetWidgetTypeConfig (string widgetType);
    }

    // Widget data processing result
    public class WidgetDataProcessingResult {
        public bool Success { get; set; }
        public string ErrorMessage { get; set; } = string.Empty;
        public object ProcessedData { get; set; } = null!;
        public Dictionary<string, object> ProcessedFilters { get; set; } = new ();
        public Dictionary<string, object> ProcessedSettings { get; set; } = new ();
        public string AggregationType { get; set; } = "none";
        public List<string> RequiredFields { get; set; } = new ();
        public string DataQueryType { get; set; } = "default"; // realtime, historical, aggregate
    }

    // Widget type configuration
    public class WidgetTypeConfiguration {
        public string WidgetType { get; set; } = null!;
        public string ExpectedDataFormat { get; set; } = null!; // json, chartData, tableData, etc.
        public List<string> RequiredDataFields { get; set; } = new ();
        public List<string> SupportedAggregations { get; set; } = new ();
        public Dictionary<string, object> DefaultSettings { get; set; } = new ();
        public bool RequiresTrendData { get; set; } = false;
        public bool SupportsRealTimeData { get; set; } = true;
        public int DefaultRefreshInterval { get; set; } = 30; // seconds
    }

    // Chart-specific data structure
    public class ChartDataStructure {
        public List<Dictionary<string, object>> ChartData { get; set; } = new ();
        public string XAxisField { get; set; } = "date";
        public string YAxisField { get; set; } = "value";
        public List<string> SeriesFields { get; set; } = new ();
        public Dictionary<string, string> FieldLabels { get; set; } = new ();
    }

    // Stat card data structure
    public class StatCardDataStructure {
        public decimal Value { get; set; }
        public string Unit { get; set; } = string.Empty;
        public TrendData? Trend { get; set; }
        public decimal? PreviousValue { get; set; }
        public string Period { get; set; } = "Current";
        public List<SubMetric> SubMetrics { get; set; } = new ();
    }

    public class TrendData {
        public decimal Percentage { get; set; }
        public string Direction { get; set; } = "neutral"; // up, down, neutral
        public string Period { get; set; } = "previous";
    }

    public class SubMetric {
        public string Label { get; set; } = null!;
        public decimal Value { get; set; }
        public string Unit { get; set; } = string.Empty;
        public string Format { get; set; } = "number";
    }

    // Table data structure
    public class TableDataStructure {
        public List<Dictionary<string, object>> Rows { get; set; } = new ();
        public List<TableColumn> Columns { get; set; } = new ();
        public int TotalRows { get; set; }
        public int CurrentPage { get; set; } = 1;
        public int PageSize { get; set; } = 10;
    }

    public class TableColumn {
        public string Field { get; set; } = null!;
        public string Label { get; set; } = null!;
        public string DataType { get; set; } = "string"; // string, number, date, boolean
        public bool Sortable { get; set; } = true;
        public string Format { get; set; } = "default";
        public int Width { get; set; } = 100;
    }
}