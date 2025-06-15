using System.Threading;
using System.Threading.Tasks;
using FMS.Domain.Entities;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Command.DatabaseCommand.DeviceManagement.DeviceTypeCommands;

public record UpdateDeviceTypeCommand(Devicetype Devicetype) : IRequest<Unit>;

public class UpdateDeviceTypeCommandHandler : IRequestHandler<UpdateDeviceTypeCommand, Unit>
{
    private readonly GpsdataContext _context;
    private readonly ILogger<UpdateDeviceTypeCommandHandler> _logger;

    public UpdateDeviceTypeCommandHandler(GpsdataContext context, ILogger<UpdateDeviceTypeCommandHandler> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<Unit> Handle(UpdateDeviceTypeCommand request, CancellationToken cancellationToken)
    {
        var entity = await _context.Devicetypes.FindAsync(request.Devicetype.Id);
        if (entity == null)
        {
            _logger.LogWarning("Device type with ID: {Id} not found", request.Devicetype.Id);
            return Unit.Value;
        }

        entity.Name = request.Devicetype.Name;
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Device type with ID: {Id} updated", entity.Id);

        return Unit.Value;
    }


}