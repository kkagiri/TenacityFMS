using FMS.Application.Features.EventEngine.Engine;
using FMS.Application.Features.EventEngine.Events;
using FMS.Domain.Entities;
using FMS.Domain.Entities.Features.VehicleDocumentManagement;
using FMS.Persistence.DataAccess;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
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
        var eventEngine = scope.ServiceProvider.GetService<IEventExpressionEngine>();

        DateTime processingHorizon = DateTime.UtcNow.Date.AddDays(365);
        List<VehicleDocument> documentsToNotify = await context.VehicleDocuments
            .Include(vd => vd.Vehicle)
            .ThenInclude(vehicle => vehicle.WorkingSite)
            .Include(vd => vd.Vehicle)
            .ThenInclude(vehicle => vehicle.VehicleType)
            .Where(vd => vd.ExpiryDate <= processingHorizon)
            .ToListAsync(stoppingToken);

        foreach (VehicleDocument doc in documentsToNotify)
        {
            int daysUntilExpiry = (doc.ExpiryDate.Date - DateTime.UtcNow.Date).Days;
            if (daysUntilExpiry == doc.AlertLeadDays || daysUntilExpiry == 0 || daysUntilExpiry < 0)
            {
                string alarmType = daysUntilExpiry <= 0 ? "VehicleDocumentExpired" : "VehicleDocumentExpiringSoon";
                string priority = daysUntilExpiry <= Math.Max(1, Math.Min(doc.AlertLeadDays, 7)) ? "High" : "Medium";
                string message = $"{doc.ComplianceCategory} for vehicle {doc.Vehicle.HyoungNo} is expiring in {daysUntilExpiry} days.";
                if (daysUntilExpiry == 0) message = $"{doc.DocumentType} for vehicle {doc.Vehicle.HyoungNo} expires today.";

                if (daysUntilExpiry < 0)
                {
                    message = $"{doc.ComplianceCategory} for vehicle {doc.Vehicle.HyoungNo} expired {-daysUntilExpiry} days ago.";
                }


                // Fire SystemEvent for document expiry through the event expression engine
                if (eventEngine != null)
                {
                    var documentUrl = doc.DocumentFileUrl ?? string.Empty;
                    if (!string.IsNullOrWhiteSpace(documentUrl) && !documentUrl.StartsWith("/api/v1/files/", StringComparison.OrdinalIgnoreCase))
                    {
                        documentUrl = $"/api/v1/files/{documentUrl.TrimStart('/')}";
                    }

                    var docEvent = new VehicleDocumentComplianceEvent
                    {
                        SiteId = doc.Vehicle?.WorkingSiteId,
                        Severity = priority,
                        SubType = daysUntilExpiry <= 0 ? "VehicleDocumentExpired" : "VehicleDocumentExpiringSoon",
                        SourceComponent = "VehicleDocumentNotifier",
                        Message = message,
                        ReferenceType = "VehicleDocument",
                        DocumentId = doc.Id,
                        VehicleId = doc.VehicleId,
                        VehicleNo = doc.Vehicle?.HyoungNo ?? string.Empty,
                        VehicleTypeId = doc.Vehicle?.VehicleTypeId,
                        VehicleTypeName = doc.Vehicle?.VehicleType?.Name ?? string.Empty,
                        SiteName = doc.Vehicle?.WorkingSite?.Name ?? string.Empty,
                        DocumentTypeName = doc.DocumentType.ToString(),
                        ComplianceCategoryName = doc.ComplianceCategory.ToString(),
                        DocumentNumber = doc.DocumentNumber,
                        IssuingAuthority = doc.IssuingAuthority,
                        DocumentFileName = doc.DocumentFileName ?? string.Empty,
                        ExpiryDate = doc.ExpiryDate,
                        DaysUntilExpiry = daysUntilExpiry,
                        AlertLeadDays = doc.AlertLeadDays,
                        DocumentFileUrl = documentUrl,
                    };
                    docEvent.Data["DocumentId"] = doc.Id.ToString();
                    docEvent.Data["DocumentType"] = doc.DocumentType.ToString();
                    docEvent.Data["ComplianceCategory"] = doc.ComplianceCategory.ToString();
                    docEvent.Data["VehicleNo"] = doc.Vehicle?.HyoungNo ?? "";
                    docEvent.Data["VehicleTypeId"] = doc.Vehicle?.VehicleTypeId;
                    docEvent.Data["VehicleTypeName"] = doc.Vehicle?.VehicleType?.Name ?? string.Empty;
                    docEvent.Data["SiteName"] = doc.Vehicle?.WorkingSite?.Name ?? string.Empty;
                    docEvent.Data["DocumentFileName"] = doc.DocumentFileName ?? string.Empty;
                    docEvent.Data["DaysUntilExpiry"] = daysUntilExpiry;
                    docEvent.Data["AlertLeadDays"] = doc.AlertLeadDays;
                    docEvent.Data["ExpiryDate"] = doc.ExpiryDate.ToString("yyyy-MM-dd");
                    docEvent.Data["DocumentFileUrl"] = documentUrl;
                    await eventEngine.ProcessAsync(docEvent, stoppingToken);
                }
                _logger.LogInformation(
                    "Vehicle document expiry event: {AlarmType} - {Message}", alarmType, message);
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
