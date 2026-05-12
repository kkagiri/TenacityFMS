using System;
using System.Threading;
using System.Threading.Tasks;
using FMS.Domain.Entities;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Command.DatabaseCommand.IssueTrackerCommands.Category;

public record UpdateIssueCategoryCommand (Issuecategory Category) : IRequest<Unit>;

public class UpdateIssueCategoryCommandHandler : IRequestHandler<UpdateIssueCategoryCommand, Unit> {
    private readonly GpsdataContext _context;
    private readonly ILogger<UpdateIssueCategoryCommandHandler> _logger;

    public UpdateIssueCategoryCommandHandler (GpsdataContext context, ILogger<UpdateIssueCategoryCommandHandler> logger) {
        _context = context;
        _logger = logger;
    }

    public async Task<Unit> Handle (UpdateIssueCategoryCommand request, CancellationToken cancellationToken) {
        try {
            var entity = await _context.Issuecategories.FindAsync (request.Category.Id);
            if (entity == null) {
                _logger.LogWarning ("Issue category with ID: {Id} not found", request.Category.Id);
                return Unit.Value;
            }

            entity.Name = request.Category.Name;
            entity.Description = request.Category.Description;
            await _context.SaveChangesAsync (cancellationToken);

            _logger.LogInformation ("Issue category with ID: {Id} updated", entity.Id);

            return Unit.Value;
        } catch (Exception ex) {
            _logger.LogError (ex, "Error updating issue category");
            throw new Exception ("Error updating issue category", ex);
        }
    }
}