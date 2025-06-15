using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using FMS.Application.Common;
using FMS.Application.ModelsDTOs.FMS.Tag;
using FMS.Domain.Entities;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Command.DatabaseCommand.TagCmd {
    public record CreateTagCommand (TagDTO TagDTO) : IRequest<FMSResponseMessage<int>>;

    public class CreateTagCommandHandler : IRequestHandler<CreateTagCommand, FMSResponseMessage<int>> {
        private readonly GpsdataContext _context;
        private readonly IMapper _mapper;
        private readonly ILogger<CreateTagCommandHandler> _logger;

        public CreateTagCommandHandler (GpsdataContext context, IMapper mapper, ILogger<CreateTagCommandHandler> logger) {
            _context = context;
            _mapper = mapper;
            _logger = logger;
        }

        public async Task<FMSResponseMessage<int>> Handle (CreateTagCommand request, CancellationToken cancellationToken) {
            try {
                var tag = _mapper.Map<Tag> (request.TagDTO);

                //add validtion for vehicle id
                if (tag.VehicleId == null) {
                    return new FMSResponseMessage<int> (false, "Vehicle ID is required", 0);
                }
                //check if vehicle id is valid
                var vehicle = await _context.Vehicles.FindAsync (tag.VehicleId);
                if (vehicle == null) return new FMSResponseMessage<int> (false, "Invalid vehicle ID", 0);

                //check if fuel rule set id is valid
                var fuelRuleSet = await _context.FuelingRuleSets.FindAsync (tag.FuelRuleSetId);
                if (fuelRuleSet == null) return new FMSResponseMessage<int> (false, "Invalid fuel rule set ID", 0);

                _context.Tags.Add (tag);
                await _context.SaveChangesAsync (cancellationToken);

                return new FMSResponseMessage<int> (true, "Tag created successfully", tag.Id);
            } catch (DbUpdateException dbEx) {
                if (dbEx.InnerException != null && dbEx.InnerException.Message.Contains ("Duplicate entry")) {
                    return new FMSResponseMessage<int> (false, "A tag with this name already exists.", 0);
                }
                return new FMSResponseMessage<int> (false, "Database error: " + dbEx.InnerException?.Message ?? dbEx.Message, 0);
            } catch (Exception ex) {
                _logger.LogError (ex, "Error creating tag");
                return new FMSResponseMessage<int> (false, "Unexpected error: " + ex.Message, 0);
            }
        }
    }
}