/**
 * File: UpdateVehicleTripSettingsCommand.cs
 * Purpose: Command contract for updating VehicleTrips runtime settings.
 * Dependencies: MediatR, FMSResponse, VehicleTripSettingsDTO, IVehicleTripSettingsService.
 * Last Modified: 2026-03-14
 */
using System;
using System.Text.Json.Serialization;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.VehicleTrips.DTOs;
using FMS.Application.Features.VehicleTrips.Services;
using FMS.Application.Features.VehicleTrips.Validators;
using MediatR;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.VehicleTrips.Commands;

public record UpdateVehicleTripSettingsCommand : IRequest<FMSResponse<VehicleTripSettingsDTO>>
{
    public bool EnableRealtimeStateMachineExecution { get; init; }
    public bool EnableScheduledReconciliation { get; init; }
    public string ReconciliationDailyRunTimeLocal { get; init; } = "00:30";
    public int ReconciliationLookbackDays { get; init; }
    public bool EnableFuelContextEnrichment { get; init; }
    public decimal FuelLookupWindowHours { get; init; }
    public decimal ConfidenceUnknownEndpointPenalty { get; init; }
    public decimal ConfidenceShortTripPenalty { get; init; }
    public decimal ConfidenceHighSpeedPenalty { get; init; }
    public decimal ConfidenceMissingFuelPenalty { get; init; }
    public decimal ConfidenceWeakFuelPenalty { get; init; }
    public decimal ConfidenceMinimumScore { get; init; }
    public decimal ConfidenceHighBandThreshold { get; init; }
    public decimal ConfidenceMediumBandThreshold { get; init; }
    public decimal ConfidenceHighSpeedThresholdKph { get; init; }
    public decimal ConfidenceShortTripDistanceThresholdKm { get; init; }
    public decimal ConfidenceShortTripDurationThresholdMinutes { get; init; }
    public decimal ConfidenceLoadCycleSuspiciousFuelRateThresholdKmPerLiter { get; init; }
    public decimal ConfidenceLoadCycleReturnFuelRateThresholdKmPerLiter { get; init; }
    public decimal ClusterBatchStopSpeedThresholdKph { get; init; }
    public decimal ClusterBatchMinimumStopDurationMinutes { get; init; }
    public decimal ClusterBatchMinimumTripDistanceKm { get; init; }
    public decimal ClusterBatchMinimumTripDurationMinutes { get; init; }
    public decimal ClusterBatchClusterRadiusMeters { get; init; }
    public int ClusterBatchMaxTrackPoints { get; init; }
    public decimal ClusterRealtimeStopSpeedThresholdKph { get; init; }
    public int ClusterRealtimeStopDurationPoints { get; init; }
    public int ClusterRealtimeMovingDurationPoints { get; init; }
    public decimal ClusterRealtimeClusterMatchRadiusKm { get; init; }

    [JsonIgnore]
    public string? UpdatedBy { get; set; }
}

public class UpdateVehicleTripSettingsCommandHandler : IRequestHandler<UpdateVehicleTripSettingsCommand, FMSResponse<VehicleTripSettingsDTO>>
{
    private readonly IVehicleTripSettingsService _vehicleTripSettingsService;
    private readonly IUpdateVehicleTripSettingsCommandValidator _validator;
    private readonly ILogger<UpdateVehicleTripSettingsCommandHandler> _logger;

    public UpdateVehicleTripSettingsCommandHandler(
        IVehicleTripSettingsService vehicleTripSettingsService,
        IUpdateVehicleTripSettingsCommandValidator validator,
        ILogger<UpdateVehicleTripSettingsCommandHandler> logger)
    {
        _vehicleTripSettingsService = vehicleTripSettingsService;
        _validator = validator;
        _logger = logger;
    }

    public async Task<FMSResponse<VehicleTripSettingsDTO>> Handle(
        UpdateVehicleTripSettingsCommand request,
        CancellationToken cancellationToken)
    {
        var validationErrors = _validator.Validate(request);
        if (validationErrors.Count > 0)
        {
            return FMSResponse<VehicleTripSettingsDTO>.ValidationFailed(validationErrors);
        }

        try
        {
            var update = new VehicleTripSettingsDTO
            {
                EnableRealtimeStateMachineExecution = request.EnableRealtimeStateMachineExecution,
                EnableScheduledReconciliation = request.EnableScheduledReconciliation,
                ReconciliationDailyRunTimeLocal = request.ReconciliationDailyRunTimeLocal,
                ReconciliationLookbackDays = request.ReconciliationLookbackDays,
                EnableFuelContextEnrichment = request.EnableFuelContextEnrichment,
                FuelLookupWindowHours = request.FuelLookupWindowHours,
                ConfidenceUnknownEndpointPenalty = request.ConfidenceUnknownEndpointPenalty,
                ConfidenceShortTripPenalty = request.ConfidenceShortTripPenalty,
                ConfidenceHighSpeedPenalty = request.ConfidenceHighSpeedPenalty,
                ConfidenceMissingFuelPenalty = request.ConfidenceMissingFuelPenalty,
                ConfidenceWeakFuelPenalty = request.ConfidenceWeakFuelPenalty,
                ConfidenceMinimumScore = request.ConfidenceMinimumScore,
                ConfidenceHighBandThreshold = request.ConfidenceHighBandThreshold,
                ConfidenceMediumBandThreshold = request.ConfidenceMediumBandThreshold,
                ConfidenceHighSpeedThresholdKph = request.ConfidenceHighSpeedThresholdKph,
                ConfidenceShortTripDistanceThresholdKm = request.ConfidenceShortTripDistanceThresholdKm,
                ConfidenceShortTripDurationThresholdMinutes = request.ConfidenceShortTripDurationThresholdMinutes,
                ConfidenceLoadCycleSuspiciousFuelRateThresholdKmPerLiter = request.ConfidenceLoadCycleSuspiciousFuelRateThresholdKmPerLiter,
                ConfidenceLoadCycleReturnFuelRateThresholdKmPerLiter = request.ConfidenceLoadCycleReturnFuelRateThresholdKmPerLiter,
                ClusterBatchStopSpeedThresholdKph = request.ClusterBatchStopSpeedThresholdKph,
                ClusterBatchMinimumStopDurationMinutes = request.ClusterBatchMinimumStopDurationMinutes,
                ClusterBatchMinimumTripDistanceKm = request.ClusterBatchMinimumTripDistanceKm,
                ClusterBatchMinimumTripDurationMinutes = request.ClusterBatchMinimumTripDurationMinutes,
                ClusterBatchClusterRadiusMeters = request.ClusterBatchClusterRadiusMeters,
                ClusterBatchMaxTrackPoints = request.ClusterBatchMaxTrackPoints,
                ClusterRealtimeStopSpeedThresholdKph = request.ClusterRealtimeStopSpeedThresholdKph,
                ClusterRealtimeStopDurationPoints = request.ClusterRealtimeStopDurationPoints,
                ClusterRealtimeMovingDurationPoints = request.ClusterRealtimeMovingDurationPoints,
                ClusterRealtimeClusterMatchRadiusKm = request.ClusterRealtimeClusterMatchRadiusKm,
            };

            var settings = await _vehicleTripSettingsService.UpdateSettingsAsync(
                update,
                request.UpdatedBy,
                cancellationToken);

            return FMSResponse<VehicleTripSettingsDTO>.Success(
                settings,
                "Vehicle trip settings updated successfully.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating vehicle trip settings");
            return FMSResponse<VehicleTripSettingsDTO>.SystemError(
                $"Failed to update vehicle trip settings: {ex.Message}");
        }
    }
}