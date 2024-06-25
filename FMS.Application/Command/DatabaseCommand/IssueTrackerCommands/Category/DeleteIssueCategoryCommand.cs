using System;
using System.Threading;
using System.Threading.Tasks;
using FMS.Persistence.DataAccess;
using FMS.PTS.Common;
using MediatR;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Command.DatabaseCommand.IssueTrackerCommands.Category;
public record DeleteIssueCategoryCommand(int Id): IRequest<Unit>;


public class DeleteIssueCategoryCommandHandler : IRequestHandler<DeleteIssueCategoryCommand,Unit>
{
    private readonly GpsdataContext _context;
    private readonly ILogger<DeleteIssueCategoryCommandHandler> _logger;

    public DeleteIssueCategoryCommandHandler(GpsdataContext context, ILogger<DeleteIssueCategoryCommandHandler> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<Unit> Handle(DeleteIssueCategoryCommand request, CancellationToken cancellationToken)
    {
        try
        {
        var entity = await _context.Issuecategories.FindAsync(request.Id);
        if (entity == null)
        {
            _logger.LogWarning("Issue category with ID: {Id} not found", request.Id);
            return Unit.Value;
        }

        _context.Issuecategories.Remove(entity);
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Issue category with ID: {Id} deleted", request.Id);

        return Unit.Value;
    }  catch (Exception ex)
    {
         _logger.LogError("Error deleting issue category with ID: {Id}: {Message}", request.Id, ex.Message);
         throw new Exception(ex.Message);
    }
    }
}
