using MediatR;
using Microsoft.Extensions.Logging;
using FMS.Persistence.DataAccess;
using System;
using System.Threading;
using FMS.Domain.Entities;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using FMS.Application.ModelsDTOs.FMS.FuelRefil;
using AutoMapper;

namespace FMS.Application.Command.DatabaseCommand.FuelRefillCommand;

public record FuelRefilCreateCommand(FuelRefilDTO FuelRefilDTO) : IRequest<FuelRefillCreateCommandResults>;

public class FuelRefilCreateCommandHandler : IRequestHandler<FuelRefilCreateCommand, FuelRefillCreateCommandResults>
{
    private readonly GpsdataContext _context;
        private readonly IMapper _mapper;
    private readonly ILogger<FuelRefilCreateCommandHandler> _logger;

    public FuelRefilCreateCommandHandler(GpsdataContext context, ILogger<FuelRefilCreateCommandHandler> logger , IMapper mapper)
    {
        _context = context;
        _logger = logger;
        _mapper = mapper;
    }

    public async Task<FuelRefillCreateCommandResults> Handle(FuelRefilCreateCommand request, CancellationToken cancellationToken)
    {

        try{

         var fuelRefilDto = request.FuelRefilDTO;

            // Validate related entities existence
            var vehicle = await _context.Vehicles.FindAsync(new object[] { fuelRefilDto.VehicleId }, cancellationToken);
            if (vehicle == null) return new FuelRefillCreateCommandResults(false,$"Vehicle with ID {fuelRefilDto.VehicleId} does not exist.");

            var site = await _context.Sites.FindAsync(new object[] { fuelRefilDto.SiteId }, cancellationToken);
            if (site == null) return new FuelRefillCreateCommandResults(false,$"Site with ID {fuelRefilDto.SiteId} does not exist.");

            var fuelByUser = await _context.Users.FindAsync(new object[] { fuelRefilDto.FuelBy }, cancellationToken);
            if (fuelByUser == null) return new FuelRefillCreateCommandResults(false, $"User with ID {fuelRefilDto.FuelBy} does not exist.");

            if (fuelRefilDto.DriverId.HasValue)
            {
                var driver = await _context.Employees.FindAsync(new object[] { fuelRefilDto.DriverId.Value }, cancellationToken);
                if (driver == null) return new FuelRefillCreateCommandResults(false,$"Driver with ID {fuelRefilDto.DriverId.Value} does not exist.");
            }

            if (fuelRefilDto.PumpTranscationId.HasValue)
            {
                var pumpTransaction = await _context.Pumptransactions.FindAsync(new object[] { fuelRefilDto.PumpTranscationId.Value }, cancellationToken);
                if (pumpTransaction == null) return new FuelRefillCreateCommandResults(false, $"PumpTransaction with ID {fuelRefilDto.PumpTranscationId.Value} does not exist.");
            }

            // Validate meter readings
            if (fuelRefilDto.PreviousMeterReading.HasValue && fuelRefilDto.CurrentMeterReading.HasValue &&
                fuelRefilDto.PreviousMeterReading >= fuelRefilDto.CurrentMeterReading)
            {
                return new FuelRefillCreateCommandResults(false, "Previous meter reading should be smaller than current meter reading.");
            }

            var fuelRefil = _mapper.Map<Fuelrefil>(fuelRefilDto);

            _context.Fuelrefils.Add(fuelRefil);
            await _context.SaveChangesAsync(cancellationToken);

            return new FuelRefillCreateCommandResults(true,"Fuel refill created successfully.");
        }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Error creating fuel refill");
            return new FuelRefillCreateCommandResults(false,ex.Message);
    }
    }


}


public record FuelRefillCreateCommandResults(bool Success, string Message);