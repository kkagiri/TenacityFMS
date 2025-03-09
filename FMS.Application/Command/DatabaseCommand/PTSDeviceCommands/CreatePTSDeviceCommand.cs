using AutoMapper;
using FMS.Application.Common;
using FMS.Application.ModelsDTOs.FMS;
using FMS.Application.ModelsDTOs.FMS.PTSDevice;
using FMS.Domain.Entities;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.Extensions.Logging;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace FMS.Application.Command.DatabaseCommand.PTSDeviceCommands
{
    public record CreatePTSDeviceCommand(CreatePTSDeviceDTO CreatePTSDeviceDTO) : IRequest<FMSResponseMessage<Ptsdevice>>;

    public class CreatePTSDeviceCommandHandler : IRequestHandler<CreatePTSDeviceCommand, FMSResponseMessage<Ptsdevice>>
    {
        private readonly GpsdataContext _context;
        private readonly ILogger<CreatePTSDeviceCommandHandler> _logger;
        private readonly IMapper _mapper;

        public CreatePTSDeviceCommandHandler(GpsdataContext context, ILogger<CreatePTSDeviceCommandHandler> logger, IMapper mapper)
        {
            _context = context;
            _logger = logger;
            _mapper = mapper;
        }

        public async Task<FMSResponseMessage<Ptsdevice>> Handle(CreatePTSDeviceCommand request, CancellationToken cancellationToken)
        {
            try
            {
                var dto = request.CreatePTSDeviceDTO;
                // Basic validations
                if (string.IsNullOrWhiteSpace(dto.Ipaddress))
                    return new FMSResponseMessage<Ptsdevice>(false, "IP address is required", null);
                if (dto.PortNumber <= 0)
                    return new FMSResponseMessage<Ptsdevice>(false, "Port number must be greater than 0", null);
                if (string.IsNullOrWhiteSpace(dto.Login))
                    return new FMSResponseMessage<Ptsdevice>(false, "Login is required", null);
                // Map the DTO to the domain model
                Ptsdevice ptsDevice = _mapper.Map<Ptsdevice>(dto);

                // Add the new PTS device
                _context.Ptsdevices.Add(ptsDevice);
                await _context.SaveChangesAsync(cancellationToken);

                return new FMSResponseMessage<Ptsdevice>(true, "PTS Device created successfully", ptsDevice);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating PTS device");
                return new FMSResponseMessage<Ptsdevice>(false, "Error creating PTS device", null);
            }
        }
    }
}