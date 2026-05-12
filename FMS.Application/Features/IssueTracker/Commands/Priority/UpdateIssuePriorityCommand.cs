using System;
using System.Threading;
using System.Threading.Tasks;
using FMS.Domain.Entities;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Command.DatabaseCommand.IssueTrackerCommands.Priority;

// Command record for priority update
public record UpdateIssuePriorityCommand (Issuepriority Priority) : IRequest<Unit>;

// Command handler for priority update
public class UpdateIssuePriorityCommandHandler : IRequestHandler<UpdateIssuePriorityCommand, Unit> {
    private readonly GpsdataContext _context;
    private readonly IMediator _mediator;
    private readonly ILogger<UpdateIssuePriorityCommandHandler> _logger;

    public UpdateIssuePriorityCommandHandler (GpsdataContext context, IMediator mediator, ILogger<UpdateIssuePriorityCommandHandler> logger) {
        _context = context;
        _mediator = mediator;
        _logger = logger;
    }

    public async Task<Unit> Handle (UpdateIssuePriorityCommand request, CancellationToken cancellationToken) {
        try {
            _context.Issuepriorities.Update (request.Priority);
            await _context.SaveChangesAsync (cancellationToken);
            return Unit.Value;
        } catch (Exception ex) {
            _logger.LogError (ex, "Error updating Issue Priority");
            throw new Exception (ex.Message);
        }
    }
}