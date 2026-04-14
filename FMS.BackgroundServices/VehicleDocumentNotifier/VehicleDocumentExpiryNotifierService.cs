using FMS.Application.Features.EventEngine.Engine;
using FMS.Application.Features.EventEngine.Events;
using FMS.Application.Features.Notification.DTOs;
using FMS.Application.Features.Notification.DTOs.NotificationRecipient;
using FMS.Application.Features.Notification.Enums;
using FMS.Application.Features.Notification.Services;
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

#nullable disable

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

        using IServiceScope scope = _scopeFactory.CreateScope();
        GpsdataContext context = scope.ServiceProvider.GetRequiredService<GpsdataContext>();
        var eventEngine = scope.ServiceProvider.GetService<IEventExpressionEngine>();
        var notificationService = scope.ServiceProvider.GetService<INotificationService>();

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
            if (doc is not { Vehicle: { } vehicle })
            {
                _logger.LogWarning("Vehicle document {DocumentId} has no vehicle navigation loaded. Skipping expiry processing.", doc.Id);
                continue;
            }

            var vehicleLabel = string.IsNullOrWhiteSpace(vehicle.HyoungNo) ? $"Vehicle #{doc.VehicleId}" : vehicle.HyoungNo;
            var vehicleNo = vehicle.HyoungNo ?? string.Empty;
            int? vehicleTypeId = vehicle.VehicleTypeId;
            var vehicleTypeName = vehicle.VehicleType?.Name ?? string.Empty;
            var siteName = vehicle.WorkingSite?.Name ?? string.Empty;
            int? siteId = vehicle.WorkingSiteId;
            int daysUntilExpiry = (doc.ExpiryDate.Date - DateTime.UtcNow.Date).Days;
            if (daysUntilExpiry == doc.AlertLeadDays || daysUntilExpiry == 0 || daysUntilExpiry < 0)
            {
                string alarmType = daysUntilExpiry <= 0 ? "VehicleDocumentExpired" : "VehicleDocumentExpiringSoon";
                string priority = daysUntilExpiry <= Math.Max(1, Math.Min(doc.AlertLeadDays, 7)) ? "High" : "Medium";
                string message = $"{doc.ComplianceCategory} for vehicle {vehicleLabel} is expiring in {daysUntilExpiry} days.";
                if (daysUntilExpiry == 0) message = $"{doc.DocumentType} for vehicle {vehicleLabel} expires today.";

                if (daysUntilExpiry < 0)
                {
                    message = $"{doc.ComplianceCategory} for vehicle {vehicleLabel} expired {-daysUntilExpiry} days ago.";
                }


                // Fire SystemEvent for document expiry through the event expression engine
                if (eventEngine != null)
                {
                    string documentUrl = doc.DocumentFileUrl ?? string.Empty;
                    string documentNumber = doc.DocumentNumber ?? string.Empty;
                    if (!string.IsNullOrWhiteSpace(documentUrl) && !documentUrl.StartsWith("/api/v1/files/", StringComparison.OrdinalIgnoreCase))
                    {
                        documentUrl = $"/api/v1/files/{documentUrl.TrimStart('/')}";
                    }

                    var docEvent = new VehicleDocumentComplianceEvent
                    {
                        SiteId = siteId,
                        Severity = priority,
                        SubType = daysUntilExpiry <= 0 ? "VehicleDocumentExpired" : "VehicleDocumentExpiringSoon",
                        SourceComponent = "VehicleDocumentNotifier",
                        Message = message,
                        ReferenceType = "VehicleDocument",
                        DocumentId = doc.Id,
                        VehicleId = doc.VehicleId,
                        VehicleNo = vehicleNo,
                        VehicleTypeId = vehicleTypeId,
                        VehicleTypeName = vehicleTypeName,
                        SiteName = siteName,
                        DocumentTypeName = doc.DocumentType.ToString(),
                        ComplianceCategoryName = doc.ComplianceCategory.ToString(),
                        DocumentNumber = documentNumber,
                        IssuingAuthority = doc.IssuingAuthority ?? string.Empty,
                        DocumentFileName = doc.DocumentFileName ?? string.Empty,
                        ExpiryDate = doc.ExpiryDate,
                        DaysUntilExpiry = daysUntilExpiry,
                        AlertLeadDays = doc.AlertLeadDays,
                        DocumentFileUrl = documentUrl,
                    };
                    docEvent.Data["DocumentId"] = doc.Id.ToString();
                    docEvent.Data["DocumentType"] = doc.DocumentType.ToString();
                    docEvent.Data["ComplianceCategory"] = doc.ComplianceCategory.ToString();
                    docEvent.Data["VehicleNo"] = vehicleNo;
                    docEvent.Data["VehicleTypeId"] = vehicleTypeId?.ToString() ?? string.Empty;
                    docEvent.Data["VehicleTypeName"] = vehicleTypeName;
                    docEvent.Data["SiteName"] = siteName;
                    docEvent.Data["DocumentFileName"] = doc.DocumentFileName ?? string.Empty;
                    docEvent.Data["DaysUntilExpiry"] = daysUntilExpiry;
                    docEvent.Data["AlertLeadDays"] = doc.AlertLeadDays;
                    docEvent.Data["ExpiryDate"] = doc.ExpiryDate.ToString("yyyy-MM-dd");
                    docEvent.Data["DocumentFileUrl"] = documentUrl;
                    await eventEngine.ProcessAsync(docEvent, stoppingToken);
                }

                if (notificationService != null && ShouldNotifyUploader(daysUntilExpiry, doc.AlertLeadDays))
                {
                    await NotifyDocumentUploaderAsync(doc, daysUntilExpiry, notificationService, context, stoppingToken);
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

    private static bool ShouldNotifyUploader(int daysUntilExpiry, int alertLeadDays)
    {
        return daysUntilExpiry == 0 || daysUntilExpiry == alertLeadDays;
    }

    private async Task NotifyDocumentUploaderAsync(
        VehicleDocument document,
        int daysUntilExpiry,
        INotificationService notificationService,
        GpsdataContext context,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(document.CreatedBy))
        {
            return;
        }

        var uploaderId = document.CreatedBy.Trim();
        var uploaderExists = await context.Users
            .AsNoTracking()
            .AnyAsync(user => user.Id == uploaderId, cancellationToken);

        if (!uploaderExists)
        {
            _logger.LogWarning("Vehicle document {DocumentId} uploader {UploaderId} was not found. Skipping uploader reminder.", document.Id, uploaderId);
            return;
        }

        var vehicle = document.Vehicle;
        var vehicleLabel = vehicle == null || string.IsNullOrWhiteSpace(vehicle.HyoungNo)
            ? $"Vehicle #{document.VehicleId}"
            : vehicle.HyoungNo;
        int? siteId = vehicle?.WorkingSiteId;
        var title = daysUntilExpiry == 0
            ? $"Document expires today: {vehicleLabel}"
            : $"Document expiring soon: {vehicleLabel}";
        var message = daysUntilExpiry == 0
            ? $"Your {document.ComplianceCategory} document for {vehicleLabel} expires today."
            : $"Your {document.ComplianceCategory} document for {vehicleLabel} expires in {daysUntilExpiry} day(s).";

        var request = new CreateNotificationRequest
        {
            Type = NotificationType.Alert,
            CategoryId = (int)WellKnownCategories.SystemMaintenance,
            Priority = daysUntilExpiry == 0 ? NotificationPriority.High : NotificationPriority.Medium,
            Title = title,
            Message = message,
            Data = new
            {
                DocumentId = document.Id,
                VehicleId = document.VehicleId,
                VehicleLabel = vehicleLabel,
                DocumentNumber = document.DocumentNumber,
                ComplianceCategory = document.ComplianceCategory.ToString(),
                DocumentType = document.DocumentType.ToString(),
                ExpiryDate = document.ExpiryDate,
                DaysUntilExpiry = daysUntilExpiry,
                AlertLeadDays = document.AlertLeadDays,
                Link = "/vehicles/documents"
            },
            TriggerSource = "VehicleDocumentNotifier.UploaderReminder",
            VehicleId = document.VehicleId,
            SiteId = siteId,
            Recipients = new List<NotificationRecipientDto>
            {
                new()
                {
                    UserId = uploaderId,
                    DeliveryMethods = new List<string> { "System", "Email" },
                    ResolvedFrom = "VehicleDocumentUploader"
                }
            },
            DisableFallbackAllUsers = true
        };

        var result = await notificationService.CreateNotificationAsync(request, cancellationToken);
        if (!result.IsSuccess)
        {
            _logger.LogWarning("Failed to create uploader reminder notification for vehicle document {DocumentId}: {Message}", document.Id, result.Message);
        }
    }
}
