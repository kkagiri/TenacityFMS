using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using FMS.Application.Common;
using FMS.Application.Configuration;
using FMS.Application.Features.ATG;
using FMS.Application.Features.EventEngine.Engine;
using FMS.Application.Features.EventEngine.Events;
using FMS.Application.Features.FMS.Tank;
using FMS.Application.Services.Configuration;
using FMS.Domain.Entities;
using FMS.Domain.Entities.Features.TankStockManagement;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Command.DatabaseCommand.PTSCommands.TankMeasurementsCommand
{
    public class CreateTankMeasurementCommand : IRequest<FMSResponse>
    {
        public TankMeasurementDto TankMeasurementDto { get; set; }
        public string DeviceId { get; set; }

        public CreateTankMeasurementCommand(TankMeasurementDto tankMeasurementDto, string deviceId)
        {
            TankMeasurementDto = tankMeasurementDto;
            DeviceId = deviceId;
        }
    }

    public class CreateTankMeasurementCommandHandler : IRequestHandler<CreateTankMeasurementCommand, FMSResponse>
    {
        private readonly GpsdataContext _context;
        private readonly ILogger<CreateTankMeasurementCommandHandler> _logger;
        private readonly ISystemConfigurationService _systemConfigurationService;
        private readonly IEventExpressionEngine _eventEngine;


        public CreateTankMeasurementCommandHandler(
            GpsdataContext context,
            ILogger<CreateTankMeasurementCommandHandler> logger,
            ISystemConfigurationService systemConfigurationService,
            IEventExpressionEngine eventEngine)
        {
            _context = context;
            _logger = logger;
            _systemConfigurationService = systemConfigurationService;
            _eventEngine = eventEngine;
        }

        public async Task<FMSResponse> Handle(CreateTankMeasurementCommand request, CancellationToken cancellationToken)
        {
            try
            {
                //Cursor: Validation
                var validationErrors = new List<string>();

                if (request.TankMeasurementDto == null)
                {
                    validationErrors.Add("Tank measurement data is required");
                }
                else
                {
                    if (request.TankMeasurementDto.Tank <= 0)
                    {
                        validationErrors.Add("Valid tank number is required");
                    }

                    // FuelGradeId is optional per protocol spec (section 184):
                    // "Fields FuelGradeId and FuelGradeName are optional, they are present
                    //  only when PTS-2 controller has tank configured to specific fuel grade."
                    // Do NOT validate FuelGradeId - tanks without fuel grade config will send 0 or omit it.

                    // PtsId may not be set yet (enrichment is fire-and-forget);
                    // fallback to DeviceId which is always available
                    if (string.IsNullOrEmpty(request.TankMeasurementDto.PtsId) && string.IsNullOrEmpty(request.DeviceId))
                    {
                        validationErrors.Add("PTS device ID is required");
                    }
                }

                if (validationErrors.Any())
                {
                    return FMSResponse.ValidationFailed(validationErrors);
                }

                var tankMeasurementDto = request.TankMeasurementDto;

                // Ensure PtsId is set from DeviceId if the enrichment task hasn't set it yet
                if (string.IsNullOrEmpty(tankMeasurementDto.PtsId))
                {
                    tankMeasurementDto.PtsId = request.DeviceId;
                }

                //Cursor: Try to find the actual Tank entity to link
                var tank = await _context.Tanks
                    .FirstOrDefaultAsync(t => t.PtsId == request.DeviceId && t.ProbeNumber == tankMeasurementDto.Tank, cancellationToken);

                // Fallback: match by PtsId only
                if (tank == null)
                {
                    tank = await _context.Tanks
                        .FirstOrDefaultAsync(t => t.PtsId == request.DeviceId, cancellationToken);
                }

                if (tank != null)
                {
                    tankMeasurementDto.TankId = tank.Id;

                    //Cursor: Update tank's fuel grade info if not set
                    if (!tank.FuelGradeId.HasValue && tankMeasurementDto.FuelGradeId > 0)
                    {
                        tank.FuelGradeId = tankMeasurementDto.FuelGradeId;
                        tank.FuelGradeName = tankMeasurementDto.FuelGradeName;
                    }

                    //Cursor: Check system configuration for sensor-based physical stock updates
                    var enableSensorPhysicalStock = await GetConfigurationValueAsync(global::FMS.Application.Configuration.SystemConfiguration.DB_CONFIG_TANK_ENABLE_SENSOR_PHYSICAL_STOCK_UPDATE_KEY, false, cancellationToken);
                    var normalizedPhysicalStockUpdateSource = TankProbeConfigurationOptions.NormalizePhysicalStockUpdateSource(tank.ProbePhysicalStockUpdateSource);
                    var shouldUpdatePhysicalStockFromTankMeasurement =
                        string.Equals(normalizedPhysicalStockUpdateSource, TankProbeConfigurationOptions.TankMeasurement, StringComparison.Ordinal)
                        || (string.IsNullOrWhiteSpace(normalizedPhysicalStockUpdateSource) && enableSensorPhysicalStock);

                    if (shouldUpdatePhysicalStockFromTankMeasurement && tankMeasurementDto.ProductVolume.HasValue && tankMeasurementDto.ProductVolume.Value > 0)
                    {
                        // Update physical stock from sensor reading
                        tank.PhysicalStockValue = (decimal)tankMeasurementDto.ProductVolume.Value;
                        tank.PhysicalStockSource = "Automated Sensor Reading";
                        tank.LastPhysicalStockUpdate = tankMeasurementDto.DateTime;

                        _logger.LogInformation("Updated physical stock from sensor for Tank {TankId}: {PhysicalStock}L (Source: {Source})",
                            tank.Id, tank.PhysicalStockValue, tank.PhysicalStockSource);
                    }
                }

                // Duplicate detection: skip if a measurement with the same DateTime + Tank + PtsId already exists
                var isDuplicate = await _context.Tankmeasurements
                    .AnyAsync(tm => tm.Ptsid == tankMeasurementDto.PtsId
                                 && tm.Tank == tankMeasurementDto.Tank
                                 && tm.DateTime == tankMeasurementDto.DateTime, cancellationToken);

                if (isDuplicate)
                {
                    _logger.LogDebug("Skipping duplicate tank measurement for device {DeviceId}, tank {Tank}, dateTime {DateTime}",
                        request.DeviceId, tankMeasurementDto.Tank, tankMeasurementDto.DateTime);
                    return FMSResponse.SuccessResponse("Duplicate measurement skipped");
                }

                // Warn if measurement has no useful probe data
                bool hasMeasurementData = tankMeasurementDto.ProductVolume.HasValue
                    || tankMeasurementDto.ProductHeight.HasValue
                    || tankMeasurementDto.Temperature.HasValue
                    || tankMeasurementDto.WaterHeight.HasValue
                    || (tankMeasurementDto.ProductMass.HasValue && tankMeasurementDto.ProductMass.Value > 0);

                if (!hasMeasurementData)
                {
                    _logger.LogWarning("Tank measurement from device {DeviceId}, tank {Tank} has no probe data (ProductVolume, Temperature, Heights all null, ProductMass={ProductMass}). ATG probe may not be connected or configured.",
                        request.DeviceId, tankMeasurementDto.Tank, tankMeasurementDto.ProductMass);

                    // Do not persist empty measurements - these are often repeated retransmits
                    // and cause table flooding without adding operational value.
                    return FMSResponse.SuccessResponse("Empty measurement skipped");
                }

                //Cursor: Log alarm info (Alarm table removed - alarm type names stored for reference)
                if (tankMeasurementDto.Alarms?.Any() == true)
                {
                    _logger.LogDebug("Tank measurement includes alarm types: {AlarmTypes}", string.Join(", ", tankMeasurementDto.Alarms.Distinct()));
                }

                //Cursor: Create tank measurement entity
                var tankMeasurement = new Tankmeasurement
                {
                    PacketId = tankMeasurementDto.PacketId,
                    Tank = tankMeasurementDto.Tank,
                    TankId = tankMeasurementDto.TankId,
                    ProductUllage = tankMeasurementDto.ProductUllage,
                    Ptsid = tankMeasurementDto.PtsId,
                    DateTime = tankMeasurementDto.DateTime,
                    FuelGradeId = tankMeasurementDto.FuelGradeId,
                    FuelGradeName = tankMeasurementDto.FuelGradeName,
                    ProductHeight = tankMeasurementDto.ProductHeight,
                    WaterHeight = tankMeasurementDto.WaterHeight,
                    Temperature = tankMeasurementDto.Temperature,
                    ProductVolume = tankMeasurementDto.ProductVolume,
                    WaterVolume = tankMeasurementDto.WaterVolume,
                    ProductTcvolume = tankMeasurementDto.ProductTcvolume,
                    ProductDensity = tankMeasurementDto.ProductDensity,
                    ProductMass = tankMeasurementDto.ProductMass,
                    TankFillingPercentage = tankMeasurementDto.TankFillingPercentage,
                    ConfigurationId = tankMeasurementDto.ConfigurationId,
                    Status = tankMeasurementDto.Status
                };

                _context.Tankmeasurements.Add(tankMeasurement);
                await _context.SaveChangesAsync(cancellationToken);

                _logger.LogInformation("Tank measurement created successfully for device {DeviceId}, tank {Tank}, packet {PacketId}",
                    request.DeviceId, tankMeasurementDto.Tank, tankMeasurementDto.PacketId);

                // Retention cleanup: delete older measurements for this tank beyond configured retention window.
                if (tankMeasurement.TankId.HasValue)
                {
                    var retentionDays = await _systemConfigurationService.GetTankMeasurementRetentionDaysAsync(cancellationToken);

                    if (retentionDays > 0)
                    {
                        await DeleteOldTankMeasurementsAsync(
                            tankMeasurement.TankId.Value,
                            cutoffUtc: DateTime.UtcNow.AddDays(-retentionDays),
                            cancellationToken);
                    }
                }

                // Fire TankLevelEvent for every measurement — engine handles cooldown
                if (tank != null && tankMeasurementDto.ProductVolume.HasValue)
                {
                    var measurementEvent = new TankLevelEvent
                    {
                        SiteId = tank.SiteId,
                        TankId = tank.Id,
                        PtsDeviceId = request.DeviceId,
                        Severity = "Low",
                        Message = $"Tank measurement: {tankMeasurementDto.ProductVolume:N0}L",
                        TankName = tank.Name ?? "",
                        ProductName = tankMeasurementDto.FuelGradeName ?? "",
                        ProductVolume = (decimal)tankMeasurementDto.ProductVolume.Value,
                        TankCapacity = tank.TankVolume,
                        PercentageFull = tank.TankVolume > 0 ? (decimal)((double)tankMeasurementDto.ProductVolume.Value / (double)tank.TankVolume * 100) : 0,
                        CurrentLevel = tankMeasurementDto.ProductHeight.HasValue ? (decimal)tankMeasurementDto.ProductHeight.Value : 0,
                        WaterLevel = tankMeasurementDto.WaterHeight.HasValue ? (decimal)tankMeasurementDto.WaterHeight.Value : 0,
                        Temperature = tankMeasurementDto.Temperature.HasValue ? (decimal)tankMeasurementDto.Temperature.Value : 0,
                        UllageVolume = tankMeasurementDto.ProductUllage.HasValue ? (decimal)tankMeasurementDto.ProductUllage.Value : 0,
                    };
                    // Fire-and-forget: high-volume event, engine cooldown prevents spam
                    _ = _eventEngine.ProcessAsync(measurementEvent, cancellationToken);
                }

                return FMSResponse.SuccessResponse("Tank measurement processed successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating tank measurement for device {DeviceId}, tank {Tank}",
                    request.DeviceId, request.TankMeasurementDto?.Tank);

                return FMSResponse.FailedResponse($"Error processing tank measurement: {ex.Message}");
            }
        }

        /// <summary>
        /// Helper method to get boolean configuration values with fallback
        /// </summary>
        private async Task<bool> GetConfigurationValueAsync(string key, bool defaultValue, CancellationToken cancellationToken)
        {
            try
            {
                // Check if configuration exists in database
                var configValue = await _context.SystemConfigurations
                    .Where(c => c.ConfigurationKey == key && c.IsActive)
                    .Select(c => c.ConfigurationValue)
                    .FirstOrDefaultAsync(cancellationToken);

                if (configValue != null && bool.TryParse(configValue, out bool result))
                {
                    return result;
                }

                return defaultValue;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to get configuration value for key {Key}, using default {DefaultValue}", key, defaultValue);
                return defaultValue;
            }
        }

        private async Task DeleteOldTankMeasurementsAsync(int tankId, DateTime cutoffUtc, CancellationToken cancellationToken)
        {
            try
            {
                var oldMeasurements = await _context.Tankmeasurements
                    .Where(tm => tm.TankId == tankId && tm.DateTime < cutoffUtc)
                    .ToListAsync(cancellationToken);

                if (oldMeasurements.Count == 0)
                {
                    return;
                }

                _context.Tankmeasurements.RemoveRange(oldMeasurements);
                await _context.SaveChangesAsync(cancellationToken);

                _logger.LogInformation(
                    "Deleted {Count} old tank measurements for TankId={TankId} older than {CutoffUtc}",
                    oldMeasurements.Count,
                    tankId,
                    cutoffUtc);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Non-critical: retention cleanup failed for TankId={TankId}", tankId);
            }
        }
    }
}