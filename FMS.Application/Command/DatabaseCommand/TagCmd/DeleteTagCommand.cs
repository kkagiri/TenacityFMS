using MediatR;
using FMS.Persistence.DataAccess;
using Microsoft.Extensions.Logging;
using FMS.Application.Common;
using System.Threading.Tasks;
using System.Threading;
using System;

namespace FMS.Application.Command.DatabaseCommand.TagCmd;

public record DeleteTagCommand(int Id) : IRequest<FMSResponseMessage>;

public class DeleteTagCommandHandler : IRequestHandler<DeleteTagCommand, FMSResponseMessage>
{
    private readonly GpsdataContext _context;
    private readonly ILogger<DeleteTagCommandHandler> _logger;

    public DeleteTagCommandHandler(GpsdataContext context, ILogger<DeleteTagCommandHandler> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<FMSResponseMessage> Handle(DeleteTagCommand request, CancellationToken cancellationToken)
    {
        try
        {
            var tag = await _context.Tags.FindAsync(request.Id);
            if (tag == null)
                return new FMSResponseMessage(false, "Tag not found");

            _context.Tags.Remove(tag);
            await _context.SaveChangesAsync(cancellationToken);
            return new FMSResponseMessage(true, "Tag deleted successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting tag");
            return new FMSResponseMessage(false, "Error deleting tag");
        }
    }
}