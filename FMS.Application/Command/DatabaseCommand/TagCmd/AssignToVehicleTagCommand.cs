using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.ModelsDTOs.FMS.Tag;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Command.DatabaseCommand.TagCmd;

public record AssignToVehicleTagCommand(AssignTagToVehicleDTO AssignTagDTO) : IRequest<FMSResponseMessage>;

public class AssignToVehicleTagCommandHandler : IRequestHandler<AssignToVehicleTagCommand, FMSResponseMessage>
{
    private readonly GpsdataContext _context;
    private readonly ILogger<AssignToVehicleTagCommandHandler> _logger;

    public AssignToVehicleTagCommandHandler(GpsdataContext context, ILogger<AssignToVehicleTagCommandHandler> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<FMSResponseMessage> Handle(AssignToVehicleTagCommand request, CancellationToken cancellationToken)
    {
        try
        {
            var tag = await _context.Tags
            .FirstOrDefaultAsync(t => t.Id == request.AssignTagDTO.TagId, cancellationToken);

            if (tag == null)
                return new FMSResponseMessage(false, "Tag not found");

            var vehicle = await _context.Vehicles
                .FirstOrDefaultAsync(v => v.VehicleId == request.AssignTagDTO.VehicleId, cancellationToken);

            if (vehicle == null)
                return new FMSResponseMessage(false, "Vehicle not found");



            tag.Vehicle = vehicle;
            await _context.SaveChangesAsync(cancellationToken);

            return new FMSResponseMessage(true, "Tag successfully assigned to vehicle");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error assigning tag to vehicle");
            return new FMSResponseMessage(false, "Error assigning tag to vehicle");
        }
    }
}
