using System;
using System.Threading;
using System.Threading.Tasks;
using FMS.Domain.Entities;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Command.DatabaseCommand.DeviceManagement.DeviceCommands;

public record UpdateDeviceCommand(Device Device) : IRequest<Unit>;

public class UpdateDeviceCommandHandler : IRequestHandler<UpdateDeviceCommand,Unit>
{
    private readonly GpsdataContext _context;
    private readonly ILogger<UpdateDeviceCommandHandler> _logger;

    public UpdateDeviceCommandHandler(GpsdataContext context, ILogger<UpdateDeviceCommandHandler> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<Unit> Handle(UpdateDeviceCommand request, CancellationToken cancellationToken)
    {
        try
    {
        var entity = await _context.Devices.FindAsync(request.Device.DeviceImei);
        if (entity == null)
        {
            _logger.LogWarning("Device with IMEI: {DeviceImei} not found", request.Device.DeviceImei);
            return Unit.Value;
        }

        entity.DeviceMakerId = request.Device.DeviceMakerId;
        entity.DevicePhoneNumber = request.Device.DevicePhoneNumber;
        entity.DeviceType = request.Device.DeviceType;
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Device with IMEI: {DeviceImei} updated", entity.DeviceImei);

        return Unit.Value;
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Error updating device with IMEI: {DeviceImei}", request.Device.DeviceImei);
        throw new Exception("Error updating device", ex);
        
    }
    }
}
