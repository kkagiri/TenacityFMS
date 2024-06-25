using System;
using System.Threading;
using System.Threading.Tasks;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Command.DatabaseCommand.IssueTrackerCommands.Status;

public record UpdateIssueStatusCommand(int Id, string Status) : IRequest<Unit>;

public class UpdateIssueStatusCommandHandler : IRequestHandler<UpdateIssueStatusCommand, Unit>
{
    private readonly GpsdataContext _context;
    private readonly ILogger<UpdateIssueStatusCommandHandler> _logger;

    public UpdateIssueStatusCommandHandler(GpsdataContext context, ILogger<UpdateIssueStatusCommandHandler> logger)
    {
        _context = context;
        _logger = logger;
    }


    public async Task<Unit> Handle(UpdateIssueStatusCommand request, CancellationToken cancellationToken)
    {
        try
        {
            var entity = await _context.Issuestatuses.FindAsync(request.Id, cancellationToken);

            if (entity == null)
            {
                _logger.LogWarning("Issue status with ID: {Id} not found", request.Id);
                return Unit.Value;
            }

            entity.Status = request.Status;
            await _context.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("Issue status with ID: {Id} updated", entity.Id);

            return Unit.Value;
        }
        catch (Exception ex)
        {
            _logger.LogError("Error updating issue status ", ex);
            throw new Exception("Error updating issue status", ex);
        }
    }
}