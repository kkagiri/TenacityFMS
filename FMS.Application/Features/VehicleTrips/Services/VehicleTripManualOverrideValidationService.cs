/**
 * File: VehicleTripManualOverrideValidationService.cs
 * Purpose: Loads active trip groups and validates manual override timeline and approval rules.
 * Dependencies: DbContext, fuel audit periods, vehicle trip entities.
 * Last Modified: 2026-03-11
 */
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Features.VehicleTrips.DTOs;
using FMS.Domain.Entities;
using FMS.Persistence.DataAccess;
using Microsoft.EntityFrameworkCore;

namespace FMS.Application.Features.VehicleTrips.Services;

public class VehicleTripManualOverrideValidationService : IVehicleTripManualOverrideValidationService
{
    private readonly GpsdataContext _context;

    public VehicleTripManualOverrideValidationService(GpsdataContext context)
    {
        _context = context;
    }

    public List<string> ValidateBaseRequest(string reason, string requestedByUserId)
    {
        var errors = new List<string>();
        if (string.IsNullOrWhiteSpace(reason))
        {
            errors.Add("Reason is required for all manual overrides.");
        }

        if (string.IsNullOrWhiteSpace(requestedByUserId))
        {
            errors.Add("RequestedByUserId is required for all manual overrides.");
        }

        return errors;
    }

    public async Task<VehicleTripGroup?> LoadGroupAsync(int vehicleTripGroupId, CancellationToken cancellationToken = default)
        => await _context.VehicleTripGroups
            .Include(g => g.Vehicle)
            .Include(g => g.OriginSite)
            .Include(g => g.DestinationSite)
            .Include(g => g.Trips)
                .ThenInclude(t => t.OriginSite)
            .Include(g => g.Trips)
                .ThenInclude(t => t.DestinationSite)
            .FirstOrDefaultAsync(g => g.VehicleTripGroupId == vehicleTripGroupId, cancellationToken);

    public async Task<List<string>> ValidateTripTimelineAsync(int vehicleId, List<VehicleTripMutationState> trips, IReadOnlyCollection<int> excludedGroupIds, CancellationToken cancellationToken = default)
    {
        var errors = new List<string>();
        var orderedTrips = trips.OrderBy(t => t.StartTimeUtc).ToList();

        for (var index = 0; index < orderedTrips.Count; index++)
        {
            var trip = orderedTrips[index];
            if (trip.EndTimeUtc <= trip.StartTimeUtc)
            {
                errors.Add("Arrival time must be later than departure time for every trip leg.");
            }

            if (index > 0 && trip.StartTimeUtc < orderedTrips[index - 1].EndTimeUtc)
            {
                errors.Add("Trip legs cannot overlap in time.");
            }
        }

        if (errors.Count > 0 || orderedTrips.Count == 0)
        {
            return errors;
        }

        var fromUtc = orderedTrips.First().StartTimeUtc;
        var toUtc = orderedTrips.Last().EndTimeUtc;
        var overlappingGroups = await _context.VehicleTripGroups
            .AsNoTracking()
            .Where(g => g.VehicleId == vehicleId
                && !excludedGroupIds.Contains(g.VehicleTripGroupId)
                && !g.DetectionMode.StartsWith(VehicleTripDetectionModeHelper.SupersededPrefix)
                && g.StartTimeUtc < toUtc
                && g.EndTimeUtc > fromUtc)
            .Select(g => g.VehicleTripGroupId)
            .ToListAsync(cancellationToken);

        if (overlappingGroups.Count > 0)
        {
            errors.Add($"The override overlaps active trip group(s): {string.Join(", ", overlappingGroups)}.");
        }

        return errors;
    }

    public async Task<List<string>> ValidateSupervisorApprovalAsync(int vehicleId, DateTime startTimeUtc, DateTime endTimeUtc, VehicleTripSupervisorApprovalDTO? supervisorApproval, CancellationToken cancellationToken = default)
    {
        var requiresSupervisorApproval = await PeriodHasFinalizedFuelAuditAsync(vehicleId, startTimeUtc, endTimeUtc, cancellationToken);
        if (!requiresSupervisorApproval)
        {
            return new List<string>();
        }

        var errors = new List<string>();
        if (supervisorApproval == null)
        {
            errors.Add("Supervisor approval is required because the selected period has already been finalized in fuel audit.");
            return errors;
        }

        if (string.IsNullOrWhiteSpace(supervisorApproval.ApprovedByUserId))
        {
            errors.Add("Supervisor ApprovedByUserId is required for finalized periods.");
        }

        if (string.IsNullOrWhiteSpace(supervisorApproval.ApprovalReason))
        {
            errors.Add("Supervisor ApprovalReason is required for finalized periods.");
        }

        return errors;
    }

    public async Task<bool> PeriodHasFinalizedFuelAuditAsync(int vehicleId, DateTime startTimeUtc, DateTime endTimeUtc, CancellationToken cancellationToken = default)
    {
        return await _context.FuelAudits
            .AsNoTracking()
            .Where(a => a.Status == "Finalized"
                && a.StartDate <= endTimeUtc
                && a.EndDate >= startTimeUtc)
            .AnyAsync(cancellationToken);
    }
}
