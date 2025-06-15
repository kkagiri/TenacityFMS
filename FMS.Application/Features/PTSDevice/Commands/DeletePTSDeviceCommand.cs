using FMS.Application.Common;
using FMS.Domain.Entities;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.Extensions.Logging;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace FMS.Application.Features.PTSDevice.Commands
{
    public record DeletePTSDeviceCommand(int DeviceId) : IRequest<FMSResponseMessage<Ptsdevice>>;

    public class DeletePTSDeviceCommandHandler : IRequestHandler<DeletePTSDeviceCommand, FMSResponseMessage<Ptsdevice>>
    {
        private readonly GpsdataContext _context;
        private readonly ILogger<DeletePTSDeviceCommandHandler> _logger;

        public DeletePTSDeviceCommandHandler(GpsdataContext context, ILogger<DeletePTSDeviceCommandHandler> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<FMSResponseMessage<Ptsdevice>> Handle(DeletePTSDeviceCommand request, CancellationToken cancellationToken)
        {
            try
            {
                var existingDevice = await _context.Ptsdevices.FindAsync(new object[] { request.DeviceId }, cancellationToken);
                if (existingDevice == null)
                {
                    return new FMSResponseMessage<Ptsdevice>(false, $"PTS Device with id {request.DeviceId} not found", null);
                }
                _context.Ptsdevices.Remove(existingDevice);
                await _context.SaveChangesAsync(cancellationToken);
                return new FMSResponseMessage<Ptsdevice>(true, "PTS Device deleted successfully", existingDevice);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting PTS device with id {DeviceId}", request.DeviceId);
                return new FMSResponseMessage<Ptsdevice>(false, "Error deleting PTS device", null);
            }
        }
    }
}