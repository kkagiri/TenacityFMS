using System;
using System.Threading;
using System.Threading.Tasks;
using FMS.Domain.Entities;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Command.DatabaseCommand.IssueTrackerCommands.Issues;

// Command record for priority
public record IssueStatusCreateCommand(Issuestatus Issuestatus) : IRequest<int>;

// Command handler for priority creation
public class IssueStatusCreateCommandHandler    : IRequestHandler<IssueStatusCreateCommand, int>
{
    private readonly GpsdataContext _context;
    private readonly IMediator _mediator;
    private readonly ILogger<IssueStatusCreateCommandHandler> _logger;

    public IssueStatusCreateCommandHandler(GpsdataContext context, IMediator mediator, ILogger<IssueStatusCreateCommandHandler> logger)
    {
        _context = context;
        _mediator = mediator;
        _logger = logger;
    }

    public async Task<int> Handle(IssueStatusCreateCommand request, CancellationToken cancellationToken)
    {
        try
        {
            await _context.Issuestatuses.AddAsync(request.Issuestatus, cancellationToken);
            await _context.SaveChangesAsync(cancellationToken);
            return request.Issuestatus.Id;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating Issuestatus");
            throw new Exception("Error creating Issuestatus");
        }
    }
}
