using System;
using System.Threading;
using System.Threading.Tasks;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Command.DatabaseCommand.IssueTrackerCommands.Status;

public record DeleteIssueStatusCommand(int Id) : IRequest<Unit>;

public class DeleteIssueStatusCommandHandler : IRequestHandler<DeleteIssueStatusCommand,Unit>
{
    private readonly GpsdataContext _context;
    private readonly ILogger<DeleteIssueStatusCommandHandler> _logger;

    public DeleteIssueStatusCommandHandler(GpsdataContext context, ILogger<DeleteIssueStatusCommandHandler> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<Unit> Handle(DeleteIssueStatusCommand request, CancellationToken cancellationToken)
    {
        try{
        var entity = await _context.Issuestatuses.FindAsync(request.Id);
        if (entity == null)
        {
            _logger.LogWarning("Issue status with ID: {Id} not found", request.Id);
            return Unit.Value;
        }

        _context.Issuestatuses.Remove(entity);
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Issue status with ID: {Id} deleted", request.Id);

        return Unit.Value;
        }
        catch(Exception ex)
        {
             _logger.LogError("Error deleting issue status ", ex);
             throw new Exception("Error deleting issue status", ex);
        }
    }
}