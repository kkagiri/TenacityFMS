using System;
using System.Linq;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.LocationValidation.DTOs;
using FMS.Application.Features.LocationValidation.Services;
using FMS.Application.Features.PTS.DTOs;
using FMS.Application.Features.PTS.Queries;
using MediatR;
using Microsoft.Extensions.Logging;
using StackExchange.Redis;

namespace FMS.Application.Features.PTS.Services
{
    /// <summary>
    /// Service for performing pump authorization pre-checks including:
    /// - Nozzle state validation (must be lifted)
    /// - Stuck transaction detection
    /// - Location proximity validation
    /// </summary>
    public class PumpAuthorizationPreCheckService : IPumpAuthorizationPreCheckService
    {
        private readonly IMediator _mediator;
        private readonly IDatabase _redisDb;
        private readonly ILocationValidationService _locationValidationService;
        private readonly ILogger<PumpAuthorizationPreCheckService> _logger;

        /// <summary>
        /// Threshold in minutes after which a transaction is considered stuck.
        /// </summary>
        private const double StuckTransactionThresholdMinutes = 2.0;

        public PumpAuthorizationPreCheckService(
            IMediator mediator,
            IConnectionMultiplexer redisConnection,
            ILocationValidationService locationValidationService,
            ILogger<PumpAuthorizationPreCheckService> logger)
        {
            _mediator = mediator;
            _redisDb = redisConnection.GetDatabase();
            _locationValidationService = locationValidationService;
            _logger = logger;
        }

        /// <inheritdoc/>
        public async Task<FMSResponse<NozzleStateResult>> ValidateNozzleStateAsync(
            string deviceId,
            int pumpId,
            CancellationToken cancellationToken = default)
        {
            _logger.LogInformation("[PreCheck] Checking nozzle state for device {DeviceId}, pump {PumpId}",
                deviceId, pumpId);

            var nozzleStateQuery = new GetPumpNozzleStateQuery(deviceId, pumpId);
            var nozzleStateResult = await _mediator.Send(nozzleStateQuery, cancellationToken);

            if (!nozzleStateResult.IsSuccess)
            {
                _logger.LogWarning("[PreCheck] Nozzle check failed - {Message}", nozzleStateResult.Message);
                return FMSResponse<NozzleStateResult>.Failed(
                    nozzleStateResult.Message ?? "Unable to verify nozzle state");
            }

            var nozzleState = nozzleStateResult.Data!;

            var result = new NozzleStateResult
            {
                IsNozzleUp = nozzleState.IsNozzleUp,
                NozzleNumber = nozzleState.NozzleNumber ?? 0,
                Status = nozzleState.Status,
                Message = nozzleState.Message
            };

            if (!result.IsNozzleUp)
            {
                _logger.LogWarning("[PreCheck] Nozzle down - Device {DeviceId}, Pump {PumpId}, Status: {Status}",
                    deviceId, pumpId, result.Status);

                return FMSResponse<NozzleStateResult>.Success(result, "Nozzle is down");
            }

            _logger.LogInformation("[PreCheck] Nozzle up ✅ - Device {DeviceId}, Pump {PumpId}, Nozzle {NozzleNumber}",
                deviceId, pumpId, result.NozzleNumber);

            return FMSResponse<NozzleStateResult>.Success(result, "Nozzle is up");
        }

        /// <inheritdoc/>
        public async Task<StuckTransactionInfo?> CheckForStuckTransactionAsync(string deviceId, int pumpId)
        {
            try
            {
                _logger.LogInformation("[PreCheck] Checking for stuck transactions on device {DeviceId}, pump {PumpId}",
                    deviceId, pumpId);

                // Check Redis for active transaction contexts for this device
                var pattern = $"device:{deviceId}:transaction:*";
                var server = _redisDb.Multiplexer.GetServer(_redisDb.Multiplexer.GetEndPoints()[0]);
                var keys = server.Keys(pattern: pattern);

                foreach (var key in keys)
                {
                    try
                    {
                        var contextJson = await _redisDb.StringGetAsync(key);
                        if (contextJson.IsNullOrEmpty) continue;

                        var context = JsonSerializer.Deserialize<JsonElement>(contextJson);

                        // Check if this transaction belongs to the pump being authorized
                        var contextPumpId = context.TryGetProperty("PumpId", out var pumpProp) ? pumpProp.GetInt32() : 0;
                        if (contextPumpId != pumpId) continue; // Different pump, skip

                        var transactionId = context.TryGetProperty("TransactionId", out var transProp) ? transProp.GetInt32() : 0;
                        var startTimeStr = context.TryGetProperty("StartTime", out var startProp) ? startProp.GetString() : null;

                        if (transactionId > 0 && DateTime.TryParse(startTimeStr, out var startTime))
                        {
                            var age = DateTime.UtcNow - startTime;

                            if (age.TotalMinutes > StuckTransactionThresholdMinutes)
                            {
                                _logger.LogWarning("[PreCheck] Stuck transaction detected - Transaction {TransactionId} for pump {PumpId} on device {DeviceId}, age: {Age:F1} minutes",
                                    transactionId, pumpId, deviceId, age.TotalMinutes);

                                return new StuckTransactionInfo
                                {
                                    TransactionId = transactionId,
                                    PumpId = pumpId,
                                    DeviceId = deviceId,
                                    StartTime = startTime,
                                    Age = age
                                };
                            }
                            else
                            {
                                _logger.LogDebug("[PreCheck] Active transaction {TransactionId} found for pump {PumpId} but not stuck yet (age: {Age:F1} minutes)",
                                    transactionId, pumpId, age.TotalMinutes);
                            }
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogDebug("[PreCheck] Error parsing transaction key {Key}: {Error}", key, ex.Message);
                    }
                }

                return null; // No stuck transaction found
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[PreCheck] Error checking for stuck transactions on device {DeviceId}, pump {PumpId}",
                    deviceId, pumpId);
                return null; // Don't block authorization on error, just log
            }
        }

        /// <inheritdoc/>
        public async Task<LocationValidationResult> ValidateLocationProximityAsync(
            LocationValidationRequest request,
            CancellationToken cancellationToken = default)
        {
            _logger.LogInformation("[PreCheck] Validating location proximity for Tank {TankId}, Vehicle {VehicleId}",
                request.TankId, request.VehicleId);

            var result = await _locationValidationService.ValidateProximityAsync(request, cancellationToken);

            if (!result.IsValid)
            {
                _logger.LogWarning("[PreCheck] Location validation failed - {Reason}. " +
                    "Vehicle distance: {VehicleDistance}m (max: {VehicleRadius}m), " +
                    "Mobile distance: {MobileDistance}m (max: {MobileRadius}m)",
                    result.FailureReason,
                    result.VehicleProximity?.DistanceMeters,
                    result.VehicleProximity?.AllowedRadiusMeters,
                    result.MobileProximity?.DistanceMeters,
                    result.MobileProximity?.AllowedRadiusMeters);
            }
            else if (result.WasBypassedDueToGPSFailure)
            {
                _logger.LogWarning("[PreCheck] Location validation bypassed - GPS data unavailable");
            }
            else if (result.ValidationPerformed)
            {
                _logger.LogInformation("[PreCheck] Location validation passed ✅ - Tank at {TankLocation}, " +
                    "Vehicle distance: {VehicleDistance}m, Mobile distance: {MobileDistance}m",
                    result.TankLocation,
                    result.VehicleProximity?.DistanceMeters,
                    result.MobileProximity?.DistanceMeters);
            }

            return result;
        }

        /// <inheritdoc/>
        public async Task<GeofenceValidationResult> ValidateGeofenceAsync(
            GeofenceValidationRequest request,
            CancellationToken cancellationToken = default)
        {
            _logger.LogInformation("[PreCheck] Validating geofence for RuleSetId {RuleSetId}, VehicleId {VehicleId}, PtsId {PtsId}",
                request.FuelingRuleSetId, request.VehicleId, request.PtsId);

            var result = await _locationValidationService.ValidateGeofenceAsync(request, cancellationToken);

            if (result.Outcome == ValidationOutcome.Failed)
            {
                _logger.LogWarning("[PreCheck] Geofence validation FAILED - {Reason}. " +
                    "TankerInGeofence: {TankerInGeofence}, OperatorInGeofence: {OperatorInGeofence}, VehicleInGeofence: {VehicleInGeofence}",
                    result.Reason,
                    result.TankerInGeofence,
                    result.OperatorInGeofence,
                    result.VehicleInGeofence);
            }
            else if (result.Outcome == ValidationOutcome.Skipped)
            {
                _logger.LogInformation("[PreCheck] Geofence validation skipped - {Reason}", result.Reason);
            }
            else if (result.Outcome == ValidationOutcome.Passed)
            {
                _logger.LogInformation("[PreCheck] Geofence validation passed ✅ - Tanker in '{TankerGeofence}', GeofencesChecked: {Count}",
                    result.TankerGeofenceName ?? "N/A",
                    result.GeofencesChecked);
            }

            return result;
        }
    }
}
