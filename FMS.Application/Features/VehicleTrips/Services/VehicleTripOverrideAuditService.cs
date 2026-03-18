/**
 * File: VehicleTripOverrideAuditService.cs
 * Purpose: Persists and retrieves manual trip override audit records using the dedicated trip override table with legacy fallback.
 * Dependencies: DbContext, System.Text.Json, trip override entity, legacy user activity entity.
 * Last Modified: 2026-03-12
 */
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Features.VehicleTrips.DTOs;
using FMS.Domain.Entities;
using FMS.Persistence.DataAccess;
using Microsoft.EntityFrameworkCore;

namespace FMS.Application.Features.VehicleTrips.Services;

public class VehicleTripOverrideAuditService : IVehicleTripOverrideAuditService
{
    private const string LegacyControllerName = "VehicleTripsOverride";
    private const string LegacyActionName = "VehicleTripManualOverride";
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);
    private readonly GpsdataContext _context;

    public VehicleTripOverrideAuditService(GpsdataContext context)
    {
        _context = context;
    }

    public async Task RecordAsync(VehicleTripOverrideAuditPayloadDTO payload, CancellationToken cancellationToken = default)
    {
        var auditRecord = new VehicleTripOverride
        {
            VehicleId = payload.VehicleId,
            VehicleTripGroupId = payload.VehicleTripGroupId,
            VehicleTripId = payload.VehicleTripId,
            SecondaryVehicleTripId = payload.SecondaryVehicleTripId,
            ResultVehicleTripGroupId = payload.ResultVehicleTripGroupId,
            ActionType = payload.Action.ToString(),
            Reason = payload.Reason,
            RequestedByUserId = string.IsNullOrWhiteSpace(payload.RequestedByUserId) ? "system" : payload.RequestedByUserId,
            RequestedByName = payload.RequestedByName,
            RequestIpAddress = payload.RequestIpAddress,
            RequestedAtUtc = payload.RequestedAtUtc,
            RequiredSupervisorApproval = payload.RequiredSupervisorApproval,
            SupervisorApprovalJson = payload.SupervisorApproval != null ? JsonSerializer.Serialize(payload.SupervisorApproval, JsonOptions) : null,
            OriginalValuesJson = payload.OriginalValues != null ? JsonSerializer.Serialize(payload.OriginalValues, JsonOptions) : null,
            NewValuesJson = payload.NewValues != null ? JsonSerializer.Serialize(payload.NewValues, JsonOptions) : null,
            CreatedAtUtc = DateTime.UtcNow,
        };

        _context.VehicleTripOverrides.Add(auditRecord);
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task<List<VehicleTripOverrideHistoryItemDTO>> GetHistoryAsync(int vehicleTripGroupId, int? vehicleTripId, CancellationToken cancellationToken = default)
    {
        var overrideQuery = _context.VehicleTripOverrides
            .AsNoTracking()
            .Where(overrideRecord => overrideRecord.VehicleTripGroupId == vehicleTripGroupId
                || overrideRecord.ResultVehicleTripGroupId == vehicleTripGroupId);

        if (vehicleTripId.HasValue)
        {
            overrideQuery = overrideQuery.Where(overrideRecord => overrideRecord.VehicleTripId == vehicleTripId.Value
                || overrideRecord.SecondaryVehicleTripId == vehicleTripId.Value);
        }

        var overrides = await overrideQuery
            .OrderByDescending(overrideRecord => overrideRecord.RequestedAtUtc)
            .ToListAsync(cancellationToken);

        var legacyGroupToken = $"\"VehicleTripGroupId\":{vehicleTripGroupId}";
        var legacyResultToken = $"\"ResultVehicleTripGroupId\":{vehicleTripGroupId}";
        var legacyTripToken = vehicleTripId.HasValue ? $"\"VehicleTripId\":{vehicleTripId.Value}" : null;

        var legacyQuery = _context.UserActivities
            .AsNoTracking()
            .Where(activity => activity.Controller == LegacyControllerName
                && activity.Action == LegacyActionName
                && activity.Parameters != null
                && (activity.Parameters.Contains(legacyGroupToken) || activity.Parameters.Contains(legacyResultToken)));

        if (legacyTripToken != null)
        {
            legacyQuery = legacyQuery.Where(activity => activity.Parameters!.Contains(legacyTripToken));
        }

        var activities = await legacyQuery
            .OrderByDescending(activity => activity.Timestamp)
            .ToListAsync(cancellationToken);

        return overrides
            .Select(MapOverride)
            .Concat(activities.Select(DeserializeLegacy))
            .Where(item => item != null)
            .Cast<VehicleTripOverrideHistoryItemDTO>()
            .OrderByDescending(item => item.RequestedAtUtc)
            .ToList();
    }

    private static VehicleTripOverrideHistoryItemDTO MapOverride(VehicleTripOverride record)
    {
        var action = Enum.TryParse<VehicleTripManualOverrideAction>(record.ActionType, true, out var parsedAction)
            ? parsedAction
            : VehicleTripManualOverrideAction.AdjustTimes;

        return new VehicleTripOverrideHistoryItemDTO
        {
            AuditId = record.VehicleTripOverrideId,
            Action = action,
            Reason = record.Reason,
            RequestedByUserId = record.RequestedByUserId,
            RequestedByName = record.RequestedByName,
            RequestIpAddress = record.RequestIpAddress,
            RequestedAtUtc = record.RequestedAtUtc,
            VehicleId = record.VehicleId,
            VehicleTripGroupId = record.VehicleTripGroupId,
            VehicleTripId = record.VehicleTripId,
            SecondaryVehicleTripId = record.SecondaryVehicleTripId,
            ResultVehicleTripGroupId = record.ResultVehicleTripGroupId,
            RequiredSupervisorApproval = record.RequiredSupervisorApproval,
            SupervisorApproval = DeserializeJson<VehicleTripSupervisorApprovalDTO>(record.SupervisorApprovalJson),
            OriginalValues = DeserializeJson<VehicleTripDetailDTO>(record.OriginalValuesJson),
            NewValues = DeserializeJson<VehicleTripDetailDTO>(record.NewValuesJson),
        };
    }

    private static VehicleTripOverrideHistoryItemDTO? DeserializeLegacy(UserActivity activity)
    {
        if (string.IsNullOrWhiteSpace(activity.Parameters))
        {
            return null;
        }

        var payload = JsonSerializer.Deserialize<VehicleTripOverrideAuditPayloadDTO>(activity.Parameters, JsonOptions);
        if (payload == null)
        {
            return null;
        }

        return new VehicleTripOverrideHistoryItemDTO
        {
            AuditId = activity.Id,
            Action = payload.Action,
            Reason = payload.Reason,
            RequestedByUserId = payload.RequestedByUserId,
            RequestedByName = payload.RequestedByName,
            RequestIpAddress = payload.RequestIpAddress,
            RequestedAtUtc = payload.RequestedAtUtc,
            VehicleId = payload.VehicleId,
            VehicleTripGroupId = payload.VehicleTripGroupId,
            VehicleTripId = payload.VehicleTripId,
            SecondaryVehicleTripId = payload.SecondaryVehicleTripId,
            ResultVehicleTripGroupId = payload.ResultVehicleTripGroupId,
            RequiredSupervisorApproval = payload.RequiredSupervisorApproval,
            SupervisorApproval = payload.SupervisorApproval,
            OriginalValues = payload.OriginalValues,
            NewValues = payload.NewValues,
        };
    }

    private static T? DeserializeJson<T>(string? json)
    {
        if (string.IsNullOrWhiteSpace(json))
        {
            return default;
        }

        return JsonSerializer.Deserialize<T>(json, JsonOptions);
    }
}
