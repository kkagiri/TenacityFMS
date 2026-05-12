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
    /// Command to resolve a flag on an audit
    /// </summary>
    public record ResolveFlagCommand(ResolveFlagDTO Data)
        : IRequest<FMSResponse<FlagDTO>>;

    /// <summary>
    /// Handler for ResolveFlagCommand
    /// </summary>
    public class ResolveFlagCommandHandler
        : IRequestHandler<ResolveFlagCommand, FMSResponse<FlagDTO>>
    {
        private readonly GpsdataContext _context;
        private readonly ILogger<ResolveFlagCommandHandler> _logger;

        public ResolveFlagCommandHandler(
            GpsdataContext context,
            ILogger<ResolveFlagCommandHandler> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<FMSResponse<FlagDTO>> Handle(
            ResolveFlagCommand request,
            CancellationToken cancellationToken)
        {
            try
            {
                var dto = request.Data;

                var flag = await _context.FuelAuditFlags
                    .Include(f => f.Audit)
                    .FirstOrDefaultAsync(f => f.Id == dto.FlagId, cancellationToken);

                if (flag == null)
                {
                    return FMSResponse<FlagDTO>.Failed($"Flag {dto.FlagId} not found");
                }

                if (flag.Audit?.Status == "Finalized")
                {
                    return FMSResponse<FlagDTO>.Failed("Cannot modify flags on a finalized audit");
                }

                if (flag.Status == "Resolved")
                {
                    return FMSResponse<FlagDTO>.Failed("Flag is already resolved");
                }

                // Update flag status
                flag.Status = dto.Action == "Acknowledge" ? "Acknowledged" : "Resolved";
                flag.ResolutionNotes = dto.ResolutionNotes;
                flag.ResolvedBy = long.TryParse(dto.ResolvedBy, out var resolvedById) ? resolvedById : null;
                flag.ResolvedAt = DateTime.UtcNow;
                flag.UpdatedAt = DateTime.UtcNow;
                flag.UpdatedBy = flag.ResolvedBy;

                // Update audit's unresolved flag count
                if (dto.Action == "Resolve" && flag.Audit != null)
                {
                    var audit = flag.Audit;
                    audit.UnresolvedFlagCount = Math.Max(0, audit.UnresolvedFlagCount - 1);
                    audit.UpdatedAt = DateTime.UtcNow;
                    audit.UpdatedBy = flag.ResolvedBy;
                }

                await _context.SaveChangesAsync(cancellationToken);

                _logger.LogInformation("{Action} flag {FlagId} on audit {AuditId}",
                    dto.Action, dto.FlagId, flag.AuditId);

                var result = new FlagDTO
                {
                    Id = flag.Id,
                    AuditId = flag.AuditId,
                    FlagType = flag.FlagType,
                    Severity = flag.Severity,
                    Category = flag.Category,
                    Title = flag.Title,
                    Description = flag.Description,
                    Status = flag.Status,
                    AffectedValue = flag.ActualValue,
                    ThresholdValue = flag.ThresholdValue,
                    AffectedEntityType = flag.ReferenceType,
                    AffectedEntityId = flag.ReferenceId,
                    AffectedEntityName = flag.ReferenceName,
                    ResolutionNotes = flag.ResolutionNotes,
                    ResolvedBy = flag.ResolvedBy?.ToString(),
                    ResolvedAt = flag.ResolvedAt,
                    CreatedAt = flag.CreatedAt
                };

                return FMSResponse<FlagDTO>.Success(result,
                    $"Flag {(dto.Action == "Acknowledge" ? "acknowledged" : "resolved")} successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error resolving flag");
                return FMSResponse<FlagDTO>.Failed($"Error: {ex.Message}");
            }
        }
    }
}
