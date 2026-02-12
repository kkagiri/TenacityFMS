/**
 * File: DeleteEventExpressionCommandHandler.cs
 * Purpose: Handles soft-deletion (deactivation) of an EventExpression entity.
 * Dependencies: GpsdataContext, ILogger, FMSResponse
 * Last Modified: 2026-02-11
 */

using System;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.EventEngine.Commands
{
    public class DeleteEventExpressionCommandHandler
        : IRequestHandler<DeleteEventExpressionCommand, FMSResponse<bool>>
    {
        private readonly GpsdataContext _context;
        private readonly ILogger<DeleteEventExpressionCommandHandler> _logger;

        public DeleteEventExpressionCommandHandler(
            GpsdataContext context,
            ILogger<DeleteEventExpressionCommandHandler> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<FMSResponse<bool>> Handle(
            DeleteEventExpressionCommand command,
            CancellationToken cancellationToken)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(command.DeletedBy))
                    return FMSResponse<bool>.ValidationFailed(
                        new System.Collections.Generic.List<string> { "DeletedBy is required" });

                var entity = await _context.EventExpressions
                    .FirstOrDefaultAsync(e => e.Id == command.Id, cancellationToken);

                if (entity == null)
                    return FMSResponse<bool>.Failed(
                        $"Event expression with ID {command.Id} not found", "NOT_FOUND");

                // Soft delete: deactivate and mark as modified
                entity.IsActive = false;
                entity.ModifiedBy = command.DeletedBy;
                entity.ModifiedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync(cancellationToken);

                _logger.LogInformation(
                    "Event expression {Id} ('{Name}') deactivated by {DeletedBy}",
                    entity.Id, entity.Name, command.DeletedBy);

                return FMSResponse<bool>.Success(true, "Event expression deleted successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting event expression {Id}", command.Id);
                return FMSResponse<bool>.SystemError($"Error deleting event expression: {ex.Message}");
            }
        }
    }
}
