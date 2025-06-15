using System;
using System.Threading;
using System.Threading.Tasks;
using FMS.Domain.Entities;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Command.DatabaseCommand.DeviceManagement.DeviceCommands;

public record CreateDeviceCommand(Device Device) : IRequest<int>;

public class CreateDeviceCommandHandler : IRequestHandler<CreateDeviceCommand, int>
{
    private readonly GpsdataContext _context;
    private readonly ILogger<CreateDeviceCommandHandler> _logger;

    public CreateDeviceCommandHandler(GpsdataContext context, ILogger<CreateDeviceCommandHandler> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<int> Handle(CreateDeviceCommand request, CancellationToken cancellationToken)
    {
        try
        {
            await _context.Devices.AddAsync(request.Device, cancellationToken);
            await _context.SaveChangesAsync(cancellationToken);

            return request.Device.DeviceImei;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating device");
            throw new Exception("Error creating device", ex);
        }
    }
}