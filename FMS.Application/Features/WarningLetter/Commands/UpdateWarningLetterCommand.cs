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
using FMS.Application.Features.WarningLetter.DTOs;
using FMS.Domain.Entities.Features.WarningLetterManagement;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FMS.Application.Features.WarningLetter.Commands;

public class UpdateWarningLetterCommand : IRequest<FMSResponse<WarningLetterDto>>
{
    public UpdateWarningLetterDto WarningLetter { get; set; } = new();
    public string ModifiedBy { get; set; } = string.Empty;
}

public class UpdateWarningLetterCommandHandler : IRequestHandler<UpdateWarningLetterCommand, FMSResponse<WarningLetterDto>>
{
    private readonly GpsdataContext _context;

    public UpdateWarningLetterCommandHandler(GpsdataContext context)
    {
        _context = context;
    }

    public async Task<FMSResponse<WarningLetterDto>> Handle(UpdateWarningLetterCommand request, CancellationToken cancellationToken)
    {
        var validationErrors = ValidateRequest(request.WarningLetter, request.ModifiedBy);
        if (validationErrors.Count > 0)
        {
            return FMSResponse<WarningLetterDto>.ValidationFailed(validationErrors);
        }

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

        if (employee.SiteId.HasValue && employee.SiteId.Value != request.WarningLetter.SiteId)
        {
            return FMSResponse<WarningLetterDto>.ValidationFailed(new List<string> { "Employee does not belong to the selected site." });
        }

        if (vehicle.WorkingSiteId.HasValue && vehicle.WorkingSiteId.Value != request.WarningLetter.SiteId)
        {
            return FMSResponse<WarningLetterDto>.ValidationFailed(new List<string> { "Vehicle does not belong to the selected site." });
        }

        warningLetter.LetterType = request.WarningLetter.LetterType;
        warningLetter.EmployeeId = request.WarningLetter.EmployeeId;
        warningLetter.VehicleId = request.WarningLetter.VehicleId;
        warningLetter.SiteId = request.WarningLetter.SiteId;
        warningLetter.LetterDate = request.WarningLetter.LetterDate;
        warningLetter.PeriodStart = request.WarningLetter.PeriodStart;
        warningLetter.PeriodEnd = request.WarningLetter.PeriodEnd;
        warningLetter.ViolationSummary = request.WarningLetter.ViolationSummary.Trim();
        warningLetter.ExpectedValue = request.WarningLetter.ExpectedValue;
        warningLetter.ActualValue = request.WarningLetter.ActualValue;
        warningLetter.ExcessValue = request.WarningLetter.ExcessValue;
        warningLetter.FuelPrice = request.WarningLetter.FuelPrice;
        warningLetter.ExcessCost = CreateWarningLetterCommandHandler.ResolveExcessCost(request.WarningLetter.ExcessCost, request.WarningLetter.ExcessValue, request.WarningLetter.FuelPrice);
        warningLetter.IssuedByUserId = userId;
        warningLetter.IssuedByName = request.WarningLetter.IssuedByName.Trim();
        warningLetter.IssuedByTitle = string.IsNullOrWhiteSpace(request.WarningLetter.IssuedByTitle) ? null : request.WarningLetter.IssuedByTitle.Trim();
        warningLetter.EmailRecipient = string.IsNullOrWhiteSpace(request.WarningLetter.EmailRecipient) ? employee.Email : request.WarningLetter.EmailRecipient.Trim();
        warningLetter.Notes = string.IsNullOrWhiteSpace(request.WarningLetter.Notes) ? null : request.WarningLetter.Notes.Trim();
        warningLetter.DateModified = DateTime.UtcNow;
        warningLetter.ModifiedBy = request.ModifiedBy;

        await _context.SaveChangesAsync(cancellationToken);

        return FMSResponse<WarningLetterDto>.Success(CreateWarningLetterCommandHandler.MapToDto(warningLetter, employee, vehicle, site), "Warning letter updated successfully");
    }

    private static List<string> ValidateRequest(UpdateWarningLetterDto dto, string modifiedBy)
    {
        var errors = new List<string>();

        if (dto.Id <= 0) errors.Add("Id is required.");
        if (dto.EmployeeId <= 0) errors.Add("EmployeeId is required.");
        if (dto.VehicleId <= 0) errors.Add("VehicleId is required.");
        if (dto.SiteId <= 0) errors.Add("SiteId is required.");
        if (string.IsNullOrWhiteSpace(dto.ViolationSummary)) errors.Add("ViolationSummary is required.");
        if (string.IsNullOrWhiteSpace(dto.IssuedByName)) errors.Add("IssuedByName is required.");
        if (string.IsNullOrWhiteSpace(modifiedBy)) errors.Add("ModifiedBy is required.");
        if (dto.PeriodEnd < dto.PeriodStart) errors.Add("PeriodEnd cannot be earlier than PeriodStart.");
        if (dto.ExpectedValue < 0) errors.Add("ExpectedValue cannot be negative.");
        if (dto.ActualValue < 0) errors.Add("ActualValue cannot be negative.");
        if (dto.ExcessValue < 0) errors.Add("ExcessValue cannot be negative.");
        if (dto.FuelPrice < 0) errors.Add("FuelPrice cannot be negative.");
        if (dto.ExcessCost < 0) errors.Add("ExcessCost cannot be negative.");

        return errors;
    }
}