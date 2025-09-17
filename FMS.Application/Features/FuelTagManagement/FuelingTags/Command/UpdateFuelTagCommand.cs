using System;
using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using FMS.Application.Common;
using FMS.Application.Features.FuelTagManagement.FuelingTags.DTOs;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.FuelTagManagement.FuelingTags.Command;

public record UpdateFuelTagCommand (FuelTagDTO fuelTagDTO) : IRequest<FMSResponseMessage>;

public class UpdateFuelTagCommandHandler : IRequestHandler<UpdateFuelTagCommand, FMSResponseMessage> {
    private readonly GpsdataContext _context;
    private readonly IMapper _mapper;
    private readonly ILogger<UpdateFuelTagCommandHandler> _logger;

    public UpdateFuelTagCommandHandler (GpsdataContext context, IMapper mapper, ILogger<UpdateFuelTagCommandHandler> logger) {
        _context = context;
        _mapper = mapper;
        _logger = logger;
    }

    public async Task<FMSResponseMessage> Handle (UpdateFuelTagCommand request, CancellationToken cancellationToken) {
        try {
            var fuelTag = await _context.FuelTags.FindAsync (request.fuelTagDTO.Id, cancellationToken);

            if (fuelTag == null)
                return new FMSResponseMessage (false, "Tag not found");

            // Validate vehicle only if VehicleId is not null
            if (request.fuelTagDTO.VehicleId != null) {
                var vehicle = await _context.Vehicles.FindAsync (request.fuelTagDTO.VehicleId, cancellationToken);
                if (vehicle == null) return new FMSResponseMessage (false, "Invalid vehicle ID");
            }

            // Validate fuel rule set only if FuelRuleSetId is not null
            if (request.fuelTagDTO.FuelRuleSetId != null) {
                var fuelRuleSet = await _context.FuelingRuleSets.FindAsync (request.fuelTagDTO.FuelRuleSetId, cancellationToken);
                if (fuelRuleSet == null) return new FMSResponseMessage (false, "Invalid fuel rule set ID");
            }

            // Check if tag is referenced in User or Fuelrefil
            bool isReferenced = await _context.Users.AnyAsync (u => u.MasterRFIDTag == fuelTag.Id, cancellationToken) ||
                await _context.FuelRefills.AnyAsync (f => f.TagId == fuelTag.Id.ToString (), cancellationToken);

            // Only allow name change if not referenced
            if (isReferenced && !string.Equals (fuelTag.Name, request.fuelTagDTO.Name, StringComparison.OrdinalIgnoreCase)) {
                return new FMSResponseMessage (false, "Cannot change tag name because it is referenced by other records.");
            }

            // Ensure new name is unique if changed
            if (!string.Equals (fuelTag.Name, request.fuelTagDTO.Name, StringComparison.OrdinalIgnoreCase)) {
                var nameExists = await _context.FuelTags.AnyAsync (
                    t => t.Name == request.fuelTagDTO.Name && t.Id != fuelTag.Id, cancellationToken);
                if (nameExists)
                    return new FMSResponseMessage (false, "Tag name must be unique");
            }

            // Otherwise, just update other properties
            _mapper.Map (request.fuelTagDTO, fuelTag);
            await _context.SaveChangesAsync (cancellationToken);
            return new FMSResponseMessage (true, "Tag updated successfully");
        } catch (Exception ex) {
            _logger.LogError (ex, "Error updating tag");
            return new FMSResponseMessage (false, "Error updating tag");
        }
    }
}