using System;
using System.Threading;
using System.Threading.Tasks;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Command.DatabaseCommand.IssueTrackerCommands.Category;
public class UpdateIssueCategoryCommand : IRequest<Unit>
{
    public int Id { get; set; }
    public string Name { get; set; }
    public string Description { get; set; }
}

public class UpdateIssueCategoryCommandHandler : IRequestHandler<UpdateIssueCategoryCommand, Unit>
{
    private readonly GpsdataContext _context;
    private readonly ILogger<UpdateIssueCategoryCommandHandler> _logger;

    public UpdateIssueCategoryCommandHandler(GpsdataContext context, ILogger<UpdateIssueCategoryCommandHandler> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<Unit> Handle(UpdateIssueCategoryCommand request, CancellationToken cancellationToken)
    {
        try
        {
            var entity = await _context.Issuecategories.FindAsync(request.Id);
            if (entity == null)
            {
                _logger.LogWarning("Issue category with ID: {Id} not found", request.Id);
                return Unit.Value;
            }

            entity.Name = request.Name;
            entity.Description = request.Description;
            await _context.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("Issue category with ID: {Id} updated", entity.Id);

            return Unit.Value;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating issue category");
            throw new Exception("Error updating issue category", ex);
        }
    }
}
