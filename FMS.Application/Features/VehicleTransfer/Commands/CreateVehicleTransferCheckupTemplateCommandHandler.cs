/**
 * File: CreateVehicleTransferCheckupTemplateCommandHandler.cs
 * Purpose: Handles creation of admin-defined vehicle transfer checkup template rows.
 * Dependencies: EF Core, GpsdataContext, MediatR
 * Last Modified: 2026-02-26
 *
 * Key Components:
 * - Handle(): Validates criteria references, assigns ordering defaults, persists new template row.
 */
using System;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.VehicleTransfer.DTOs;
using FMS.Application.Features.VehicleTransfer.Constants;
using FMS.Persistence.DataAccess;
using FMS.Persistence.Models;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FMS.Application.Features.VehicleTransfer.Commands;

public class CreateVehicleTransferCheckupTemplateCommandHandler : IRequestHandler<CreateVehicleTransferCheckupTemplateCommand, FMSResponse<VehicleTransferCheckupTemplateItemDTO>>
{
    private readonly GpsdataContext _context;

    public CreateVehicleTransferCheckupTemplateCommandHandler(GpsdataContext context)
    {
        _context = context;
    }

    public async Task<FMSResponse<VehicleTransferCheckupTemplateItemDTO>> Handle(CreateVehicleTransferCheckupTemplateCommand request, CancellationToken cancellationToken)
    {
        try
        {
            var item = request.Item;
            var description = item.Description?.Trim();
            if (string.IsNullOrWhiteSpace(description))
            {
                return FMSResponse<VehicleTransferCheckupTemplateItemDTO>.Failed("Description is required", "VALIDATION_ERROR");
            }

            if (!CheckTypeConstants.IsValid(item.CheckType))
            {
                return FMSResponse<VehicleTransferCheckupTemplateItemDTO>.Failed(
                    $"Invalid check type '{item.CheckType}'. Allowed values: {string.Join(", ", CheckTypeConstants.All)}",
                    "VALIDATION_ERROR");
            }

            if (item.VehicleTypeId.HasValue)
            {
                var vehicleTypeExists = await _context.Vehicletypes.AnyAsync(type => type.Id == item.VehicleTypeId.Value, cancellationToken);
                if (!vehicleTypeExists)
                {
                    return FMSResponse<VehicleTransferCheckupTemplateItemDTO>.Failed($"Vehicle type {item.VehicleTypeId.Value} was not found", "NOT_FOUND");
                }
            }

            if (item.VehicleModelId.HasValue)
            {
                var vehicleModelExists = await _context.Vehiclemodels.AnyAsync(model => model.Id == item.VehicleModelId.Value, cancellationToken);
                if (!vehicleModelExists)
                {
                    return FMSResponse<VehicleTransferCheckupTemplateItemDTO>.Failed($"Vehicle model {item.VehicleModelId.Value} was not found", "NOT_FOUND");
                }
            }

            var maxSortOrder = await _context.VehicleTransferCheckupTemplates.MaxAsync(existing => (int?)existing.SortOrder, cancellationToken) ?? 0;
            var nextSortOrder = item.SortOrder ?? (maxSortOrder + 1);
            var nextSerialNo = item.SerialNo ?? nextSortOrder;

            var entity = new VehicleTransferCheckupTemplate
            {
                SerialNo = nextSerialNo,
                Description = description,
                CheckType = CheckTypeConstants.Normalise(item.CheckType),
                VehicleTypeId = item.VehicleTypeId,
                VehicleModelId = item.VehicleModelId,
                HasGps = null,
                SortOrder = nextSortOrder,
                IsActive = item.IsActive ?? true,
                CreatedBy = request.UserId,
                DateCreated = DateTime.UtcNow
            };

            _context.VehicleTransferCheckupTemplates.Add(entity);
            await _context.SaveChangesAsync(cancellationToken);

            var response = new VehicleTransferCheckupTemplateItemDTO
            {
                Id = entity.Id,
                SerialNo = entity.SerialNo,
                Description = entity.Description,
                CheckType = entity.CheckType,
                VehicleTypeId = entity.VehicleTypeId,
                VehicleModelId = entity.VehicleModelId,
                HasGps = entity.HasGps,
                SortOrder = entity.SortOrder,
                IsActive = entity.IsActive,
                CreatedBy = entity.CreatedBy,
                DateCreated = entity.DateCreated
            };

            return FMSResponse<VehicleTransferCheckupTemplateItemDTO>.Success(response, "Checkup template item created successfully");
        }
        catch (Exception ex)
        {
            return FMSResponse<VehicleTransferCheckupTemplateItemDTO>.Failed($"Error creating checkup template item: {ex.Message}");
        }
    }
}
