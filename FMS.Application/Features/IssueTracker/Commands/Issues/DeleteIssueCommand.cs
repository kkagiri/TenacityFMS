using System;
using System.Threading;
using System.Threading.Tasks;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.IssueTracker.Commands.Issues;
public record DeleteIssueCommand (int Id) : IRequest<Unit>;

public class DeleteIssueCommandHandler : IRequestHandler<DeleteIssueCommand, Unit> {
    private readonly GpsdataContext _context;
    private readonly ILogger<DeleteIssueCommandHandler> _logger;

    public DeleteIssueCommandHandler (GpsdataContext context, ILogger<DeleteIssueCommandHandler> logger) {
        _context = context;
        _logger = logger;
    }

    public async Task<Unit> Handle (DeleteIssueCommand request, CancellationToken cancellationToken) {
        try {
            var entity = await _context.Issuetrackers.FindAsync (request.Id);
            if (entity == null) {
                _logger.LogWarning ("Issue with ID: {Id} not found", request.Id);
                return Unit.Value;
            }

            _context.Issuetrackers.Remove (entity);
            await _context.SaveChangesAsync (cancellationToken);

            _logger.LogInformation ("Issue with ID: {Id} deleted", request.Id);

            return Unit.Value;
        } catch (Exception ex) {
            _logger.LogWarning ("An error occured while deleting issue with ID: {Id}", request.Id);
            throw new Exception (ex.Message);
        }
    }
}