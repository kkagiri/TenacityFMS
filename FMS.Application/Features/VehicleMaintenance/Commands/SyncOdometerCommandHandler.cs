using System;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.CommonInterface;
using FMS.Application.Features.VehicleMaintenance.DTOs;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.VehicleMaintenance.Commands;

/// <summary>
/// Handler for SyncOdometerFromGPSCommand - syncs odometer from GPS to database
/// </summary>
public class SyncOdometerFromGPSCommandHandler : IRequestHandler<SyncOdometerFromGPSCommand, FMSResponse<OdometerSyncResultDTO>>
{
    private readonly IOdometerSyncService _odometerSyncService;
    private readonly ILogger<SyncOdometerFromGPSCommandHandler> _logger;

    public SyncOdometerFromGPSCommandHandler(
        IOdometerSyncService odometerSyncService,
        ILogger<SyncOdometerFromGPSCommandHandler> logger)
    {
        _odometerSyncService = odometerSyncService;
        _logger = logger;
    }

    public async Task<FMSResponse<OdometerSyncResultDTO>> Handle(SyncOdometerFromGPSCommand request, CancellationToken cancellationToken)
    {
        try
        {
            _logger.LogInformation($"Syncing odometer from GPS for vehicle {request.VehicleId}");
            return await _odometerSyncService.SyncOdometerFromGPSAsync(request.VehicleId, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error syncing odometer from GPS for vehicle {request.VehicleId}");
            return FMSResponse<OdometerSyncResultDTO>.Failed($"Error syncing odometer: {ex.Message}");
        }
    }
}

/// <summary>
/// Handler for SyncOdometerToGPSCommand - syncs odometer from database to GPS
/// </summary>
public class SyncOdometerToGPSCommandHandler : IRequestHandler<SyncOdometerToGPSCommand, FMSResponse<OdometerSyncResultDTO>>
{
    private readonly IOdometerSyncService _odometerSyncService;
    private readonly ILogger<SyncOdometerToGPSCommandHandler> _logger;

    public SyncOdometerToGPSCommandHandler(
        IOdometerSyncService odometerSyncService,
        ILogger<SyncOdometerToGPSCommandHandler> logger)
    {
        _odometerSyncService = odometerSyncService;
        _logger = logger;
    }

    public async Task<FMSResponse<OdometerSyncResultDTO>> Handle(SyncOdometerToGPSCommand request, CancellationToken cancellationToken)
    {
        try
        {
            _logger.LogInformation($"Syncing odometer to GPS for vehicle {request.VehicleId}");
            return await _odometerSyncService.SyncOdometerToGPSAsync(request.VehicleId, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error syncing odometer to GPS for vehicle {request.VehicleId}");
            return FMSResponse<OdometerSyncResultDTO>.Failed($"Error syncing odometer: {ex.Message}");
        }
    }
}

/// <summary>
/// Handler for BatchSyncOdometerFromGPSCommand - batch syncs all vehicles' odometers from GPS
/// </summary>
public class BatchSyncOdometerFromGPSCommandHandler : IRequestHandler<BatchSyncOdometerFromGPSCommand, FMSResponse<OdometerBatchSyncResultDTO>>
{
    private readonly IOdometerSyncService _odometerSyncService;
    private readonly ILogger<BatchSyncOdometerFromGPSCommandHandler> _logger;

    public BatchSyncOdometerFromGPSCommandHandler(
        IOdometerSyncService odometerSyncService,
        ILogger<BatchSyncOdometerFromGPSCommandHandler> logger)
    {
        _odometerSyncService = odometerSyncService;
        _logger = logger;
    }

    public async Task<FMSResponse<OdometerBatchSyncResultDTO>> Handle(BatchSyncOdometerFromGPSCommand request, CancellationToken cancellationToken)
    {
        try
        {
            _logger.LogInformation($"Starting batch sync from GPS (OnlyOutOfSync: {request.OnlyOutOfSync})");
            return await _odometerSyncService.BatchSyncFromGPSAsync(request.OnlyOutOfSync, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in batch odometer sync from GPS");
            return FMSResponse<OdometerBatchSyncResultDTO>.Failed($"Error in batch sync: {ex.Message}");
        }
    }
}

/// <summary>
/// Handler for SetVehicleOdometerCommand - manually sets a vehicle's odometer reading
/// </summary>
public class SetVehicleOdometerCommandHandler : IRequestHandler<SetVehicleOdometerCommand, FMSResponse<OdometerSyncResultDTO>>
{
    private readonly IOdometerSyncService _odometerSyncService;
    private readonly IGPSGateAccumulatorService _accumulatorService;
    private readonly GpsdataContext _context;
    private readonly ILogger<SetVehicleOdometerCommandHandler> _logger;

    public SetVehicleOdometerCommandHandler(
        IOdometerSyncService odometerSyncService,
        IGPSGateAccumulatorService accumulatorService,
        GpsdataContext context,
        ILogger<SetVehicleOdometerCommandHandler> logger)
    {
        _odometerSyncService = odometerSyncService;
        _accumulatorService = accumulatorService;
        _context = context;
        _logger = logger;
    }

    public async Task<FMSResponse<OdometerSyncResultDTO>> Handle(SetVehicleOdometerCommand request, CancellationToken cancellationToken)
    {
        try
        {
            _logger.LogInformation($"Setting odometer for vehicle {request.VehicleId} to {request.Reading}");

            // Get the vehicle
            var vehicle = await _context.Vehicles
                .FirstOrDefaultAsync(v => v.VehicleId == request.VehicleId, cancellationToken);

            if (vehicle == null)
            {
                return FMSResponse<OdometerSyncResultDTO>.Failed($"Vehicle {request.VehicleId} not found");
            }

            var result = new OdometerSyncResultDTO
            {
                VehicleId = request.VehicleId,
                VehicleCode = vehicle.VehicleCode,
                SourceUsed = OdometerSource.ManualEntry
            };

            // Get old value
            result.OldValue = decimal.TryParse(vehicle.CurrentPhysicalReading, out var oldVal) ? (double)oldVal : null;
            result.NewValue = (double)request.Reading;

            // Update the vehicle's physical reading
            vehicle.CurrentPhysicalReading = request.Reading.ToString("F2");
            vehicle.DateModified = DateTime.UtcNow;
            vehicle.ModifiedBy = request.UserId;

            await _context.SaveChangesAsync(cancellationToken);

            result.Success = true;
            result.Message = $"Set odometer to {request.Reading:N2} {(vehicle.AverageKmL ? "km" : "hr")}";

            // Optionally sync to GPS
            if (request.SyncToGPS)
            {
                var gpsResult = await _odometerSyncService.SyncOdometerToGPSAsync(request.VehicleId, cancellationToken);
                if (!gpsResult.IsSuccess || gpsResult.Data?.Success != true)
                {
                    result.Message += $" (GPS sync failed: {gpsResult.Message})";
                    _logger.LogWarning($"GPS sync failed for vehicle {request.VehicleId}: {gpsResult.Message}");
                }
                else
                {
                    result.Message += " (GPS synced)";
                }
            }

            _logger.LogInformation($"Set odometer for vehicle {request.VehicleId}: {result.OldValue} → {result.NewValue}");

            return FMSResponse<OdometerSyncResultDTO>.Success(result, result.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error setting odometer for vehicle {request.VehicleId}");
            return FMSResponse<OdometerSyncResultDTO>.Failed($"Error setting odometer: {ex.Message}");
        }
    }
}
