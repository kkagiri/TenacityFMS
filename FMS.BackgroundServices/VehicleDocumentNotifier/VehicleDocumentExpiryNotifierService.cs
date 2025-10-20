using FMS.Application.Features.Notification.DTOs;
using FMS.Application.Features.Notification.Services.ActiveAlarm;
using FMS.Domain.Entities;
using FMS.Domain.Entities.Features.VehicleDocumentManagement;
using FMS.Persistence.DataAccess;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace FMS.BackgroundServices.VehicleDocumentNotifier;

public class VehicleDocumentExpiryNotifierService : BackgroundService
{
    private readonly ILogger<VehicleDocumentExpiryNotifierService> _logger;
    private readonly IServiceScopeFactory _scopeFactory;

    public VehicleDocumentExpiryNotifierService(ILogger<VehicleDocumentExpiryNotifierService> logger, IServiceScopeFactory scopeFactory)
    {
        _logger = logger;
        _scopeFactory = scopeFactory;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Vehicle Document Expiry Notifier Service running.");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await ProcessExpiringDocuments(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while processing expiring vehicle documents.");
            }

            // Run once a day
            await Task.Delay(TimeSpan.FromDays(1), stoppingToken);
        }
    }

    private async Task ProcessExpiringDocuments(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Checking for expiring vehicle documents.");

        IServiceScope scope = _scopeFactory.CreateScope();
        GpsdataContext context = scope.ServiceProvider.GetRequiredService<GpsdataContext>();
        IActiveAlarmService activeAlarmService = scope.ServiceProvider.GetRequiredService<IActiveAlarmService>();

        DateTime expiringSoonDate = DateTime.UtcNow.Date.AddDays(30);
        List<VehicleDocument> documentsToNotify = await context.VehicleDocuments
            .Include(vd => vd.Vehicle)
            .Where(vd => vd.ExpiryDate <= expiringSoonDate && vd.Status != DocumentStatus.Expired)
            .ToListAsync(stoppingToken);

        foreach (VehicleDocument doc in documentsToNotify)
        {
            int daysUntilExpiry = (doc.ExpiryDate.Date - DateTime.UtcNow.Date).Days;
            if (daysUntilExpiry == 30 || daysUntilExpiry == 7 || daysUntilExpiry == 1 || daysUntilExpiry <= 0)
            {
                string alarmType = daysUntilExpiry <= 0 ? "VehicleDocumentExpired" : "VehicleDocumentExpiringSoon";
                string priority = daysUntilExpiry <= 7 ? "High" : "Medium";
                string message = $"{doc.DocumentType} for vehicle {doc.Vehicle.HyoungNo} is expiring in {daysUntilExpiry} days.";
                if (daysUntilExpiry == 0) message = $"{doc.DocumentType} for vehicle {doc.Vehicle.HyoungNo} expires today.";

                if (daysUntilExpiry < 0)
                {
                    message = $"{doc.DocumentType} for vehicle {doc.Vehicle.HyoungNo} expired {-daysUntilExpiry} days ago.";
                }


                CreateActiveAlarmRequest request = new CreateActiveAlarmRequest
                {
                    AlarmType = alarmType,
                    TriggerSource = "System",
                    Severity = Domain.Entities.enums.DiscrepancySeverity.Medium,
                    Priority = priority,
                    Message = message,
                    Description = $"Document: {doc.DocumentNumber}, Expires on: {doc.ExpiryDate:yyyy-MM-dd}",
                    SiteId = doc.Vehicle.WorkingSiteId,
                    CheckForDuplicates = true,
                };

                await activeAlarmService.CreateActiveAlarmAsync(request, stoppingToken);
                _logger.LogInformation(
                    $"Created alarm for document ID {doc.Id} expiring in {daysUntilExpiry} days.");
            }
        }

        // Also update status for documents that have just expired
        List<VehicleDocument> newlyExpiredDocuments = await context.VehicleDocuments
            .Where(vd => vd.ExpiryDate < DateTime.UtcNow.Date && vd.Status != DocumentStatus.Expired)
            .ToListAsync(stoppingToken);

        foreach (VehicleDocument doc in newlyExpiredDocuments)
        {
            doc.UpdateStatus();
        }
        await context.SaveChangesAsync(stoppingToken);
    }
}
