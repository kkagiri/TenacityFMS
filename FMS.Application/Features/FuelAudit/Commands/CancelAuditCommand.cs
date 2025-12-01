using System;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.FuelAudit.DTOs;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.FuelAudit.Commands
{
    /// <summary>
    /// Command to cancel an audit
    /// </summary>
    public record CancelAuditCommand(long AuditId, string CancelledBy, string Reason)
        : IRequest<FMSResponse<bool>>;

    /// <summary>
    /// Handler for CancelAuditCommand
    /// </summary>
    public class CancelAuditCommandHandler
        : IRequestHandler<CancelAuditCommand, FMSResponse<bool>>
    {
        private readonly GpsdataContext _context;
        private readonly ILogger<CancelAuditCommandHandler> _logger;

        public CancelAuditCommandHandler(
            GpsdataContext context,
            ILogger<CancelAuditCommandHandler> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<FMSResponse<bool>> Handle(
            CancelAuditCommand request,
            CancellationToken cancellationToken)
        {
            try
            {
                var audit = await _context.FuelAudits
                    .FirstOrDefaultAsync(a => a.Id == request.AuditId, cancellationToken);

                if (audit == null)
                {
                    return FMSResponse<bool>.Failed($"Audit {request.AuditId} not found");
                }

                if (audit.Status == "Finalized")
                {
                    return FMSResponse<bool>.Failed("Cannot cancel a finalized audit");
                }

                if (audit.Status == "Cancelled")
                {
                    return FMSResponse<bool>.Failed("Audit is already cancelled");
                }

                // Cancel the audit - use Description to store cancellation reason
                audit.Status = "Cancelled";
                audit.Description = $"Cancelled: {request.Reason}";
                audit.UpdatedAt = DateTime.UtcNow;
                audit.UpdatedBy = long.TryParse(request.CancelledBy, out var updatedById) ? updatedById : null;

                await _context.SaveChangesAsync(cancellationToken);

                _logger.LogInformation("Cancelled audit {AuditNumber} (ID: {AuditId}). Reason: {Reason}",
                    audit.AuditNumber, audit.Id, request.Reason);

                return FMSResponse<bool>.Success(true,
                    $"Audit {audit.AuditNumber} cancelled successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error cancelling audit");
                return FMSResponse<bool>.Failed($"Error: {ex.Message}");
            }
        }
    }
}
