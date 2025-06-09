using System;
using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using FMS.Application.Common;
using FMS.Application.ModelsDTOs.FMS.Tag;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Command.DatabaseCommand.TagCmd;

public record UpdateTagCommand (TagDTO TagDTO) : IRequest<FMSResponseMessage>;

public class UpdateTagCommandHandler : IRequestHandler<UpdateTagCommand, FMSResponseMessage> {
    private readonly GpsdataContext _context;
    private readonly IMapper _mapper;
    private readonly ILogger<UpdateTagCommandHandler> _logger;

    public UpdateTagCommandHandler (GpsdataContext context, IMapper mapper, ILogger<UpdateTagCommandHandler> logger) {
        _context = context;
        _mapper = mapper;
        _logger = logger;
    }

    public async Task<FMSResponseMessage> Handle (UpdateTagCommand request, CancellationToken cancellationToken) {
        try {
            var tag = await _context.Tags.FindAsync (request.TagDTO.Id, cancellationToken);

            if (tag == null)
                return new FMSResponseMessage (false, "Tag not found");

            // Validate vehicle only if VehicleId is not null
            if (request.TagDTO.VehicleId != null) {
                var vehicle = await _context.Vehicles.FindAsync (request.TagDTO.VehicleId, cancellationToken);
                if (vehicle == null) return new FMSResponseMessage (false, "Invalid vehicle ID");
            }

            // Validate fuel rule set only if FuelRuleSetId is not null
            if (request.TagDTO.FuelRuleSetId != null) {
                var fuelRuleSet = await _context.FuelingRuleSets.FindAsync (request.TagDTO.FuelRuleSetId, cancellationToken);
                if (fuelRuleSet == null) return new FMSResponseMessage (false, "Invalid fuel rule set ID");
            }

            // Check if tag is referenced in User or Fuelrefil
            bool isReferenced = await _context.Users.AnyAsync (u => u.MasterRFIDTag == tag.Id, cancellationToken) ||
                await _context.FuelRefills.AnyAsync (f => f.TagId == tag.Id.ToString (), cancellationToken);

            // Only allow name change if not referenced
            if (isReferenced && !string.Equals (tag.Name, request.TagDTO.Name, StringComparison.OrdinalIgnoreCase)) {
                return new FMSResponseMessage (false, "Cannot change tag name because it is referenced by other records.");
            }

            // Ensure new name is unique if changed
            if (!string.Equals (tag.Name, request.TagDTO.Name, StringComparison.OrdinalIgnoreCase)) {
                var nameExists = await _context.Tags.AnyAsync (
                    t => t.Name == request.TagDTO.Name && t.Id != tag.Id, cancellationToken);
                if (nameExists)
                    return new FMSResponseMessage (false, "Tag name must be unique");
            }

            // Otherwise, just update other properties
            _mapper.Map (request.TagDTO, tag);
            await _context.SaveChangesAsync (cancellationToken);
            return new FMSResponseMessage (true, "Tag updated successfully");
        } catch (Exception ex) {
            _logger.LogError (ex, "Error updating tag");
            return new FMSResponseMessage (false, "Error updating tag");
        }
    }
}