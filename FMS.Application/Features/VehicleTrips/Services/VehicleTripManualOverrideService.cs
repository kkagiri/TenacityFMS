/**
 * File: VehicleTripManualOverrideService.cs
 * Purpose: Applies manual trip override commands while preserving original auto-detected records for auditability.
 * Dependencies: DbContext, override validation service, fuel context service, confidence scoring service, override audit service.
 * Last Modified: 2026-03-11
 */
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.VehicleTrips.Commands;
using FMS.Application.Features.VehicleTrips.DTOs;
using FMS.Domain.Entities;
using FMS.Persistence.DataAccess;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.VehicleTrips.Services;

public class VehicleTripManualOverrideService : IVehicleTripManualOverrideService
{
    private readonly GpsdataContext _context;
    private readonly IVehicleTripManualOverrideValidationService _validationService;
    private readonly IVehicleTripFuelContextService _fuelContextService;
    private readonly IVehicleTripConfidenceScoringService _confidenceScoringService;
    private readonly IVehicleTripOverrideAuditService _auditService;
    private readonly ILogger<VehicleTripManualOverrideService> _logger;

    public VehicleTripManualOverrideService(
        GpsdataContext context,
        IVehicleTripManualOverrideValidationService validationService,
        IVehicleTripFuelContextService fuelContextService,
        IVehicleTripConfidenceScoringService confidenceScoringService,
        IVehicleTripOverrideAuditService auditService,
        ILogger<VehicleTripManualOverrideService> logger)
    {
        _context = context;
        _validationService = validationService;
        _fuelContextService = fuelContextService;
        _confidenceScoringService = confidenceScoringService;
        _auditService = auditService;
        _logger = logger;
    }

    public Task<FMSResponse<VehicleTripManualOverrideResponseDTO>> SplitTripAsync(SplitVehicleTripCommand request, CancellationToken cancellationToken = default)
        => ExecuteAgainstExistingGroupAsync(
            request,
            VehicleTripManualOverrideAction.Split,
            request.VehicleTripGroupId,
            request.VehicleTripId,
            null,
            group =>
            {
                var trips = VehicleTripManualOverrideFactory.BuildMutableTrips(group);
                var index = trips.FindIndex(t => t.VehicleTripId == request.VehicleTripId);
                if (index < 0)
                {
                    return Task.FromResult(FMSResponse<List<VehicleTripMutationState>>.NotFound("VEHICLE_TRIP_NOT_FOUND", $"Trip {request.VehicleTripId} was not found in group {request.VehicleTripGroupId}."));
                }

                var trip = trips[index];
                var splitTimeUtc = request.SplitTimeUtc.ToUniversalTime();
                if (splitTimeUtc <= trip.StartTimeUtc || splitTimeUtc >= trip.EndTimeUtc)
                {
                    return Task.FromResult(FMSResponse<List<VehicleTripMutationState>>.ValidationFailed(new List<string>
                    {
                        "SplitTimeUtc must fall strictly between the trip start and end time."
                    }));
                }

                var ratio = VehicleTripManualOverrideFactory.GetSegmentRatio(trip.StartTimeUtc, splitTimeUtc, trip.EndTimeUtc);
                var splitLatitude = request.SplitLatitude ?? VehicleTripManualOverrideFactory.Interpolate(trip.StartLatitude, trip.EndLatitude, ratio);
                var splitLongitude = request.SplitLongitude ?? VehicleTripManualOverrideFactory.Interpolate(trip.StartLongitude, trip.EndLongitude, ratio);

                var firstTrip = VehicleTripManualOverrideFactory.CloneTrip(trip);
                firstTrip.EndTimeUtc = splitTimeUtc;
                firstTrip.EndLatitude = splitLatitude;
                firstTrip.EndLongitude = splitLongitude;
                firstTrip.DestinationSiteId = request.IntermediateSiteId;
                firstTrip.DestinationGeofenceId = null;
                firstTrip.EndTrackInfoId = null;
                firstTrip.FuelAtDeparture = null;
                firstTrip.FuelAtArrival = null;
                firstTrip.FuelConsumed = null;
                firstTrip.DistanceKm = Math.Round(trip.DistanceKm * ratio, 2);
                firstTrip.DurationMinutes = VehicleTripManualOverrideFactory.GetDurationMinutes(firstTrip.StartTimeUtc, firstTrip.EndTimeUtc);

                var secondTrip = VehicleTripManualOverrideFactory.CloneTrip(trip);
                secondTrip.StartTimeUtc = splitTimeUtc;
                secondTrip.StartLatitude = splitLatitude;
                secondTrip.StartLongitude = splitLongitude;
                secondTrip.OriginSiteId = request.IntermediateSiteId;
                secondTrip.OriginGeofenceId = null;
                secondTrip.StartTrackInfoId = null;
                secondTrip.FuelAtDeparture = null;
                secondTrip.FuelAtArrival = null;
                secondTrip.FuelConsumed = null;
                secondTrip.DistanceKm = Math.Round(Math.Max(0m, trip.DistanceKm - firstTrip.DistanceKm), 2);
                secondTrip.DurationMinutes = VehicleTripManualOverrideFactory.GetDurationMinutes(secondTrip.StartTimeUtc, secondTrip.EndTimeUtc);

                trips.RemoveAt(index);
                trips.Insert(index, secondTrip);
                trips.Insert(index, firstTrip);
                return Task.FromResult(FMSResponse<List<VehicleTripMutationState>>.Success(trips));
            },
            cancellationToken);

    public Task<FMSResponse<VehicleTripManualOverrideResponseDTO>> MergeTripsAsync(MergeVehicleTripsCommand request, CancellationToken cancellationToken = default)
        => ExecuteAgainstExistingGroupAsync(
            request,
            VehicleTripManualOverrideAction.Merge,
            request.VehicleTripGroupId,
            request.PrimaryVehicleTripId,
            request.SecondaryVehicleTripId,
            group =>
            {
                var trips = VehicleTripManualOverrideFactory.BuildMutableTrips(group);
                var firstIndex = trips.FindIndex(t => t.VehicleTripId == request.PrimaryVehicleTripId);
                var secondIndex = trips.FindIndex(t => t.VehicleTripId == request.SecondaryVehicleTripId);
                if (firstIndex < 0 || secondIndex < 0)
                {
                    return Task.FromResult(FMSResponse<List<VehicleTripMutationState>>.NotFound("VEHICLE_TRIP_NOT_FOUND", "One or both trips were not found in the selected group."));
                }

                if (secondIndex != firstIndex + 1)
                {
                    return Task.FromResult(FMSResponse<List<VehicleTripMutationState>>.ValidationFailed(new List<string>
                    {
                        "Only consecutive trips can be merged."
                    }));
                }

                var firstTrip = trips[firstIndex];
                var secondTrip = trips[secondIndex];
                var mergedTrip = VehicleTripManualOverrideFactory.CloneTrip(firstTrip);
                mergedTrip.EndTimeUtc = secondTrip.EndTimeUtc;
                mergedTrip.EndLatitude = secondTrip.EndLatitude;
                mergedTrip.EndLongitude = secondTrip.EndLongitude;
                mergedTrip.DestinationSiteId = secondTrip.DestinationSiteId;
                mergedTrip.DestinationGeofenceId = secondTrip.DestinationGeofenceId;
                mergedTrip.EndTrackInfoId = secondTrip.EndTrackInfoId;
                mergedTrip.DistanceKm = Math.Round(firstTrip.DistanceKm + secondTrip.DistanceKm, 2);
                mergedTrip.DurationMinutes = VehicleTripManualOverrideFactory.GetDurationMinutes(mergedTrip.StartTimeUtc, mergedTrip.EndTimeUtc);
                mergedTrip.MaxSpeedKph = Max(firstTrip.MaxSpeedKph, secondTrip.MaxSpeedKph);
                mergedTrip.FuelAtDeparture = null;
                mergedTrip.FuelAtArrival = null;
                mergedTrip.FuelConsumed = null;

                trips.RemoveAt(secondIndex);
                trips[firstIndex] = mergedTrip;
                return Task.FromResult(FMSResponse<List<VehicleTripMutationState>>.Success(trips));
            },
            cancellationToken);

    public Task<FMSResponse<VehicleTripManualOverrideResponseDTO>> ReassignSiteAsync(ReassignVehicleTripSiteCommand request, CancellationToken cancellationToken = default)
        => ExecuteAgainstExistingGroupAsync(
            request,
            VehicleTripManualOverrideAction.ReassignSite,
            request.VehicleTripGroupId,
            request.VehicleTripId,
            null,
            group =>
            {
                if (!request.OverrideOriginSiteId.HasValue && !request.OverrideDestinationSiteId.HasValue)
                {
                    return Task.FromResult(FMSResponse<List<VehicleTripMutationState>>.ValidationFailed(new List<string>
                    {
                        "At least one override site must be provided."
                    }));
                }

                var trips = VehicleTripManualOverrideFactory.BuildMutableTrips(group);
                if (request.VehicleTripId.HasValue)
                {
                    var target = trips.FirstOrDefault(t => t.VehicleTripId == request.VehicleTripId.Value);
                    if (target == null)
                    {
                        return Task.FromResult(FMSResponse<List<VehicleTripMutationState>>.NotFound("VEHICLE_TRIP_NOT_FOUND", $"Trip {request.VehicleTripId.Value} was not found in group {request.VehicleTripGroupId}."));
                    }

                    if (request.OverrideOriginSiteId.HasValue)
                    {
                        target.OriginSiteId = request.OverrideOriginSiteId.Value;
                        target.OriginGeofenceId = null;
                    }

                    if (request.OverrideDestinationSiteId.HasValue)
                    {
                        target.DestinationSiteId = request.OverrideDestinationSiteId.Value;
                        target.DestinationGeofenceId = null;
                    }
                }
                else
                {
                    var first = trips.First();
                    var last = trips.Last();
                    if (request.OverrideOriginSiteId.HasValue)
                    {
                        first.OriginSiteId = request.OverrideOriginSiteId.Value;
                        first.OriginGeofenceId = null;
                    }

                    if (request.OverrideDestinationSiteId.HasValue)
                    {
                        last.DestinationSiteId = request.OverrideDestinationSiteId.Value;
                        last.DestinationGeofenceId = null;
                    }
                }

                return Task.FromResult(FMSResponse<List<VehicleTripMutationState>>.Success(trips));
            },
            cancellationToken);

    public async Task<FMSResponse<VehicleTripManualOverrideResponseDTO>> AddTripAsync(AddVehicleTripCommand request, CancellationToken cancellationToken = default)
    {
        var requestValidation = _validationService.ValidateBaseRequest(request.Reason, request.RequestedByUserId);
        if (requestValidation.Count > 0)
        {
            return FMSResponse<VehicleTripManualOverrideResponseDTO>.ValidationFailed(requestValidation);
        }

        if (request.VehicleId <= 0)
        {
            return FMSResponse<VehicleTripManualOverrideResponseDTO>.ValidationFailed(new List<string> { "VehicleId must be greater than zero." });
        }

        var startTimeUtc = request.StartTimeUtc.ToUniversalTime();
        var endTimeUtc = request.EndTimeUtc.ToUniversalTime();
        if (endTimeUtc <= startTimeUtc)
        {
            return FMSResponse<VehicleTripManualOverrideResponseDTO>.ValidationFailed(new List<string> { "EndTimeUtc must be later than StartTimeUtc." });
        }

        var vehicle = await _context.Vehicles.FirstOrDefaultAsync(v => v.VehicleId == request.VehicleId, cancellationToken);
        if (vehicle == null)
        {
            return FMSResponse<VehicleTripManualOverrideResponseDTO>.NotFound("VEHICLE_NOT_FOUND", $"Vehicle {request.VehicleId} was not found.");
        }

        var trips = new List<VehicleTripMutationState>
        {
            new()
            {
                StartTimeUtc = startTimeUtc,
                EndTimeUtc = endTimeUtc,
                OriginSiteId = request.OriginSiteId,
                DestinationSiteId = request.DestinationSiteId,
                StartLatitude = request.StartLatitude,
                StartLongitude = request.StartLongitude,
                EndLatitude = request.EndLatitude,
                EndLongitude = request.EndLongitude,
                DistanceKm = request.DistanceKm,
                DurationMinutes = VehicleTripManualOverrideFactory.GetDurationMinutes(startTimeUtc, endTimeUtc),
                MaxSpeedKph = request.MaxSpeedKph,
                MovementProfile = request.MovementProfile ?? vehicle.MovementProfile,
                DetectionMode = VehicleTripDetectionModeHelper.CreateManualOverrideMode(VehicleTripManualOverrideAction.Add),
                Status = VehicleTripStatus.Completed,
                GroupingType = request.GroupingType,
            }
        };

        await _fuelContextService.EnrichTripsAsync(vehicle.VehicleId, trips, cancellationToken);
        await _confidenceScoringService.ScoreTripsAsync(trips.Cast<VehicleTripDetectionResultDTO>().ToList(), cancellationToken);

        var overlapErrors = await _validationService.ValidateTripTimelineAsync(vehicle.VehicleId, trips, Array.Empty<int>(), cancellationToken);
        if (overlapErrors.Count > 0)
        {
            return FMSResponse<VehicleTripManualOverrideResponseDTO>.ValidationFailed(overlapErrors);
        }

        var approvalErrors = await _validationService.ValidateSupervisorApprovalAsync(vehicle.VehicleId, startTimeUtc, endTimeUtc, request.SupervisorApproval, cancellationToken);
        if (approvalErrors.Count > 0)
        {
            return FMSResponse<VehicleTripManualOverrideResponseDTO>.ValidationFailed(approvalErrors);
        }

        try
        {
            var executionStrategy = _context.Database.CreateExecutionStrategy();
            var response = await executionStrategy.ExecuteAsync(async () =>
            {
                await using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);

                var resultGroup = VehicleTripManualOverrideFactory.BuildResultGroupEntity(vehicle.VehicleId, vehicle.MovementProfile, request.GroupingType, trips, VehicleTripManualOverrideAction.Add, VehicleTripReconciliationStatus.Adjusted);
                _context.VehicleTripGroups.Add(resultGroup);
                await _context.SaveChangesAsync(cancellationToken);

                var persistedResult = await _validationService.LoadGroupAsync(resultGroup.VehicleTripGroupId, cancellationToken);
                var resultSnapshot = persistedResult != null ? VehicleTripManualOverrideFactory.MapGroupToDetailDto(persistedResult) : null;

                await _auditService.RecordAsync(new VehicleTripOverrideAuditPayloadDTO
                {
                    Action = VehicleTripManualOverrideAction.Add,
                    Reason = request.Reason,
                    RequestedByUserId = request.RequestedByUserId,
                    RequestedByName = request.RequestedByName,
                    RequestIpAddress = request.RequestIpAddress,
                    RequestedAtUtc = DateTime.UtcNow,
                    VehicleId = vehicle.VehicleId,
                    ResultVehicleTripGroupId = resultGroup.VehicleTripGroupId,
                    RequiredSupervisorApproval = await _validationService.PeriodHasFinalizedFuelAuditAsync(vehicle.VehicleId, startTimeUtc, endTimeUtc, cancellationToken),
                    SupervisorApproval = request.SupervisorApproval,
                    NewValues = resultSnapshot,
                }, cancellationToken);

                await transaction.CommitAsync(cancellationToken);

                return FMSResponse<VehicleTripManualOverrideResponseDTO>.Success(
                    VehicleTripManualOverrideFactory.CreateResponse(resultGroup.VehicleTripGroupId, null, VehicleTripManualOverrideAction.Add, VehicleTripReconciliationStatus.Adjusted, "Manual trip created successfully.", request));
            });

            return response;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error adding manual trip for vehicle {VehicleId}", request.VehicleId);
            return FMSResponse<VehicleTripManualOverrideResponseDTO>.SystemError($"Failed to add manual trip: {ex.Message}");
        }
    }

    public Task<FMSResponse<VehicleTripManualOverrideResponseDTO>> DeleteTripAsync(DeleteVehicleTripCommand request, CancellationToken cancellationToken = default)
        => ExecuteAgainstExistingGroupAsync(
            request,
            VehicleTripManualOverrideAction.Delete,
            request.VehicleTripGroupId,
            request.VehicleTripId,
            null,
            group =>
            {
                var trips = VehicleTripManualOverrideFactory.BuildMutableTrips(group);
                if (request.VehicleTripId.HasValue)
                {
                    var removed = trips.RemoveAll(t => t.VehicleTripId == request.VehicleTripId.Value);
                    if (removed == 0)
                    {
                        return Task.FromResult(FMSResponse<List<VehicleTripMutationState>>.NotFound("VEHICLE_TRIP_NOT_FOUND", $"Trip {request.VehicleTripId.Value} was not found in group {request.VehicleTripGroupId}."));
                    }
                }
                else
                {
                    trips.Clear();
                }

                return Task.FromResult(FMSResponse<List<VehicleTripMutationState>>.Success(trips));
            },
            cancellationToken);

    public Task<FMSResponse<VehicleTripManualOverrideResponseDTO>> AdjustTripTimesAsync(AdjustVehicleTripTimesCommand request, CancellationToken cancellationToken = default)
        => ExecuteAgainstExistingGroupAsync(
            request,
            VehicleTripManualOverrideAction.AdjustTimes,
            request.VehicleTripGroupId,
            request.VehicleTripId,
            null,
            group =>
            {
                var trips = VehicleTripManualOverrideFactory.BuildMutableTrips(group);
                var target = trips.FirstOrDefault(t => t.VehicleTripId == request.VehicleTripId);
                if (target == null)
                {
                    return Task.FromResult(FMSResponse<List<VehicleTripMutationState>>.NotFound("VEHICLE_TRIP_NOT_FOUND", $"Trip {request.VehicleTripId} was not found in group {request.VehicleTripGroupId}."));
                }

                if (!request.OverrideStartTimeUtc.HasValue && !request.OverrideEndTimeUtc.HasValue)
                {
                    return Task.FromResult(FMSResponse<List<VehicleTripMutationState>>.ValidationFailed(new List<string>
                    {
                        "At least one override time must be provided."
                    }));
                }

                target.StartTimeUtc = request.OverrideStartTimeUtc?.ToUniversalTime() ?? target.StartTimeUtc;
                target.EndTimeUtc = request.OverrideEndTimeUtc?.ToUniversalTime() ?? target.EndTimeUtc;
                target.DurationMinutes = VehicleTripManualOverrideFactory.GetDurationMinutes(target.StartTimeUtc, target.EndTimeUtc);
                target.FuelAtDeparture = null;
                target.FuelAtArrival = null;
                target.FuelConsumed = null;

                return Task.FromResult(FMSResponse<List<VehicleTripMutationState>>.Success(trips));
            },
            cancellationToken);

    private async Task<FMSResponse<VehicleTripManualOverrideResponseDTO>> ExecuteAgainstExistingGroupAsync(
        VehicleTripManualOverrideCommandBase request,
        VehicleTripManualOverrideAction action,
        int vehicleTripGroupId,
        int? vehicleTripId,
        int? secondaryVehicleTripId,
        Func<VehicleTripGroup, Task<FMSResponse<List<VehicleTripMutationState>>>> mutateAsync,
        CancellationToken cancellationToken)
    {
        var requestValidation = _validationService.ValidateBaseRequest(request.Reason, request.RequestedByUserId);
        if (requestValidation.Count > 0)
        {
            return FMSResponse<VehicleTripManualOverrideResponseDTO>.ValidationFailed(requestValidation);
        }

        if (vehicleTripGroupId <= 0)
        {
            return FMSResponse<VehicleTripManualOverrideResponseDTO>.ValidationFailed(new List<string> { "VehicleTripGroupId must be greater than zero." });
        }

        var group = await _validationService.LoadGroupAsync(vehicleTripGroupId, cancellationToken);
        if (group == null || VehicleTripDetectionModeHelper.IsSuperseded(group.DetectionMode))
        {
            return FMSResponse<VehicleTripManualOverrideResponseDTO>.NotFound("VEHICLE_TRIP_GROUP_NOT_FOUND", $"Trip group {vehicleTripGroupId} was not found.");
        }

        var originalSnapshot = VehicleTripManualOverrideFactory.MapGroupToDetailDto(group);
        var approvalErrors = await _validationService.ValidateSupervisorApprovalAsync(group.VehicleId, group.StartTimeUtc, group.EndTimeUtc, request.SupervisorApproval, cancellationToken);
        if (approvalErrors.Count > 0)
        {
            return FMSResponse<VehicleTripManualOverrideResponseDTO>.ValidationFailed(approvalErrors);
        }

        var mutationResult = await mutateAsync(group);
        if (!mutationResult.IsSuccess)
        {
            return VehicleTripManualOverrideFactory.PropagateFailure(mutationResult);
        }

        var mutatedTrips = mutationResult.Data ?? new List<VehicleTripMutationState>();
        var reconciliationStatus = action == VehicleTripManualOverrideAction.Split
            ? VehicleTripReconciliationStatus.Split
            : action == VehicleTripManualOverrideAction.Merge
                ? VehicleTripReconciliationStatus.Merged
                : VehicleTripReconciliationStatus.Adjusted;

        if (mutatedTrips.Count > 0)
        {
            foreach (var trip in mutatedTrips)
            {
                trip.StartTimeUtc = trip.StartTimeUtc.ToUniversalTime();
                trip.EndTimeUtc = trip.EndTimeUtc.ToUniversalTime();
                trip.DurationMinutes = VehicleTripManualOverrideFactory.GetDurationMinutes(trip.StartTimeUtc, trip.EndTimeUtc);
                trip.DetectionMode = VehicleTripDetectionModeHelper.CreateManualOverrideMode(action);
                trip.ReconciliationStatus = reconciliationStatus;
            }

            await _fuelContextService.EnrichTripsAsync(group.VehicleId, mutatedTrips, cancellationToken);
            await _confidenceScoringService.ScoreTripsAsync(mutatedTrips.Cast<VehicleTripDetectionResultDTO>().ToList(), cancellationToken);

            var timelineErrors = await _validationService.ValidateTripTimelineAsync(group.VehicleId, mutatedTrips, new[] { group.VehicleTripGroupId }, cancellationToken);
            if (timelineErrors.Count > 0)
            {
                return FMSResponse<VehicleTripManualOverrideResponseDTO>.ValidationFailed(timelineErrors);
            }
        }

        try
        {
            var executionStrategy = _context.Database.CreateExecutionStrategy();
            var response = await executionStrategy.ExecuteAsync(async () =>
            {
                await using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);

                VehicleTripGroup? replacementGroup = null;
                VehicleTripDetailDTO? replacementSnapshot = null;

                if (mutatedTrips.Count > 0)
                {
                    replacementGroup = VehicleTripManualOverrideFactory.BuildResultGroupEntity(group.VehicleId, group.MovementProfile, VehicleTripManualOverrideFactory.ResolveGroupingType(group), mutatedTrips, action, reconciliationStatus);
                    _context.VehicleTripGroups.Add(replacementGroup);
                    await _context.SaveChangesAsync(cancellationToken);

                    var persistedReplacement = await _validationService.LoadGroupAsync(replacementGroup.VehicleTripGroupId, cancellationToken);
                    replacementSnapshot = persistedReplacement != null ? VehicleTripManualOverrideFactory.MapGroupToDetailDto(persistedReplacement) : null;
                }

                VehicleTripManualOverrideFactory.SupersedeGroup(group, action, replacementGroup?.VehicleTripGroupId, reconciliationStatus);
                await _context.SaveChangesAsync(cancellationToken);

                await _auditService.RecordAsync(new VehicleTripOverrideAuditPayloadDTO
                {
                    Action = action,
                    Reason = request.Reason,
                    RequestedByUserId = request.RequestedByUserId,
                    RequestedByName = request.RequestedByName,
                    RequestIpAddress = request.RequestIpAddress,
                    RequestedAtUtc = DateTime.UtcNow,
                    VehicleId = group.VehicleId,
                    VehicleTripGroupId = group.VehicleTripGroupId,
                    VehicleTripId = vehicleTripId,
                    SecondaryVehicleTripId = secondaryVehicleTripId,
                    ResultVehicleTripGroupId = replacementGroup?.VehicleTripGroupId,
                    RequiredSupervisorApproval = await _validationService.PeriodHasFinalizedFuelAuditAsync(group.VehicleId, group.StartTimeUtc, group.EndTimeUtc, cancellationToken),
                    SupervisorApproval = request.SupervisorApproval,
                    OriginalValues = originalSnapshot,
                    NewValues = replacementSnapshot,
                }, cancellationToken);

                await transaction.CommitAsync(cancellationToken);

                return FMSResponse<VehicleTripManualOverrideResponseDTO>.Success(
                    VehicleTripManualOverrideFactory.CreateResponse(replacementGroup?.VehicleTripGroupId ?? group.VehicleTripGroupId, group.VehicleTripGroupId, action, reconciliationStatus, VehicleTripManualOverrideFactory.BuildSuccessMessage(action, replacementGroup != null), request));
            });

            return response;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error applying {Action} override to vehicle trip group {VehicleTripGroupId}", action, vehicleTripGroupId);
            return FMSResponse<VehicleTripManualOverrideResponseDTO>.SystemError($"Failed to apply manual override: {ex.Message}");
        }
    }

    private static decimal? Max(decimal? first, decimal? second)
    {
        if (!first.HasValue)
        {
            return second;
        }

        if (!second.HasValue)
        {
            return first;
        }

        return Math.Max(first.Value, second.Value);
    }
}
