using System;
using System.Threading;
using System.Threading.Tasks;
using FMS.Domain.Entities;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Command.DatabaseCommand.IssueTrackerCommands.Category;

// Command record for device status
public record IssueCategoryCreateCommand(Issuecategory Issuecategory) : IRequest<int>;

// Command handler for device status creation
public class IssueCategoryCreateCommandHandler : IRequestHandler<IssueCategoryCreateCommand, int>
{
    private readonly GpsdataContext _context;
    private readonly IMediator _mediator;
    private readonly ILogger<IssueCategoryCreateCommandHandler> _logger;

    public IssueCategoryCreateCommandHandler(GpsdataContext context, IMediator mediator, ILogger<IssueCategoryCreateCommandHandler> logger)
    {
        _context = context;
        _mediator = mediator;
        _logger = logger;
    }

    public async Task<int> Handle(IssueCategoryCreateCommand request, CancellationToken cancellationToken)
    {
        try
        {
            await _context.Issuecategories.AddAsync(request.Issuecategory, cancellationToken);
            await _context.SaveChangesAsync(cancellationToken);
            return request.Issuecategory.Id;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating Issuecategory");
            throw new Exception(ex.Message);
        }
    }
}
