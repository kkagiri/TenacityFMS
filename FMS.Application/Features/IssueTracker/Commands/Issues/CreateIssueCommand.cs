//Create Issue based on FMS Issue Tracker
using System;
using System.Threading;
using System.Threading.Tasks;
using FMS.Domain.Entities;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Command.DatabaseCommand.IssueTrackerCommands.Issues;

public record CreateIssueCommand(Issuetracker Issuetracker) : IRequest<int>;

public class IssueCreateCommandHandler : IRequestHandler<CreateIssueCommand, int>
{
    private readonly GpsdataContext _context;
    private readonly IMediator _mediator;
    private readonly ILogger<IssueCreateCommandHandler> _logger;

    public IssueCreateCommandHandler(GpsdataContext context, IMediator mediator, ILogger<IssueCreateCommandHandler> logger)
    {
        _context = context;
        _mediator = mediator;
        _logger = logger;
    }


    public async Task<int> Handle(CreateIssueCommand request, CancellationToken cancellationToken)
    {
        try
        {
            await _context.Issuetrackers.AddAsync(request.Issuetracker, cancellationToken);
            await _context.SaveChangesAsync();

            return request.Issuetracker.Id;

        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating issue");
            throw new Exception("Error creating issue", ex);
        }

    }
}
