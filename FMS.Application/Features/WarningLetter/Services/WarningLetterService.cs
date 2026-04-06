/**
 * File: WarningLetterService.cs
 * Purpose: Handles warning letter preview, PDF persistence, and email delivery workflows.
 * Dependencies: EF Core, SystemConfigurationService, IEmailService, IWarningLetterPdfRenderer
 * Last Modified: 2026-04-06
 */
using System;
using System.Collections.Generic;
using System.IO;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.Notification.DTOs;
using FMS.Application.Features.Notification.Services;
using FMS.Application.Features.WarningLetter.DTOs;
using FMS.Application.Features.WarningLetter.Templates;
using FMS.Application.Services.Configuration;
using FMS.Domain.Entities;
using FMS.Domain.Entities.Features.WarningLetterManagement;
using EmployeeEntity = FMS.Domain.Entities.Employee;
using SiteEntity = FMS.Domain.Entities.Site;
using VehicleEntity = FMS.Domain.Entities.Vehicle;
using FMS.Persistence.DataAccess;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.WarningLetter.Services;

public class WarningLetterService : IWarningLetterService
{
    private const string PdfStoragePathConfigKey = "WarningLetter:PdfStoragePath";
    private const string DefaultPdfStoragePath = @"C:\FMSData\reports\warning-letters";
    private const string CompanyName = "H. Young & Co. (EA) Ltd";

    private readonly GpsdataContext _context;
    private readonly IWarningLetterPdfRenderer _pdfRenderer;
    private readonly IEmailService _emailService;
    private readonly ISystemConfigurationService _systemConfigurationService;
    private readonly ILogger<WarningLetterService> _logger;

    public WarningLetterService(
        GpsdataContext context,
        IWarningLetterPdfRenderer pdfRenderer,
        IEmailService emailService,
        ISystemConfigurationService systemConfigurationService,
        ILogger<WarningLetterService> logger)
    {
        _context = context;
        _pdfRenderer = pdfRenderer;
        _emailService = emailService;
        _systemConfigurationService = systemConfigurationService;
        _logger = logger;
    }

    public async Task<FMSResponse<string>> PreviewHtmlAsync(CreateWarningLetterDto request, CancellationToken cancellationToken = default)
    {
        var validationErrors = ValidatePreviewRequest(request);
        if (validationErrors.Count > 0)
        {
            return FMSResponse<string>.ValidationFailed(validationErrors);
        }

        var employee = await _context.Employees.FirstOrDefaultAsync(e => e.Id == request.EmployeeId, cancellationToken);
        if (employee == null)
        {
            return FMSResponse<string>.NotFound("WARNING_LETTER_EMPLOYEE_NOT_FOUND", "Employee not found");
        }

        var vehicle = await _context.Vehicles
            .Include(v => v.VehicleType)
            .FirstOrDefaultAsync(v => v.VehicleId == request.VehicleId, cancellationToken);
        if (vehicle == null)
        {
            return FMSResponse<string>.NotFound("WARNING_LETTER_VEHICLE_NOT_FOUND", "Vehicle not found");
        }

        var site = await _context.Sites.FirstOrDefaultAsync(s => s.Id == request.SiteId, cancellationToken);
        if (site == null)
        {
            return FMSResponse<string>.NotFound("WARNING_LETTER_SITE_NOT_FOUND", "Site not found");
        }

        var transientLetter = new Domain.Entities.Features.WarningLetterManagement.WarningLetter
        {
            Id = 0,
            LetterType = request.LetterType,
            EmployeeId = request.EmployeeId,
            VehicleId = request.VehicleId,
            SiteId = request.SiteId,
            LetterDate = request.LetterDate,
            PeriodStart = request.PeriodStart,
            PeriodEnd = request.PeriodEnd,
            ViolationSummary = request.ViolationSummary,
            ExpectedValue = request.ExpectedValue,
            ActualValue = request.ActualValue,
            ExcessValue = request.ExcessValue,
            FuelPrice = request.FuelPrice,
            ExcessCost = Commands.CreateWarningLetterCommandHandler.ResolveExcessCost(request.ExcessCost, request.ExcessValue, request.FuelPrice),
            IssuedByUserId = request.IssuedByUserId,
            IssuedByName = request.IssuedByName,
            IssuedByTitle = request.IssuedByTitle,
            Notes = request.Notes,
            Status = WarningLetterStatus.Draft,
            DateCreated = DateTime.UtcNow,
            CreatedBy = request.IssuedByUserId
        };

        var html = WarningLetterHtmlTemplates.Render(BuildTemplateModel(transientLetter, employee, vehicle, site));
        return FMSResponse<string>.Success(html);
    }

    public async Task<FMSResponse<WarningLetterDocumentDto>> GeneratePdfAsync(int warningLetterId, string? modifiedBy = null, CancellationToken cancellationToken = default)
    {
        var bundle = await LoadWarningLetterBundleAsync(warningLetterId, cancellationToken);
        if (bundle == null)
        {
            return FMSResponse<WarningLetterDocumentDto>.NotFound("WARNING_LETTER_NOT_FOUND", "Warning letter not found");
        }

        var html = WarningLetterHtmlTemplates.Render(BuildTemplateModel(bundle.WarningLetter, bundle.Employee, bundle.Vehicle, bundle.Site));
        var pdfBytes = await _pdfRenderer.RenderPdfAsync(html, cancellationToken);
        var fileName = BuildPdfFileName(bundle.WarningLetter);
        var filePath = await SavePdfToDiskAsync(bundle.WarningLetter, pdfBytes, fileName, cancellationToken);

        bundle.WarningLetter.PdfFilePath = filePath;
        bundle.WarningLetter.DateModified = DateTime.UtcNow;
        if (!string.IsNullOrWhiteSpace(modifiedBy))
        {
            bundle.WarningLetter.ModifiedBy = modifiedBy;
        }

        await _context.SaveChangesAsync(cancellationToken);

        return FMSResponse<WarningLetterDocumentDto>.Success(new WarningLetterDocumentDto
        {
            FileName = fileName,
            ContentType = "application/pdf",
            Content = pdfBytes,
            FilePath = filePath
        }, "Warning letter PDF generated successfully");
    }

    public async Task<FMSResponse<WarningLetterDocumentDto>> GetPdfAsync(int warningLetterId, CancellationToken cancellationToken = default)
    {
        var warningLetter = await _context.WarningLetters.AsNoTracking().FirstOrDefaultAsync(w => w.Id == warningLetterId, cancellationToken);
        if (warningLetter == null)
        {
            return FMSResponse<WarningLetterDocumentDto>.NotFound("WARNING_LETTER_NOT_FOUND", "Warning letter not found");
        }

        if (!string.IsNullOrWhiteSpace(warningLetter.PdfFilePath) && File.Exists(warningLetter.PdfFilePath))
        {
            var pdfBytes = await File.ReadAllBytesAsync(warningLetter.PdfFilePath, cancellationToken);
            return FMSResponse<WarningLetterDocumentDto>.Success(new WarningLetterDocumentDto
            {
                FileName = Path.GetFileName(warningLetter.PdfFilePath),
                ContentType = "application/pdf",
                Content = pdfBytes,
                FilePath = warningLetter.PdfFilePath
            });
        }

        return await GeneratePdfAsync(warningLetterId, cancellationToken: cancellationToken);
    }

    public async Task<FMSResponse> SendEmailAsync(int warningLetterId, string modifiedBy, string? emailRecipient = null, CancellationToken cancellationToken = default)
    {
        var bundle = await LoadWarningLetterBundleAsync(warningLetterId, cancellationToken);
        if (bundle == null)
        {
            return FMSResponse.NotFound("WARNING_LETTER_NOT_FOUND", "Warning letter not found");
        }

        if (bundle.WarningLetter.Status == WarningLetterStatus.Draft)
        {
            return FMSResponse.BusinessLogicError("WARNING_LETTER_NOT_FINALIZED", "Finalize the warning letter before sending email.");
        }

        var recipient = string.IsNullOrWhiteSpace(emailRecipient)
            ? (string.IsNullOrWhiteSpace(bundle.WarningLetter.EmailRecipient) ? bundle.Employee.Email : bundle.WarningLetter.EmailRecipient)
            : emailRecipient.Trim();

        if (string.IsNullOrWhiteSpace(recipient))
        {
            return FMSResponse.ValidationFailed(new List<string> { "No employee email address is available for this warning letter." });
        }

        var documentResult = await GetPdfAsync(warningLetterId, cancellationToken);
        if (!documentResult.IsSuccess || documentResult.Data == null)
        {
            return FMSResponse.FailedResponse(documentResult.Message, documentResult.ErrorCode);
        }

        var templateModel = BuildTemplateModel(bundle.WarningLetter, bundle.Employee, bundle.Vehicle, bundle.Site);
        var subject = $"Warning Letter - {templateModel.ViolationTitle} - {bundle.Vehicle.HyoungNo}";
        var body = WarningLetterHtmlTemplates.BuildEmailBody(templateModel);

        var sent = await _emailService.SendEmailAsync(
            recipient,
            subject,
            body,
            isHtml: true,
            cancellationToken: cancellationToken,
            attachments: new[]
            {
                new EmailAttachmentDto
                {
                    FileName = documentResult.Data.FileName,
                    ContentType = documentResult.Data.ContentType,
                    Content = documentResult.Data.Content
                }
            });

        if (!sent)
        {
            return FMSResponse.FailedResponse("Failed to send warning letter email");
        }

        bundle.WarningLetter.EmailSentAt = DateTime.UtcNow;
        bundle.WarningLetter.EmailRecipient = recipient;
        if (bundle.WarningLetter.Status != WarningLetterStatus.Acknowledged)
        {
            bundle.WarningLetter.Status = WarningLetterStatus.Sent;
        }
        bundle.WarningLetter.DateModified = DateTime.UtcNow;
        bundle.WarningLetter.ModifiedBy = modifiedBy;

        await _context.SaveChangesAsync(cancellationToken);
        _logger.LogInformation("Warning letter {WarningLetterId} emailed successfully to {Recipient}", warningLetterId, recipient);

        return FMSResponse.SuccessResponse("Warning letter emailed successfully");
    }

    private async Task<string> SavePdfToDiskAsync(Domain.Entities.Features.WarningLetterManagement.WarningLetter warningLetter, byte[] pdfBytes, string fileName, CancellationToken cancellationToken)
    {
        var configuredBasePath = await _systemConfigurationService.GetConfigurationValueAsync(PdfStoragePathConfigKey, cancellationToken);
        var basePath = string.IsNullOrWhiteSpace(configuredBasePath) ? DefaultPdfStoragePath : configuredBasePath.Trim();
        var yearPath = Path.Combine(basePath, warningLetter.LetterDate.Year.ToString());

        Directory.CreateDirectory(yearPath);
        var fullPath = Path.Combine(yearPath, fileName);
        await File.WriteAllBytesAsync(fullPath, pdfBytes, cancellationToken);
        return fullPath;
    }

    private async Task<WarningLetterBundle?> LoadWarningLetterBundleAsync(int warningLetterId, CancellationToken cancellationToken)
    {
        var warningLetter = await _context.WarningLetters.FirstOrDefaultAsync(w => w.Id == warningLetterId, cancellationToken);
        if (warningLetter == null)
        {
            return null;
        }

        var employee = await _context.Employees.FirstAsync(e => e.Id == warningLetter.EmployeeId, cancellationToken);
        var vehicle = await _context.Vehicles
            .Include(v => v.VehicleType)
            .FirstAsync(v => v.VehicleId == warningLetter.VehicleId, cancellationToken);
        var site = await _context.Sites.FirstAsync(s => s.Id == warningLetter.SiteId, cancellationToken);

        return new WarningLetterBundle(warningLetter, employee, vehicle, site);
    }

    private static List<string> ValidatePreviewRequest(CreateWarningLetterDto request)
    {
        var errors = new List<string>();

        if (request.EmployeeId <= 0) errors.Add("EmployeeId is required.");
        if (request.VehicleId <= 0) errors.Add("VehicleId is required.");
        if (request.SiteId <= 0) errors.Add("SiteId is required.");
        if (string.IsNullOrWhiteSpace(request.ViolationSummary)) errors.Add("ViolationSummary is required.");
        if (string.IsNullOrWhiteSpace(request.IssuedByName)) errors.Add("IssuedByName is required.");
        if (request.PeriodEnd < request.PeriodStart) errors.Add("PeriodEnd cannot be earlier than PeriodStart.");

        return errors;
    }

    private static WarningLetterHtmlTemplates.WarningLetterTemplateModel BuildTemplateModel(
        Domain.Entities.Features.WarningLetterManagement.WarningLetter warningLetter,
        EmployeeEntity employee,
        VehicleEntity vehicle,
        SiteEntity site)
    {
        var metrics = BuildMetricSet(warningLetter);
        return new WarningLetterHtmlTemplates.WarningLetterTemplateModel
        {
            CompanyName = CompanyName,
            ReferenceNumber = BuildReferenceNumber(warningLetter),
            LetterDate = FormatLongDate(warningLetter.LetterDate),
            EmployeeName = employee.FullName,
            EmployeeWorkNo = string.IsNullOrWhiteSpace(employee.EmployeeWorkNo) ? "N/A" : employee.EmployeeWorkNo,
            Trade = string.IsNullOrWhiteSpace(employee.Trade) ? "N/A" : employee.Trade,
            VehicleHyoungNo = vehicle.HyoungNo,
            NumberPlate = string.IsNullOrWhiteSpace(vehicle.NumberPlate) ? "N/A" : vehicle.NumberPlate,
            VehicleType = vehicle.VehicleType?.Name ?? "N/A",
            SiteName = site.Name,
            PeriodStart = FormatLongDate(warningLetter.PeriodStart),
            PeriodEnd = FormatLongDate(warningLetter.PeriodEnd),
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
            Notes = warningLetter.Notes
        };
    }

    private static string BuildReferenceNumber(Domain.Entities.Features.WarningLetterManagement.WarningLetter warningLetter)
    {
        var suffix = warningLetter.Id > 0 ? warningLetter.Id.ToString("D5") : "PREVIEW";
        return $"WL-{warningLetter.SiteId}-{warningLetter.LetterDate:yyyy}-{suffix}";
    }

    private static string BuildPdfFileName(Domain.Entities.Features.WarningLetterManagement.WarningLetter warningLetter)
    {
        return $"Warning-Letter-{warningLetter.Id}-{warningLetter.LetterDate:yyyyMMdd}.pdf";
    }

    private static string FormatLongDate(DateTime value)
    {
        var day = value.Day;
        var suffix = day % 100 is 11 or 12 or 13
            ? "th"
            : day % 10 switch
            {
                1 => "st",
                2 => "nd",
                3 => "rd",
                _ => "th"
            };

        return $"{day}{suffix} {value:MMMM yyyy}";
    }

    private static MetricSet BuildMetricSet(Domain.Entities.Features.WarningLetterManagement.WarningLetter warningLetter)
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

    private sealed record WarningLetterBundle(
        Domain.Entities.Features.WarningLetterManagement.WarningLetter WarningLetter,
        EmployeeEntity Employee,
        VehicleEntity Vehicle,
        SiteEntity Site);

    private sealed record MetricSet(
        string Title,
        string ExpectedLabel,
        string ExpectedValue,
        string ActualLabel,
        string ActualValue,
        string ExcessLabel,
        string ExcessValue,
        string? FuelPrice,
        string? ExcessCost,
        string RemedialInstruction);
}