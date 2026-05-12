/**
 * File: DeleteVehicleTransferCheckupTemplateCommand.cs
 * Purpose: Command contract for soft-removing a checkup template row from active use.
 * Dependencies: MediatR, FMSResponse
 * Last Modified: 2026-02-26
 *
 * Key Components:
 * - DeleteVehicleTransferCheckupTemplateCommand: Carries target id and user context.
 */
using FMS.Application.Common;
using MediatR;
using FMS.Persistence.DataAccess;
using Microsoft.EntityFrameworkCore;
using System.Threading.Tasks;
using System.Threading;
using System;

namespace FMS.Application.Features.VehicleTransfer.Commands;

public record DeleteVehicleTransferCheckupTemplateCommand(
    int Id,
    string? UserId
) : IRequest<FMSResponse<bool>>;

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
