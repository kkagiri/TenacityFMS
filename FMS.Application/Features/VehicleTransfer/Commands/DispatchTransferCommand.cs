/**
 * File: DispatchTransferCommand.cs
 * Purpose: Command contract for dispatching an approved vehicle transfer (Approved → InTransit).
 * Dependencies: FMSResponse, VehicleTransferDTO
 * Last Modified: 2026-03-02
 *
 * Key Components:
 * - DispatchTransferCommand: Carries transfer id and sender user id.
 */
using FMS.Application.Common;
using FMS.Application.Features.VehicleTransfer.DTOs;
using MediatR;
using AutoMapper;
using FMS.Application.Features.VehicleTransfer.Services;
using FMS.Persistence.DataAccess;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System.Threading.Tasks;
using System.Threading;
using System;

namespace FMS.Application.Features.VehicleTransfer.Commands;

public record DispatchTransferCommand(
    int TransferId,
    string? UserId
) : IRequest<FMSResponse<VehicleTransferDTO>>;

public class DispatchTransferCommandHandler : IRequestHandler<DispatchTransferCommand, FMSResponse<VehicleTransferDTO>>
{
    private readonly GpsdataContext _context;
    private readonly IMapper _mapper;
    private readonly IVehicleTransferNotificationService _notificationService;
    private readonly ILogger<DispatchTransferCommandHandler> _logger;

    public DispatchTransferCommandHandler(
        GpsdataContext context,
        IMapper mapper,
        IVehicleTransferNotificationService notificationService,
        ILogger<DispatchTransferCommandHandler> logger)
    {
        _context = context;
        _mapper = mapper;
        _notificationService = notificationService;
        _logger = logger;
    }

    public async Task<FMSResponse<VehicleTransferDTO>> Handle(DispatchTransferCommand request, CancellationToken cancellationToken)
    {
        try
        {
            var transfer = await _context.Set<Domain.Entities.Features.VehicleManagement.VehicleTransfer>()
                .Include(t => t.Vehicle)
                .Include(t => t.FromSite)
                .Include(t => t.ToSite)
                .FirstOrDefaultAsync(t => t.TransferId == request.TransferId, cancellationToken);

            if (transfer == null)
            {
                return FMSResponse<VehicleTransferDTO>.Failed($"Transfer with ID {request.TransferId} not found", "NOT_FOUND");
            }

            if (!string.Equals(transfer.Status, "Approved", StringComparison.OrdinalIgnoreCase))
            {
                return FMSResponse<VehicleTransferDTO>.Failed(
                    "Only Approved transfers can be dispatched",
                    "VALIDATION_ERROR");
            }

            // Transition to InTransit
            transfer.Status = "InTransit";
            transfer.DispatchedAt = DateTime.UtcNow;
            transfer.ModifiedBy = request.UserId;
            transfer.DateModified = DateTime.UtcNow;

            await _context.SaveChangesAsync(cancellationToken);

            // Send dispatch notification to receiver
            try
            {
                await _notificationService.NotifyReceiverDispatchedAsync(
                    transfer.TransferId,
                    request.UserId ?? "System",
                    cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex,
                    "Transfer {TransferId} dispatched but notification to receiver failed",
                    transfer.TransferId);
            }

            var response = _mapper.Map<VehicleTransferDTO>(transfer);
            return FMSResponse<VehicleTransferDTO>.Success(response, "Vehicle dispatched successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error dispatching transfer {TransferId}", request.TransferId);
            return FMSResponse<VehicleTransferDTO>.Failed($"Error dispatching transfer: {ex.Message}");
        }
    }
}
