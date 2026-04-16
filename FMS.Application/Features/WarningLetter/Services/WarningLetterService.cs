/**
 * File: WarningLetterService.cs
 * Purpose: Handles warning letter preview, PDF persistence, and email delivery workflows.
 * Dependencies: EF Core, SystemConfigurationService, IEmailService, IWarningLetterPdfRenderer
 * Last Modified: 2026-04-14
 */
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Docnet.Core;
using Docnet.Core.Models;
using FMS.Application.Common;
using FMS.Application.Features.WarningLetter;
using FMS.Application.Features.Notification.DTOs;
using FMS.Application.Features.Notification.DTOs.NotificationRecipient;
using FMS.Application.Features.Notification.Enums;
using FMS.Application.Features.Notification.Services;
using FMS.Application.Features.WarningLetter.DTOs;
using FMS.Application.Features.WarningLetter.Queries;
using FMS.Application.Features.WarningLetter.Templates;
using FMS.Application.Services.Configuration;
using FMS.Domain.Entities;
using FMS.Domain.Entities.Features.WarningLetterManagement;
using EmployeeEntity = FMS.Domain.Entities.Employee;
using SiteEntity = FMS.Domain.Entities.Site;
using VehicleEntity = FMS.Domain.Entities.Vehicle;
using UserEntity = FMS.Domain.Entities.User;
using FMS.Persistence.DataAccess;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using QRCoder;
using ZXing;
using ZXing.Common;

namespace FMS.Application.Features.WarningLetter.Services;

public class WarningLetterService : IWarningLetterService
{
    private const string PdfStoragePathConfigKey = "WarningLetter:PdfStoragePath";
    private const string DefaultPdfStoragePath = @"C:\FMSData\reports\warning-letters";
    private const string DefaultUploadedDocumentStoragePath = @"C:\FMSData\uploads\warning-letters";
    private const string UploadedDocumentRelativeRoot = "warning-letters";
    private const string ApproveLetterFolder = "approve";
    private const string LetterheadLogoPath = @"C:\FMSData\reports\branding\letterhead-logo.png";
    private const string CompanyName = "H. Young & Co. (EA) Ltd";
    private const string WarningLetterTemplateName = "warning-letter-report";
    private const string FrontendBaseUrlConfigKey = "IssueTracker:FrontendBaseUrl";
    private const string DefaultFrontendBaseUrl = "http://localhost:3000";
    private static readonly HashSet<string> AllowedLetterDocumentExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".pdf"
    };

    private readonly GpsdataContext _context;
    private readonly IWarningLetterPdfRenderer _pdfRenderer;
    private readonly IEmailService _emailService;
    private readonly INotificationService _notificationService;
    private readonly ISystemConfigurationService _systemConfigurationService;
    private readonly IConfiguration _configuration;
    private readonly ILogger<WarningLetterService> _logger;

    public WarningLetterService(
        GpsdataContext context,
        IWarningLetterPdfRenderer pdfRenderer,
        IEmailService emailService,
        INotificationService notificationService,
        ISystemConfigurationService systemConfigurationService,
        IConfiguration configuration,
        ILogger<WarningLetterService> logger)
    {
        _context = context;
        _pdfRenderer = pdfRenderer;
        _emailService = emailService;
        _notificationService = notificationService;
        _systemConfigurationService = systemConfigurationService;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<FMSResponse<string>> PreviewHtmlAsync(CreateWarningLetterDto request, CancellationToken cancellationToken = default)
    {
        var validationErrors = ValidatePreviewRequest(request);
        if (validationErrors.Count > 0)
        {
            return FMSResponse<string>.ValidationFailed(validationErrors);
        }

        var resolvedViolationSummary = WarningLetterSummaryBuilder.Resolve(
            request.ViolationSummary,
            request.LetterType,
            request.PeriodStart,
            request.PeriodEnd,
            request.ExpectedValue,
            request.ActualValue,
            request.ExcessValue);

        var employee = await _context.Employees.FirstOrDefaultAsync(e => e.Id == request.EmployeeId, cancellationToken);
        if (employee == null)
        {
            return FMSResponse<string>.NotFound("WARNING_LETTER_EMPLOYEE_NOT_FOUND", "Employee not found");
        }

        if (string.IsNullOrWhiteSpace(employee.Position))
        {
            return FMSResponse<string>.ValidationFailed(new List<string> { "Employee position is required before generating a warning letter." });
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

        var settings = await LoadResolvedSettingsAsync(cancellationToken);
        var fuelPrice = request.LetterType == WarningLetterType.ExcessFuelConsumption
            ? settings.FuelPricePerLitre
            : request.FuelPrice;
        var issuedByName = ResolveIssuerName(settings.IssuerName, request.IssuedByName);
        var issuedByTitle = ResolveIssuerTitle(settings.IssuerTitle, request.IssuedByTitle);

        if (string.IsNullOrWhiteSpace(issuedByName))
        {
            return FMSResponse<string>.ValidationFailed(new List<string> { "IssuedByName is required." });
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
            ViolationSummary = resolvedViolationSummary,
            ExpectedValue = request.ExpectedValue,
            ActualValue = request.ActualValue,
            ExcessValue = request.ExcessValue,
            FuelPrice = fuelPrice,
            ExcessCost = Commands.CreateWarningLetterCommandHandler.ResolveExcessCost(request.ExcessCost, request.ExcessValue, fuelPrice),
            IssuedByUserId = request.IssuedByUserId,
            IssuedByName = issuedByName,
            IssuedByTitle = issuedByTitle,
            Notes = request.Notes,
            Status = WarningLetterStatus.Draft,
            DateCreated = DateTime.UtcNow,
            CreatedBy = request.IssuedByUserId
        };

        var templateModel = await BuildTemplateModelAsync(transientLetter, employee, vehicle, site, request.IssuedByUserId, settings.MaxWarningCountBeforeLast, cancellationToken);
        var html = await _pdfRenderer.RenderHtmlAsync(WarningLetterTemplateName, templateModel, cancellationToken);
        return FMSResponse<string>.Success(html);
    }

    public async Task<FMSResponse<string>> GetHtmlAsync(int warningLetterId, CancellationToken cancellationToken = default)
    {
        var bundle = await LoadWarningLetterBundleAsync(warningLetterId, cancellationToken);
        if (bundle == null)
        {
            return FMSResponse<string>.NotFound("WARNING_LETTER_NOT_FOUND", "Warning letter not found");
        }

        var settings = await LoadResolvedSettingsAsync(cancellationToken);
        var templateModel = await BuildTemplateModelAsync(
            bundle.WarningLetter,
            bundle.Employee,
            bundle.Vehicle,
            bundle.Site,
            bundle.WarningLetter.ModifiedBy ?? bundle.WarningLetter.CreatedBy,
            settings.MaxWarningCountBeforeLast,
            cancellationToken);
        var html = await _pdfRenderer.RenderHtmlAsync(WarningLetterTemplateName, templateModel, cancellationToken);
        return FMSResponse<string>.Success(html);
    }

    public async Task<FMSResponse<WarningLetterDocumentDto>> GeneratePdfAsync(int warningLetterId, string? modifiedBy = null, CancellationToken cancellationToken = default)
    {
        var bundle = await LoadWarningLetterBundleAsync(warningLetterId, cancellationToken);
        if (bundle == null)
        {
            return FMSResponse<WarningLetterDocumentDto>.NotFound("WARNING_LETTER_NOT_FOUND", "Warning letter not found");
        }

        var settings = await LoadResolvedSettingsAsync(cancellationToken);
        var templateModel = await BuildTemplateModelAsync(
            bundle.WarningLetter,
            bundle.Employee,
            bundle.Vehicle,
            bundle.Site,
            modifiedBy ?? bundle.WarningLetter.ModifiedBy ?? bundle.WarningLetter.CreatedBy,
            settings.MaxWarningCountBeforeLast,
            cancellationToken);
        var pdfBytes = await _pdfRenderer.RenderPdfAsync(WarningLetterTemplateName, templateModel, cancellationToken);
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

        if (!string.IsNullOrWhiteSpace(warningLetter.SignedCopyFilePath))
        {
            var signedCopyResult = await GetSignedCopyAsync(warningLetterId, cancellationToken);
            if (signedCopyResult.IsSuccess)
            {
                return signedCopyResult;
            }
        }

        if (!string.IsNullOrWhiteSpace(warningLetter.ApproveLetterFilePath))
        {
            var approvedLetterResult = await GetApproveLetterAsync(warningLetterId, cancellationToken);
            if (approvedLetterResult.IsSuccess)
            {
                return approvedLetterResult;
            }
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

        var settings = await LoadResolvedSettingsAsync(cancellationToken);
        var templateModel = await BuildTemplateModelAsync(
            bundle.WarningLetter,
            bundle.Employee,
            bundle.Vehicle,
            bundle.Site,
            modifiedBy,
            settings.MaxWarningCountBeforeLast,
            cancellationToken);
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

    public async Task<FMSResponse<WarningLetterDto>> RequestSignatureAsync(int warningLetterId, string modifiedBy, RequestWarningLetterSignatureDto request, CancellationToken cancellationToken = default)
    {
        var bundle = await LoadWarningLetterBundleAsync(warningLetterId, cancellationToken);
        if (bundle == null)
        {
            return FMSResponse<WarningLetterDto>.NotFound("WARNING_LETTER_NOT_FOUND", "Warning letter not found");
        }

        if (!bundle.WarningLetter.ApproveLetterUploadedAt.HasValue)
        {
            return FMSResponse<WarningLetterDto>.BusinessLogicError("WARNING_LETTER_NOT_APPROVED", "Upload the approved letter before sending it to a site representative.");
        }

        if (bundle.WarningLetter.EmployeeAcknowledgedAt.HasValue || bundle.WarningLetter.Status == WarningLetterStatus.Acknowledged)
        {
            return FMSResponse<WarningLetterDto>.BusinessLogicError("WARNING_LETTER_ALREADY_CLOSED", "Acknowledged warning letters cannot be resent.");
        }

        var recipientOptions = await WarningLetterRecipientGroupResolver.GetRecipientOptionsAsync(_context, bundle.WarningLetter.SiteId, cancellationToken);

        var selectedUserId = string.IsNullOrWhiteSpace(request?.SignatureRecipientUserId)
            ? bundle.WarningLetter.SignatureRequestRecipientUserId
            : request.SignatureRecipientUserId.Trim();

        var selectedUser = string.IsNullOrWhiteSpace(selectedUserId)
            ? null
            : recipientOptions.SiteRepresentatives.FirstOrDefault(recipient => string.Equals(recipient.Id, selectedUserId, StringComparison.OrdinalIgnoreCase));

        if (!string.IsNullOrWhiteSpace(selectedUserId) && selectedUser == null)
        {
            return FMSResponse<WarningLetterDto>.ValidationFailed(new List<string> { $"The selected site representative is not configured in recipient group '{recipientOptions.SiteRepresentativeGroupName}'." });
        }

        if (selectedUser == null || string.IsNullOrWhiteSpace(selectedUser.Email))
        {
            return FMSResponse<WarningLetterDto>.ValidationFailed(new List<string> { $"Select a configured site representative from recipient group '{recipientOptions.SiteRepresentativeGroupName}'." });
        }

        var recipient = selectedUser.Email;

        var ccRecipientUserIds = (request?.CcRecipientUserIds ?? new List<string>())
            .Where(value => !string.IsNullOrWhiteSpace(value))
            .Select(value => value.Trim())
            .Where(value => !string.Equals(value, selectedUser.Id, StringComparison.OrdinalIgnoreCase))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        var ccRecipients = recipientOptions.SignatureCcRecipients
            .Where(recipientOption => ccRecipientUserIds.Contains(recipientOption.Id, StringComparer.OrdinalIgnoreCase))
            .ToList();

        var ccRecipientIds = ccRecipients.Select(recipientOption => recipientOption.Id).ToList();
        var ccRecipientEmails = ccRecipients.Select(recipientOption => recipientOption.Email!).Where(email => !string.IsNullOrWhiteSpace(email)).ToList();

        if (ccRecipientEmails.Count != ccRecipientUserIds.Count)
        {
            return FMSResponse<WarningLetterDto>.ValidationFailed(new List<string> { $"One or more CC recipients are not configured in recipient group '{recipientOptions.SignatureCcGroupName}'." });
        }

        var documentResult = await GetPdfAsync(warningLetterId, cancellationToken);
        if (!documentResult.IsSuccess || documentResult.Data == null)
        {
            return FMSResponse<WarningLetterDto>.Failed(documentResult.Message, documentResult.ErrorCode);
        }

        var subject = $"Signature Required - Warning Letter #{warningLetterId} - {bundle.Vehicle.HyoungNo}";
        var body = BuildSignatureRequestEmailBody(bundle.WarningLetter, bundle.Employee, bundle.Vehicle, bundle.Site, BuildWarningLetterPreviewUrl(bundle.WarningLetter.Id));
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
            },
            cc: ccRecipientEmails.Count == 0 ? null : string.Join(",", ccRecipientEmails.Distinct(StringComparer.OrdinalIgnoreCase)));

        if (!sent)
        {
            return FMSResponse<WarningLetterDto>.Failed("Failed to send signature request email.");
        }

        bundle.WarningLetter.SignatureRequestRecipientUserId = selectedUser.Id;
        bundle.WarningLetter.SignatureRequestRecipient = recipient;
        bundle.WarningLetter.SignatureRequestCcUserIds = JoinDelimitedValues(ccRecipientIds);
        bundle.WarningLetter.SignatureRequestCcRecipients = JoinDelimitedValues(ccRecipientEmails);
        bundle.WarningLetter.SignatureRequestedAt = DateTime.UtcNow;
        bundle.WarningLetter.SignatureRequestedBy = modifiedBy;
        bundle.WarningLetter.Status = WarningLetterStatus.Sent;
        bundle.WarningLetter.DateModified = DateTime.UtcNow;
        bundle.WarningLetter.ModifiedBy = modifiedBy;

        await _context.SaveChangesAsync(cancellationToken);

        await NotifySiteRepresentativeSignatureRequestedAsync(
            bundle.WarningLetter,
            bundle.Employee,
            bundle.Vehicle,
            bundle.Site,
            modifiedBy,
            selectedUser?.Id,
            cancellationToken);

        _logger.LogInformation("Warning letter {WarningLetterId} signature request sent to {Recipient}", warningLetterId, recipient);
        return FMSResponse<WarningLetterDto>.Success(
            Commands.CreateWarningLetterCommandHandler.MapToDto(bundle.WarningLetter, bundle.Employee, bundle.Vehicle, bundle.Site),
            "Signature request sent successfully.");
    }

    public async Task<FMSResponse<WarningLetterDto>> UploadSignedCopyAsync(int warningLetterId, IFormFile file, string uploadedBy, CancellationToken cancellationToken = default)
    {
        if (file == null || file.Length == 0)
        {
            return FMSResponse<WarningLetterDto>.ValidationFailed(new List<string> { "A signed copy file is required." });
        }

        var extension = Path.GetExtension(file.FileName);
        if (string.IsNullOrWhiteSpace(extension) || !AllowedLetterDocumentExtensions.Contains(extension))
        {
            return FMSResponse<WarningLetterDto>.ValidationFailed(new List<string> { "Only PDF signed copies are allowed." });
        }

        var bundle = await LoadWarningLetterBundleAsync(warningLetterId, cancellationToken);
        if (bundle == null)
        {
            return FMSResponse<WarningLetterDto>.NotFound("WARNING_LETTER_NOT_FOUND", "Warning letter not found");
        }

        if (!bundle.WarningLetter.ApproveLetterUploadedAt.HasValue || !bundle.WarningLetter.SignatureRequestedAt.HasValue)
        {
            return FMSResponse<WarningLetterDto>.BusinessLogicError("WARNING_LETTER_NOT_UPLOADABLE", "Send the approved letter to a site representative before uploading a signed copy.");
        }

        if (bundle.WarningLetter.EmployeeAcknowledgedAt.HasValue || bundle.WarningLetter.Status == WarningLetterStatus.Acknowledged)
        {
            return FMSResponse<WarningLetterDto>.BusinessLogicError("WARNING_LETTER_ALREADY_CLOSED", "Acknowledged warning letters cannot accept another signed copy.");
        }

        var signedCopyQrValidationErrors = await ValidateUploadedDocumentQrAsync(file, bundle.WarningLetter, cancellationToken);
        if (signedCopyQrValidationErrors.Count > 0)
        {
            return FMSResponse<WarningLetterDto>.ValidationFailed(signedCopyQrValidationErrors);
        }

        if (!string.IsNullOrWhiteSpace(bundle.WarningLetter.SignedCopyFilePath))
        {
            var existingFullPath = GetUploadedDocumentFullPath(bundle.WarningLetter.SignedCopyFilePath);
            if (File.Exists(existingFullPath))
            {
                File.Delete(existingFullPath);
            }
        }

        var storedFileName = $"{Guid.NewGuid():N}{extension.ToLowerInvariant()}";
        var relativePath = await SaveUploadedDocumentToDiskAsync(warningLetterId.ToString(), storedFileName, file, cancellationToken);

        var signedCopyReferenceFileName = $"{BuildReferenceNumber(bundle.WarningLetter)}-SignedCopy{extension.ToLowerInvariant()}";
        bundle.WarningLetter.SignedCopyFileName = signedCopyReferenceFileName;
        bundle.WarningLetter.SignedCopyStoredFileName = storedFileName;
        bundle.WarningLetter.SignedCopyFilePath = relativePath;
        bundle.WarningLetter.SignedCopyContentType = string.IsNullOrWhiteSpace(file.ContentType) ? ResolveImageMimeType(extension) : file.ContentType;
        bundle.WarningLetter.SignedCopyFileSize = file.Length;
        bundle.WarningLetter.SignedCopyUploadedAt = DateTime.UtcNow;
        bundle.WarningLetter.SignedCopyUploadedBy = uploadedBy;
        bundle.WarningLetter.Status = WarningLetterStatus.SignedCopyReceived;
        bundle.WarningLetter.DateModified = DateTime.UtcNow;
        bundle.WarningLetter.ModifiedBy = uploadedBy;

        await _context.SaveChangesAsync(cancellationToken);

        await NotifyIssuerSignedCopyUploadedAsync(bundle.WarningLetter, bundle.Employee, bundle.Vehicle, bundle.Site, uploadedBy, cancellationToken);

        var responseDto = Commands.CreateWarningLetterCommandHandler.MapToDto(bundle.WarningLetter, bundle.Employee, bundle.Vehicle, bundle.Site);
        responseDto.SignedCopyUploadedBy = await ResolveUserDisplayLabelAsync(bundle.WarningLetter.SignedCopyUploadedBy, cancellationToken) ?? responseDto.SignedCopyUploadedBy;

        return FMSResponse<WarningLetterDto>.Success(responseDto, "Signed copy uploaded successfully.");
    }

    public async Task<FMSResponse<WarningLetterDto>> UploadApproveLetterAsync(int warningLetterId, IFormFile file, string uploadedBy, CancellationToken cancellationToken = default)
    {
        if (file == null || file.Length == 0)
        {
            return FMSResponse<WarningLetterDto>.ValidationFailed(new List<string> { "An approved letter file is required." });
        }

        var extension = Path.GetExtension(file.FileName);
        if (string.IsNullOrWhiteSpace(extension) || !AllowedLetterDocumentExtensions.Contains(extension))
        {
            return FMSResponse<WarningLetterDto>.ValidationFailed(new List<string> { "Only PDF approved letters are allowed." });
        }

        var bundle = await LoadWarningLetterBundleAsync(warningLetterId, cancellationToken);
        if (bundle == null)
        {
            return FMSResponse<WarningLetterDto>.NotFound("WARNING_LETTER_NOT_FOUND", "Warning letter not found");
        }

        if (bundle.WarningLetter.SignatureRequestedAt.HasValue || bundle.WarningLetter.SignedCopyUploadedAt.HasValue || bundle.WarningLetter.EmployeeAcknowledgedAt.HasValue)
        {
            return FMSResponse<WarningLetterDto>.BusinessLogicError("WARNING_LETTER_NOT_UPLOADABLE", "Approved letters can only be uploaded before the letter is sent for signature.");
        }

        var approveLetterQrValidationErrors = await ValidateUploadedDocumentQrAsync(file, bundle.WarningLetter, cancellationToken);
        if (approveLetterQrValidationErrors.Count > 0)
        {
            return FMSResponse<WarningLetterDto>.ValidationFailed(approveLetterQrValidationErrors);
        }

        if (!string.IsNullOrWhiteSpace(bundle.WarningLetter.ApproveLetterFilePath))
        {
            var existingFullPath = GetUploadedDocumentFullPath(bundle.WarningLetter.ApproveLetterFilePath);
            if (File.Exists(existingFullPath))
            {
                File.Delete(existingFullPath);
            }
        }

        var storedFileName = $"{Guid.NewGuid():N}{extension.ToLowerInvariant()}";
        var relativePath = await SaveUploadedDocumentToDiskAsync(Path.Combine(ApproveLetterFolder, warningLetterId.ToString()), storedFileName, file, cancellationToken);

        var approveLetterReferenceFileName = $"{BuildReferenceNumber(bundle.WarningLetter)}-ApproveLetter{extension.ToLowerInvariant()}";
        bundle.WarningLetter.ApproveLetterFileName = approveLetterReferenceFileName;
        bundle.WarningLetter.ApproveLetterStoredFileName = storedFileName;
        bundle.WarningLetter.ApproveLetterFilePath = relativePath;
        bundle.WarningLetter.ApproveLetterContentType = string.IsNullOrWhiteSpace(file.ContentType) ? ResolveImageMimeType(extension) : file.ContentType;
        bundle.WarningLetter.ApproveLetterFileSize = file.Length;
        bundle.WarningLetter.ApproveLetterUploadedAt = DateTime.UtcNow;
        bundle.WarningLetter.ApproveLetterUploadedBy = uploadedBy;
        bundle.WarningLetter.Status = WarningLetterStatus.Finalized;
        bundle.WarningLetter.DateModified = DateTime.UtcNow;
        bundle.WarningLetter.ModifiedBy = uploadedBy;

        await _context.SaveChangesAsync(cancellationToken);

        var responseDto = Commands.CreateWarningLetterCommandHandler.MapToDto(bundle.WarningLetter, bundle.Employee, bundle.Vehicle, bundle.Site);
        responseDto.ApproveLetterUploadedBy = await ResolveUserDisplayLabelAsync(bundle.WarningLetter.ApproveLetterUploadedBy, cancellationToken) ?? responseDto.ApproveLetterUploadedBy;

        return FMSResponse<WarningLetterDto>.Success(responseDto, "Approved letter uploaded successfully.");
    }

    public async Task<FMSResponse<WarningLetterDocumentDto>> GetApproveLetterAsync(int warningLetterId, CancellationToken cancellationToken = default)
    {
        var warningLetter = await _context.WarningLetters.AsNoTracking().FirstOrDefaultAsync(w => w.Id == warningLetterId, cancellationToken);
        if (warningLetter == null)
        {
            return FMSResponse<WarningLetterDocumentDto>.NotFound("WARNING_LETTER_NOT_FOUND", "Warning letter not found");
        }

        if (string.IsNullOrWhiteSpace(warningLetter.ApproveLetterFilePath))
        {
            return FMSResponse<WarningLetterDocumentDto>.NotFound("WARNING_LETTER_APPROVE_LETTER_NOT_FOUND", "Approved letter not found.");
        }

        var fullPath = GetUploadedDocumentFullPath(warningLetter.ApproveLetterFilePath);
        if (!File.Exists(fullPath))
        {
            return FMSResponse<WarningLetterDocumentDto>.NotFound("WARNING_LETTER_APPROVE_LETTER_NOT_FOUND", "Approved letter file not found on disk.");
        }

        var bytes = await File.ReadAllBytesAsync(fullPath, cancellationToken);
        return FMSResponse<WarningLetterDocumentDto>.Success(new WarningLetterDocumentDto
        {
            FileName = warningLetter.ApproveLetterFileName ?? Path.GetFileName(fullPath),
            ContentType = string.IsNullOrWhiteSpace(warningLetter.ApproveLetterContentType) ? ResolveImageMimeType(Path.GetExtension(fullPath)) : warningLetter.ApproveLetterContentType,
            Content = bytes,
            FilePath = warningLetter.ApproveLetterFilePath
        });
    }

    public async Task<FMSResponse<WarningLetterDocumentDto>> GetSignedCopyAsync(int warningLetterId, CancellationToken cancellationToken = default)
    {
        var warningLetter = await _context.WarningLetters.AsNoTracking().FirstOrDefaultAsync(w => w.Id == warningLetterId, cancellationToken);
        if (warningLetter == null)
        {
            return FMSResponse<WarningLetterDocumentDto>.NotFound("WARNING_LETTER_NOT_FOUND", "Warning letter not found");
        }

        if (string.IsNullOrWhiteSpace(warningLetter.SignedCopyFilePath))
        {
            return FMSResponse<WarningLetterDocumentDto>.NotFound("WARNING_LETTER_SIGNED_COPY_NOT_FOUND", "Signed copy not found.");
        }

        var fullPath = GetUploadedDocumentFullPath(warningLetter.SignedCopyFilePath);
        if (!File.Exists(fullPath))
        {
            return FMSResponse<WarningLetterDocumentDto>.NotFound("WARNING_LETTER_SIGNED_COPY_NOT_FOUND", "Signed copy file not found on disk.");
        }

        var bytes = await File.ReadAllBytesAsync(fullPath, cancellationToken);
        return FMSResponse<WarningLetterDocumentDto>.Success(new WarningLetterDocumentDto
        {
            FileName = warningLetter.SignedCopyFileName ?? Path.GetFileName(fullPath),
            ContentType = string.IsNullOrWhiteSpace(warningLetter.SignedCopyContentType) ? ResolveImageMimeType(Path.GetExtension(fullPath)) : warningLetter.SignedCopyContentType,
            Content = bytes,
            FilePath = warningLetter.SignedCopyFilePath
        });
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

    private static async Task<string> SaveUploadedDocumentToDiskAsync(string relativeDirectory, string storedFileName, IFormFile file, CancellationToken cancellationToken)
    {
        var warningLetterDirectory = Path.Combine(DefaultUploadedDocumentStoragePath, relativeDirectory);
        Directory.CreateDirectory(warningLetterDirectory);

        var fullPath = Path.Combine(warningLetterDirectory, storedFileName);
        await using var stream = new FileStream(fullPath, FileMode.Create, FileAccess.Write, FileShare.None);
        await file.CopyToAsync(stream, cancellationToken);
        return Path.Combine(UploadedDocumentRelativeRoot, relativeDirectory, storedFileName).Replace('\\', '/');
    }

    private static string GetUploadedDocumentFullPath(string relativePath)
    {
        var stripped = relativePath.StartsWith($"{UploadedDocumentRelativeRoot}/", StringComparison.OrdinalIgnoreCase)
            ? relativePath.Substring($"{UploadedDocumentRelativeRoot}/".Length)
            : relativePath;

        return Path.Combine(DefaultUploadedDocumentStoragePath, stripped.Replace('/', Path.DirectorySeparatorChar));
    }

    private static string? JoinDelimitedValues(IEnumerable<string> values)
    {
        var resolved = values
            .Where(value => !string.IsNullOrWhiteSpace(value))
            .Select(value => value.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        return resolved.Count == 0 ? null : string.Join(";", resolved);
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

    private async Task<WarningLetterResolvedSettings> LoadResolvedSettingsAsync(CancellationToken cancellationToken)
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

    private static string ResolveIssuerName(string? configuredIssuerName, string? fallbackIssuerName)
    {
        if (!string.IsNullOrWhiteSpace(configuredIssuerName))
        {
            return configuredIssuerName.Trim();
        }

        return fallbackIssuerName?.Trim() ?? string.Empty;
    }

    private static string? ResolveIssuerTitle(string? configuredIssuerTitle, string? fallbackIssuerTitle)
    {
        if (!string.IsNullOrWhiteSpace(configuredIssuerTitle))
        {
            return configuredIssuerTitle.Trim();
        }

        return string.IsNullOrWhiteSpace(fallbackIssuerTitle) ? null : fallbackIssuerTitle.Trim();
    }

    private static List<string> ValidatePreviewRequest(CreateWarningLetterDto request)
    {
        var errors = new List<string>();

        if (request.EmployeeId <= 0) errors.Add("EmployeeId is required.");
        if (request.VehicleId <= 0) errors.Add("VehicleId is required.");
        if (request.SiteId <= 0) errors.Add("SiteId is required.");
        if (request.PeriodEnd < request.PeriodStart) errors.Add("PeriodEnd cannot be earlier than PeriodStart.");

        return errors;
    }

    private async Task<WarningLetterHtmlTemplates.WarningLetterTemplateModel> BuildTemplateModelAsync(
        Domain.Entities.Features.WarningLetterManagement.WarningLetter warningLetter,
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
        var generatedDate = DateTime.Now.ToString("dd-MMM-yyyy HH:mm");

        return new WarningLetterHtmlTemplates.WarningLetterTemplateModel
        {
            CompanyName = CompanyName,
            LogoDataUri = LoadLetterheadLogoDataUri(),
            IsExcessFuelConsumption = warningLetter.LetterType == WarningLetterType.ExcessFuelConsumption,
            IsExcessiveSpeed = warningLetter.LetterType == WarningLetterType.ExcessiveSpeed,
            IsExcessiveIdling = warningLetter.LetterType == WarningLetterType.ExcessiveIdling,
            WarningCountLabel = warningSequence.Label,
            IsLastWarning = warningSequence.IsLastWarning,
            ReferenceNumber = BuildReferenceNumber(warningLetter),
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
            GeneratedDate = generatedDate,
            QrCodeDataUri = GenerateQrCodeDataUri(BuildReferenceNumber(warningLetter))
        };
    }

    private async Task<WarningSequenceInfo> ResolveWarningSequenceAsync(
        Domain.Entities.Features.WarningLetterManagement.WarningLetter warningLetter,
        int maxWarningCountBeforeLast,
        CancellationToken cancellationToken)
    {
        var matchingWarningLetters = _context.WarningLetters
            .AsNoTracking()
            .Where(w => w.EmployeeId == warningLetter.EmployeeId && w.LetterType == warningLetter.LetterType);

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
        return new WarningSequenceInfo(
            warningCount,
            isLastWarning,
            isLastWarning ? "LAST" : ToOrdinal(warningCount));
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

    private sealed record WarningLetterResolvedSettings(
        decimal FuelPricePerLitre,
        string? IssuerName,
        string? IssuerTitle,
        int MaxWarningCountBeforeLast);

    private sealed record WarningSequenceInfo(
        int Count,
        bool IsLastWarning,
        string Label);

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

        var mimeType = ResolveImageMimeType(Path.GetExtension(logoPath));
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

    private static string ResolveImageMimeType(string extension)
    {
        return extension.ToLowerInvariant() switch
        {
            ".jpg" or ".jpeg" => "image/jpeg",
            ".svg" => "image/svg+xml",
            ".gif" => "image/gif",
            ".webp" => "image/webp",
            _ => "image/png"
        };
    }

    private static string BuildSignatureRequestEmailBody(
        Domain.Entities.Features.WarningLetterManagement.WarningLetter warningLetter,
        EmployeeEntity employee,
        VehicleEntity vehicle,
        SiteEntity site,
        string previewUrl)
    {
        var encodedPreviewUrl = System.Net.WebUtility.HtmlEncode(previewUrl);

        return $@"<html><body style='font-family:Segoe UI,Arial,sans-serif;color:#201f1e;'>
<p>Please print the attached warning letter for <strong>{System.Net.WebUtility.HtmlEncode(employee.FullName)}</strong>, obtain the driver signature and stamp where applicable, then upload the signed scan back into FMS.</p>
<table style='border-collapse:collapse;'>
<tr><td style='padding:4px 12px 4px 0;'><strong>Reference</strong></td><td style='padding:4px 0;'>#{warningLetter.Id}</td></tr>
<tr><td style='padding:4px 12px 4px 0;'><strong>Vehicle</strong></td><td style='padding:4px 0;'>{System.Net.WebUtility.HtmlEncode(vehicle.HyoungNo)}</td></tr>
<tr><td style='padding:4px 12px 4px 0;'><strong>Site</strong></td><td style='padding:4px 0;'>{System.Net.WebUtility.HtmlEncode(site.Name)}</td></tr>
</table>
<p>Open the warning-letter preview page to upload the signed copy after signature collection:</p>
<p><a href='{encodedPreviewUrl}' style='color:#0078d4;text-decoration:none;'>{encodedPreviewUrl}</a></p>
<p>After upload, the issuer will be notified automatically.</p>
</body></html>";
    }

    private string BuildWarningLetterPreviewUrl(int warningLetterId)
    {
        var baseUrl = (_configuration[FrontendBaseUrlConfigKey] ?? DefaultFrontendBaseUrl).Trim();
        return $"{baseUrl.TrimEnd('/')}{BuildWarningLetterPreviewPath(warningLetterId)}";
    }

    private static string BuildWarningLetterPreviewPath(int warningLetterId)
    {
        return $"/reports/warning-letters/{warningLetterId}/preview";
    }

    private async Task NotifySiteRepresentativeSignatureRequestedAsync(
        Domain.Entities.Features.WarningLetterManagement.WarningLetter warningLetter,
        EmployeeEntity employee,
        VehicleEntity vehicle,
        SiteEntity site,
        string requestedBy,
        string? recipientUserId,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(recipientUserId))
        {
            return;
        }

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

    private async Task NotifyIssuerSignedCopyUploadedAsync(
        Domain.Entities.Features.WarningLetterManagement.WarningLetter warningLetter,
        EmployeeEntity employee,
        VehicleEntity vehicle,
        SiteEntity site,
        string uploadedBy,
        CancellationToken cancellationToken)
    {
        var issuer = await _context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == warningLetter.IssuedByUserId, cancellationToken);
        if (issuer == null)
        {
            return;
        }

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

        if (string.IsNullOrWhiteSpace(issuer.Email))
        {
            return;
        }

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

        var signedCopyAttachment = await BuildSignedCopyAttachmentAsync(warningLetter, cancellationToken);
        await _emailService.SendEmailAsync(
            issuer.Email,
            subject,
            body,
            true,
            cancellationToken,
            signedCopyAttachment != null ? new[] { signedCopyAttachment } : null);
    }

    private async Task<EmailAttachmentDto?> BuildSignedCopyAttachmentAsync(
        Domain.Entities.Features.WarningLetterManagement.WarningLetter warningLetter,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(warningLetter.SignedCopyFilePath))
        {
            return null;
        }

        var fullPath = GetUploadedDocumentFullPath(warningLetter.SignedCopyFilePath);
        if (!File.Exists(fullPath))
        {
            _logger.LogWarning("Signed copy attachment file was not found for warning letter {WarningLetterId} at {Path}", warningLetter.Id, fullPath);
            return null;
        }

        var bytes = await File.ReadAllBytesAsync(fullPath, cancellationToken);
        if (bytes.Length == 0)
        {
            _logger.LogWarning("Signed copy attachment file was empty for warning letter {WarningLetterId} at {Path}", warningLetter.Id, fullPath);
            return null;
        }

        return new EmailAttachmentDto
        {
            FileName = string.IsNullOrWhiteSpace(warningLetter.SignedCopyFileName)
                ? Path.GetFileName(fullPath)
                : warningLetter.SignedCopyFileName,
            ContentType = string.IsNullOrWhiteSpace(warningLetter.SignedCopyContentType)
                ? "application/octet-stream"
                : warningLetter.SignedCopyContentType,
            Content = bytes
        };
    }

    private async Task<string?> ResolveUserDisplayLabelAsync(string? userId, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(userId))
        {
            return null;
        }

        var user = await _context.Users
            .AsNoTracking()
            .Where(u => u.Id == userId)
            .Select(u => new { u.FirstName, u.LastName, u.UserName, u.Email })
            .FirstOrDefaultAsync(cancellationToken);

        if (user == null)
        {
            return userId;
        }

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

    private static string BuildReferenceNumber(Domain.Entities.Features.WarningLetterManagement.WarningLetter warningLetter)
    {
        var suffix = warningLetter.Id > 0 ? warningLetter.Id.ToString("D5") : "PREVIEW";
        return $"WL-{warningLetter.SiteId}-{warningLetter.LetterDate:yyyy}-{suffix}";
    }

    private async Task<List<string>> ValidateUploadedDocumentQrAsync(
        IFormFile file,
        Domain.Entities.Features.WarningLetterManagement.WarningLetter warningLetter,
        CancellationToken cancellationToken)
    {
        var expectedReferenceNumber = BuildReferenceNumber(warningLetter);
        var uploadedReferenceNumber = await TryReadWarningLetterReferenceFromPdfQrAsync(file, cancellationToken);

        if (string.IsNullOrWhiteSpace(uploadedReferenceNumber))
        {
            return new List<string>
            {
                "Could not read a warning letter QR code from page 1 of the uploaded PDF. Upload the official warning letter PDF for this record."
            };
        }

        if (!string.Equals(uploadedReferenceNumber, expectedReferenceNumber, StringComparison.OrdinalIgnoreCase))
        {
            return new List<string>
            {
                $"Uploaded document QR does not match this warning letter. Expected reference '{expectedReferenceNumber}' but found '{uploadedReferenceNumber}'."
            };
        }

        return new List<string>();
    }

    private async Task<string?> TryReadWarningLetterReferenceFromPdfQrAsync(IFormFile file, CancellationToken cancellationToken)
    {
        try
        {
            using var stream = new MemoryStream();
            await file.CopyToAsync(stream, cancellationToken);
            var pdfBytes = stream.ToArray();

            if (pdfBytes.Length == 0)
            {
                return null;
            }

            using var docReader = DocLib.Instance.GetDocReader(pdfBytes, new PageDimensions(1080, 1920));
            if (docReader.GetPageCount() <= 0)
            {
                return null;
            }

            using var pageReader = docReader.GetPageReader(0);
            var rawBytes = pageReader.GetImage();
            var width = pageReader.GetPageWidth();
            var height = pageReader.GetPageHeight();

            if (rawBytes == null || rawBytes.Length == 0 || width <= 0 || height <= 0)
            {
                return null;
            }

            var qrPayload = TryDecodeQrPayload(rawBytes, width, height)
                ?? TryDecodeFooterQrPayload(rawBytes, width, height);

            return ExtractReferenceNumberFromQrPayload(qrPayload);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to read warning letter QR from uploaded PDF {FileName}", file.FileName);
            return null;
        }
    }

    private static string? TryDecodeFooterQrPayload(byte[] rawBytes, int width, int height)
    {
        var footerWidth = Math.Max(1, (int)(width * 0.35));
        var footerHeight = Math.Max(1, (int)(height * 0.28));
        var startX = Math.Max(0, width - footerWidth);
        var startY = Math.Max(0, height - footerHeight);

        var croppedRawBytes = CropRawBytes(rawBytes, width, height, startX, startY, footerWidth, footerHeight);
        return TryDecodeQrPayload(croppedRawBytes, footerWidth, footerHeight);
    }

    private static string? TryDecodeQrPayload(byte[] rawBytes, int width, int height)
    {
        var barcodeReader = new BarcodeReaderGeneric
        {
            AutoRotate = true,
            Options = new DecodingOptions
            {
                TryHarder = true,
                PossibleFormats = new List<BarcodeFormat> { BarcodeFormat.QR_CODE }
            }
        };

        var luminanceSource = new RGBLuminanceSource(rawBytes, width, height, RGBLuminanceSource.BitmapFormat.BGRA32);
        var result = barcodeReader.Decode(luminanceSource);
        return string.IsNullOrWhiteSpace(result?.Text)
            ? null
            : result.Text.Trim();
    }

    private static string? ExtractReferenceNumberFromQrPayload(string? qrPayload)
    {
        if (string.IsNullOrWhiteSpace(qrPayload))
        {
            return null;
        }

        var lines = qrPayload
            .Split(new[] { "\r\n", "\n", "\r" }, StringSplitOptions.RemoveEmptyEntries)
            .Select(line => line.Trim())
            .Where(line => !string.IsNullOrWhiteSpace(line))
            .ToList();

        var referenceLine = lines.FirstOrDefault(line => line.StartsWith("Reference:", StringComparison.OrdinalIgnoreCase));
        if (!string.IsNullOrWhiteSpace(referenceLine))
        {
            return referenceLine[(referenceLine.IndexOf(':') + 1)..].Trim();
        }

        return lines.FirstOrDefault();
    }

    private static byte[] CropRawBytes(byte[] rawBytes, int sourceWidth, int sourceHeight, int startX, int startY, int cropWidth, int cropHeight)
    {
        var output = new byte[cropWidth * cropHeight * 4];

        for (var y = 0; y < cropHeight; y++)
        {
            var sourceY = startY + y;
            if (sourceY >= sourceHeight)
            {
                break;
            }

            for (var x = 0; x < cropWidth; x++)
            {
                var sourceX = startX + x;
                if (sourceX >= sourceWidth)
                {
                    break;
                }

                var sourceIndex = ((sourceY * sourceWidth) + sourceX) * 4;
                var targetIndex = ((y * cropWidth) + x) * 4;

                if (sourceIndex + 3 >= rawBytes.Length || targetIndex + 3 >= output.Length)
                {
                    continue;
                }

                output[targetIndex] = rawBytes[sourceIndex];
                output[targetIndex + 1] = rawBytes[sourceIndex + 1];
                output[targetIndex + 2] = rawBytes[sourceIndex + 2];
                output[targetIndex + 3] = rawBytes[sourceIndex + 3];
            }
        }

        return output;
    }

    private static string? GenerateQrCodeDataUri(string referenceNumber)
    {
        if (string.IsNullOrWhiteSpace(referenceNumber)) return null;

        using var qrGenerator = new QRCodeGenerator();
        using var qrCodeData = qrGenerator.CreateQrCode(referenceNumber, QRCodeGenerator.ECCLevel.M);
        using var qrCode = new PngByteQRCode(qrCodeData);
        var pngBytes = qrCode.GetGraphic(8);
        return $"data:image/png;base64,{Convert.ToBase64String(pngBytes)}";
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
            : (day % 10) switch
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