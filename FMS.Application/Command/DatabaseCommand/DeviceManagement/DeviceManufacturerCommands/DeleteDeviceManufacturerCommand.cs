using System;
using System.Threading;
using System.Threading.Tasks;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Command.DatabaseCommand.DeviceManagement.DeviceManufacturerCommands;
public record DeleteDeviceManufacturerCommand(int Id) : IRequest<Unit>;

public class DeleteDeviceManufacturerCommandHandler : IRequestHandler<DeleteDeviceManufacturerCommand,Unit>
{
    private readonly GpsdataContext _context;
    private readonly ILogger<DeleteDeviceManufacturerCommandHandler> _logger;

    public DeleteDeviceManufacturerCommandHandler(GpsdataContext context, ILogger<DeleteDeviceManufacturerCommandHandler> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<Unit> Handle(DeleteDeviceManufacturerCommand request, CancellationToken cancellationToken)
    {
        try{
        var entity = await _context.Devicemanufacturers.FindAsync(request.Id);
        if (entity == null)
        {
            _logger.LogWarning("Device manufacturer with ID: {Id} not found", request.Id);
            return Unit.Value;
        }

        _context.Devicemanufacturers.Remove(entity);
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Device manufacturer with ID: {Id} deleted", request.Id);

        return Unit.Value;
        }
        catch (Exception ex)
        {
            _logger.LogError("Unable to delete device manufacturer with ID: {Id}", request.Id);
            throw new Exception("Unable to delete device manufacturer", ex);
        }
    }
}