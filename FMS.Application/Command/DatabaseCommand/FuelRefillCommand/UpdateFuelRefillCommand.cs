using MediatR;
using Microsoft.Extensions.Logging;
using FMS.Persistence.DataAccess;
using System.Threading;
using System.Threading.Tasks;
using System;
using FMS.Application.ModelsDTOs.FMS.FuelRefil;
using AutoMapper;

namespace FMS.Application.Command.DatabaseCommand.FuelRefillCommand;

public record UpdateFuelRefillCommand(FuelRefilDTO FuelRefilDTO,int Id) : IRequest<bool>;

public class FuelRefilUpdateCommandHandler : IRequestHandler<UpdateFuelRefillCommand, bool>
{
    private readonly GpsdataContext _context;
    private readonly ILogger<FuelRefilUpdateCommandHandler> _logger;
        private readonly IMapper _mapper;

    public FuelRefilUpdateCommandHandler(GpsdataContext context, ILogger<FuelRefilUpdateCommandHandler> logger, IMapper mapper)
    {
        _context = context;
        _logger = logger;
        _mapper = mapper;
    }

    public async Task<bool> Handle(UpdateFuelRefillCommand request, CancellationToken cancellationToken)
    {
        try{
        var fuelRefil = await _context.Fuelrefils.FindAsync(new object[] { request.Id }, cancellationToken);
        if (fuelRefil == null) return false;
            
            var fuelByUser = await _context.Users.FindAsync(new object[] { request.FuelRefilDTO.FuelBy }, cancellationToken);
            var site = await _context.Sites.FindAsync(new object[] { request.FuelRefilDTO.SiteId }, cancellationToken);
            var vehicle = await _context.Vehicles.FindAsync(new object[] { request.FuelRefilDTO.VehicleId }, cancellationToken);
            var driver = request.FuelRefilDTO.DriverId.HasValue ? await _context.Employees.FindAsync(new object[] { request.FuelRefilDTO.DriverId.Value }, cancellationToken) : null;
            var pumpTransaction = request.FuelRefilDTO.PumpTranscationId.HasValue ? await _context.Pumptransactions.FindAsync(new object[] { request.FuelRefilDTO.PumpTranscationId.Value }, cancellationToken) : null;

            if (fuelByUser == null || site == null || vehicle == null || (request.FuelRefilDTO.DriverId.HasValue && driver == null) || (request.FuelRefilDTO.PumpTranscationId.HasValue && pumpTransaction == null))
            {
                _logger.LogError("Validation failed: related entities do not exist.");
                return false;
            }

            // Validate meter readings
            if (request.FuelRefilDTO.PreviousMeterReading.HasValue && request.FuelRefilDTO.CurrentMeterReading.HasValue && request.FuelRefilDTO.PreviousMeterReading > request.FuelRefilDTO.CurrentMeterReading)
            {
                _logger.LogError("Validation failed: Previous meter reading is greater than current meter reading.");
                return false;
            }
          _mapper.Map(request.FuelRefilDTO, fuelRefil);

        await _context.SaveChangesAsync(cancellationToken);
        return true;
        }
        catch(Exception ex)
        {
            _logger.LogError(ex.ToString(),"Error in UpdateFuelRefilCommandHandler");
            throw;
        }
    }
}
