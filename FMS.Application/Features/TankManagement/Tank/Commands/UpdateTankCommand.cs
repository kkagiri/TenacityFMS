using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using FMS.Application.Features.FMS.Tank;
using FMS.Domain.Entities.Enums;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Command.DatabaseCommand.TankCommands
{
    public record UpdateTankCommand(int Id, TankDTO Tank) : IRequest<bool>;

    public class UpdateTankCommandHandler : IRequestHandler<UpdateTankCommand, bool>
    {
        private readonly GpsdataContext _context;
        private readonly IMapper _mapper;
        private readonly ILogger<UpdateTankCommandHandler> _logger;

        public UpdateTankCommandHandler(GpsdataContext context, IMapper mapper, ILogger<UpdateTankCommandHandler> logger)
        {
            _context = context;
            _mapper = mapper;
            _logger = logger;
        }

        public async Task<bool> Handle(UpdateTankCommand request, CancellationToken cancellationToken)
        {
            try
            {
                var tank = await _context.Tanks.FindAsync(request.Id);
                if (tank == null)
                {
                    return false;
                }

                // Direct property assignment instead of AutoMapper
                // Basic Info
                tank.Name = request.Tank.Name;
                tank.TankVolume = request.Tank.TankVolume;
                tank.TankHeight = request.Tank.TankHeight;
                tank.TankLength = request.Tank.TankLength;
                tank.PtsId = request.Tank.PtsId;
                tank.SiteId = request.Tank.SiteId;
                tank.DiscrepancyThreshold = request.Tank.DiscrepancyThreshold;
                tank.CurrentStock = request.Tank.CurrentStock;
                tank.UseBookKeeping = request.Tank.UseBookKeeping ? (sbyte)1 : (sbyte)0;
                tank.HasAutomaticBookKeeping = request.Tank.HasAutomaticBookKeeping ? (sbyte)1 : (sbyte)0;
                tank.Priority = request.Tank.Priority;

                // Fuel Grade
                tank.FuelGradeId = request.Tank.FuelGradeId;
                tank.FuelGradeName = request.Tank.FuelGradeName;

                // Location Validation Fields
                tank.TankType = ParseTankType(request.Tank.TankType);
                tank.Latitude = request.Tank.TankType == "Stationary" ? request.Tank.Latitude : null;
                tank.Longitude = request.Tank.TankType == "Stationary" ? request.Tank.Longitude : null;
                tank.LinkedVehicleId = request.Tank.TankType == "MobileTanker" ? request.Tank.LinkedVehicleId : null;
                tank.LocationValidationRadius = request.Tank.LocationValidationRadius ?? 100;

                // NOTE: LastStockUpdate, PhysicalStockValue, LastPhysicalStockUpdate, PhysicalStockSource
                // are NOT updated here - they are managed by the stock management system

                if (tank.SiteId == null) throw new ArgumentException("SiteId is required");

                var siteExists = await _context.Sites.AnyAsync(s => s.Id == tank.SiteId, cancellationToken);
                if (!siteExists)
                {
                    throw new ArgumentException("Invalid SiteId");
                }

                if (tank.PtsId != null)
                {
                    var ptsExists = await _context.Ptsdevices.AnyAsync(p => p.Ptsid == tank.PtsId, cancellationToken);
                    if (!ptsExists)
                    {
                        throw new ArgumentException("Invalid PtsId");
                    }
                }

                await _context.SaveChangesAsync(cancellationToken);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating tank");
                throw;
            }
        }

        private static TankType ParseTankType(string tankType)
        {
            if (string.IsNullOrEmpty(tankType))
                return TankType.Stationary;

            return Enum.TryParse<TankType>(tankType, out var result) ? result : TankType.Stationary;
        }
    }
}