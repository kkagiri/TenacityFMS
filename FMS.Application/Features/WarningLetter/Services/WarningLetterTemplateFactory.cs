/**
 * File: WarningLetterTemplateFactory.cs
 * Purpose: Builds warning-letter template models and resolves rendering settings.
 * Dependencies: EF Core, SystemConfigurationService, QRCoder, WarningLetterHtmlTemplates
 * Last Modified: 2026-04-21
 *
 * Key Functions:
 * - LoadResolvedSettingsAsync(): Resolves warning-letter configuration values.
 * - BuildTemplateModelAsync(): Maps warning-letter entities into the HTML/PDF template model.
 * - ResolveWarningSequenceAsync(): Computes ordinal warning labels with effective-date filtering.
 */
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net.Mail;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Features.Notification.DTOs;
using FMS.Application.Features.Notification.DTOs.NotificationRecipient;
using FMS.Application.Features.Notification.Enums;
using FMS.Application.Features.Notification.Services;
using FMS.Application.Features.WarningLetter;
using FMS.Application.Features.WarningLetter.DTOs;
using FMS.Application.Features.WarningLetter.Queries;
using FMS.Application.Features.WarningLetter.Templates;
using FMS.Application.Services.Configuration;
using FMS.Domain.Entities;
using FMS.Domain.Entities.Features.WarningLetterManagement;
using FMS.Persistence.DataAccess;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using QRCoder;
using EmployeeEntity = FMS.Domain.Entities.Employee;
using SiteEntity = FMS.Domain.Entities.Site;
using VehicleEntity = FMS.Domain.Entities.Vehicle;
using WarningLetterEntity = FMS.Domain.Entities.Features.WarningLetterManagement.WarningLetter;

namespace FMS.Application.Features.WarningLetter.Services;

internal sealed class WarningLetterTemplateFactory
{
    private const string CompanyName = "H. Young & Co. (EA) Ltd";
    private const string LetterheadLogoPath = @"C:\FMSData\reports\branding\letterhead-logo.png";

    private readonly GpsdataContext _context;
    private readonly ISystemConfigurationService _systemConfigurationService;

    public WarningLetterTemplateFactory(GpsdataContext context, ISystemConfigurationService systemConfigurationService)
    {
        _context = context;
        _systemConfigurationService = systemConfigurationService;
    }

    public async Task<WarningLetterResolvedSettings> LoadResolvedSettingsAsync(CancellationToken cancellationToken)
    {
        var fuelPrice = await _systemConfigurationService.GetDecimalAsync(
            GetWarningLetterSettingsQueryHandler.FuelPricePerLitreConfigKey,
            0m,
            cancellationToken);

        var issuerName = await _systemConfigurationService.GetConfigurationValueAsync(
            GetWarningLetterSettingsQueryHandler.IssuerNameConfigKey,
            cancellationToken);
        var issuerTitle = await _systemConfigurationService.GetConfigurationValueAsync(
            GetWarningLetterSettingsQueryHandler.IssuerTitleConfigKey,
            cancellationToken);
        var maxWarningCountRaw = await _systemConfigurationService.GetConfigurationValueAsync(
            GetWarningLetterSettingsQueryHandler.MaxWarningCountBeforeLastConfigKey,
            cancellationToken);

        var maxWarningCountBeforeLast = int.TryParse(maxWarningCountRaw, out var parsedCount) && parsedCount > 0
            ? parsedCount
            : GetWarningLetterSettingsQueryHandler.DefaultMaxWarningCountBeforeLast;

        return new WarningLetterResolvedSettings(
            fuelPrice,
            issuerName?.Trim(),
            issuerTitle?.Trim(),
            maxWarningCountBeforeLast);
    }

    public async Task<WarningLetterHtmlTemplates.WarningLetterTemplateModel> BuildTemplateModelAsync(
        WarningLetterEntity warningLetter,
        EmployeeEntity employee,
        VehicleEntity vehicle,
        SiteEntity site,
        string? generatedByUserId,
        int maxWarningCountBeforeLast,
        CancellationToken cancellationToken)
    {
        var metrics = BuildMetricSet(warningLetter);
        var warningSequence = await ResolveWarningSequenceAsync(warningLetter, maxWarningCountBeforeLast, cancellationToken);
        var generatedBy = await ResolveGeneratedByAsync(generatedByUserId, cancellationToken);
        var referenceNumber = WarningLetterDocumentManager.BuildReferenceNumber(warningLetter);

        return new WarningLetterHtmlTemplates.WarningLetterTemplateModel
        {
            CompanyName = CompanyName,
            LogoDataUri = LoadLetterheadLogoDataUri(),
            IsExcessFuelConsumption = warningLetter.LetterType == WarningLetterType.ExcessFuelConsumption,
            IsExcessiveSpeed = warningLetter.LetterType == WarningLetterType.ExcessiveSpeed,
            IsExcessiveIdling = warningLetter.LetterType == WarningLetterType.ExcessiveIdling,
            WarningCountLabel = warningSequence.Label,
            IsLastWarning = warningSequence.IsLastWarning,
            HideWarningCountInSubject = warningLetter.HideWarningCountInSubject,
            ReferenceNumber = referenceNumber,
            LetterDate = FormatLongDate(warningLetter.LetterDate),
            EmployeeName = employee.FullName,
            EmployeeWorkNo = string.IsNullOrWhiteSpace(employee.EmployeeWorkNo) ? "N/A" : employee.EmployeeWorkNo,
            Position = string.IsNullOrWhiteSpace(employee.Position) ? "N/A" : employee.Position,
            VehicleHyoungNo = vehicle.HyoungNo,
            NumberPlate = string.IsNullOrWhiteSpace(vehicle.NumberPlate) ? "N/A" : vehicle.NumberPlate,
            VehicleType = vehicle.VehicleType?.Name ?? "N/A",
            SiteName = site.Name,
            AffectedDate = FormatLongDate(warningLetter.PeriodStart),
            ViolationTitle = metrics.Title,
            ViolationSummary = warningLetter.ViolationSummary,
            ExpectedLabel = metrics.ExpectedLabel,
            ExpectedValue = metrics.ExpectedValue,
            ActualLabel = metrics.ActualLabel,
            ActualValue = metrics.ActualValue,
            ExcessLabel = metrics.ExcessLabel,
            ExcessValue = metrics.ExcessValue,
            FuelPrice = metrics.FuelPrice,
            ExcessCost = metrics.ExcessCost,
            RemedialInstruction = metrics.RemedialInstruction,
            ConsequenceWarning = "Failure to improve may lead to escalation through the disciplinary process, including further written warnings or termination in line with company policy.",
            IssuedByName = warningLetter.IssuedByName,
            IssuedByTitle = string.IsNullOrWhiteSpace(warningLetter.IssuedByTitle) ? "Fleet Manager" : warningLetter.IssuedByTitle,
            Notes = NormalizeNotes(warningLetter.Notes),
            GeneratedBy = generatedBy,
            GeneratedDate = DateTime.Now.ToString("dd-MMM-yyyy HH:mm"),
            QrCodeDataUri = GenerateQrCodeDataUri(referenceNumber)
        };
    }

    private async Task<WarningSequenceInfo> ResolveWarningSequenceAsync(
        WarningLetterEntity warningLetter,
        int maxWarningCountBeforeLast,
        CancellationToken cancellationToken)
    {
        var effectiveStartDate = await GetWarningLetterSettingsQueryHandler.GetEffectiveStartDateAsync(
            _systemConfigurationService,
            cancellationToken);

        var matchingWarningLetters = _context.WarningLetters
            .AsNoTracking()
            .Where(w => w.EmployeeId == warningLetter.EmployeeId
                     && w.LetterType == warningLetter.LetterType
                     && w.DateCreated >= effectiveStartDate);

        int warningCount;
        if (warningLetter.Id > 0)
        {
            warningCount = await matchingWarningLetters.CountAsync(
                w => w.DateCreated < warningLetter.DateCreated
                    || (w.DateCreated == warningLetter.DateCreated && w.Id <= warningLetter.Id),
                cancellationToken);

            if (warningCount <= 0)
            {
                warningCount = 1;
            }
        }
        else
        {
            warningCount = await matchingWarningLetters.CountAsync(cancellationToken) + 1;
        }

        var isLastWarning = maxWarningCountBeforeLast > 0 && warningCount >= maxWarningCountBeforeLast;
        return new WarningSequenceInfo(warningCount, isLastWarning, isLastWarning ? "LAST" : ToOrdinal(warningCount));
    }

    private async Task<string> ResolveGeneratedByAsync(string? generatedByUserId, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(generatedByUserId))
        {
            return "System";
        }

        var trimmedUserId = generatedByUserId.Trim();
        var displayName = await _context.Users
            .AsNoTracking()
            .Where(user => user.Id == trimmedUserId)
            .Select(user => user.UserName ?? user.Email ?? user.Id)
            .FirstOrDefaultAsync(cancellationToken);

        return string.IsNullOrWhiteSpace(displayName) ? trimmedUserId : displayName;
    }

    private static string ToOrdinal(int value)
    {
        var absoluteValue = Math.Abs(value);
        var lastTwoDigits = absoluteValue % 100;
        if (lastTwoDigits is >= 11 and <= 13)
        {
            return $"{value}th";
        }

        return (absoluteValue % 10) switch
        {
            1 => $"{value}st",
            2 => $"{value}nd",
            3 => $"{value}rd",
            _ => $"{value}th"
        };
    }

    private static string? NormalizeNotes(string? notes)
    {
        if (string.IsNullOrWhiteSpace(notes))
        {
            return null;
        }

        var trimmed = notes.Trim();
        var normalized = trimmed.ToLowerInvariant();

        if (normalized is "n/a" or "na" or "none" or "nil" or "-" or "--" or ".")
        {
            return null;
        }

        return trimmed.Length < 3 ? null : trimmed;
    }

    private static string? LoadLetterheadLogoDataUri()
    {
        var logoPath = ResolveLetterheadLogoPath();
        if (string.IsNullOrWhiteSpace(logoPath) || !File.Exists(logoPath))
        {
            return null;
        }

        var bytes = File.ReadAllBytes(logoPath);
        if (bytes.Length == 0)
        {
            return null;
        }

        var mimeType = WarningLetterDocumentManager.ResolveStoredDocumentContentType(Path.GetExtension(logoPath));
        return $"data:{mimeType};base64,{Convert.ToBase64String(bytes)}";
    }

    private static string? ResolveLetterheadLogoPath()
    {
        if (File.Exists(LetterheadLogoPath))
        {
            return LetterheadLogoPath;
        }

        var directory = Path.GetDirectoryName(LetterheadLogoPath);
        var fileNameWithoutExtension = Path.GetFileNameWithoutExtension(LetterheadLogoPath);

        if (string.IsNullOrWhiteSpace(directory) || !Directory.Exists(directory))
        {
            return null;
        }

        var matchingFiles = Directory.GetFiles(directory, $"{fileNameWithoutExtension}*", SearchOption.TopDirectoryOnly);
        return matchingFiles.Length > 0 ? matchingFiles[0] : null;
    }

    private static string? GenerateQrCodeDataUri(string referenceNumber)
    {
        if (string.IsNullOrWhiteSpace(referenceNumber))
        {
            return null;
        }

        using var qrGenerator = new QRCodeGenerator();
        using var qrCodeData = qrGenerator.CreateQrCode(referenceNumber, QRCodeGenerator.ECCLevel.M);
        using var qrCode = new PngByteQRCode(qrCodeData);
        var pngBytes = qrCode.GetGraphic(8);
        return $"data:image/png;base64,{Convert.ToBase64String(pngBytes)}";
    }

    private static string FormatLongDate(DateTime value)
    {
        var day = value.Day;
        var suffix = day % 100 is 11 or 12 or 13
            ? "th"
            : (day % 10) switch
            {
                1 => "st",
                2 => "nd",
                3 => "rd",
                _ => "th"
            };

        return $"{day}{suffix} {value:MMMM yyyy}";
    }

    private static MetricSet BuildMetricSet(WarningLetterEntity warningLetter)
    {
        return warningLetter.LetterType switch
        {
            WarningLetterType.ExcessiveSpeed => new MetricSet(
                "EXCESSIVE SPEED",
                "Speed limit",
                FormatNumber(warningLetter.ExpectedValue, "km/h"),
                "Recorded speed",
                FormatNumber(warningLetter.ActualValue, "km/h"),
                "Excess speed",
                FormatNumber(warningLetter.ExcessValue, "km/h"),
                null,
                null,
                "You are required to observe approved speed limits at all times and to report any exceptional operational condition through your supervisor immediately."),
            WarningLetterType.ExcessiveIdling => new MetricSet(
                "EXCESSIVE IDLING",
                "Allowed idle hours",
                FormatNumber(warningLetter.ExpectedValue, "hours"),
                "Recorded idle hours",
                FormatNumber(warningLetter.ActualValue, "hours"),
                "Excess idle hours",
                FormatNumber(warningLetter.ExcessValue, "hours"),
                null,
                null,
                "You are required to minimize avoidable idling, shut down equipment when safe, and report any mechanical issue that prevents normal engine cut-off."),
            _ => new MetricSet(
                "EXCESS FUEL CONSUMPTION",
                "Expected average",
                FormatNumber(warningLetter.ExpectedValue, "km/l"),
                "Actual average",
                FormatNumber(warningLetter.ActualValue, "km/l"),
                "Fuel lost",
                FormatNumber(warningLetter.ExcessValue, "litres"),
                FormatCurrency(warningLetter.FuelPrice),
                FormatCurrency(warningLetter.ExcessCost),
                "You are required to improve driving habits, avoid unauthorized usage, and report any mechanical defect that could affect fuel consumption without delay.")
        };
    }

    private static string FormatNumber(decimal? value, string unit)
    {
        return value.HasValue ? $"{value.Value:N2} {unit}" : "N/A";
    }

    private static string? FormatCurrency(decimal? value)
    {
        return value.HasValue ? $"KES {value.Value:N2}" : null;
    }
}

internal sealed record WarningLetterResolvedSettings(decimal FuelPricePerLitre, string? IssuerName, string? IssuerTitle, int MaxWarningCountBeforeLast);
internal sealed record WarningSequenceInfo(int Count, bool IsLastWarning, string Label);
internal sealed record MetricSet(string Title, string ExpectedLabel, string ExpectedValue, string ActualLabel, string ActualValue, string ExcessLabel, string ExcessValue, string? FuelPrice, string? ExcessCost, string RemedialInstruction);

internal sealed class WarningLetterWorkflowSupport
{
    private const string FrontendBaseUrlConfigKey = "IssueTracker:FrontendBaseUrl";
    private const string DefaultFrontendBaseUrl = "http://localhost:3000";
    private const string InternalFrontendIpAddress = "10.0.10.153";

    private readonly GpsdataContext _context;
    private readonly IEmailService _emailService;
    private readonly INotificationService _notificationService;
    private readonly IConfiguration _configuration;
    private readonly WarningLetterDocumentManager _documentManager;
    private readonly ILogger _logger;

    public WarningLetterWorkflowSupport(
        GpsdataContext context,
        IEmailService emailService,
        INotificationService notificationService,
        IConfiguration configuration,
        WarningLetterDocumentManager documentManager,
        ILogger logger)
    {
        _context = context;
        _emailService = emailService;
        _notificationService = notificationService;
        _configuration = configuration;
        _documentManager = documentManager;
        _logger = logger;
    }

    public async Task<WarningLetterBundle?> LoadWarningLetterBundleAsync(int warningLetterId, CancellationToken cancellationToken)
    {
        var warningLetter = await _context.WarningLetters.FirstOrDefaultAsync(w => w.Id == warningLetterId, cancellationToken);
        if (warningLetter == null) return null;

        var employee = await _context.Employees.FirstAsync(e => e.Id == warningLetter.EmployeeId, cancellationToken);
        var vehicle = await _context.Vehicles
            .Include(v => v.VehicleType)
            .FirstAsync(v => v.VehicleId == warningLetter.VehicleId, cancellationToken);
        var site = await _context.Sites.FirstAsync(s => s.Id == warningLetter.SiteId, cancellationToken);

        return new WarningLetterBundle(warningLetter, employee, vehicle, site);
    }

    public async Task<string?> ResolveUserDisplayLabelAsync(string? userId, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(userId)) return null;

        var user = await _context.Users
            .AsNoTracking()
            .Where(u => u.Id == userId)
            .Select(u => new { u.FirstName, u.LastName, u.UserName, u.Email })
            .FirstOrDefaultAsync(cancellationToken);

        if (user == null) return userId;

        var fullName = string.Join(" ", new[] { user.FirstName?.Trim(), user.LastName?.Trim() }.Where(value => !string.IsNullOrWhiteSpace(value)));
        if (!string.IsNullOrWhiteSpace(fullName) && !string.IsNullOrWhiteSpace(user.Email))
        {
            return $"{fullName} ({user.Email})";
        }

        if (!string.IsNullOrWhiteSpace(fullName))
        {
            return fullName;
        }

        if (!string.IsNullOrWhiteSpace(user.UserName) && !string.IsNullOrWhiteSpace(user.Email))
        {
            return $"{user.UserName} ({user.Email})";
        }

        return !string.IsNullOrWhiteSpace(user.Email)
            ? user.Email
            : user.UserName ?? userId;
    }

    public async Task NotifySiteRepresentativeSignatureRequestedAsync(
        WarningLetterEntity warningLetter,
        EmployeeEntity employee,
        VehicleEntity vehicle,
        SiteEntity site,
        string requestedBy,
        string? recipientUserId,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(recipientUserId)) return;

        var notificationRequest = new CreateNotificationRequest
        {
            Type = NotificationType.Info,
            CategoryId = (int)WellKnownCategories.Generic,
            Priority = NotificationPriority.High,
            Title = $"Signature Required: Warning Letter #{warningLetter.Id}",
            Message = $"Please print, sign, stamp, and upload the warning letter for {employee.FullName} at {site.Name}.",
            Data = new
            {
                WarningLetterId = warningLetter.Id,
                EmployeeId = warningLetter.EmployeeId,
                EmployeeName = employee.FullName,
                VehicleId = warningLetter.VehicleId,
                VehicleLabel = vehicle.HyoungNo,
                SiteId = warningLetter.SiteId,
                SiteName = site.Name,
                Action = "SignatureRequested",
                Link = BuildWarningLetterPreviewPath(warningLetter.Id)
            },
            Link = BuildWarningLetterPreviewPath(warningLetter.Id),
            LinkLabel = "Review & sign",
            TriggerSource = "WarningLetter.RequestSignature",
            TriggeredBy = requestedBy,
            VehicleId = warningLetter.VehicleId,
            SiteId = warningLetter.SiteId,
            Recipients = new List<NotificationRecipientDto>
            {
                new()
                {
                    UserId = recipientUserId,
                    DeliveryMethods = new List<string> { "System", "Email" },
                    ResolvedFrom = "WarningLetterSiteRepresentative"
                }
            },
            DisableFallbackAllUsers = true
        };

        var result = await _notificationService.CreateNotificationAsync(notificationRequest, cancellationToken);
        if (!result.IsSuccess)
        {
            _logger.LogWarning("Failed to create site representative notification for warning letter {WarningLetterId}: {Message}", warningLetter.Id, result.Message);
        }
    }

    public async Task NotifyIssuerSignedCopyUploadedAsync(
        WarningLetterEntity warningLetter,
        EmployeeEntity employee,
        VehicleEntity vehicle,
        SiteEntity site,
        string uploadedBy,
        CancellationToken cancellationToken)
    {
        var issuer = await _context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == warningLetter.IssuedByUserId, cancellationToken);
        if (issuer == null) return;

        var uploadedByDisplay = await ResolveUserDisplayLabelAsync(uploadedBy, cancellationToken) ?? uploadedBy;

        var notificationRequest = new CreateNotificationRequest
        {
            Type = NotificationType.Info,
            CategoryId = (int)WellKnownCategories.Generic,
            Priority = NotificationPriority.High,
            Title = $"Signed Copy Received: Warning Letter #{warningLetter.Id}",
            Message = $"The signed copy for {employee.FullName} was uploaded by {uploadedByDisplay} and is now available in FMS.",
            Data = new
            {
                WarningLetterId = warningLetter.Id,
                EmployeeId = warningLetter.EmployeeId,
                EmployeeName = employee.FullName,
                VehicleId = warningLetter.VehicleId,
                VehicleLabel = vehicle.HyoungNo,
                SiteId = warningLetter.SiteId,
                SiteName = site.Name,
                UploadedBy = uploadedByDisplay,
                UploadedByUserId = uploadedBy,
                Action = "SignedCopyUploaded",
                Link = $"/reports/warning-letters/{warningLetter.Id}"
            },
            Link = $"/reports/warning-letters/{warningLetter.Id}",
            LinkLabel = "View warning letter",
            TriggerSource = "WarningLetter.SignedCopyUploaded",
            TriggeredBy = uploadedBy,
            VehicleId = warningLetter.VehicleId,
            SiteId = warningLetter.SiteId,
            Recipients = new List<NotificationRecipientDto>
            {
                new()
                {
                    UserId = issuer.Id,
                    DeliveryMethods = new List<string> { "System" },
                    ResolvedFrom = "WarningLetterIssuer"
                }
            },
            DisableFallbackAllUsers = true
        };

        var notificationResult = await _notificationService.CreateNotificationAsync(notificationRequest, cancellationToken);
        if (!notificationResult.IsSuccess)
        {
            _logger.LogWarning("Failed to create issuer notification for warning letter {WarningLetterId}: {Message}", warningLetter.Id, notificationResult.Message);
        }

        if (string.IsNullOrWhiteSpace(issuer.Email)) return;

        var subject = $"Signed Copy Received - Warning Letter #{warningLetter.Id} - {vehicle.HyoungNo}";
        var body = $@"<html><body style='font-family:Segoe UI,Arial,sans-serif;color:#201f1e;'>
<p>The signed copy for warning letter <strong>#{warningLetter.Id}</strong> has been uploaded to the server.</p>
<table style='border-collapse:collapse;'>
<tr><td style='padding:4px 12px 4px 0;'><strong>Employee</strong></td><td style='padding:4px 0;'>{System.Net.WebUtility.HtmlEncode(employee.FullName)}</td></tr>
<tr><td style='padding:4px 12px 4px 0;'><strong>Vehicle</strong></td><td style='padding:4px 0;'>{System.Net.WebUtility.HtmlEncode(vehicle.HyoungNo)}</td></tr>
<tr><td style='padding:4px 12px 4px 0;'><strong>Site</strong></td><td style='padding:4px 0;'>{System.Net.WebUtility.HtmlEncode(site.Name)}</td></tr>
<tr><td style='padding:4px 12px 4px 0;'><strong>Uploaded By</strong></td><td style='padding:4px 0;'>{System.Net.WebUtility.HtmlEncode(uploadedByDisplay)}</td></tr>
</table>
<p>The signed copy is now available in FMS for your records.</p>
</body></html>";

        var signedCopyAttachment = await _documentManager.BuildSignedCopyAttachmentAsync(warningLetter, cancellationToken);
        await _emailService.SendEmailAsync(
            issuer.Email,
            subject,
            body,
            true,
            cancellationToken,
            signedCopyAttachment != null ? new[] { signedCopyAttachment } : null);
    }

    public string BuildWarningLetterPreviewUrl(int warningLetterId)
    {
        var baseUrl = (_configuration[FrontendBaseUrlConfigKey] ?? DefaultFrontendBaseUrl).Trim();
        return $"{baseUrl.TrimEnd('/')}{BuildWarningLetterPreviewPath(warningLetterId)}";
    }

    public string BuildInternalWarningLetterPreviewUrl(int warningLetterId)
    {
        var baseUrl = (_configuration[FrontendBaseUrlConfigKey] ?? DefaultFrontendBaseUrl).Trim();
        if (!Uri.TryCreate(baseUrl, UriKind.Absolute, out var parsedBaseUrl))
        {
            return $"http://{InternalFrontendIpAddress}{BuildWarningLetterPreviewPath(warningLetterId)}";
        }

        var builder = new UriBuilder(parsedBaseUrl) { Host = InternalFrontendIpAddress };
        return $"{builder.Uri.ToString().TrimEnd('/')}{BuildWarningLetterPreviewPath(warningLetterId)}";
    }

    public static string BuildSignatureRequestEmailBody(
        WarningLetterEntity warningLetter,
        EmployeeEntity employee,
        VehicleEntity vehicle,
        SiteEntity site,
        string previewUrl,
        string internalPreviewUrl)
    {
        var encodedPreviewUrl = System.Net.WebUtility.HtmlEncode(previewUrl);
        var encodedInternalPreviewUrl = System.Net.WebUtility.HtmlEncode(internalPreviewUrl);

        return $@"<html><body style='font-family:Segoe UI,Arial,sans-serif;color:#201f1e;'>
<p>Please print the attached warning letter for <strong>{System.Net.WebUtility.HtmlEncode(employee.FullName)}</strong>, obtain the driver signature and stamp where applicable, then upload the signed scan back into FMS.</p>
<table style='border-collapse:collapse;'>
<tr><td style='padding:4px 12px 4px 0;'><strong>Reference</strong></td><td style='padding:4px 0;'>#{warningLetter.Id}</td></tr>
<tr><td style='padding:4px 12px 4px 0;'><strong>Vehicle</strong></td><td style='padding:4px 0;'>{System.Net.WebUtility.HtmlEncode(vehicle.HyoungNo)}</td></tr>
<tr><td style='padding:4px 12px 4px 0;'><strong>Site</strong></td><td style='padding:4px 0;'>{System.Net.WebUtility.HtmlEncode(site.Name)}</td></tr>
</table>
<p>Open the warning-letter preview page to upload the signed copy after signature collection:</p>
<p><a href='{encodedPreviewUrl}' style='color:#0078d4;text-decoration:none;'>{encodedPreviewUrl}</a></p>
or
<p>If you're within the organization network, please use the internal link below</p>
<p><a href='{encodedInternalPreviewUrl}' style='color:#0078d4;text-decoration:none;'>{encodedInternalPreviewUrl}</a></p>
<p>Please do not reply to this email or send the signed copy via email.</p>
</body></html>";
    }

    public static bool IsValidEmailAddress(string emailAddress)
    {
        try
        {
            var parsedAddress = new MailAddress(emailAddress);
            return string.Equals(parsedAddress.Address, emailAddress, StringComparison.OrdinalIgnoreCase);
        }
        catch
        {
            return false;
        }
    }

    public static string? JoinDelimitedValues(IEnumerable<string> values)
    {
        var resolved = values
            .Where(value => !string.IsNullOrWhiteSpace(value))
            .Select(value => value.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        return resolved.Count == 0 ? null : string.Join(";", resolved);
    }

    public static string ResolveIssuerName(string? configuredIssuerName, string? fallbackIssuerName)
    {
        if (!string.IsNullOrWhiteSpace(configuredIssuerName))
        {
            return configuredIssuerName.Trim();
        }

        return fallbackIssuerName?.Trim() ?? string.Empty;
    }

    public static string? ResolveIssuerTitle(string? configuredIssuerTitle, string? fallbackIssuerTitle)
    {
        if (!string.IsNullOrWhiteSpace(configuredIssuerTitle))
        {
            return configuredIssuerTitle.Trim();
        }

        return string.IsNullOrWhiteSpace(fallbackIssuerTitle) ? null : fallbackIssuerTitle.Trim();
    }

    public static List<string> ValidatePreviewRequest(CreateWarningLetterDto request)
    {
        var errors = new List<string>();

        if (request.EmployeeId <= 0) errors.Add("EmployeeId is required.");
        if (request.VehicleId <= 0) errors.Add("VehicleId is required.");
        if (request.SiteId <= 0) errors.Add("SiteId is required.");
        if (request.PeriodEnd < request.PeriodStart) errors.Add("PeriodEnd cannot be earlier than PeriodStart.");

        return errors;
    }

    private static string BuildWarningLetterPreviewPath(int warningLetterId)
    {
        return $"/reports/warning-letters/{warningLetterId}/preview";
    }
}

internal sealed record WarningLetterBundle(
    WarningLetterEntity WarningLetter,
    EmployeeEntity Employee,
    VehicleEntity Vehicle,
    SiteEntity Site);