using FMS.Application.Features.EventEngine.Engine;
using FMS.Application.Features.EventEngine.Events;
using FMS.Application.Features.Notification.Services.AlertConfiguration;
using FMS.Domain.Entities.enums;
using FMS.Persistence.DataAccess;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace FMS.BackgroundServices.VehicleMaintenance
{
    /// <summary>
    /// Background service that monitors vehicle maintenance schedules and creates alerts/notifications
    /// for upcoming, due, and overdue maintenance based on notification policies
    /// </summary>
    public class VehicleMaintenanceNotifierService : BackgroundService
    {
        private readonly ILogger<VehicleMaintenanceNotifierService> _logger;
        private readonly IServiceScopeFactory _scopeFactory;

        public VehicleMaintenanceNotifierService(
            ILogger<VehicleMaintenanceNotifierService> logger,
            IServiceScopeFactory scopeFactory)
        {
            _logger = logger;
            _scopeFactory = scopeFactory;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Vehicle Maintenance Notifier Service started.");

            // Wait a bit before first execution to allow system startup
            await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken);

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await ProcessMaintenanceAlertsAsync(stoppingToken);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error occurred while processing maintenance alerts.");
                }

                // Run at configurable interval (default: every 6 hours)
                int checkIntervalHours;
                try
                {
                    using var intervalScope = _scopeFactory.CreateScope();
                    var alertConfig = intervalScope.ServiceProvider.GetRequiredService<IAlertConfigurationService>();
                    checkIntervalHours = await alertConfig.GetIntAsync(
                        AlertConfigurationConstants.VehicleMaintenanceDue, "checkIntervalHours", 6);
                }
                catch
                {
                    checkIntervalHours = 6;
                }
                await Task.Delay(TimeSpan.FromHours(checkIntervalHours), stoppingToken);
            }

            _logger.LogInformation("Vehicle Maintenance Notifier Service stopped.");
        }

        private async Task ProcessMaintenanceAlertsAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Checking for due and overdue vehicle maintenance...");

            using IServiceScope scope = _scopeFactory.CreateScope();
            GpsdataContext context = scope.ServiceProvider.GetRequiredService<GpsdataContext>();
            IAlertConfigurationService alertConfig = scope.ServiceProvider.GetRequiredService<IAlertConfigurationService>();
            var eventEngine = scope.ServiceProvider.GetService<IEventExpressionEngine>();

            // Check if vehicle maintenance alerts are enabled
            bool isEnabled = await alertConfig.IsAlertEnabledAsync(AlertConfigurationConstants.VehicleMaintenanceDue);
            if (!isEnabled)
            {
                _logger.LogDebug("Vehicle maintenance alerts are disabled. Skipping.");
                return;
            }

            DateTime now = DateTime.UtcNow;
            int warningDays = await alertConfig.GetIntAsync(
                AlertConfigurationConstants.VehicleMaintenanceDue, "warningDaysBeforeDue", 7);
            DateTime warningThreshold = now.AddDays(warningDays);

            try
            {
                // Get all active vehicles with scheduled or in-progress maintenance
                var maintenanceRecords = await context.VehicleMaintenances
                    .Include(m => m.Vehicle)
                    .Include(m => m.MaintenanceSchedule)
                    .Where(m => m.Status == "Scheduled" || m.Status == "In Progress")
                    .Where(m => m.Vehicle != null && m.Vehicle.IsActive == 1)
                    .ToListAsync(stoppingToken);

                _logger.LogInformation($"Found {maintenanceRecords.Count} active maintenance records to process.");

                int overdueAlarmsCreated = 0;
                int dueSoonAlarmsCreated = 0;
                int recordsMarkedOverdue = 0;

                foreach (var maintenance in maintenanceRecords)
                {
                    bool isOverdue = false;
                    bool isDueSoon = false;
                    int? daysUntilDue = null;
                    decimal? kilometersDue = null;

                    // Check date-based maintenance
                    if (maintenance.ScheduledDate.HasValue)
                    {
                        var scheduledDate = maintenance.ScheduledDate.Value.Date;
                        var daysDiff = (scheduledDate - now.Date).Days;
                        daysUntilDue = daysDiff;

                        if (scheduledDate < now.Date)
                        {
                            isOverdue = true;
                        }
                        else if (scheduledDate <= warningThreshold.Date)
                        {
                            isDueSoon = true;
                        }
                    }

                    // Check odometer-based maintenance if we have odometer at schedule and next due odometer
                    // Note: For now, we skip real-time GPS odometer checks to avoid performance overhead
                    // Future enhancement: Periodically update a cached odometer value in Vehicle table
                    if (maintenance.NextDueOdometer.HasValue && maintenance.OdometerAtSchedule.HasValue)
                    {
                        // For odometer-based checks, we would need current odometer from GPS
                        // This would require injecting IVehicleTrackingProvider which is complex for background service
                        // Recommendation: Add a CurrentOdometer field to Vehicle table that gets updated periodically
                        // For now, log that odometer-based checks are skipped
                        _logger.LogDebug($"Maintenance ID {maintenance.MaintenanceId} has odometer threshold but current odometer not available in Vehicle table");
                    }

                    // Create alarms based on conditions
                    if (isOverdue && !maintenance.IsOverdue)
                    {
                        // Mark as overdue
                        maintenance.IsOverdue = true;
                        recordsMarkedOverdue++;

                        // Create critical alarm for overdue maintenance
                        string message = BuildOverdueMessage(maintenance, daysUntilDue, kilometersDue);
                        await CreateMaintenanceAlarm(
                            "VehicleMaintenanceOverdue",
                            "Critical",
                            DiscrepancySeverity.High,
                            message,
                            maintenance,
                            eventEngine,
                            stoppingToken);

                        overdueAlarmsCreated++;
                        _logger.LogWarning($"Created overdue alarm for maintenance ID {maintenance.MaintenanceId} - {maintenance.Vehicle?.HyoungNo}");
                    }
                    else if (isDueSoon && !isOverdue)
                    {
                        // Create medium priority alarm for due soon maintenance
                        string message = BuildDueSoonMessage(maintenance, daysUntilDue, kilometersDue);
                        await CreateMaintenanceAlarm(
                            "VehicleMaintenanceDueSoon",
                            "Medium",
                            DiscrepancySeverity.Medium,
                            message,
                            maintenance,
                            eventEngine,
                            stoppingToken);

                        dueSoonAlarmsCreated++;
                        _logger.LogInformation($"Created due soon alarm for maintenance ID {maintenance.MaintenanceId} - {maintenance.Vehicle?.HyoungNo}");
                    }
                }

                // Save changes (for IsOverdue flag updates)
                if (recordsMarkedOverdue > 0)
                {
                    await context.SaveChangesAsync(stoppingToken);
                    _logger.LogInformation($"Marked {recordsMarkedOverdue} maintenance records as overdue.");
                }

                _logger.LogInformation(
                    $"Maintenance alert processing completed. Overdue: {overdueAlarmsCreated}, Due Soon: {dueSoonAlarmsCreated}, Total Marked Overdue: {recordsMarkedOverdue}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing maintenance alerts.");
                throw;
            }
        }

        private string BuildOverdueMessage(
            Domain.Entities.Features.VehicleManagement.VehicleMaintenance maintenance,
            int? daysOverdue,
            decimal? kilometersDue)
        {
            string vehicleInfo = $"Vehicle {maintenance.Vehicle?.HyoungNo ?? "Unknown"} ({maintenance.Vehicle?.NumberPlate ?? "N/A"})";
            string maintenanceType = maintenance.MaintenanceType;

            List<string> parts = [$"{maintenanceType} maintenance is OVERDUE for {vehicleInfo}"];

            if (daysOverdue.HasValue && daysOverdue.Value < 0)
            {
                parts.Add($"Scheduled date was {Math.Abs(daysOverdue.Value)} days ago");
            }

            if (kilometersDue.HasValue && kilometersDue.Value < 0)
            {
                parts.Add($"Vehicle has exceeded scheduled odometer by {Math.Abs(kilometersDue.Value):N0} km");
            }

            return string.Join(". ", parts) + ".";
        }

        private string BuildDueSoonMessage(
            Domain.Entities.Features.VehicleManagement.VehicleMaintenance maintenance,
            int? daysUntilDue,
            decimal? kilometersDue)
        {
            string vehicleInfo = $"Vehicle {maintenance.Vehicle?.HyoungNo ?? "Unknown"} ({maintenance.Vehicle?.NumberPlate ?? "N/A"})";
            string maintenanceType = maintenance.MaintenanceType;

            List<string> parts = [$"{maintenanceType} maintenance is due soon for {vehicleInfo}"];

            if (daysUntilDue.HasValue && daysUntilDue.Value >= 0)
            {
                parts.Add($"Due in {daysUntilDue.Value} days");
            }

            if (kilometersDue.HasValue && kilometersDue.Value >= 0)
            {
                parts.Add($"{kilometersDue.Value:N0} km remaining until due");
            }

            return string.Join(". ", parts) + ".";
        }

        private async Task CreateMaintenanceAlarm(
            string alarmType,
            string priority,
            DiscrepancySeverity severity,
            string message,
            Domain.Entities.Features.VehicleManagement.VehicleMaintenance maintenance,
            IEventExpressionEngine? eventEngine,
            CancellationToken stoppingToken)
        {
            string description = BuildAlarmDescription(maintenance);

            // Fire SystemEvent for vehicle maintenance through event expression engine
            if (eventEngine != null)
            {
                var maintenanceEvent = new SystemEvent
                {
                    Severity = priority,
                    SubType = alarmType,
                    SourceComponent = "VehicleMaintenanceNotifier",
                    Message = message,
                    ReferenceId = maintenance.MaintenanceId,
                    ReferenceType = "VehicleMaintenance",
                };
                maintenanceEvent.Data["VehicleNo"] = maintenance.Vehicle?.HyoungNo ?? "Unknown";
                maintenanceEvent.Data["NumberPlate"] = maintenance.Vehicle?.NumberPlate ?? "N/A";
                maintenanceEvent.Data["MaintenanceType"] = maintenance.MaintenanceType;
                maintenanceEvent.Data["Status"] = maintenance.Status;
                maintenanceEvent.Data["Description"] = description;
                if (maintenance.ScheduledDate.HasValue)
                    maintenanceEvent.Data["ScheduledDate"] = maintenance.ScheduledDate.Value.ToString("yyyy-MM-dd");
                await eventEngine.ProcessAsync(maintenanceEvent, stoppingToken);
            }
            _logger.LogInformation(
                "Vehicle maintenance event: {AlarmType} Priority={Priority} Severity={Severity} MaintenanceId={MaintenanceId} - {Message}",
                alarmType, priority, severity, maintenance.MaintenanceId, message);
        }

        private string BuildAlarmDescription(Domain.Entities.Features.VehicleManagement.VehicleMaintenance maintenance)
        {
            List<string> details =
            [
                $"Maintenance Type: {maintenance.MaintenanceType}",
            $"Vehicle: {maintenance.Vehicle?.HyoungNo ?? "Unknown"}",
            $"Plate: {maintenance.Vehicle?.NumberPlate ?? "N/A"}",
            $"Status: {maintenance.Status}",
            $"Priority: {GetPriorityLabel(maintenance.Priority)}"
            ];

            if (maintenance.ScheduledDate.HasValue)
            {
                details.Add($"Scheduled Date: {maintenance.ScheduledDate.Value:yyyy-MM-dd}");
            }

            if (maintenance.NextDueOdometer.HasValue)
            {
                details.Add($"Next Due Odometer: {maintenance.NextDueOdometer.Value:N0} km");
            }

            if (maintenance.OdometerAtSchedule.HasValue)
            {
                details.Add($"Odometer at Schedule: {maintenance.OdometerAtSchedule.Value:N0} km");
            }

            if (!string.IsNullOrWhiteSpace(maintenance.ServiceProvider))
            {
                details.Add($"Service Provider: {maintenance.ServiceProvider}");
            }

            if (!string.IsNullOrWhiteSpace(maintenance.ResponsiblePerson))
            {
                details.Add($"Responsible: {maintenance.ResponsiblePerson}");
            }

            return string.Join(" | ", details);
        }

        private string GetPriorityLabel(int priority)
        {
            return priority switch
            {
                1 => "Low",
                2 => "Normal",
                3 => "Medium",
                4 => "High",
                5 => "Critical",
                _ => "Normal"
            };
        }
    }
}
