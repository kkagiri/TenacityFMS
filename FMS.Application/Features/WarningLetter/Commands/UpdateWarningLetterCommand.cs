/**
 * File: UpdateWarningLetterCommand.cs
 * Purpose: Updates editable fields on draft warning letters.
 * Dependencies: MediatR, GpsdataContext, FMSResponse, WarningLetter DTO/entity types
 * Last Modified: 2026-04-06
 */
using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.CommonInterface;
using FMS.Application.Features.WarningLetter.DTOs;
using FMS.Application.Features.WarningLetter.Queries;
using FMS.Application.Features.WarningLetter.Services;
using FMS.Application.Services.Configuration;
using FMS.Domain.Entities;
using FMS.Domain.Entities.Features.WarningLetterManagement;
using VehicleEntity = global::FMS.Domain.Entities.Vehicle;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.WarningLetter.Commands;

public class UpdateWarningLetterCommand : IRequest<FMSResponse<WarningLetterDto>>
{
    public UpdateWarningLetterDto WarningLetter { get; set; } = new();
    public string ModifiedBy { get; set; } = string.Empty;
}

public class UpdateWarningLetterCommandHandler : IRequestHandler<UpdateWarningLetterCommand, FMSResponse<WarningLetterDto>>
{
    private readonly GpsdataContext _context;
    private readonly ISystemConfigurationService _systemConfigurationService;
    private readonly ILogger<UpdateWarningLetterCommandHandler> _logger;
    private readonly IGPSGateDriverNameService? _driverNameService;

    public UpdateWarningLetterCommandHandler(
        GpsdataContext context,
        ISystemConfigurationService systemConfigurationService,
        ILogger<UpdateWarningLetterCommandHandler> logger,
        IGPSGateDriverNameService? driverNameService = null)
    {
        _context = context;
        _systemConfigurationService = systemConfigurationService;
        _logger = logger;
        _driverNameService = driverNameService;
    }

    public async Task<FMSResponse<WarningLetterDto>> Handle(UpdateWarningLetterCommand request, CancellationToken cancellationToken)
    {
        var configuredIssuerName = await _systemConfigurationService.GetConfigurationValueAsync(
            GetWarningLetterSettingsQueryHandler.IssuerNameConfigKey,
            cancellationToken);
        var configuredIssuerTitle = await _systemConfigurationService.GetConfigurationValueAsync(
            GetWarningLetterSettingsQueryHandler.IssuerTitleConfigKey,
            cancellationToken);

        var resolvedIssuedByName = ResolveIssuerName(configuredIssuerName, request.WarningLetter.IssuedByName);
        var resolvedIssuedByTitle = ResolveIssuerTitle(configuredIssuerTitle, request.WarningLetter.IssuedByTitle);

        var validationErrors = ValidateRequest(request.WarningLetter, request.ModifiedBy, resolvedIssuedByName);
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

        var warningLetter = await _context.WarningLetters.FirstOrDefaultAsync(w => w.Id == request.WarningLetter.Id, cancellationToken);
        if (warningLetter == null)
        {
            return FMSResponse<WarningLetterDto>.NotFound("WARNING_LETTER_NOT_FOUND", "Warning letter not found");
        }

        if (warningLetter.Status != WarningLetterStatus.Draft)
        {
            return FMSResponse<WarningLetterDto>.BusinessLogicError("WARNING_LETTER_NOT_EDITABLE", "Only draft warning letters can be updated.");
        }

        var employee = await _context.Employees.FirstOrDefaultAsync(e => e.Id == request.WarningLetter.EmployeeId, cancellationToken);
        if (employee == null)
        {
            return FMSResponse<WarningLetterDto>.NotFound("WARNING_LETTER_EMPLOYEE_NOT_FOUND", "Employee not found");
        }

        if (string.IsNullOrWhiteSpace(employee.Position))
        {
            return FMSResponse<WarningLetterDto>.ValidationFailed(new List<string> { "Employee position is required before updating a warning letter." });
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
            ? request.ModifiedBy
            : request.WarningLetter.IssuedByUserId;

        var issuedByExists = await _context.Users.AnyAsync(u => u.Id == userId, cancellationToken);
        if (!issuedByExists)
        {
            return FMSResponse<WarningLetterDto>.NotFound("WARNING_LETTER_ISSUER_NOT_FOUND", "Issuing user not found");
        }

        warningLetter.LetterType = request.WarningLetter.LetterType;
        warningLetter.EmployeeId = request.WarningLetter.EmployeeId;
        warningLetter.VehicleId = request.WarningLetter.VehicleId;
        warningLetter.SiteId = request.WarningLetter.SiteId;
        warningLetter.LetterDate = request.WarningLetter.LetterDate;
        warningLetter.PeriodStart = request.WarningLetter.PeriodStart;
        warningLetter.PeriodEnd = request.WarningLetter.PeriodEnd;
        warningLetter.ViolationSummary = resolvedViolationSummary;
        warningLetter.ExpectedValue = request.WarningLetter.ExpectedValue;
        warningLetter.ActualValue = request.WarningLetter.ActualValue;
        warningLetter.ExcessValue = request.WarningLetter.ExcessValue;
        var fuelPrice = request.WarningLetter.FuelPrice;
        if (request.WarningLetter.LetterType == WarningLetterType.ExcessFuelConsumption)
        {
            fuelPrice = await _systemConfigurationService.GetDecimalAsync(
                GetWarningLetterSettingsQueryHandler.FuelPricePerLitreConfigKey, 0m, cancellationToken);
        }
        warningLetter.FuelPrice = fuelPrice;
        warningLetter.ExcessCost = CreateWarningLetterCommandHandler.ResolveExcessCost(request.WarningLetter.ExcessCost, request.WarningLetter.ExcessValue, fuelPrice);
        warningLetter.IssuedByUserId = userId;
        warningLetter.IssuedByName = resolvedIssuedByName;
        warningLetter.IssuedByTitle = resolvedIssuedByTitle;
        warningLetter.EmailRecipient = string.IsNullOrWhiteSpace(request.WarningLetter.EmailRecipient) ? employee.Email : request.WarningLetter.EmailRecipient.Trim();
        warningLetter.SignatureRequestRecipientUserId = string.IsNullOrWhiteSpace(request.WarningLetter.SignatureRequestRecipientUserId) ? null : request.WarningLetter.SignatureRequestRecipientUserId.Trim();
        warningLetter.SignatureRequestCcUserIds = CreateWarningLetterCommandHandler.JoinDelimitedValues(request.WarningLetter.SignatureRequestCcUserIds);
        warningLetter.Notes = string.IsNullOrWhiteSpace(request.WarningLetter.Notes) ? null : request.WarningLetter.Notes.Trim();
        warningLetter.DateModified = DateTime.UtcNow;
        warningLetter.ModifiedBy = request.ModifiedBy;

        await EnsureEmployeeVehicleAssignmentAsync(vehicle, employee.Id, request.ModifiedBy, cancellationToken);

        await _context.SaveChangesAsync(cancellationToken);

        await TryUpdateGpsGateDriverNameAsync(vehicle.VehicleId, employee.Id, cancellationToken);

        return FMSResponse<WarningLetterDto>.Success(CreateWarningLetterCommandHandler.MapToDto(warningLetter, employee, vehicle, site), "Warning letter updated successfully");
    }

    private static List<string> ValidateRequest(UpdateWarningLetterDto dto, string modifiedBy, string resolvedIssuedByName)
    {
        var errors = new List<string>();

        if (dto.Id <= 0) errors.Add("Id is required.");
        if (dto.EmployeeId <= 0) errors.Add("EmployeeId is required.");
        if (dto.VehicleId <= 0) errors.Add("VehicleId is required.");
        if (dto.SiteId <= 0) errors.Add("SiteId is required.");
        if (string.IsNullOrWhiteSpace(resolvedIssuedByName)) errors.Add("IssuedByName is required.");
        if (string.IsNullOrWhiteSpace(modifiedBy)) errors.Add("ModifiedBy is required.");
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
                    "Updated GPSGate DriverName for vehicle {VehicleId} during warning letter update with employee {EmployeeId}: {Message}",
                    vehicleId,
                    employeeId,
                    result.Message);
            }
            else
            {
                _logger.LogWarning(
                    "Failed to update GPSGate DriverName for vehicle {VehicleId} during warning letter update with employee {EmployeeId}: {Message}",
                    vehicleId,
                    employeeId,
                    result.Message);
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(
                ex,
                "Error updating GPSGate DriverName for vehicle {VehicleId} during warning letter update with employee {EmployeeId}",
                vehicleId,
                employeeId);
        }
    }
}