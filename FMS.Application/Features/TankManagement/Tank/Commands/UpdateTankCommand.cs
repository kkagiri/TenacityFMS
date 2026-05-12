/**
 * File: UpdateTankCommand.cs
 * Purpose: Updates tank master data including PTS device and probe binding.
 * Dependencies: EF Core, MediatR
 * Last Modified: 2026-02-05
 */
using System;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Features.FMS.Tank;
using FMS.Domain.Entities;
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
        private readonly ILogger<UpdateTankCommandHandler> _logger;

        public UpdateTankCommandHandler(GpsdataContext context, ILogger<UpdateTankCommandHandler> logger)
        {
            _context = context;
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

                // Basic Info
                tank.Name = request.Tank.Name;
                tank.TankVolume = request.Tank.TankVolume;
                tank.TankHeight = request.Tank.TankHeight;
                tank.TankLength = request.Tank.TankLength;
                tank.SiteId = request.Tank.SiteId;
                tank.DiscrepancyThreshold = request.Tank.DiscrepancyThreshold;
                tank.CurrentStock = request.Tank.CurrentStock;
                tank.UseBookKeeping = request.Tank.UseBookKeeping ? (sbyte)1 : (sbyte)0;
                tank.HasAutomaticBookKeeping = request.Tank.HasAutomaticBookKeeping ? (sbyte)1 : (sbyte)0;
                tank.Priority = request.Tank.Priority;

                // PTS Device and Probe Binding - stored directly on tank
                tank.PtsId = request.Tank.PtsId;
                tank.ProbeNumber = request.Tank.ProbeNumber;
                tank.PtsTankId = request.Tank.PtsTankId;
                tank.UsePtsProbeReadings = request.Tank.UsePtsProbeReadings;

                var normalizedPhysicalStockUpdateSource = TankProbeConfigurationOptions.NormalizePhysicalStockUpdateSource(request.Tank.ProbePhysicalStockUpdateSource);
                if (!string.IsNullOrWhiteSpace(request.Tank.ProbePhysicalStockUpdateSource) && normalizedPhysicalStockUpdateSource == null)
                {
                    throw new ArgumentException("ProbePhysicalStockUpdateSource must be upload-status or tank-measurement");
                }

                var normalizedCalibrationChartSource = TankProbeConfigurationOptions.NormalizeCalibrationChartSource(request.Tank.CalibrationChartSource);
                if (!string.IsNullOrWhiteSpace(request.Tank.CalibrationChartSource) && normalizedCalibrationChartSource == null)
                {
                    throw new ArgumentException("CalibrationChartSource must be auto, manual, automatic, interval-volume, or fms-learned");
                }

                var normalizedProductVolumeSource = TankProbeConfigurationOptions.NormalizeProductVolumeSource(request.Tank.ProductVolumeSource);
                if (!string.IsNullOrWhiteSpace(request.Tank.ProductVolumeSource) && normalizedProductVolumeSource == null)
                {
                    throw new ArgumentException("ProductVolumeSource must be pts or fms-calibrated");
                }

                tank.ProbePhysicalStockUpdateSource = normalizedPhysicalStockUpdateSource;
                tank.CalibrationChartSource = normalizedCalibrationChartSource;
                tank.ProductVolumeSource = normalizedProductVolumeSource;

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

                if (tank.SiteId <= 0)
                {
                    throw new ArgumentException("SiteId is required");
                }

                var siteExists = await _context.Sites.AnyAsync(s => s.Id == tank.SiteId, cancellationToken);
                if (!siteExists)
                {
                    throw new ArgumentException("Invalid SiteId");
                }

                if (!string.IsNullOrWhiteSpace(tank.PtsId))
                {
                    var ptsExists = await _context.Ptsdevices.AnyAsync(p => p.Ptsid == tank.PtsId, cancellationToken);
                    if (!ptsExists)
                    {
                        throw new ArgumentException("Invalid PtsId");
                    }
                }

                // Validate ProbeNumber if provided
                if (tank.ProbeNumber.HasValue && tank.ProbeNumber.Value <= 0)
                {
                    throw new ArgumentException("ProbeNumber must be greater than 0");
                }

                await _context.SaveChangesAsync(cancellationToken);

                _logger.LogInformation(
                    "Updated tank {TankId} with PtsId={PtsId}, ProbeNumber={ProbeNumber}, PtsTankId={PtsTankId}",
                    tank.Id, tank.PtsId, tank.ProbeNumber, tank.PtsTankId);

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
