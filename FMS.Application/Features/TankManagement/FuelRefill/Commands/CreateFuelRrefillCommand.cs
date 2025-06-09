using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using AutoMapper.Configuration.Annotations;
using FMS.Application.Command.DatabaseCommand.TankVolumeHistoryCommand;
using FMS.Application.Common;
using FMS.Application.ModelsDTOs.FMS.FuelRefil;
using FMS.Domain.Entities;
using FMS.Domain.Entities.enums;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Command.DatabaseCommand.FuelRefillCommand;

public record FuelRefilCreateCommand (FuelRefilDTO FuelRefilDTO) : IRequest<FMSResponseMessage>;

public class FuelRefilCreateCommandHandler : IRequestHandler<FuelRefilCreateCommand, FMSResponseMessage> {
    private readonly GpsdataContext _context;
    private readonly IMapper _mapper;
    private readonly ILogger<FuelRefilCreateCommandHandler> _logger;
    private readonly IMediator _mediator;

    public FuelRefilCreateCommandHandler (GpsdataContext context, ILogger<FuelRefilCreateCommandHandler> logger, IMapper mapper, IMediator mediator) {
        _context = context;
        _logger = logger;
        _mapper = mapper;
        _mediator = mediator;
    }

    public async Task<FMSResponseMessage> Handle (FuelRefilCreateCommand request, CancellationToken cancellationToken) {
        try {

            var fuelRefilDto = request.FuelRefilDTO;

            var entryDate = request.FuelRefilDTO?.Date ?? DateTime.Now;
            //TODO: Insert check for configuration enforcement to use start of day for opening check
            // Check if there is opening stock for the tank on the entry day
            var existingOpeningStock = await _context.TankVolumeHistories
                .Where (x => x.TankId == request.FuelRefilDTO.TankId &&
                    x.Timestamp.Date.Date == entryDate.Date.Date &&
                    x.ChangeReason == VolumeChangeReasonEnum.OpeningStock)
                .OrderByDescending (x => x.Timestamp.Date)
                .FirstOrDefaultAsync (cancellationToken);

            if (existingOpeningStock == null) return new FMSResponseMessage (false, $"Opening stock for the tank on {entryDate.Date} not found Create A new Opening Stock ");

            var existingRefuel = await _context.Fuelrefils
                .FirstOrDefaultAsync (f =>
                    f.VehicleId == fuelRefilDto.VehicleId &&
                    f.Date.Value.Date == fuelRefilDto.Date.Value.Date &&
                    f.PreviousMeterReading == fuelRefilDto.PreviousMeterReading &&
                    f.CurrentMeterReading == fuelRefilDto.CurrentMeterReading &&
                    f.ManualFuelrefilAmount == fuelRefilDto.ManualFuelrefilAmount,
                    cancellationToken);

            if (existingRefuel != null) return new FMSResponseMessage (false, "Duplicate entry: A fuel refill with the same details already exists for this vehicle on the specified date.");

            if (request.FuelRefilDTO.ManualFuelrefilAmount <= 0) return new FMSResponseMessage (false, "Fuel refill amount should be greater than 0.");

            var vehicle = await _context.Vehicles
                .AsNoTracking ()
                .Include (v => v.WorkingSite)
                .FirstOrDefaultAsync (v => v.VehicleId == fuelRefilDto.VehicleId, cancellationToken);
            // Validate related entities existence
            if (vehicle == null) return new FMSResponseMessage (false, $"Vehicle with ID {fuelRefilDto.VehicleId} does not exist.");

            var site = await _context.Sites.FindAsync (new object[] { fuelRefilDto.SiteId }, cancellationToken);
            if (site == null) return new FMSResponseMessage (false, $"Site with ID {fuelRefilDto.SiteId} does not exist.");

            var tank = await _context.Tanks.FindAsync (new object[] { fuelRefilDto.TankId }, cancellationToken);

            if (tank == null) return new FMSResponseMessage (false, $"Tank with ID {fuelRefilDto.TankId} does not exist.");

            // Check if the tank is using book keeping
            if (tank.UseBookKeeping == 1) {
                // Always validate tank has fuel regardless of entry date
                if (tank.CurrentStock == null || tank.CurrentStock <= 0)
                    return new FMSResponseMessage (false, "The tank is empty. Please check if the opening stock has been set correctly.");

                if (tank.CurrentStock < fuelRefilDto.ManualFuelrefilAmount)
                    return new FMSResponseMessage (false, $"Insufficient fuel in the tank. Current stock: {tank.CurrentStock}, Requested amount: {fuelRefilDto.ManualFuelrefilAmount}");

                // For past date entries, check available fuel on that date using TankVolumeHistory
                if (entryDate.Date < DateTime.Now.Date) {
                    // Get all volume changes up to the entry date
                    var volumeHistoryForDay = await _context.TankVolumeHistories
                        .Where (x => x.TankId == tank.Id && x.Timestamp.Date <= entryDate.Date)
                        .OrderByDescending (x => x.Timestamp)
                        .FirstOrDefaultAsync (cancellationToken);

                    if (volumeHistoryForDay != null) {
                        decimal availableFuelOnDate = volumeHistoryForDay.NewVolume ?? 0;

                        if (availableFuelOnDate <= 0)
                            return new FMSResponseMessage (false, $"The tank was empty on {entryDate.Date:d}. Cannot record fuel dispensing.");

                        if (availableFuelOnDate < fuelRefilDto.ManualFuelrefilAmount)
                            return new FMSResponseMessage (false, $"Insufficient fuel in the tank on {entryDate.Date:d}. Available: {availableFuelOnDate}, Requested: {fuelRefilDto.ManualFuelrefilAmount}");
                    }
                }
            }

            var fuelByUser = await _context.Users.FindAsync (new object[] { fuelRefilDto.FuelBy }, cancellationToken);
            if (fuelByUser == null) return new FMSResponseMessage (false, $"User with ID {fuelRefilDto.FuelBy} does not exist.");

            if (fuelRefilDto.DriverId.HasValue) {
                var driver = await _context.Employees.FindAsync (new object[] { fuelRefilDto.DriverId.Value }, cancellationToken);
                if (driver == null) return new FMSResponseMessage (false, $"Driver with ID {fuelRefilDto.DriverId.Value} does not exist.");
            }

            if (fuelRefilDto.PumpTranscationId.HasValue) {
                var pumpTransaction = await _context.Pumptransactions.FindAsync (new object[] { fuelRefilDto.PumpTranscationId.Value }, cancellationToken);
                if (pumpTransaction == null) return new FMSResponseMessage (false, $"PumpTransaction with ID {fuelRefilDto.PumpTranscationId.Value} does not exist.");
            }

            // Validate meter readings
            if (fuelRefilDto.PreviousMeterReading.HasValue && fuelRefilDto.CurrentMeterReading.HasValue &&
                fuelRefilDto.PreviousMeterReading >= fuelRefilDto.CurrentMeterReading) {
                return new FMSResponseMessage (false, "Previous meter reading should be smaller than current meter reading.");
            }
            request.FuelRefilDTO.DateCreated = DateTime.UtcNow.ToString ();
            request.FuelRefilDTO.DateModified = DateTime.UtcNow;
            var fuelRefil = _mapper.Map<Fuelrefil> (fuelRefilDto);
            fuelRefil.IsModified = false ? (sbyte) 1 : (sbyte) 0;

            _context.Fuelrefils.Add (fuelRefil);

            // We check if the tank is using book keeping and update the stock accordingly
            if (tank.UseBookKeeping == 1) {
                //check if the date of the fuel refill is today or past date
                var today = DateTime.Now.Date;

                if (entryDate.Date == today) {
                    // Final check to prevent negative stock (defensive programming)
                    if (tank.CurrentStock == null || tank.CurrentStock - (decimal) fuelRefil.ManualFuelrefilAmount < 0) {
                        return new FMSResponseMessage (false, "Operation would result in negative tank level. Cannot proceed.");
                    }

                    tank.CurrentStock -= (decimal) fuelRefil.ManualFuelrefilAmount;
                    tank.LastStockUpdate = DateTime.Now;
                }
            }

            await _context.SaveChangesAsync (cancellationToken);

            var tankVolumeHistory = new TankVolumeHistory {
                ChangeReason = VolumeChangeReasonEnum.Dispensing,
                Timestamp = request.FuelRefilDTO.Date.Value,
                TankId = tank.Id,
                VolumeChange = -(decimal) fuelRefil.ManualFuelrefilAmount,
                NewVolume = tank.CurrentStock ?? 0,
                RecordedBy = fuelRefil.FuelBy,
                ReferenceId = fuelRefil.Id,
                ReferenceType = "Dispense"
            };

            _context.TankVolumeHistories.Add (tankVolumeHistory);

            await _context.SaveChangesAsync (cancellationToken);

            return new FMSResponseMessage<Fuelrefil> (true, "Fuel refill created successfully.", fuelRefil);
        } catch (Exception ex) {
            _logger.LogError (ex, "Error creating fuel refill");
            return new FMSResponseMessage (false, ex.Message);
        }
    }
}