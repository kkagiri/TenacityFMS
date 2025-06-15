using System.Threading;
using System.Threading.Tasks;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Command.DatabaseCommand.DeviceManagement.DeviceTypeCommands;
public record DeleteDeviceTypeCommand(int Id) : IRequest<Unit>;

public class DeleteDeviceTypeCommandHandler : IRequestHandler<DeleteDeviceTypeCommand, Unit>
{

    private readonly GpsdataContext _context;
    private readonly ILogger<DeleteDeviceTypeCommandHandler> _logger;

    public DeleteDeviceTypeCommandHandler(GpsdataContext context, ILogger<DeleteDeviceTypeCommandHandler> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<Unit> Handle(DeleteDeviceTypeCommand request, CancellationToken cancellationToken)
    {
        var entity = await _context.Devicetypes.FindAsync(request.Id);
        if (entity == null)
        {
            _logger.LogWarning("Device type with ID: {Id} not found", request.Id);
            return Unit.Value;
        }

        _context.Devicetypes.Remove(entity);
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Device type with ID: {Id} deleted", request.Id);

        return Unit.Value;
    }
}