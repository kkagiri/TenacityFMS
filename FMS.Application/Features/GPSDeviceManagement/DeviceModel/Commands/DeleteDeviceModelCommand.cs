using System;
using System.Threading;
using System.Threading.Tasks;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Command.DatabaseCommand.DeviceManagement.DeviceModelCommands;

public record DeleteDeviceModelCommand(int Id) : IRequest<Unit>;

public class DeleteDeviceModelCommandHandler : IRequestHandler<DeleteDeviceModelCommand, Unit>
{
    private readonly GpsdataContext _context;
    private readonly ILogger<DeleteDeviceModelCommandHandler> _logger;

    public DeleteDeviceModelCommandHandler(GpsdataContext context, ILogger<DeleteDeviceModelCommandHandler> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<Unit> Handle(DeleteDeviceModelCommand request, CancellationToken cancellationToken)
    {
        try
        {
            var entity = await _context.Devicemodels.FindAsync(request.Id);
            if (entity == null)
            {
                _logger.LogWarning("Device model with ID: {Id} not found", request.Id);
                return Unit.Value;
            }

            _context.Devicemodels.Remove(entity);
            await _context.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("Device model with ID: {Id} deleted", request.Id);

            return Unit.Value;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting device model with ID: {Id}", request.Id);
            throw new Exception("Error deleting device mode ");
        }
    }
}