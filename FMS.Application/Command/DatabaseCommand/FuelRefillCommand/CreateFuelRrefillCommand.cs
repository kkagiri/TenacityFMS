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
using FMS.Application.Common;
using FMS.Domain.Entities.enums;

namespace FMS.Application.Command.DatabaseCommand.FuelRefillCommand;

public record FuelRefilCreateCommand(FuelRefilDTO FuelRefilDTO) : IRequest<FMSResponseMessage>;

public class FuelRefilCreateCommandHandler : IRequestHandler<FuelRefilCreateCommand, FMSResponseMessage>
{
    private readonly GpsdataContext _context;
    private readonly IMapper _mapper;
    private readonly ILogger<FuelRefilCreateCommandHandler> _logger;

    public FuelRefilCreateCommandHandler(GpsdataContext context, ILogger<FuelRefilCreateCommandHandler> logger, IMapper mapper)
    {
        _context = context;
        _logger = logger;
        _mapper = mapper;
    }

    public async Task<FMSResponseMessage> Handle(FuelRefilCreateCommand request, CancellationToken cancellationToken)
    {
        using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);
        try
        {

            var fuelRefilDto = request.FuelRefilDTO;

            if (request.FuelRefilDTO.ManualFuelrefilAmount <= 0) return new FMSResponseMessage(false, "Fuel refill amount should be greater than 0.");


            // Validate related entities existence
            var vehicle = await _context.Vehicles.FindAsync(new object[] { fuelRefilDto.VehicleId }, cancellationToken);
            if (vehicle == null) return new FMSResponseMessage(false, $"Vehicle with ID {fuelRefilDto.VehicleId} does not exist.");

            var site = await _context.Sites.FindAsync(new object[] { fuelRefilDto.SiteId }, cancellationToken);
            if (site == null) return new FMSResponseMessage(false, $"Site with ID {fuelRefilDto.SiteId} does not exist.");


            var tank = await _context.Tanks.FindAsync(new object[] { fuelRefilDto.TankId }, cancellationToken);
            if (tank == null) return new FMSResponseMessage(false, $"Tank with ID {fuelRefilDto.TankId} does not exist.");

            if (tank.CurrentStock <= 0) return new FMSResponseMessage(false, "The tank is empty. Please check if the opening stock has been set correctly.");

            if (tank.CurrentStock < fuelRefilDto.ManualFuelrefilAmount) return new FMSResponseMessage(false, $"Insufficient fuel in the tank. Current stock: {tank.CurrentStock}, Requested amount: {fuelRefilDto.ManualFuelrefilAmount}");


            var fuelByUser = await _context.Users.FindAsync(new object[] { fuelRefilDto.FuelBy }, cancellationToken);
            if (fuelByUser == null) return new FMSResponseMessage(false, $"User with ID {fuelRefilDto.FuelBy} does not exist.");

            if (fuelRefilDto.DriverId.HasValue)
            {
                var driver = await _context.Employees.FindAsync(new object[] { fuelRefilDto.DriverId.Value }, cancellationToken);
                if (driver == null) return new FMSResponseMessage(false, $"Driver with ID {fuelRefilDto.DriverId.Value} does not exist.");
            }

            if (fuelRefilDto.PumpTranscationId.HasValue)
            {
                var pumpTransaction = await _context.Pumptransactions.FindAsync(new object[] { fuelRefilDto.PumpTranscationId.Value }, cancellationToken);
                if (pumpTransaction == null) return new FMSResponseMessage(false, $"PumpTransaction with ID {fuelRefilDto.PumpTranscationId.Value} does not exist.");
            }

            // Validate meter readings
            if (fuelRefilDto.PreviousMeterReading.HasValue && fuelRefilDto.CurrentMeterReading.HasValue &&
                fuelRefilDto.PreviousMeterReading >= fuelRefilDto.CurrentMeterReading)
            {
                return new FMSResponseMessage(false, "Previous meter reading should be smaller than current meter reading.");
            }
            request.FuelRefilDTO.DateCreated = DateTime.UtcNow;
            request.FuelRefilDTO.DateModified = DateTime.UtcNow;
            var fuelRefil = _mapper.Map<Fuelrefil>(fuelRefilDto);
            fuelRefil.IsModified = false ? (sbyte)1 : (sbyte)0;

            _context.Fuelrefils.Add(fuelRefil);

            // Update tank stock
            tank.CurrentStock -= (decimal)fuelRefil.ManualFuelrefilAmount;
            tank.LastStockUpdate = DateTime.Now;


            var tankVolumeHistory = new TankVolumeHistory
            {
                ChangeReason = VolumeChangeReasonEnum.Dispensing,
                Timestamp = DateTime.Now,
                TankId = tank.Id,
                VolumeChange = -(decimal)fuelRefil.ManualFuelrefilAmount,
                NewVolume = tank.CurrentStock,
                RecordedBy = fuelRefil.FuelBy,

            };



            _context.TankVolumeHistories.Add(tankVolumeHistory);


            await _context.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);

            return new FMSResponseMessage<Fuelrefil>(true, "Fuel refill created successfully.", fuelRefil);
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync(cancellationToken);
            _logger.LogError(ex, "Error creating fuel refill");
            return new FMSResponseMessage(false, ex.Message);
        }
    }
}




