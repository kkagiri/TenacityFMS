using AutoMapper;
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
    public record UpdatePTSDeviceCommand(int DeviceId, Ptsdevice UpdatedPTSDevice) : IRequest<FMSResponseMessage<Ptsdevice>>;

    public class UpdatePTSDeviceCommandHandler : IRequestHandler<UpdatePTSDeviceCommand, FMSResponseMessage<Ptsdevice>>
    {
        private readonly GpsdataContext _context;
        private readonly ILogger<UpdatePTSDeviceCommandHandler> _logger;
        private readonly IMapper _mapper;

        public UpdatePTSDeviceCommandHandler(GpsdataContext context, ILogger<UpdatePTSDeviceCommandHandler> logger, IMapper mapper)
        {
            _context = context;
            _logger = logger;
            _mapper = mapper;
        }

        public async Task<FMSResponseMessage<Ptsdevice>> Handle(UpdatePTSDeviceCommand request, CancellationToken cancellationToken)
        {
            try
            {
                var existingDevice = await _context.Ptsdevices.FindAsync(new object[] { request.DeviceId }, cancellationToken);
                if (existingDevice == null)
                {
                    return new FMSResponseMessage<Ptsdevice>(false, $"PTS Device with id {request.DeviceId} not found", null);
                }
                _mapper.Map(request.UpdatedPTSDevice, existingDevice);
                _context.Ptsdevices.Update(existingDevice);
                await _context.SaveChangesAsync(cancellationToken);
                return new FMSResponseMessage<Ptsdevice>(true, "PTS Device updated successfully", existingDevice);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating PTS device with id {DeviceId}", request.DeviceId);
                return new FMSResponseMessage<Ptsdevice>(false, "Error updating PTS device", null);
            }
        }
    }
}