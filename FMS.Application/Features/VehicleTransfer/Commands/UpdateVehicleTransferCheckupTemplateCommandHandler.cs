/**
 * File: UpdateVehicleTransferCheckupTemplateCommandHandler.cs
 * Purpose: Handles updates to vehicle transfer checkup template rows.
 * Dependencies: EF Core, GpsdataContext, MediatR
 * Last Modified: 2026-02-26
 *
 * Key Components:
 * - Handle(): Validates references and updates criteria/order/metadata for template rows.
 */
using System;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.VehicleTransfer.DTOs;
using FMS.Application.Features.VehicleTransfer.Constants;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FMS.Application.Features.VehicleTransfer.Commands;

public class UpdateVehicleTransferCheckupTemplateCommandHandler : IRequestHandler<UpdateVehicleTransferCheckupTemplateCommand, FMSResponse<VehicleTransferCheckupTemplateItemDTO>>
{
    private readonly GpsdataContext _context;

    public UpdateVehicleTransferCheckupTemplateCommandHandler(GpsdataContext context)
    {
        _context = context;
    }

    public async Task<FMSResponse<VehicleTransferCheckupTemplateItemDTO>> Handle(UpdateVehicleTransferCheckupTemplateCommand request, CancellationToken cancellationToken)
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

            var entity = await _context.VehicleTransferCheckupTemplates
                .Include(template => template.VehicleType)
                .Include(template => template.VehicleModel)
                .FirstOrDefaultAsync(template => template.Id == request.Id, cancellationToken);

            if (entity == null)
            {
                return FMSResponse<VehicleTransferCheckupTemplateItemDTO>.Failed($"Checkup template item {request.Id} was not found", "NOT_FOUND");
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

            entity.SerialNo = item.SerialNo ?? entity.SerialNo;
            entity.Description = description;
            entity.CheckType = CheckTypeConstants.Normalise(item.CheckType);
            entity.VehicleTypeId = item.VehicleTypeId;
            entity.VehicleModelId = item.VehicleModelId;
            entity.HasGps = null;
            entity.SortOrder = item.SortOrder ?? entity.SortOrder;
            entity.IsActive = item.IsActive ?? entity.IsActive;
            entity.ModifiedBy = request.UserId;
            entity.DateModified = DateTime.UtcNow;

            await _context.SaveChangesAsync(cancellationToken);

            var response = new VehicleTransferCheckupTemplateItemDTO
            {
                Id = entity.Id,
                SerialNo = entity.SerialNo,
                Description = entity.Description,
                CheckType = entity.CheckType,
                VehicleTypeId = entity.VehicleTypeId,
                VehicleTypeName = entity.VehicleType != null ? entity.VehicleType.Name : null,
                VehicleModelId = entity.VehicleModelId,
                VehicleModelName = entity.VehicleModel != null ? entity.VehicleModel.Name : null,
                HasGps = entity.HasGps,
                SortOrder = entity.SortOrder,
                IsActive = entity.IsActive,
                CreatedBy = entity.CreatedBy,
                ModifiedBy = entity.ModifiedBy,
                DateCreated = entity.DateCreated,
                DateModified = entity.DateModified
            };

            return FMSResponse<VehicleTransferCheckupTemplateItemDTO>.Success(response, "Checkup template item updated successfully");
        }
        catch (Exception ex)
        {
            return FMSResponse<VehicleTransferCheckupTemplateItemDTO>.Failed($"Error updating checkup template item: {ex.Message}");
        }
    }
}
