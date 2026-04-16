/**
 * File: CreateWarningLetterCommand.cs
 * Purpose: Creates draft warning letters after validating related employee, vehicle, and site data.
 * Dependencies: MediatR, GpsdataContext, FMSResponse, WarningLetter DTOs/entities
 * Last Modified: 2026-04-06
 */
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.CommonInterface;
using FMS.Application.Features.WarningLetter.DTOs;
using FMS.Application.Features.WarningLetter;
using FMS.Application.Features.WarningLetter.Queries;
using FMS.Application.Features.WarningLetter.Services;
using FMS.Application.Services.Configuration;
using FMS.Domain.Entities;
using FMS.Domain.Entities.Features.WarningLetterManagement;
using EmployeeEntity = FMS.Domain.Entities.Employee;
using SiteEntity = FMS.Domain.Entities.Site;
using VehicleEntity = FMS.Domain.Entities.Vehicle;
using WarningLetterEntity = FMS.Domain.Entities.Features.WarningLetterManagement.WarningLetter;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.WarningLetter.Commands;

public class CreateWarningLetterCommand : IRequest<FMSResponse<WarningLetterDto>>
{
    public CreateWarningLetterDto WarningLetter { get; set; } = new();
    public string CreatedBy { get; set; } = string.Empty;
}

public class CreateWarningLetterCommandHandler : IRequestHandler<CreateWarningLetterCommand, FMSResponse<WarningLetterDto>>
{
    private readonly GpsdataContext _context;
    private readonly ISystemConfigurationService _systemConfigurationService;
    private readonly ILogger<CreateWarningLetterCommandHandler> _logger;
    private readonly IGPSGateDriverNameService? _driverNameService;

    public CreateWarningLetterCommandHandler(
        GpsdataContext context,
        ISystemConfigurationService systemConfigurationService,
        ILogger<CreateWarningLetterCommandHandler> logger,
        IGPSGateDriverNameService? driverNameService = null)
    {
        _context = context;
        _systemConfigurationService = systemConfigurationService;
        _logger = logger;
        _driverNameService = driverNameService;
    }

    public async Task<FMSResponse<WarningLetterDto>> Handle(CreateWarningLetterCommand request, CancellationToken cancellationToken)
    {
        var configuredIssuerName = await _systemConfigurationService.GetConfigurationValueAsync(
            GetWarningLetterSettingsQueryHandler.IssuerNameConfigKey,
            cancellationToken);
        var configuredIssuerTitle = await _systemConfigurationService.GetConfigurationValueAsync(
            GetWarningLetterSettingsQueryHandler.IssuerTitleConfigKey,
            cancellationToken);

        var resolvedIssuedByName = ResolveIssuerName(configuredIssuerName, request.WarningLetter.IssuedByName);
        var resolvedIssuedByTitle = ResolveIssuerTitle(configuredIssuerTitle, request.WarningLetter.IssuedByTitle);

        var validationErrors = ValidateRequest(request.WarningLetter, request.CreatedBy, resolvedIssuedByName);
        if (validationErrors.Count > 0)
        {
            return FMSResponse<WarningLetterDto>.ValidationFailed(validationErrors);
        }

        var resolvedViolationSummary = WarningLetterSummaryBuilder.Resolve(
            request.WarningLetter.ViolationSummary,
            request.WarningLetter.LetterType,
            request.WarningLetter.PeriodStart,
            request.WarningLetter.PeriodEnd,
            request.WarningLetter.ExpectedValue,
            request.WarningLetter.ActualValue,
            request.WarningLetter.ExcessValue);

        var employee = await _context.Employees.FirstOrDefaultAsync(e => e.Id == request.WarningLetter.EmployeeId, cancellationToken);
        if (employee == null)
        {
            return FMSResponse<WarningLetterDto>.NotFound("WARNING_LETTER_EMPLOYEE_NOT_FOUND", "Employee not found");
        }

        if (string.IsNullOrWhiteSpace(employee.Position))
        {
            return FMSResponse<WarningLetterDto>.ValidationFailed(new List<string> { "Employee position is required before creating a warning letter." });
        }

        var vehicle = await _context.Vehicles.FirstOrDefaultAsync(v => v.VehicleId == request.WarningLetter.VehicleId, cancellationToken);
        if (vehicle == null)
        {
            return FMSResponse<WarningLetterDto>.NotFound("WARNING_LETTER_VEHICLE_NOT_FOUND", "Vehicle not found");
        }

        var site = await _context.Sites.FirstOrDefaultAsync(s => s.Id == request.WarningLetter.SiteId, cancellationToken);
        if (site == null)
        {
            return FMSResponse<WarningLetterDto>.NotFound("WARNING_LETTER_SITE_NOT_FOUND", "Site not found");
        }

        var userId = string.IsNullOrWhiteSpace(request.WarningLetter.IssuedByUserId)
            ? request.CreatedBy
            : request.WarningLetter.IssuedByUserId;

        var issuedByExists = await _context.Users.AnyAsync(u => u.Id == userId, cancellationToken);
        if (!issuedByExists)
        {
            return FMSResponse<WarningLetterDto>.NotFound("WARNING_LETTER_ISSUER_NOT_FOUND", "Issuing user not found");
        }

        var fuelPrice = request.WarningLetter.FuelPrice;
        if (request.WarningLetter.LetterType == WarningLetterType.ExcessFuelConsumption)
        {
            fuelPrice = await _systemConfigurationService.GetDecimalAsync(
                GetWarningLetterSettingsQueryHandler.FuelPricePerLitreConfigKey, 0m, cancellationToken);
        }

        var warningLetter = new WarningLetterEntity
        {
            LetterType = request.WarningLetter.LetterType,
            EmployeeId = request.WarningLetter.EmployeeId,
            VehicleId = request.WarningLetter.VehicleId,
            SiteId = request.WarningLetter.SiteId,
            LetterDate = request.WarningLetter.LetterDate,
            PeriodStart = request.WarningLetter.PeriodStart,
            PeriodEnd = request.WarningLetter.PeriodEnd,
            ViolationSummary = resolvedViolationSummary,
            ExpectedValue = request.WarningLetter.ExpectedValue,
            ActualValue = request.WarningLetter.ActualValue,
            ExcessValue = request.WarningLetter.ExcessValue,
            FuelPrice = fuelPrice,
            ExcessCost = ResolveExcessCost(request.WarningLetter.ExcessCost, request.WarningLetter.ExcessValue, fuelPrice),
            IssuedByUserId = userId,
            IssuedByName = resolvedIssuedByName,
            IssuedByTitle = resolvedIssuedByTitle,
            EmailRecipient = string.IsNullOrWhiteSpace(request.WarningLetter.EmailRecipient) ? employee.Email : request.WarningLetter.EmailRecipient.Trim(),
            SignatureRequestRecipientUserId = string.IsNullOrWhiteSpace(request.WarningLetter.SignatureRequestRecipientUserId) ? null : request.WarningLetter.SignatureRequestRecipientUserId.Trim(),
            SignatureRequestCcUserIds = JoinDelimitedValues(request.WarningLetter.SignatureRequestCcUserIds),
            Notes = string.IsNullOrWhiteSpace(request.WarningLetter.Notes) ? null : request.WarningLetter.Notes.Trim(),
            Status = global::FMS.Domain.Entities.Features.WarningLetterManagement.WarningLetterStatus.Draft,
            DateCreated = DateTime.UtcNow,
            CreatedBy = request.CreatedBy
        };

        await EnsureEmployeeVehicleAssignmentAsync(vehicle, employee.Id, request.CreatedBy, cancellationToken);

        _context.WarningLetters.Add(warningLetter);
        await _context.SaveChangesAsync(cancellationToken);

        await TryUpdateGpsGateDriverNameAsync(vehicle.VehicleId, employee.Id, cancellationToken);

        var response = FMSResponse<WarningLetterDto>.Success(MapToDto(warningLetter, employee, vehicle, site), "Warning letter created successfully");
        response.StatusCode = 201;
        return response;
    }

    private static List<string> ValidateRequest(CreateWarningLetterDto dto, string createdBy, string resolvedIssuedByName)
    {
        var errors = new List<string>();

        if (dto.EmployeeId <= 0) errors.Add("EmployeeId is required.");
        if (dto.VehicleId <= 0) errors.Add("VehicleId is required.");
        if (dto.SiteId <= 0) errors.Add("SiteId is required.");
        if (string.IsNullOrWhiteSpace(resolvedIssuedByName)) errors.Add("IssuedByName is required.");
        if (string.IsNullOrWhiteSpace(createdBy)) errors.Add("CreatedBy is required.");
        if (dto.PeriodEnd < dto.PeriodStart) errors.Add("PeriodEnd cannot be earlier than PeriodStart.");
        if (dto.ExpectedValue < 0) errors.Add("ExpectedValue cannot be negative.");
        if (dto.ActualValue < 0) errors.Add("ActualValue cannot be negative.");
        if (dto.ExcessValue < 0) errors.Add("ExcessValue cannot be negative.");
        if (dto.FuelPrice < 0) errors.Add("FuelPrice cannot be negative.");
        if (dto.ExcessCost < 0) errors.Add("ExcessCost cannot be negative.");

        return errors;
    }

    private static string ResolveIssuerName(string? configuredIssuerName, string? requestedIssuerName)
    {
        if (!string.IsNullOrWhiteSpace(configuredIssuerName))
        {
            return configuredIssuerName.Trim();
        }

        return requestedIssuerName?.Trim() ?? string.Empty;
    }

    private static string? ResolveIssuerTitle(string? configuredIssuerTitle, string? requestedIssuerTitle)
    {
        if (!string.IsNullOrWhiteSpace(configuredIssuerTitle))
        {
            return configuredIssuerTitle.Trim();
        }

        return string.IsNullOrWhiteSpace(requestedIssuerTitle) ? null : requestedIssuerTitle.Trim();
    }

    internal static decimal? ResolveExcessCost(decimal? providedValue, decimal? excessValue, decimal? fuelPrice)
    {
        if (providedValue.HasValue)
        {
            return providedValue.Value;
        }

        if (excessValue.HasValue && fuelPrice.HasValue)
        {
            return Math.Round(excessValue.Value * fuelPrice.Value, 2, MidpointRounding.AwayFromZero);
        }

        return null;
    }

    private async Task EnsureEmployeeVehicleAssignmentAsync(
        VehicleEntity vehicle,
        int employeeId,
        string modifiedBy,
        CancellationToken cancellationToken)
    {
        if (vehicle.DefaultEmployeeId != employeeId)
        {
            vehicle.DefaultEmployeeId = employeeId;
            vehicle.DateModified = DateTime.UtcNow;
            vehicle.ModifiedBy = modifiedBy;
        }

        var assignmentExists = await _context.EmployeeVehicle
            .AsNoTracking()
            .AnyAsync(
                employeeVehicle => employeeVehicle.EmployeeId == employeeId && employeeVehicle.VehicleId == vehicle.VehicleId,
                cancellationToken);

        if (!assignmentExists)
        {
            _context.EmployeeVehicle.Add(new EmployeeVehicle
            {
                EmployeeId = employeeId,
                VehicleId = vehicle.VehicleId,
            });
        }
    }

    private async Task TryUpdateGpsGateDriverNameAsync(int vehicleId, int employeeId, CancellationToken cancellationToken)
    {
        if (_driverNameService == null)
        {
            return;
        }

        try
        {
            var result = await _driverNameService.UpdateDriverNameAsync(vehicleId, employeeId, cancellationToken);

            if (result.IsSuccess)
            {
                _logger.LogInformation(
                    "Updated GPSGate DriverName for vehicle {VehicleId} during warning letter creation with employee {EmployeeId}: {Message}",
                    vehicleId,
                    employeeId,
                    result.Message);
            }
            else
            {
                _logger.LogWarning(
                    "Failed to update GPSGate DriverName for vehicle {VehicleId} during warning letter creation with employee {EmployeeId}: {Message}",
                    vehicleId,
                    employeeId,
                    result.Message);
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(
                ex,
                "Error updating GPSGate DriverName for vehicle {VehicleId} during warning letter creation with employee {EmployeeId}",
                vehicleId,
                employeeId);
        }
    }

    internal static WarningLetterDto MapToDto(WarningLetterEntity entity, EmployeeEntity employee, VehicleEntity vehicle, SiteEntity site)
    {
        return new WarningLetterDto
        {
            Id = entity.Id,
            LetterType = entity.LetterType,
            EmployeeId = entity.EmployeeId,
            EmployeeName = employee.FullName,
            EmployeeWorkNo = employee.EmployeeWorkNo,
            EmployeeEmail = employee.Email,
            Position = employee.Position,
            VehicleId = entity.VehicleId,
            VehicleHyoungNo = vehicle.HyoungNo,
            NumberPlate = vehicle.NumberPlate,
            SiteId = entity.SiteId,
            SiteName = site.Name,
            LetterDate = entity.LetterDate,
            PeriodStart = entity.PeriodStart,
            PeriodEnd = entity.PeriodEnd,
            ViolationSummary = entity.ViolationSummary,
            ExpectedValue = entity.ExpectedValue,
            ActualValue = entity.ActualValue,
            ExcessValue = entity.ExcessValue,
            FuelPrice = entity.FuelPrice,
            ExcessCost = entity.ExcessCost,
            IssuedByUserId = entity.IssuedByUserId,
            IssuedByName = entity.IssuedByName,
            IssuedByTitle = entity.IssuedByTitle,
            PdfFilePath = entity.PdfFilePath,
            EmailSentAt = entity.EmailSentAt,
            EmailRecipient = entity.EmailRecipient,
            SignatureRequestRecipientUserId = entity.SignatureRequestRecipientUserId,
            SignatureRequestRecipient = entity.SignatureRequestRecipient,
            SignatureRequestCcUserIds = SplitDelimitedValues(entity.SignatureRequestCcUserIds),
            SignatureRequestCcRecipients = SplitDelimitedValues(entity.SignatureRequestCcRecipients),
            SignatureRequestedAt = entity.SignatureRequestedAt,
            SignatureRequestedBy = entity.SignatureRequestedBy,
            ApproveLetterFileName = entity.ApproveLetterFileName,
            ApproveLetterStoredFileName = entity.ApproveLetterStoredFileName,
            ApproveLetterFilePath = entity.ApproveLetterFilePath,
            ApproveLetterContentType = entity.ApproveLetterContentType,
            ApproveLetterFileSize = entity.ApproveLetterFileSize,
            ApproveLetterUploadedAt = entity.ApproveLetterUploadedAt,
            ApproveLetterUploadedBy = entity.ApproveLetterUploadedBy,
            SignedCopyFileName = entity.SignedCopyFileName,
            SignedCopyStoredFileName = entity.SignedCopyStoredFileName,
            SignedCopyFilePath = entity.SignedCopyFilePath,
            SignedCopyContentType = entity.SignedCopyContentType,
            SignedCopyFileSize = entity.SignedCopyFileSize,
            SignedCopyUploadedAt = entity.SignedCopyUploadedAt,
            SignedCopyUploadedBy = entity.SignedCopyUploadedBy,
            Status = entity.Status,
            WorkflowStage = WarningLetterWorkflowStageResolver.Resolve(entity),
            EmployeeAcknowledgedAt = entity.EmployeeAcknowledgedAt,
            Notes = entity.Notes,
            DateCreated = entity.DateCreated,
            DateModified = entity.DateModified,
            CreatedBy = entity.CreatedBy,
            ModifiedBy = entity.ModifiedBy
        };
    }

    internal static List<string> SplitDelimitedValues(string? value)
    {
        return string.IsNullOrWhiteSpace(value)
            ? new List<string>()
            : value.Split(';', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries).ToList();
    }

    internal static string? JoinDelimitedValues(IEnumerable<string>? values)
    {
        if (values == null)
        {
            return null;
        }

        var cleanedValues = values
            .Where(value => !string.IsNullOrWhiteSpace(value))
            .Select(value => value.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        return cleanedValues.Count == 0 ? null : string.Join(';', cleanedValues);
    }
}