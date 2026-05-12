using System;
using System.Threading;
using System.Threading.Tasks;
using FMS.Domain.Entities;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Command.DatabaseCommand.IssueTrackerCommands.Priority;

// Command record for priority (short name for controller compatibility)
public record PriorityCreateCommand (Issuepriority Priority) : IRequest<int>;

// Original command record for priority
public record IssuePriorityCreateCommand (Issuepriority Priority) : IRequest<int>;

// Command handler for priority creation (works for both commands)
public class PriorityCreateCommandHandler : IRequestHandler<PriorityCreateCommand, int> {
    private readonly GpsdataContext _context;
    private readonly ILogger<PriorityCreateCommandHandler> _logger;

    public PriorityCreateCommandHandler (GpsdataContext context, ILogger<PriorityCreateCommandHandler> logger) {
        _context = context;
        _logger = logger;
    }

    public async Task<int> Handle (PriorityCreateCommand request, CancellationToken cancellationToken) {
        try {
            await _context.Issuepriorities.AddAsync (request.Priority, cancellationToken);
            await _context.SaveChangesAsync (cancellationToken);
            return request.Priority.Id;
        } catch (Exception ex) {
            _logger.LogError (ex, "Error creating priority");
            throw new Exception ("Error creating priority");
        }
    }
}

// Command handler for priority creation
public class IssuePriorityCreateCommandHandler : IRequestHandler<IssuePriorityCreateCommand, int> {
    private readonly GpsdataContext _context;
    private readonly IMediator _mediator;
    private readonly ILogger<IssuePriorityCreateCommandHandler> _logger;

    public IssuePriorityCreateCommandHandler (GpsdataContext context, IMediator mediator, ILogger<IssuePriorityCreateCommandHandler> logger) {
        _context = context;
        _mediator = mediator;
        _logger = logger;
    }

    public async Task<int> Handle (IssuePriorityCreateCommand request, CancellationToken cancellationToken) {
        try {
            await _context.Issuepriorities.AddAsync (request.Priority, cancellationToken);
            await _context.SaveChangesAsync (cancellationToken);
            return request.Priority.Id;
        } catch (Exception ex) {
            _logger.LogError (ex, "Error creating priority");
            throw new Exception ("Error creating priority");
        }
    }
}