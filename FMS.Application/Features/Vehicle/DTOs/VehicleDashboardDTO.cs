// Vehicle Dashboard DTOs for analytics
using System;
using System.Collections.Generic;
public class VehicleDashboardAnalyticsDTO {
    public VehicleDashboardMetricsDTO Metrics { get; set; }
    public List<VehicleStatusDistributionDTO> StatusDistribution { get; set; }
    public FleetUtilizationDTO FleetUtilization { get; set; }
    public List<MaintenanceAlertDTO> MaintenanceAlerts { get; set; }
    public List<VehicleActivityDTO> RecentActivities { get; set; }
    public VehiclePerformanceMetricsDTO PerformanceMetrics { get; set; }
    public DateTime LastUpdated { get; set; }
}

public class VehicleDashboardMetricsDTO {
    public int TotalVehicles { get; set; }
    public int ActiveVehicles { get; set; }
    public int OnlineVehicles { get; set; }
    public int OfflineVehicles { get; set; }
    public int VehiclesWithIssues { get; set; }
    public int PendingVehicles { get; set; }
    public int MaintenanceDue { get; set; }
    public int InTransit { get; set; }
    public int Idle { get; set; }
    public double AverageUtilization { get; set; }
    public double FleetHealthScore { get; set; }
    public int GPSEnabledVehicles { get; set; }
    public int UnassignedVehicles { get; set; }
}

public class VehicleStatusDistributionDTO {
    public string Status { get; set; }
    public int Count { get; set; }
    public double Percentage { get; set; }
    public string Color { get; set; }
    public string Description { get; set; }
}

public class FleetUtilizationDTO {
    public double OverallUtilization { get; set; }
    public List<DailyUtilizationDTO> DailyUtilization { get; set; }
    public List<VehicleUtilizationDTO> VehicleUtilization { get; set; }
    public double AverageHoursPerDay { get; set; }
    public double PeakUtilizationHour { get; set; }
    public int TotalOperatingHours { get; set; }
}

public class DailyUtilizationDTO {
    public DateTime Date { get; set; }
    public double UtilizationRate { get; set; }
    public int ActiveVehicles { get; set; }
    public double TotalHours { get; set; }
}

public class VehicleUtilizationDTO {
    public int VehicleId { get; set; }
    public string VehicleName { get; set; }
    public string VehicleNumber { get; set; }
    public string PlateNumber { get; set; }
    public double UtilizationRate { get; set; }
    public double HoursOperated { get; set; }
    public string Status { get; set; }
    public DateTime LastUsed { get; set; }
}

public class MaintenanceAlertDTO {
    public int VehicleId { get; set; }
    public string VehicleName { get; set; }
    public string VehicleNumber { get; set; }
    public string PlateNumber { get; set; }
    public string AlertType { get; set; }
    public string AlertLevel { get; set; } // Critical, High, Medium, Low
    public string Description { get; set; }
    public DateTime DueDate { get; set; }
    public int DaysOverdue { get; set; }
    public bool IsOverdue { get; set; }
    public string MaintenanceType { get; set; }
    public double? Mileage { get; set; }
    public string Priority { get; set; }
    public double EstimatedCost { get; set; }
    public DateTime LastMaintenanceDate { get; set; }
}

public class VehicleActivityDTO {
    public int ActivityId { get; set; }
    public int VehicleId { get; set; }
    public string VehicleName { get; set; }
    public string VehicleNumber { get; set; }
    public string PlateNumber { get; set; }
    public string ActivityType { get; set; }
    public string Description { get; set; }
    public DateTime Timestamp { get; set; }
    public DateTime ActivityDate { get; set; }
    public string Location { get; set; }
    public string Status { get; set; }
    public int UserId { get; set; }
    public string CreatedBy { get; set; }
    public string UserName { get; set; }
    public Dictionary<string, object> AdditionalData { get; set; }
}

public class VehiclePerformanceMetricsDTO {
    public double AverageFuelEfficiency { get; set; }
    public double TotalDistanceTraveled { get; set; }
    public double AverageSpeed { get; set; }
    public int TotalTrips { get; set; }
    public double AverageTripDistance { get; set; }
    public double AverageTripDuration { get; set; }
    public List<VehiclePerformanceDetailDTO> VehicleDetails { get; set; }
    public List<DailyPerformanceDTO> DailyPerformance { get; set; }
    public double IdleTimePercentage { get; set; }
    public int HarshBrakingEvents { get; set; }
    public int HarshAccelerationEvents { get; set; }
    public int SpeedingViolations { get; set; }
    public double AverageFuelCostPerLiter { get; set; }
    public double TotalFuelConsumed { get; set; }
    public double AverageIdleTime { get; set; }
    public double CostEfficiency { get; set; }
    public double AverageTripsPerDay { get; set; }
    public double MaintenanceCostRatio { get; set; }
    public double UtilizationRate { get; set; }
    public DateTime PeriodStart { get; set; }
    public DateTime PeriodEnd { get; set; }
    public int TotalVehiclesTracked { get; set; }
    public double FuelEfficiency { get; set; }
    public double TotalDistance { get; set; }
}

public class VehiclePerformanceDetailDTO {
    public int VehicleId { get; set; }
    public string VehicleName { get; set; }
    public string PlateNumber { get; set; }
    public double FuelEfficiency { get; set; }
    public double DistanceTraveled { get; set; }
    public double AverageSpeed { get; set; }
    public int TripCount { get; set; }
    public double IdleTime { get; set; }
    public int SafetyScore { get; set; }
    public double PerformanceScore { get; set; }
}

public class DailyPerformanceDTO {
    public DateTime Date { get; set; }
    public double TotalDistance { get; set; }
    public double AverageSpeed { get; set; }
    public double FuelConsumed { get; set; }
    public int TripCount { get; set; }
    public double IdleTime { get; set; }
    public int ActiveVehicles { get; set; }
}

// Additional DTOs for specific analytics

public class VehicleDashboardLocationDTO {
    public int VehicleId { get; set; }
    public string VehicleName { get; set; }
    public string PlateNumber { get; set; }
    public double Latitude { get; set; }
    public double Longitude { get; set; }
    public string Address { get; set; }
    public DateTime LastUpdate { get; set; }
    public string Status { get; set; }
    public double Speed { get; set; }
    public string Direction { get; set; }
}

public class VehicleAlertSummaryDTO {
    public int CriticalAlerts { get; set; }
    public int HighAlerts { get; set; }
    public int MediumAlerts { get; set; }
    public int LowAlerts { get; set; }
    public int TotalAlerts { get; set; }
    public List<AlertByTypeDTO> AlertsByType { get; set; }
}

public class AlertByTypeDTO {
    public string AlertType { get; set; }
    public int Count { get; set; }
    public string Description { get; set; }
}