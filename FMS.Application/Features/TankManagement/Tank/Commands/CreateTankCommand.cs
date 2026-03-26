using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using FMS.Application.Features.FMS.Tank;
using FMS.Domain.Entities;
using FMS.Domain.Entities.Enums;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Command.DatabaseCommand.TankCommands
{
    public record CreateTankCommand(TankDTO TankDto) : IRequest<int>;

    public class CreateTankCommandHandler : IRequestHandler<CreateTankCommand, int>
    {
        private readonly GpsdataContext _context;
        private readonly IMapper _mapper;
        private readonly ILogger<CreateTankCommandHandler> _logger;

        public CreateTankCommandHandler(GpsdataContext context, IMapper mapper, ILogger<CreateTankCommandHandler> logger)
        {
            _context = context;
            _mapper = mapper;
            _logger = logger;
        }

        public async Task<int> Handle(CreateTankCommand request, CancellationToken cancellationToken)
        {
            try
            {
                var normalizedPhysicalStockUpdateSource = TankProbeConfigurationOptions.NormalizePhysicalStockUpdateSource(request.TankDto.ProbePhysicalStockUpdateSource);
                var normalizedCalibrationChartSource = TankProbeConfigurationOptions.NormalizeCalibrationChartSource(request.TankDto.CalibrationChartSource);
                var normalizedProductVolumeSource = TankProbeConfigurationOptions.NormalizeProductVolumeSource(request.TankDto.ProductVolumeSource);

                if (!string.IsNullOrWhiteSpace(request.TankDto.ProbePhysicalStockUpdateSource) && normalizedPhysicalStockUpdateSource == null)
                {
                    throw new ArgumentException("ProbePhysicalStockUpdateSource must be upload-status or tank-measurement");
                }

                if (!string.IsNullOrWhiteSpace(request.TankDto.CalibrationChartSource) && normalizedCalibrationChartSource == null)
                {
                    throw new ArgumentException("CalibrationChartSource must be auto, manual, automatic, interval-volume, or fms-learned");
                }

                if (!string.IsNullOrWhiteSpace(request.TankDto.ProductVolumeSource) && normalizedProductVolumeSource == null)
                {
                    throw new ArgumentException("ProductVolumeSource must be pts or fms-calibrated");
                }

                // Direct property assignment instead of AutoMapper
                var tank = new Tank
                {
                    // Basic Info
                    Name = request.TankDto.Name,
                    TankVolume = request.TankDto.TankVolume,
                    TankHeight = request.TankDto.TankHeight,
                    TankLength = request.TankDto.TankLength,
                    SiteId = request.TankDto.SiteId,
                    DiscrepancyThreshold = request.TankDto.DiscrepancyThreshold,
                    CurrentStock = request.TankDto.CurrentStock ?? 0,
                    UseBookKeeping = request.TankDto.UseBookKeeping ? (sbyte)1 : (sbyte)0,
                    HasAutomaticBookKeeping = request.TankDto.HasAutomaticBookKeeping ? (sbyte)1 : (sbyte)0,
                    Priority = request.TankDto.Priority,
                    LastStockUpdate = DateTime.UtcNow, // Set to now for new tanks

                    // PTS Device and Probe Binding
                    PtsId = request.TankDto.PtsId,
                    ProbeNumber = request.TankDto.ProbeNumber,
                    PtsTankId = request.TankDto.PtsTankId,
                    UsePtsProbeReadings = request.TankDto.UsePtsProbeReadings,
                    ProbePhysicalStockUpdateSource = normalizedPhysicalStockUpdateSource,
                    CalibrationChartSource = normalizedCalibrationChartSource,
                    ProductVolumeSource = normalizedProductVolumeSource,

                    // Fuel Grade
                    FuelGradeId = request.TankDto.FuelGradeId,
                    FuelGradeName = request.TankDto.FuelGradeName,

                    // Location Validation Fields
                    TankType = ParseTankType(request.TankDto.TankType),
                    Latitude = request.TankDto.TankType == "Stationary" ? request.TankDto.Latitude : null,
                    Longitude = request.TankDto.TankType == "Stationary" ? request.TankDto.Longitude : null,
                    LinkedVehicleId = request.TankDto.TankType == "MobileTanker" ? request.TankDto.LinkedVehicleId : null,
                    LocationValidationRadius = request.TankDto.LocationValidationRadius ?? 100
                };

                // Validate the tank name
                if (string.IsNullOrEmpty(tank.Name))
                {
                    throw new ArgumentException("Tank name is required");
                }

                if (tank.SiteId == 0) throw new ArgumentException("SiteId is required");

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

                _context.Tanks.Add(tank);
                await _context.SaveChangesAsync(cancellationToken);

                return tank.Id;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating tank");
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