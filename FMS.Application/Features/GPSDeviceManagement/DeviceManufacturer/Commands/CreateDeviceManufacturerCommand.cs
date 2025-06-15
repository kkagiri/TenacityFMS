using System;
using System.Threading;
using System.Threading.Tasks;
using FMS.Domain.Entities;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Command.DatabaseCommand.DeviceManagement.DeviceManufacturerCommands;
public record CreateDeviceManufacturerCommand(Devicemanufacturer Devicemanufacturer) : IRequest<int>;

public class CreateDeviceManufacturerCommandHandler : IRequestHandler<CreateDeviceManufacturerCommand, int>
{
    private readonly GpsdataContext _context;
    private readonly ILogger<CreateDeviceManufacturerCommandHandler> _logger;

    public CreateDeviceManufacturerCommandHandler(GpsdataContext context, ILogger<CreateDeviceManufacturerCommandHandler> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<int> Handle(CreateDeviceManufacturerCommand request, CancellationToken cancellationToken)
    {
        try
        {
            await _context.Devicemanufacturers.AddAsync(request.Devicemanufacturer, cancellationToken);
            await _context.SaveChangesAsync(cancellationToken);

            return request.Devicemanufacturer.Id;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating device manufacturer");
            throw new Exception("Error creating device manufacturer", ex);
        }
    }
}