using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace FMS.Application.Features.Dashboard {
    public class DashboardMetricRequestDto {
        [Required]
        public string MetricType { get; set; } = string.Empty; // fuel_dispense, engine_hours, km_travel, etc.

        [Required]
        public string Mode { get; set; } = string.Empty; // live, cumulative

        [Required]
        public string DatePreset { get; set; } = string.Empty; // today, yesterday, last_week, last_month, etc.

        public List<int> ? SiteIds { get; set; } // null = all sites

        public List<int> ? VehicleIds { get; set; } // for future vehicle-specific metrics

        public List<int> ? TankIds { get; set; } // for future tank-specific metrics

        public List<int> ? VehicleType { get; set; } // for future vehicle type-specific metrics

        // Optional custom date range (overrides DatePreset if provided)
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }

        // Time interval configuration for time-series data (in hours)
        public int? IntervalHours { get; set; }
    }
}