using System;
using System.Threading;
using System.Threading.Tasks;
using FMS.Domain.Entities;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Command.DatabaseCommand.DeviceManagement.DeviceManufacturerCommands;
public record UpdateDeviceManufacturerCommand(Devicemanufacturer Devicemanufacturer) : IRequest<Unit>;

public class UpdateDeviceManufacturerCommandHandler : IRequestHandler<UpdateDeviceManufacturerCommand,Unit>
{
    private readonly GpsdataContext _context;
    private readonly ILogger<UpdateDeviceManufacturerCommandHandler> _logger;

    public UpdateDeviceManufacturerCommandHandler(GpsdataContext context, ILogger<UpdateDeviceManufacturerCommandHandler> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<Unit> Handle(UpdateDeviceManufacturerCommand request, CancellationToken cancellationToken)
    {
        try{
        var entity = await _context.Devicemanufacturers.FindAsync(request.Devicemanufacturer.Id);
        if (entity == null)
        {
            _logger.LogWarning("Device manufacturer with ID: {Id} not found", request.Devicemanufacturer.Id);
            return Unit.Value;
        }

        entity.Name = request.Devicemanufacturer.Name;
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Device manufacturer with ID: {Id} updated", entity.Id);

        return Unit.Value;
        }
        catch (Exception ex)
        {
            _logger.LogWarning("Unable to update device manufacturer with ID: {Id}", request.Devicemanufacturer.Id);
            throw new Exception("Unable to update device manufacturer", ex);
        }
    }
}