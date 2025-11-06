using System;
using System.Collections.Generic;

namespace FMS.Application.Features.VehicleMaintenance.DTOs;

/// <summary>
/// Data Transfer Object for Maintenance Dashboard Statistics
/// </summary>
public class MaintenanceDashboardDTO
{
    public int TotalVehicles { get; set; }
    public int UpToDateCount { get; set; }
    public int DueSoonCount { get; set; }
    public int OverdueCount { get; set; }
    public int InProgressCount { get; set; }
    public int ScheduledCount { get; set; }
    public int CompletedThisMonthCount { get; set; }
    public decimal TotalCostThisMonth { get; set; }
    public decimal TotalCostThisYear { get; set; }
    public decimal AverageCostPerMaintenance { get; set; }

    public List<MaintenanceByTypeDTO>? MaintenanceByType { get; set; }
    public List<UpcomingMaintenanceDTO>? UpcomingMaintenance { get; set; }
    public List<OverdueMaintenanceDTO>? OverdueMaintenance { get; set; }
    public List<MonthlyMaintenanceTrendDTO>? MonthlyTrend { get; set; }
}

/// <summary>
/// Maintenance count by type
/// </summary>
public class MaintenanceByTypeDTO
{
    public string MaintenanceType { get; set; } = null!;
    public int Count { get; set; }
    public decimal TotalCost { get; set; }
}

/// <summary>
/// Upcoming maintenance summary
/// </summary>
public class UpcomingMaintenanceDTO
{
    public int MaintenanceId { get; set; }
    public int VehicleId { get; set; }
    public string? VehicleName { get; set; }
    public string? NumberPlate { get; set; }
    public string MaintenanceType { get; set; } = null!;
    public DateTime? ScheduledDate { get; set; }
    public decimal? NextDueOdometer { get; set; }
    public int DaysUntilDue { get; set; }
    public decimal? KilometersUntilDue { get; set; }
}

/// <summary>
/// Overdue maintenance summary
/// </summary>
public class OverdueMaintenanceDTO
{
    public int MaintenanceId { get; set; }
    public int VehicleId { get; set; }
    public string? VehicleName { get; set; }
    public string? NumberPlate { get; set; }
    public string MaintenanceType { get; set; } = null!;
    public DateTime? ScheduledDate { get; set; }
    public int DaysOverdue { get; set; }
    public decimal? KilometersOverdue { get; set; }
    public int Priority { get; set; }
}

/// <summary>
/// Monthly maintenance trend
/// </summary>
public class MonthlyMaintenanceTrendDTO
{
    public int Year { get; set; }
    public int Month { get; set; }
    public string MonthName { get; set; } = null!;
    public int Count { get; set; }
    public decimal TotalCost { get; set; }
}
