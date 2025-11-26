using System;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;

namespace FMS.Application.Features.TankManagement.TankStock.Commands;

#pragma warning disable CS0618 // Type or member is obsolete
/// <summary>
/// Command to soft delete a TankStock entry.
/// Sets IsDeleted = true, DeletedAt = now, DeletedBy = current user.
/// Optionally processes TankVolumeHistory updates (controlled by processHistory parameter).
/// </summary>
public record DeleteTankStockCommand(
    int EntryId,
    bool ProcessHistory = false,
    string? UserId = null
) : IRequest<FMSResponseMessage>;

public class DeleteTankStockCommandHandler : IRequestHandler<DeleteTankStockCommand, FMSResponseMessage>
{
    private readonly GpsdataContext _context;
    private readonly ILogger<DeleteTankStockCommandHandler> _logger;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public DeleteTankStockCommandHandler(
        GpsdataContext context,
        ILogger<DeleteTankStockCommandHandler> logger,
        IHttpContextAccessor httpContextAccessor)
    {
        _context = context;
        _logger = logger;
        _httpContextAccessor = httpContextAccessor;
    }

    public async Task<FMSResponseMessage> Handle(DeleteTankStockCommand request, CancellationToken cancellationToken)
    {
        try
        {
            var tankStock = await _context.Tankstocks.FindAsync(new object[] { request.EntryId }, cancellationToken);

            if (tankStock == null)
            {
                return new FMSResponseMessage(false, $"Tank stock entry with ID {request.EntryId} not found");
            }

            if (tankStock.IsDeleted)
            {
                return new FMSResponseMessage(false, $"Tank stock entry {request.EntryId} is already deleted");
            }

            // Get current user ID
            var userId = request.UserId ?? _httpContextAccessor.HttpContext?.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            // Soft delete: mark as deleted instead of removing
            tankStock.IsDeleted = true;
            tankStock.DeletedAt = DateTime.UtcNow;
            tankStock.DeletedBy = userId;

            // Optional: Process TankVolumeHistory updates if requested
            if (request.ProcessHistory)
            {
                _logger.LogInformation(
                    "Processing TankVolumeHistory updates for deleted TankStock entry {EntryId}. " +
                    "This feature is currently not implemented - TankStock deletions do not automatically update TankVolumeHistory.",
                    request.EntryId);

                // TODO: Implement optional TankVolumeHistory processing
                // This would involve:
                // 1. Finding related TankVolumeHistory record by ReferenceId/ReferenceType
                // 2. Soft deleting it
                // 3. Triggering recalculation of subsequent balances if needed
            }

            await _context.SaveChangesAsync(cancellationToken);

            _logger.LogInformation(
                "Tank stock entry {EntryId} soft deleted successfully by user {UserId}. ProcessHistory: {ProcessHistory}",
                request.EntryId,
                userId,
                request.ProcessHistory);

            return new FMSResponseMessage(true, "Tank stock entry deleted successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting tank stock entry {EntryId}", request.EntryId);
            return new FMSResponseMessage(false, $"Failed to delete tank stock entry: {ex.Message}");
        }
    }
}
#pragma warning restore CS0618 // Type or member is obsolete
