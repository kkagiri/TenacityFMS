using System;
using System.Threading;
using System.Threading.Tasks;
using FMS.Domain.Entities;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Command.DatabaseCommand.DeviceManagement.DeviceModelCommands;

public record UpdateDeviceModelCommand(Devicemodel Devicemodel) : IRequest<Unit>;

public class UpdateDeviceModelCommandHandler : IRequestHandler<UpdateDeviceModelCommand, Unit>
{
    private readonly GpsdataContext _context;
    private readonly ILogger<UpdateDeviceModelCommandHandler> _logger;

    public UpdateDeviceModelCommandHandler(GpsdataContext context, ILogger<UpdateDeviceModelCommandHandler> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<Unit> Handle(UpdateDeviceModelCommand request, CancellationToken cancellationToken)
    {
        try
        {
            var entity = await _context.Devicemodels.FindAsync(request.Devicemodel.Id);
            if (entity == null)
            {
                _logger.LogWarning("Device model with ID: {Id} not found", request.Devicemodel.Id);
                return Unit.Value;
            }

            entity.Name = request.Devicemodel.Name;
            entity.DevicemanufacturerId = request.Devicemodel.DevicemanufacturerId;
            await _context.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("Device model with ID: {Id} updated", entity.Id);

            return Unit.Value;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating device model");
            throw new Exception("Error updating device model", ex);
        }
    }
}