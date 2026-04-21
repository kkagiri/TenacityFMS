/**
 * File: WarningLetterService.cs
 * Purpose: Handles warning letter preview, PDF persistence, and email delivery workflows.
 * Dependencies: EF Core, SystemConfigurationService, IEmailService, IWarningLetterPdfRenderer
 * Last Modified: 2026-04-21
 */
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.Notification.DTOs;
using FMS.Application.Features.WarningLetter;
using FMS.Application.Features.Notification.Services;
using FMS.Application.Features.WarningLetter.DTOs;
using FMS.Application.Features.WarningLetter.Templates;
using FMS.Application.Services.Configuration;
using FMS.Domain.Entities.Features.WarningLetterManagement;
using FMS.Persistence.DataAccess;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.WarningLetter.Services;

public class WarningLetterService : IWarningLetterService
{
    private const string ApproveLetterFolder = "approve";
    private const string WarningLetterTemplateName = "warning-letter-report";
    private static readonly HashSet<string> AllowedLetterDocumentExtensions = new(StringComparer.OrdinalIgnoreCase) { ".pdf" };

    private readonly GpsdataContext _context;
    private readonly IWarningLetterPdfRenderer _pdfRenderer;
    private readonly IEmailService _emailService;
    private readonly ISystemConfigurationService _systemConfigurationService;
    private readonly ILogger<WarningLetterService> _logger;
    private readonly WarningLetterTemplateFactory _templateFactory;
    private readonly WarningLetterDocumentManager _documentManager;
    private readonly WarningLetterWorkflowSupport _workflowSupport;

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
        _systemConfigurationService = systemConfigurationService;
        _logger = logger;
        _templateFactory = new WarningLetterTemplateFactory(_context, _systemConfigurationService);
        _documentManager = new WarningLetterDocumentManager(_systemConfigurationService, _logger);
        _workflowSupport = new WarningLetterWorkflowSupport(_context, emailService, notificationService, configuration, _documentManager, _logger);
    }

    public async Task<FMSResponse<string>> PreviewHtmlAsync(CreateWarningLetterDto request, CancellationToken cancellationToken = default)
    {
        var validationErrors = WarningLetterWorkflowSupport.ValidatePreviewRequest(request);
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

        var settings = await _templateFactory.LoadResolvedSettingsAsync(cancellationToken);
        var fuelPrice = request.LetterType == WarningLetterType.ExcessFuelConsumption
            ? settings.FuelPricePerLitre
            : request.FuelPrice;
        var issuedByName = WarningLetterWorkflowSupport.ResolveIssuerName(settings.IssuerName, request.IssuedByName);
        var issuedByTitle = WarningLetterWorkflowSupport.ResolveIssuerTitle(settings.IssuerTitle, request.IssuedByTitle);

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
            HideWarningCountInSubject = request.HideWarningCountInSubject,
            Notes = request.Notes,
            Status = WarningLetterStatus.Draft,
            DateCreated = DateTime.UtcNow,
            CreatedBy = request.IssuedByUserId
        };

        var templateModel = await _templateFactory.BuildTemplateModelAsync(transientLetter, employee, vehicle, site, request.IssuedByUserId, settings.MaxWarningCountBeforeLast, cancellationToken);
        var html = await _pdfRenderer.RenderHtmlAsync(WarningLetterTemplateName, templateModel, cancellationToken);
        return FMSResponse<string>.Success(html);
    }

    public async Task<FMSResponse<string>> GetHtmlAsync(int warningLetterId, CancellationToken cancellationToken = default)
    {
        var bundle = await _workflowSupport.LoadWarningLetterBundleAsync(warningLetterId, cancellationToken);
        if (bundle == null) return FMSResponse<string>.NotFound("WARNING_LETTER_NOT_FOUND", "Warning letter not found");

        var settings = await _templateFactory.LoadResolvedSettingsAsync(cancellationToken);
        var templateModel = await _templateFactory.BuildTemplateModelAsync(
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
        var bundle = await _workflowSupport.LoadWarningLetterBundleAsync(warningLetterId, cancellationToken);
        if (bundle == null) return FMSResponse<WarningLetterDocumentDto>.NotFound("WARNING_LETTER_NOT_FOUND", "Warning letter not found");

        var settings = await _templateFactory.LoadResolvedSettingsAsync(cancellationToken);
        var templateModel = await _templateFactory.BuildTemplateModelAsync(
            bundle.WarningLetter,
            bundle.Employee,
            bundle.Vehicle,
            bundle.Site,
            modifiedBy ?? bundle.WarningLetter.ModifiedBy ?? bundle.WarningLetter.CreatedBy,
            settings.MaxWarningCountBeforeLast,
            cancellationToken);
        var pdfBytes = await _pdfRenderer.RenderPdfAsync(WarningLetterTemplateName, templateModel, cancellationToken);
        var fileName = WarningLetterDocumentManager.BuildPdfFileName(bundle.WarningLetter);
        var filePath = await _documentManager.SavePdfToDiskAsync(bundle.WarningLetter, pdfBytes, fileName, cancellationToken);

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
        var bundle = await _workflowSupport.LoadWarningLetterBundleAsync(warningLetterId, cancellationToken);
        if (bundle == null) return FMSResponse.NotFound("WARNING_LETTER_NOT_FOUND", "Warning letter not found");

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

        var settings = await _templateFactory.LoadResolvedSettingsAsync(cancellationToken);
        var templateModel = await _templateFactory.BuildTemplateModelAsync(
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
        var bundle = await _workflowSupport.LoadWarningLetterBundleAsync(warningLetterId, cancellationToken);
        if (bundle == null) return FMSResponse<WarningLetterDto>.NotFound("WARNING_LETTER_NOT_FOUND", "Warning letter not found");

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
            return FMSResponse<WarningLetterDto>.ValidationFailed(new List<string> { "The selected site representative is no longer assigned to this site." });
        }

        var recipient = !string.IsNullOrWhiteSpace(request?.EmailRecipient)
            ? request.EmailRecipient.Trim()
            : selectedUser?.Email?.Trim() ?? bundle.WarningLetter.SignatureRequestRecipient?.Trim() ?? string.Empty;

        if (selectedUser != null && string.IsNullOrWhiteSpace(selectedUser.Email))
        {
            return FMSResponse<WarningLetterDto>.ValidationFailed(new List<string> { "The selected site representative does not have an email address." });
        }

        if (string.IsNullOrWhiteSpace(recipient) || !WarningLetterWorkflowSupport.IsValidEmailAddress(recipient))
        {
            return FMSResponse<WarningLetterDto>.ValidationFailed(new List<string> { "Provide a valid signature recipient email address." });
        }

        var ccRecipientUserIds = (request?.CcRecipientUserIds ?? new List<string>())
            .Where(value => !string.IsNullOrWhiteSpace(value))
            .Select(value => value.Trim())
            .Where(value => selectedUser == null || !string.Equals(value, selectedUser.Id, StringComparison.OrdinalIgnoreCase))
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

        var requesterUser = string.IsNullOrWhiteSpace(modifiedBy)
            ? null
            : await _context.Users
                .AsNoTracking()
                .Where(u => u.Id == modifiedBy)
                .Select(u => new { u.Id, u.Email })
                .FirstOrDefaultAsync(cancellationToken);

        var requesterEmail = requesterUser?.Email?.Trim();
        if (!string.IsNullOrWhiteSpace(requesterEmail)
            && WarningLetterWorkflowSupport.IsValidEmailAddress(requesterEmail)
            && !string.Equals(requesterEmail, recipient, StringComparison.OrdinalIgnoreCase))
        {
            if (!string.Equals(requesterUser!.Id, selectedUser?.Id, StringComparison.OrdinalIgnoreCase))
            {
                ccRecipientIds.Add(requesterUser.Id);
            }

            ccRecipientEmails.Add(requesterEmail);
        }

        ccRecipientIds = ccRecipientIds
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        ccRecipientEmails = ccRecipientEmails
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        var documentResult = await GetPdfAsync(warningLetterId, cancellationToken);
        if (!documentResult.IsSuccess || documentResult.Data == null)
        {
            return FMSResponse<WarningLetterDto>.Failed(documentResult.Message, documentResult.ErrorCode);
        }

        var subject = $"Signature Required - Warning Letter #{warningLetterId} - {bundle.Vehicle.HyoungNo}";
        var body = WarningLetterWorkflowSupport.BuildSignatureRequestEmailBody(
            bundle.WarningLetter,
            bundle.Employee,
            bundle.Vehicle,
            bundle.Site,
            _workflowSupport.BuildWarningLetterPreviewUrl(bundle.WarningLetter.Id),
            _workflowSupport.BuildInternalWarningLetterPreviewUrl(bundle.WarningLetter.Id));
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

        bundle.WarningLetter.SignatureRequestRecipientUserId = selectedUser?.Id;
        bundle.WarningLetter.SignatureRequestRecipient = recipient;
        bundle.WarningLetter.SignatureRequestCcUserIds = WarningLetterWorkflowSupport.JoinDelimitedValues(ccRecipientIds);
        bundle.WarningLetter.SignatureRequestCcRecipients = WarningLetterWorkflowSupport.JoinDelimitedValues(ccRecipientEmails);
        bundle.WarningLetter.SignatureRequestedAt = DateTime.UtcNow;
        bundle.WarningLetter.SignatureRequestedBy = modifiedBy;
        bundle.WarningLetter.Status = WarningLetterStatus.Sent;
        bundle.WarningLetter.DateModified = DateTime.UtcNow;
        bundle.WarningLetter.ModifiedBy = modifiedBy;

        await _context.SaveChangesAsync(cancellationToken);

        await _workflowSupport.NotifySiteRepresentativeSignatureRequestedAsync(
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

    public async Task<FMSResponse<BulkSignatureResultDto>> BulkRequestSignatureAsync(string modifiedBy, BulkRequestWarningLetterSignatureDto request, CancellationToken cancellationToken = default)
    {
        if (request == null || request.WarningLetterIds == null || request.WarningLetterIds.Count == 0)
        {
            return FMSResponse<BulkSignatureResultDto>.ValidationFailed(new List<string> { "At least one warning letter must be selected." });
        }

        if (string.IsNullOrWhiteSpace(request.SignatureRecipientUserId) && string.IsNullOrWhiteSpace(request.EmailRecipient))
        {
            return FMSResponse<BulkSignatureResultDto>.ValidationFailed(new List<string> { "A signature recipient must be selected." });
        }

        var distinctIds = request.WarningLetterIds.Distinct().ToList();
        var result = new BulkSignatureResultDto
        {
            TotalRequested = distinctIds.Count,
            Results = new List<BulkSignatureItemResultDto>()
        };

        foreach (var warningLetterId in distinctIds)
        {
            var itemRequest = new RequestWarningLetterSignatureDto
            {
                SignatureRecipientUserId = request.SignatureRecipientUserId,
                EmailRecipient = request.EmailRecipient,
                CcRecipientUserIds = request.CcRecipientUserIds ?? new List<string>()
            };

            var singleResult = await RequestSignatureAsync(warningLetterId, modifiedBy, itemRequest, cancellationToken);

            if (singleResult.IsSuccess)
            {
                result.SuccessCount++;
                result.Results.Add(new BulkSignatureItemResultDto
                {
                    WarningLetterId = warningLetterId,
                    Success = true
                });
            }
            else
            {
                result.FailedCount++;
                result.Results.Add(new BulkSignatureItemResultDto
                {
                    WarningLetterId = warningLetterId,
                    Success = false,
                    ErrorMessage = singleResult.Message
                });
            }
        }

        var message = result.FailedCount == 0
            ? $"Signature requests sent successfully for all {result.SuccessCount} letter(s)."
            : $"Signature requests completed: {result.SuccessCount} succeeded, {result.FailedCount} failed.";

        _logger.LogInformation("Bulk signature request completed: {SuccessCount}/{TotalRequested} succeeded", result.SuccessCount, result.TotalRequested);
        return FMSResponse<BulkSignatureResultDto>.Success(result, message);
    }

    public async Task<FMSResponse<WarningLetterDto>> UploadSignedCopyAsync(int warningLetterId, IFormFile file, string uploadedBy, CancellationToken cancellationToken = default)
    {
        if (file == null || file.Length == 0) return FMSResponse<WarningLetterDto>.ValidationFailed(new List<string> { "A signed copy file is required." });

        var extension = Path.GetExtension(file.FileName);
        if (string.IsNullOrWhiteSpace(extension) || !AllowedLetterDocumentExtensions.Contains(extension))
        {
            return FMSResponse<WarningLetterDto>.ValidationFailed(new List<string> { "Only PDF signed copies are allowed." });
        }

        var bundle = await _workflowSupport.LoadWarningLetterBundleAsync(warningLetterId, cancellationToken);
        if (bundle == null) return FMSResponse<WarningLetterDto>.NotFound("WARNING_LETTER_NOT_FOUND", "Warning letter not found");

        if (!bundle.WarningLetter.ApproveLetterUploadedAt.HasValue || !bundle.WarningLetter.SignatureRequestedAt.HasValue)
        {
            return FMSResponse<WarningLetterDto>.BusinessLogicError("WARNING_LETTER_NOT_UPLOADABLE", "Send the approved letter to a site representative before uploading a signed copy.");
        }

        if (bundle.WarningLetter.EmployeeAcknowledgedAt.HasValue || bundle.WarningLetter.Status == WarningLetterStatus.Acknowledged)
        {
            return FMSResponse<WarningLetterDto>.BusinessLogicError("WARNING_LETTER_ALREADY_CLOSED", "Acknowledged warning letters cannot accept another signed copy.");
        }

        var signedCopyQrValidationErrors = await _documentManager.ValidateUploadedDocumentQrAsync(file, bundle.WarningLetter, cancellationToken);
        if (signedCopyQrValidationErrors.Count > 0) return FMSResponse<WarningLetterDto>.ValidationFailed(signedCopyQrValidationErrors);

        if (!string.IsNullOrWhiteSpace(bundle.WarningLetter.SignedCopyFilePath))
        {
            var existingFullPath = _documentManager.GetUploadedDocumentFullPath(bundle.WarningLetter.SignedCopyFilePath);
            if (File.Exists(existingFullPath))
            {
                File.Delete(existingFullPath);
            }
        }

        var storedFileName = $"{Guid.NewGuid():N}{extension.ToLowerInvariant()}";
        var relativePath = await _documentManager.SaveUploadedDocumentToDiskAsync(warningLetterId.ToString(), storedFileName, file, cancellationToken);

        var signedCopyReferenceFileName = $"{WarningLetterDocumentManager.BuildReferenceNumber(bundle.WarningLetter)}-SignedCopy{extension.ToLowerInvariant()}";
        bundle.WarningLetter.SignedCopyFileName = signedCopyReferenceFileName;
        bundle.WarningLetter.SignedCopyStoredFileName = storedFileName;
        bundle.WarningLetter.SignedCopyFilePath = relativePath;
        bundle.WarningLetter.SignedCopyContentType = string.IsNullOrWhiteSpace(file.ContentType) ? WarningLetterDocumentManager.ResolveStoredDocumentContentType(extension) : file.ContentType;
        bundle.WarningLetter.SignedCopyFileSize = file.Length;
        bundle.WarningLetter.SignedCopyUploadedAt = DateTime.UtcNow;
        bundle.WarningLetter.SignedCopyUploadedBy = uploadedBy;
        bundle.WarningLetter.Status = WarningLetterStatus.SignedCopyReceived;
        bundle.WarningLetter.DateModified = DateTime.UtcNow;
        bundle.WarningLetter.ModifiedBy = uploadedBy;

        await _context.SaveChangesAsync(cancellationToken);

        await _workflowSupport.NotifyIssuerSignedCopyUploadedAsync(bundle.WarningLetter, bundle.Employee, bundle.Vehicle, bundle.Site, uploadedBy, cancellationToken);

        var responseDto = Commands.CreateWarningLetterCommandHandler.MapToDto(bundle.WarningLetter, bundle.Employee, bundle.Vehicle, bundle.Site);
        responseDto.SignedCopyUploadedBy = await _workflowSupport.ResolveUserDisplayLabelAsync(bundle.WarningLetter.SignedCopyUploadedBy, cancellationToken) ?? responseDto.SignedCopyUploadedBy;

        return FMSResponse<WarningLetterDto>.Success(responseDto, "Signed copy uploaded successfully.");
    }

    public async Task<FMSResponse<WarningLetterDto>> UploadApproveLetterAsync(int warningLetterId, IFormFile file, string uploadedBy, CancellationToken cancellationToken = default)
    {
        if (file == null || file.Length == 0) return FMSResponse<WarningLetterDto>.ValidationFailed(new List<string> { "An approved letter file is required." });

        var extension = Path.GetExtension(file.FileName);
        if (string.IsNullOrWhiteSpace(extension) || !AllowedLetterDocumentExtensions.Contains(extension))
        {
            return FMSResponse<WarningLetterDto>.ValidationFailed(new List<string> { "Only PDF approved letters are allowed." });
        }

        var bundle = await _workflowSupport.LoadWarningLetterBundleAsync(warningLetterId, cancellationToken);
        if (bundle == null) return FMSResponse<WarningLetterDto>.NotFound("WARNING_LETTER_NOT_FOUND", "Warning letter not found");

        if (bundle.WarningLetter.SignatureRequestedAt.HasValue || bundle.WarningLetter.SignedCopyUploadedAt.HasValue || bundle.WarningLetter.EmployeeAcknowledgedAt.HasValue)
        {
            return FMSResponse<WarningLetterDto>.BusinessLogicError("WARNING_LETTER_NOT_UPLOADABLE", "Approved letters can only be uploaded before the letter is sent for signature.");
        }

        var approveLetterQrValidationErrors = await _documentManager.ValidateUploadedDocumentQrAsync(file, bundle.WarningLetter, cancellationToken);
        if (approveLetterQrValidationErrors.Count > 0) return FMSResponse<WarningLetterDto>.ValidationFailed(approveLetterQrValidationErrors);

        if (!string.IsNullOrWhiteSpace(bundle.WarningLetter.ApproveLetterFilePath))
        {
            var existingFullPath = _documentManager.GetUploadedDocumentFullPath(bundle.WarningLetter.ApproveLetterFilePath);
            if (File.Exists(existingFullPath))
            {
                File.Delete(existingFullPath);
            }
        }

        var storedFileName = $"{Guid.NewGuid():N}{extension.ToLowerInvariant()}";
        var relativePath = await _documentManager.SaveUploadedDocumentToDiskAsync(Path.Combine(ApproveLetterFolder, warningLetterId.ToString()), storedFileName, file, cancellationToken);

        var approveLetterReferenceFileName = $"{WarningLetterDocumentManager.BuildReferenceNumber(bundle.WarningLetter)}-ApproveLetter{extension.ToLowerInvariant()}";
        bundle.WarningLetter.ApproveLetterFileName = approveLetterReferenceFileName;
        bundle.WarningLetter.ApproveLetterStoredFileName = storedFileName;
        bundle.WarningLetter.ApproveLetterFilePath = relativePath;
        bundle.WarningLetter.ApproveLetterContentType = string.IsNullOrWhiteSpace(file.ContentType) ? WarningLetterDocumentManager.ResolveStoredDocumentContentType(extension) : file.ContentType;
        bundle.WarningLetter.ApproveLetterFileSize = file.Length;
        bundle.WarningLetter.ApproveLetterUploadedAt = DateTime.UtcNow;
        bundle.WarningLetter.ApproveLetterUploadedBy = uploadedBy;
        bundle.WarningLetter.Status = WarningLetterStatus.Finalized;
        bundle.WarningLetter.DateModified = DateTime.UtcNow;
        bundle.WarningLetter.ModifiedBy = uploadedBy;

        await _context.SaveChangesAsync(cancellationToken);

        var responseDto = Commands.CreateWarningLetterCommandHandler.MapToDto(bundle.WarningLetter, bundle.Employee, bundle.Vehicle, bundle.Site);
        responseDto.ApproveLetterUploadedBy = await _workflowSupport.ResolveUserDisplayLabelAsync(bundle.WarningLetter.ApproveLetterUploadedBy, cancellationToken) ?? responseDto.ApproveLetterUploadedBy;

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

        var fullPath = _documentManager.GetUploadedDocumentFullPath(warningLetter.ApproveLetterFilePath);
        if (!File.Exists(fullPath))
        {
            return FMSResponse<WarningLetterDocumentDto>.NotFound("WARNING_LETTER_APPROVE_LETTER_NOT_FOUND", "Approved letter file not found on disk.");
        }

        var bytes = await File.ReadAllBytesAsync(fullPath, cancellationToken);
        return FMSResponse<WarningLetterDocumentDto>.Success(new WarningLetterDocumentDto
        {
            FileName = warningLetter.ApproveLetterFileName ?? Path.GetFileName(fullPath),
            ContentType = string.IsNullOrWhiteSpace(warningLetter.ApproveLetterContentType) ? WarningLetterDocumentManager.ResolveStoredDocumentContentType(Path.GetExtension(fullPath)) : warningLetter.ApproveLetterContentType,
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

        var fullPath = _documentManager.GetUploadedDocumentFullPath(warningLetter.SignedCopyFilePath);
        if (!File.Exists(fullPath))
        {
            return FMSResponse<WarningLetterDocumentDto>.NotFound("WARNING_LETTER_SIGNED_COPY_NOT_FOUND", "Signed copy file not found on disk.");
        }

        var bytes = await File.ReadAllBytesAsync(fullPath, cancellationToken);
        return FMSResponse<WarningLetterDocumentDto>.Success(new WarningLetterDocumentDto
        {
            FileName = warningLetter.SignedCopyFileName ?? Path.GetFileName(fullPath),
            ContentType = string.IsNullOrWhiteSpace(warningLetter.SignedCopyContentType) ? WarningLetterDocumentManager.ResolveStoredDocumentContentType(Path.GetExtension(fullPath)) : warningLetter.SignedCopyContentType,
            Content = bytes,
            FilePath = warningLetter.SignedCopyFilePath
        });
    }

}