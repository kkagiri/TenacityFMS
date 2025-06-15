using System;
using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using FMS.Application.ModelsDTOs.FMS.Issuetracker;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Command.DatabaseCommand.IssueTrackerCommands.Issues;

public record UpdateIssueCommand(IssueTrackerDTO IssueTracker) : IRequest<Unit>;

public class UpdateIssueCommandHandler : IRequestHandler<UpdateIssueCommand, Unit>
{
    private readonly GpsdataContext _context;
    private readonly IMapper _mapper;
    private readonly ILogger<UpdateIssueCommandHandler> _logger;

    public UpdateIssueCommandHandler(GpsdataContext context, IMapper mapper, ILogger<UpdateIssueCommandHandler> logger)
    {
        _context = context;
        _mapper = mapper;
        _logger = logger;
    }

    public async Task<Unit> Handle(UpdateIssueCommand request, CancellationToken cancellationToken)
    {
        try
        {
            var entity = await _context.Issuetrackers.FindAsync(request.IssueTracker.Id);
            if (entity == null)
            {
                _logger.LogWarning("Issue with ID: {Id} not found", request.IssueTracker.Id);
                return Unit.Value;
            }

            _mapper.Map(request.IssueTracker, entity);
            await _context.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("Issue with ID: {Id} updated", entity.Id);

            return Unit.Value;
        }
        catch (Exception ex)
        {
            _logger.LogError("An error occured while updating issue with ID: {Id}", request.IssueTracker.Id);
            throw new Exception(ex.Message);
        }
    }
}