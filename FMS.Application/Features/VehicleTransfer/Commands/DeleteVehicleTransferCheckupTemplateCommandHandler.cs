/**
 * File: DeleteVehicleTransferCheckupTemplateCommandHandler.cs
 * Purpose: Handles soft-delete behavior for vehicle transfer checkup template rows.
 * Dependencies: EF Core, GpsdataContext, MediatR
 * Last Modified: 2026-02-26
 *
 * Key Components:
 * - Handle(): Marks row inactive and stamps modification metadata.
 */
using System;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FMS.Application.Features.VehicleTransfer.Commands;

public class DeleteVehicleTransferCheckupTemplateCommandHandler : IRequestHandler<DeleteVehicleTransferCheckupTemplateCommand, FMSResponse<bool>>
{
    private readonly GpsdataContext _context;

    public DeleteVehicleTransferCheckupTemplateCommandHandler(GpsdataContext context)
    {
        _context = context;
    }

    public async Task<FMSResponse<bool>> Handle(DeleteVehicleTransferCheckupTemplateCommand request, CancellationToken cancellationToken)
    {
        try
        {
            var entity = await _context.VehicleTransferCheckupTemplates
                .FirstOrDefaultAsync(template => template.Id == request.Id, cancellationToken);

            if (entity == null)
            {
                return FMSResponse<bool>.Failed($"Checkup template item {request.Id} was not found", "NOT_FOUND");
            }

            entity.IsActive = false;
            entity.ModifiedBy = request.UserId;
            entity.DateModified = DateTime.UtcNow;

            await _context.SaveChangesAsync(cancellationToken);
            return FMSResponse<bool>.Success(true, "Checkup template item removed successfully");
        }
        catch (Exception ex)
        {
            return FMSResponse<bool>.Failed($"Error removing checkup template item: {ex.Message}");
        }
    }
}
