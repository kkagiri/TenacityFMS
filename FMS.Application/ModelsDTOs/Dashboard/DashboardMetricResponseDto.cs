using System;

namespace FMS.Application.Features.Dashboard {
    public class DashboardMetricResponseDto {
        public decimal Value { get; set; }
        public string Unit { get; set; } = string.Empty;
        public DateTime LastUpdated { get; set; }
        public string MetricType { get; set; } = string.Empty;
        public string Mode { get; set; } = string.Empty;
        public string DateRange { get; set; } = string.Empty;
        public int? AffectedSitesCount { get; set; }
        public int? AffectedVehiclesCount { get; set; }
        public bool IsLiveData { get; set; }
        public string? ErrorMessage { get; set; }
    }
}