using System;
using System.Threading;
using System.Threading.Tasks;
using FMS.Domain.Entities;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Command.DatabaseCommand.IssueTrackerCommands.Priority;

// Command record for priority deletion
public record DeleteIssuePriorityCommand (int PriorityId) : IRequest<Unit>;

// Command handler for priority deletion
public class DeleteIssuePriorityCommandHandler : IRequestHandler<DeleteIssuePriorityCommand, Unit> {
    private readonly GpsdataContext _context;
    private readonly IMediator _mediator;
    private readonly ILogger<DeleteIssuePriorityCommandHandler> _logger;

    public DeleteIssuePriorityCommandHandler (GpsdataContext context, IMediator mediator, ILogger<DeleteIssuePriorityCommandHandler> logger) {
        _context = context;
        _mediator = mediator;
        _logger = logger;
    }

    public async Task<Unit> Handle (DeleteIssuePriorityCommand request, CancellationToken cancellationToken) {
        try {
            var priority = await _context.Issuepriorities.FindAsync (request.PriorityId);
            if (priority != null) {
                _context.Issuepriorities.Remove (priority);
                await _context.SaveChangesAsync (cancellationToken);
            }
            return Unit.Value;
        } catch (Exception ex) {
            _logger.LogError (ex, "Error deleting Issue Priority");
            throw new Exception (ex.Message);
        }
    }
}