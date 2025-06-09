using System;
using System.Threading;
using System.Threading.Tasks;
using FMS.Domain.Entities;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Command.DatabaseCommand.DeviceManagement.DeviceTypeCommands;
public record CreateDeviceTypeCommand(Devicetype Devicetype) : IRequest<int>;
public class CreateDeviceTypeCommandHandler : IRequestHandler<CreateDeviceTypeCommand, int>
{
    private readonly GpsdataContext _context;
    private readonly ILogger<CreateDeviceTypeCommandHandler> _logger;

    public CreateDeviceTypeCommandHandler(GpsdataContext context, ILogger<CreateDeviceTypeCommandHandler> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<int> Handle(CreateDeviceTypeCommand request, CancellationToken cancellationToken)
    {
        try
        {
            await _context.Devicetypes.AddAsync(request.Devicetype, cancellationToken);
            await _context.SaveChangesAsync(cancellationToken);

            return request.Devicetype.Id;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating device type");
            throw new Exception("Error creating device type", ex);
        }
    }
}
