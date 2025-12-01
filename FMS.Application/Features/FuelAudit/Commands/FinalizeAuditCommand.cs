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
    /// Command to finalize/lock an audit
    /// </summary>
    public record FinalizeAuditCommand(FinalizeAuditDTO Data)
        : IRequest<FMSResponse<FuelAuditSummaryDTO>>;

    /// <summary>
    /// Handler for FinalizeAuditCommand
    /// </summary>
    public class FinalizeAuditCommandHandler
        : IRequestHandler<FinalizeAuditCommand, FMSResponse<FuelAuditSummaryDTO>>
    {
        private readonly GpsdataContext _context;
        private readonly ILogger<FinalizeAuditCommandHandler> _logger;

        public FinalizeAuditCommandHandler(
            GpsdataContext context,
            ILogger<FinalizeAuditCommandHandler> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<FMSResponse<FuelAuditSummaryDTO>> Handle(
            FinalizeAuditCommand request,
            CancellationToken cancellationToken)
        {
            try
            {
                var dto = request.Data;

                var audit = await _context.FuelAudits
                    .FirstOrDefaultAsync(a => a.Id == dto.AuditId, cancellationToken);

                if (audit == null)
                {
                    return FMSResponse<FuelAuditSummaryDTO>.Failed($"Audit {dto.AuditId} not found");
                }

                if (audit.Status == "Finalized")
                {
                    return FMSResponse<FuelAuditSummaryDTO>.Failed("Audit is already finalized");
                }

                if (audit.Status == "Cancelled")
                {
                    return FMSResponse<FuelAuditSummaryDTO>.Failed("Cannot finalize a cancelled audit");
                }

                if (audit.Status != "Calculated")
                {
                    return FMSResponse<FuelAuditSummaryDTO>.Failed(
                        "Audit must be calculated before finalizing");
                }

                // Check for unresolved critical flags
                var unresolvedCriticalFlags = await _context.FuelAuditFlags
                    .CountAsync(f => f.AuditId == dto.AuditId
                        && f.Status == "Open"
                        && f.Severity == "Critical", cancellationToken);

                if (unresolvedCriticalFlags > 0)
                {
                    return FMSResponse<FuelAuditSummaryDTO>.Failed(
                        $"Cannot finalize: {unresolvedCriticalFlags} unresolved critical flag(s)");
                }

                // Finalize the audit
                audit.Status = "Finalized";
                audit.FinalizedAt = DateTime.UtcNow;
                audit.FinalizedBy = long.TryParse(dto.FinalizedBy, out var finalizedById) ? finalizedById : null;
                audit.FinalizationNotes = dto.Notes;
                audit.UpdatedAt = DateTime.UtcNow;
                audit.UpdatedBy = long.TryParse(dto.FinalizedBy, out var updatedById) ? updatedById : null;

                await _context.SaveChangesAsync(cancellationToken);

                _logger.LogInformation("Finalized audit {AuditNumber} (ID: {AuditId})",
                    audit.AuditNumber, audit.Id);

                var summary = new FuelAuditSummaryDTO
                {
                    Id = audit.Id,
                    AuditNumber = audit.AuditNumber,
                    StartDate = audit.StartDate,
                    EndDate = audit.EndDate,
                    Status = audit.Status,
                    Description = audit.Description,
                    SystemOpeningStock = audit.SystemOpeningStock,
                    SystemClosingStock = audit.SystemClosingStock,
                    SystemVariance = audit.SystemVariance,
                    SystemVariancePercent = audit.SystemVariancePercent,
                    DataConfidence = audit.DataConfidence,
                    FlagCount = audit.FlagCount,
                    UnresolvedFlagCount = audit.UnresolvedFlagCount,
                    FinalizedAt = audit.FinalizedAt,
                    CreatedAt = audit.CreatedAt
                };

                return FMSResponse<FuelAuditSummaryDTO>.Success(summary,
                    $"Audit {audit.AuditNumber} finalized successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error finalizing audit");
                return FMSResponse<FuelAuditSummaryDTO>.Failed($"Error: {ex.Message}");
            }
        }
    }
}
