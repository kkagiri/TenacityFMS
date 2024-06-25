using System;
using System.Threading;
using System.Threading.Tasks;
using FMS.Domain.Entities;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Command.DatabaseCommand.DeviceManagement.DeviceModelCommands;

public record CreateDeviceModelCommand(Devicemodel Devicemodel) : IRequest<int>;

public class CreateDeviceModelCommandHandler : IRequestHandler<CreateDeviceModelCommand, int>
{
    private readonly GpsdataContext _context;
    private readonly ILogger<CreateDeviceModelCommandHandler> _logger;

    public CreateDeviceModelCommandHandler(GpsdataContext context, ILogger<CreateDeviceModelCommandHandler> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<int> Handle(CreateDeviceModelCommand request, CancellationToken cancellationToken)
    {
        try
        {
            var deviceManufacturer = await _context.Devicemanufacturers.FindAsync(request.Devicemodel.DevicemanufacturerId, cancellationToken);
            if(deviceManufacturer == null) throw new Exception($"DeviceManufacturer {request.Devicemodel.DevicemanufacturerId} not found. Try adding Manufacturer first");
            await _context.Devicemodels.AddAsync(request.Devicemodel, cancellationToken);
            await _context.SaveChangesAsync(cancellationToken);

            return request.Devicemodel.Id;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating device model");
            throw new Exception("Error creating device model", ex);
        }
    }

  
}
