using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.FuelAudit.DTOs;
using FMS.Domain.Entities.FuelAudit;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.FuelAudit.Commands
{
    /// <summary>
    /// Command to create a new fuel audit
    /// </summary>
    public record CreateFuelAuditCommand(CreateFuelAuditDTO AuditData)
        : IRequest<FMSResponse<FuelAuditSummaryDTO>>;

    /// <summary>
    /// Handler for CreateFuelAuditCommand
    /// </summary>
    public class CreateFuelAuditCommandHandler
        : IRequestHandler<CreateFuelAuditCommand, FMSResponse<FuelAuditSummaryDTO>>
    {
        private readonly GpsdataContext _context;
        private readonly ILogger<CreateFuelAuditCommandHandler> _logger;

        public CreateFuelAuditCommandHandler(
            GpsdataContext context,
            ILogger<CreateFuelAuditCommandHandler> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<FMSResponse<FuelAuditSummaryDTO>> Handle(
            CreateFuelAuditCommand request,
            CancellationToken cancellationToken)
        {
            try
            {
                var dto = request.AuditData;

                // Validate dates
                if (dto.EndDate < dto.StartDate)
                {
                    return FMSResponse<FuelAuditSummaryDTO>.Failed("End date must be after start date");
                }

                if (dto.EndDate > DateTime.Today)
                {
                    return FMSResponse<FuelAuditSummaryDTO>.Failed("End date cannot be in the future");
                }

                // Check for overlapping audits
                var overlappingAudit = await _context.FuelAudits
                    .Where(a => a.Status != "Cancelled")
                    .Where(a =>
                        (dto.StartDate >= a.StartDate && dto.StartDate <= a.EndDate) ||
                        (dto.EndDate >= a.StartDate && dto.EndDate <= a.EndDate) ||
                        (dto.StartDate <= a.StartDate && dto.EndDate >= a.EndDate))
                    .FirstOrDefaultAsync(cancellationToken);

                if (overlappingAudit != null)
                {
                    return FMSResponse<FuelAuditSummaryDTO>.Failed(
                        $"Date range overlaps with existing audit {overlappingAudit.AuditNumber}");
                }

                // Generate audit number if not provided
                var auditNumber = dto.AuditNumber;
                if (string.IsNullOrEmpty(auditNumber))
                {
                    // Generate: FA - YYYY-MM-DD HH:mm:ss
                    var now = DateTime.UtcNow;
                    auditNumber = $"FA - {now:yyyy-MM-dd HH:mm:ss}";
                }

                // Check for duplicate audit number
                if (await _context.FuelAudits.AnyAsync(a => a.AuditNumber == auditNumber, cancellationToken))
                {
                    return FMSResponse<FuelAuditSummaryDTO>.Failed(
                        $"Audit number {auditNumber} already exists");
                }

                // Create the audit
                var audit = new Domain.Entities.FuelAudit.FuelAudit
                {
                    AuditNumber = auditNumber,
                    StartDate = dto.StartDate.Date,
                    EndDate = dto.EndDate.Date,
                    Description = dto.Description,
                    Status = "Draft",
                    CreatedAt = DateTime.UtcNow,
                    CreatedBy = long.TryParse(dto.CreatedBy, out var createdById) ? createdById : null
                };

                _context.FuelAudits.Add(audit);
                await _context.SaveChangesAsync(cancellationToken);

                _logger.LogInformation("Created fuel audit {AuditNumber} (ID: {AuditId})",
                    audit.AuditNumber, audit.Id);

                // Return summary
                var summary = new FuelAuditSummaryDTO
                {
                    Id = audit.Id,
                    AuditNumber = audit.AuditNumber,
                    StartDate = audit.StartDate,
                    EndDate = audit.EndDate,
                    Status = audit.Status,
                    Description = audit.Description,
                    CreatedAt = audit.CreatedAt
                };

                return FMSResponse<FuelAuditSummaryDTO>.Success(summary,
                    $"Fuel audit {auditNumber} created successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating fuel audit");
                return FMSResponse<FuelAuditSummaryDTO>.Failed($"Error creating fuel audit: {ex.Message}");
            }
        }
    }
}
