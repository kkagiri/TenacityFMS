using System;
using System.Threading;
using System.Threading.Tasks;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Command.DatabaseCommand.DeviceManagement.DeviceCommands
{

    public record DeleteDeviceCommand(int DeviceImei) : IRequest<Unit>;
    public class DeleteDeviceCommandHandler : IRequestHandler<DeleteDeviceCommand, Unit>
    {
        private readonly GpsdataContext _context;
        private readonly ILogger<DeleteDeviceCommandHandler> _logger;

        public DeleteDeviceCommandHandler(GpsdataContext context, ILogger<DeleteDeviceCommandHandler> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<Unit> Handle(DeleteDeviceCommand request, CancellationToken cancellationToken)
        {
            try
            {
                var entity = await _context.Devices.FindAsync(request.DeviceImei);
                if (entity == null)
                {
                    _logger.LogWarning("Device with IMEI: {DeviceImei} not found", request.DeviceImei);
                    return Unit.Value;
                }

                _context.Devices.Remove(entity);
                await _context.SaveChangesAsync(cancellationToken);

                _logger.LogInformation("Device with IMEI: {DeviceImei} deleted", request.DeviceImei);

                return Unit.Value;
            }
            catch (Exception ex)
            {
                _logger.LogError("Unable to delete device with IMEI: {DeviceImei}", request.DeviceImei, ex);
                throw new Exception("Unable to delete device with IMEI: " + request.DeviceImei, ex);
            }
        }
    }
}