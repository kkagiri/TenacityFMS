using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.FuelTagManagement.FuelingTags.DTOs;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.FuelTagManagement.FuelingTags.Command;

public record AssignToVehicleFuelTagCommand (AssignFuelTagToVehicleDTO AssignFuelTagDTO) : IRequest<FMSResponseMessage>;

public class AssignToVehicleFuelTagCommandHandler : IRequestHandler<AssignToVehicleFuelTagCommand, FMSResponseMessage> {
    private readonly GpsdataContext _context;
    private readonly ILogger<AssignToVehicleFuelTagCommandHandler> _logger;

    public AssignToVehicleFuelTagCommandHandler (GpsdataContext context, ILogger<AssignToVehicleFuelTagCommandHandler> logger) {
        _context = context;
        _logger = logger;
    }

    public async Task<FMSResponseMessage> Handle (AssignToVehicleFuelTagCommand request, CancellationToken cancellationToken) {
        try {
            var tag = await _context.FuelTags
                .FirstOrDefaultAsync (t => t.Id == request.AssignFuelTagDTO.TagId, cancellationToken);

            if (tag == null)
                return new FMSResponseMessage (false, "Tag not found");

            var vehicle = await _context.Vehicles
                .FirstOrDefaultAsync (v => v.VehicleId == request.AssignFuelTagDTO.VehicleId, cancellationToken);

            if (vehicle == null)
                return new FMSResponseMessage (false, "Vehicle not found");

            tag.Vehicle = vehicle;
            await _context.SaveChangesAsync (cancellationToken);

            return new FMSResponseMessage (true, "Tag successfully assigned to vehicle");
        } catch (Exception ex) {
            _logger.LogError (ex, "Error assigning tag to vehicle");
            return new FMSResponseMessage (false, "Error assigning tag to vehicle");
        }
    }
}