using MediatR;
using Microsoft.Extensions.Logging;
using FMS.Persistence.DataAccess;
using System.Threading;
using System.Threading.Tasks;
using System;
using FMS.Application.ModelsDTOs.FMS.FuelRefil;
using AutoMapper;
using FMS.Application.Common;
using AutoMapper.Configuration.Annotations;
using FMS.Application.Command.DatabaseCommand.TankVolumeHistoryCommand;
using FMS.Domain.Entities.enums;
using FMS.Domain.Entities;
using static Microsoft.EntityFrameworkCore.DbLoggerCategory;

namespace FMS.Application.Command.DatabaseCommand.FuelRefillCommand;

public record UpdateFuelRefillCommand(FuelRefilDTO FuelRefilDTO,int Id) : IRequest<FMSResponseMessage>;

public class FuelRefilUpdateCommandHandler : IRequestHandler<UpdateFuelRefillCommand, FMSResponseMessage>
{
    private readonly GpsdataContext _context;
    private readonly ILogger<FuelRefilUpdateCommandHandler> _logger;
        private readonly IMapper _mapper;
    private readonly IMediator _mediator;

    public FuelRefilUpdateCommandHandler(GpsdataContext context, ILogger<FuelRefilUpdateCommandHandler> logger, IMapper mapper, IMediator mediator)
    {
        _context = context;
        _logger = logger;
        _mapper = mapper;
        _mediator = mediator;
    }

    public async Task<FMSResponseMessage> Handle(UpdateFuelRefillCommand request, CancellationToken cancellationToken)
    {
        using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);
        try
        {
        var fuelRefil = await _context.Fuelrefils.FindAsync(new object[] { request.Id }, cancellationToken);


             if (fuelRefil == null) return new FMSResponseMessage(false,$"No data Found with the Id {request.Id}");
            
            var originalAmount = fuelRefil.ManualFuelrefilAmount;
            var originalDate = fuelRefil.DateCreated;


            var fuelByUser = await _context.Users.FindAsync(new object[] { request.FuelRefilDTO.FuelBy }, cancellationToken);
            var site = await _context.Sites.FindAsync(new object[] { request.FuelRefilDTO.SiteId }, cancellationToken);
            var vehicle = await _context.Vehicles.FindAsync(new object[] { request.FuelRefilDTO.VehicleId }, cancellationToken);
            var driver = request.FuelRefilDTO.DriverId.HasValue ? await _context.Employees.FindAsync(new object[] { request.FuelRefilDTO.DriverId.Value }, cancellationToken) : null;
            var pumpTransaction = request.FuelRefilDTO.PumpTranscationId.HasValue ? await _context.Pumptransactions.FindAsync(new object[] { request.FuelRefilDTO.PumpTranscationId.Value }, cancellationToken) : null;
            var tank = await _context.Tanks.FindAsync(new object[] { fuelRefil.TankId }, cancellationToken);

            if (fuelByUser == null || site == null || vehicle == null || (request.FuelRefilDTO.DriverId.HasValue && driver == null) || (request.FuelRefilDTO.PumpTranscationId.HasValue && pumpTransaction == null))return new FMSResponseMessage(false, "Related entities do not exist.");
          // Validate meter readings
            if (request.FuelRefilDTO.PreviousMeterReading.HasValue && request.FuelRefilDTO.CurrentMeterReading.HasValue && request.FuelRefilDTO.PreviousMeterReading > request.FuelRefilDTO.CurrentMeterReading) return new FMSResponseMessage(false, "Previous meter reading cannot be greater than current meter reading.");
            

        // Map DTO to entity, excluding DateCreated and DateModified
        _mapper.Map(request.FuelRefilDTO, fuelRefil);

        // Restore original DateCreated and set DateModified
        fuelRefil.DateCreated = originalDate;
        fuelRefil.DateModified = DateTime.Now;
        fuelRefil.IsModified = 1;

        var amountDifference = fuelRefil.ManualFuelrefilAmount - originalAmount;
            if (amountDifference > tank.CurrentStock)
            {
                return new FMSResponseMessage(false, "Insufficient fuel in the tank for this adjustment.");
            }

            // Update the tank's current stock
// If amountDifference is positive (more fuel used), decrease the stock
// If amountDifference is negative (less fuel used), increase the stock
            tank.CurrentStock -= amountDifference;
            tank.LastStockUpdate = DateTime.Now;



            if (amountDifference != 0)
            {
                var tankHistory = new TankVolumeHistory
                {
                    TankId = tank.Id,
                    Timestamp = DateTime.Now,
                    VolumeChange = -amountDifference,
                    NewVolume = tank.CurrentStock,
                    ChangeReason = VolumeChangeReasonEnum.Adjustment,
                    RecordedBy = fuelByUser.Id
                };
                _context.TankVolumeHistories.Add(tankHistory);
            }
            



        await _context.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);
        return new FMSResponseMessage(true,"Update SuccessFully");
        }
        catch(Exception ex)
        {
            await transaction.RollbackAsync(cancellationToken);
            _logger.LogError(ex.ToString(),"Error in UpdateFuelRefilCommandHandler");
            throw;
        }
    }
}
