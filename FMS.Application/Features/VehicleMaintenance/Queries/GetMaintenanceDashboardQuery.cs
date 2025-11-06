using FMS.Application.Features.VehicleMaintenance.DTOs;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace FMS.Application.Features.VehicleMaintenance.Queries;

public record GetMaintenanceDashboardQuery() : IRequest<MaintenanceDashboardDTO>;

public class GetMaintenanceDashboardQueryHandler : IRequestHandler<GetMaintenanceDashboardQuery, MaintenanceDashboardDTO>
{
    private readonly GpsdataContext _context;
    private readonly ILogger<GetMaintenanceDashboardQueryHandler> _logger;

    public GetMaintenanceDashboardQueryHandler(
        GpsdataContext context,
        ILogger<GetMaintenanceDashboardQueryHandler> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<MaintenanceDashboardDTO> Handle(GetMaintenanceDashboardQuery request, CancellationToken cancellationToken)
    {
        try
        {
            var now = DateTime.UtcNow;
            var startOfMonth = new DateTime(now.Year, now.Month, 1);
            var startOfYear = new DateTime(now.Year, 1, 1);

            // Get all maintenance records
            var allMaintenance = await _context.Set<Domain.Entities.Features.VehicleManagement.VehicleMaintenance>()
                .AsNoTracking()
                .Include(m => m.Vehicle)
                .ToListAsync(cancellationToken);

            // Calculate dashboard statistics
            var dashboard = new MaintenanceDashboardDTO
            {
                TotalVehicles = await _context.Vehicles.CountAsync(cancellationToken),
                ScheduledCount = allMaintenance.Count(m => m.Status == "Scheduled"),
                InProgressCount = allMaintenance.Count(m => m.Status == "In Progress"),
                OverdueCount = allMaintenance.Count(m => m.IsOverdue),
                CompletedThisMonthCount = allMaintenance.Count(m => m.Status == "Completed" && m.CompletedDate >= startOfMonth),
                TotalCostThisMonth = allMaintenance
                    .Where(m => m.CompletedDate >= startOfMonth && m.Cost.HasValue)
                    .Sum(m => m.Cost.Value),
                TotalCostThisYear = allMaintenance
                    .Where(m => m.CompletedDate >= startOfYear && m.Cost.HasValue)
                    .Sum(m => m.Cost.Value),
                AverageCostPerMaintenance = allMaintenance
                    .Where(m => m.Cost.HasValue)
                    .Average(m => (decimal?)m.Cost) ?? 0
            };

            // Calculate DueSoonCount (within 7 days or 500 km)
            var dueSoonThreshold = now.AddDays(7);
            dashboard.DueSoonCount = allMaintenance.Count(m =>
                (m.NextDueDate.HasValue && m.NextDueDate.Value <= dueSoonThreshold && m.NextDueDate.Value >= now) ||
                (m.NextDueOdometer.HasValue && m.NextDueOdometer.Value <= 500 && m.NextDueOdometer.Value > 0)
            );

            dashboard.UpToDateCount = dashboard.TotalVehicles - dashboard.DueSoonCount - dashboard.OverdueCount;

            // Maintenance by type
            dashboard.MaintenanceByType = allMaintenance
                .GroupBy(m => m.MaintenanceType)
                .Select(g => new MaintenanceByTypeDTO
                {
                    MaintenanceType = g.Key,
                    Count = g.Count(),
                    TotalCost = g.Where(m => m.Cost.HasValue).Sum(m => m.Cost.Value)
                })
                .ToList();

            // Upcoming maintenance (next 30 days)
            var upcomingThreshold = now.AddDays(30);
            dashboard.UpcomingMaintenance = allMaintenance
                .Where(m => m.Status == "Scheduled" && m.ScheduledDate.HasValue && m.ScheduledDate.Value <= upcomingThreshold && m.ScheduledDate.Value >= now)
                .OrderBy(m => m.ScheduledDate)
                .Take(10)
                .Select(m => new UpcomingMaintenanceDTO
                {
                    MaintenanceId = m.MaintenanceId,
                    VehicleId = m.VehicleId,
                    VehicleName = m.Vehicle?.HyoungNo,
                    NumberPlate = m.Vehicle?.NumberPlate,
                    MaintenanceType = m.MaintenanceType,
                    ScheduledDate = m.ScheduledDate,
                    NextDueOdometer = m.NextDueOdometer,
                    DaysUntilDue = m.ScheduledDate.HasValue ? (int)(m.ScheduledDate.Value - now).TotalDays : 0,
                    KilometersUntilDue = m.NextDueOdometer
                })
                .ToList();

            // Overdue maintenance
            dashboard.OverdueMaintenance = allMaintenance
                .Where(m => m.IsOverdue)
                .OrderByDescending(m => m.Priority)
                .ThenBy(m => m.ScheduledDate)
                .Take(10)
                .Select(m => new OverdueMaintenanceDTO
                {
                    MaintenanceId = m.MaintenanceId,
                    VehicleId = m.VehicleId,
                    VehicleName = m.Vehicle?.HyoungNo,
                    NumberPlate = m.Vehicle?.NumberPlate,
                    MaintenanceType = m.MaintenanceType,
                    ScheduledDate = m.ScheduledDate,
                    DaysOverdue = m.ScheduledDate.HasValue ? (int)(now - m.ScheduledDate.Value).TotalDays : 0,
                    KilometersOverdue = m.OdometerAtSchedule.HasValue && m.NextDueOdometer.HasValue
                        ? m.OdometerAtSchedule.Value - m.NextDueOdometer.Value
                        : null,
                    Priority = m.Priority
                })
                .ToList();

            // Monthly trend (last 12 months)
            var last12Months = Enumerable.Range(0, 12)
                .Select(i => now.AddMonths(-i))
                .OrderBy(d => d)
                .ToList();

            dashboard.MonthlyTrend = last12Months.Select(month =>
            {
                var monthStart = new DateTime(month.Year, month.Month, 1);
                var monthEnd = monthStart.AddMonths(1);

                var monthMaintenance = allMaintenance
                    .Where(m => m.CompletedDate.HasValue && m.CompletedDate.Value >= monthStart && m.CompletedDate.Value < monthEnd);

                return new MonthlyMaintenanceTrendDTO
                {
                    Year = month.Year,
                    Month = month.Month,
                    MonthName = month.ToString("MMM yyyy", CultureInfo.InvariantCulture),
                    Count = monthMaintenance.Count(),
                    TotalCost = monthMaintenance.Where(m => m.Cost.HasValue).Sum(m => m.Cost.Value)
                };
            }).ToList();

            return dashboard;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating maintenance dashboard");
            return new MaintenanceDashboardDTO();
        }
    }
}
