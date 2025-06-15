using System;
using System.Threading;
using System.Threading.Tasks;
using FMS.Domain.Entities;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Command.DatabaseCommand.IssueTrackerCommands.Devices;

// Command record for device status
public record DeviceCreateCommand(Device device) : IRequest<int>;

// Command handler for device status creation
public class DeviceCreateCommandHandler : IRequestHandler<DeviceCreateCommand, int>
{
    private readonly GpsdataContext _context;
    private readonly IMediator _mediator;
    private readonly ILogger<DeviceCreateCommandHandler> _logger;

    public DeviceCreateCommandHandler(GpsdataContext context, IMediator mediator, ILogger<DeviceCreateCommandHandler> logger)
    {
        _context = context;
        _mediator = mediator;
        _logger = logger;
    }

    public async Task<int> Handle(DeviceCreateCommand request, CancellationToken cancellationToken)
    {
        try
        {
            await _context.Devices.AddAsync(request.device, cancellationToken);
            await _context.SaveChangesAsync(cancellationToken);
            return request.device.DeviceImei;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating device status");
            throw;
        }
    }
}
