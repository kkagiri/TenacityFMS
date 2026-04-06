/**
 * File: CreateWarningLetterCommand.cs
 * Purpose: Creates draft warning letters after validating related employee, vehicle, and site data.
 * Dependencies: MediatR, GpsdataContext, FMSResponse, WarningLetter DTOs/entities
 * Last Modified: 2026-04-06
 */
using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.WarningLetter.DTOs;
using FMS.Domain.Entities;
using EmployeeEntity = FMS.Domain.Entities.Employee;
using SiteEntity = FMS.Domain.Entities.Site;
using VehicleEntity = FMS.Domain.Entities.Vehicle;
using WarningLetterEntity = FMS.Domain.Entities.Features.WarningLetterManagement.WarningLetter;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FMS.Application.Features.WarningLetter.Commands;

public class CreateWarningLetterCommand : IRequest<FMSResponse<WarningLetterDto>>
{
    public CreateWarningLetterDto WarningLetter { get; set; } = new();
    public string CreatedBy { get; set; } = string.Empty;
}

public class CreateWarningLetterCommandHandler : IRequestHandler<CreateWarningLetterCommand, FMSResponse<WarningLetterDto>>
{
    private readonly GpsdataContext _context;

    public CreateWarningLetterCommandHandler(GpsdataContext context)
    {
        _context = context;
    }

    public async Task<FMSResponse<WarningLetterDto>> Handle(CreateWarningLetterCommand request, CancellationToken cancellationToken)
    {
        var validationErrors = ValidateRequest(request.WarningLetter, request.CreatedBy);
        if (validationErrors.Count > 0)
        {
            return FMSResponse<WarningLetterDto>.ValidationFailed(validationErrors);
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
            ? request.CreatedBy
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

        var warningLetter = new WarningLetterEntity
        {
            LetterType = request.WarningLetter.LetterType,
            EmployeeId = request.WarningLetter.EmployeeId,
            VehicleId = request.WarningLetter.VehicleId,
            SiteId = request.WarningLetter.SiteId,
            LetterDate = request.WarningLetter.LetterDate,
            PeriodStart = request.WarningLetter.PeriodStart,
            PeriodEnd = request.WarningLetter.PeriodEnd,
            ViolationSummary = request.WarningLetter.ViolationSummary.Trim(),
            ExpectedValue = request.WarningLetter.ExpectedValue,
            ActualValue = request.WarningLetter.ActualValue,
            ExcessValue = request.WarningLetter.ExcessValue,
            FuelPrice = request.WarningLetter.FuelPrice,
            ExcessCost = ResolveExcessCost(request.WarningLetter.ExcessCost, request.WarningLetter.ExcessValue, request.WarningLetter.FuelPrice),
            IssuedByUserId = userId,
            IssuedByName = request.WarningLetter.IssuedByName.Trim(),
            IssuedByTitle = string.IsNullOrWhiteSpace(request.WarningLetter.IssuedByTitle) ? null : request.WarningLetter.IssuedByTitle.Trim(),
            EmailRecipient = string.IsNullOrWhiteSpace(request.WarningLetter.EmailRecipient) ? employee.Email : request.WarningLetter.EmailRecipient.Trim(),
            Notes = string.IsNullOrWhiteSpace(request.WarningLetter.Notes) ? null : request.WarningLetter.Notes.Trim(),
            Status = FMS.Domain.Entities.Features.WarningLetterManagement.WarningLetterStatus.Draft,
            DateCreated = DateTime.UtcNow,
            CreatedBy = request.CreatedBy
        };

        _context.WarningLetters.Add(warningLetter);
        await _context.SaveChangesAsync(cancellationToken);

        var response = FMSResponse<WarningLetterDto>.Success(MapToDto(warningLetter, employee, vehicle, site), "Warning letter created successfully");
        response.StatusCode = 201;
        return response;
    }

    private static List<string> ValidateRequest(CreateWarningLetterDto dto, string createdBy)
    {
        var errors = new List<string>();

        if (dto.EmployeeId <= 0) errors.Add("EmployeeId is required.");
        if (dto.VehicleId <= 0) errors.Add("VehicleId is required.");
        if (dto.SiteId <= 0) errors.Add("SiteId is required.");
        if (string.IsNullOrWhiteSpace(dto.ViolationSummary)) errors.Add("ViolationSummary is required.");
        if (string.IsNullOrWhiteSpace(dto.IssuedByName)) errors.Add("IssuedByName is required.");
        if (string.IsNullOrWhiteSpace(createdBy)) errors.Add("CreatedBy is required.");
        if (dto.PeriodEnd < dto.PeriodStart) errors.Add("PeriodEnd cannot be earlier than PeriodStart.");
        if (dto.ExpectedValue < 0) errors.Add("ExpectedValue cannot be negative.");
        if (dto.ActualValue < 0) errors.Add("ActualValue cannot be negative.");
        if (dto.ExcessValue < 0) errors.Add("ExcessValue cannot be negative.");
        if (dto.FuelPrice < 0) errors.Add("FuelPrice cannot be negative.");
        if (dto.ExcessCost < 0) errors.Add("ExcessCost cannot be negative.");

        return errors;
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
            Trade = employee.Trade,
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
            Status = entity.Status,
            EmployeeAcknowledgedAt = entity.EmployeeAcknowledgedAt,
            Notes = entity.Notes,
            DateCreated = entity.DateCreated,
            DateModified = entity.DateModified,
            CreatedBy = entity.CreatedBy,
            ModifiedBy = entity.ModifiedBy
        };
    }
}