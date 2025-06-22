using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Communication.Redis;
using FMS.Domain.Entities;
using FMS.Domain.Entities.enums;
using FMS.Persistence.DataAccess;
using Microsoft.EntityFrameworkCore;

namespace FMS.Application.Features.AutomatedReconciliation.Services;

//Cursor - PolicyEvaluationEngine with enhanced tank scope filtering and event-driven support
public class PolicyEvaluationEngine {
    private readonly GpsdataContext _context;
    private readonly IPolicyTriggerService _policyTriggerService;

    public PolicyEvaluationEngine (GpsdataContext context, IPolicyTriggerService policyTriggerService) {
        _context = context;
        _policyTriggerService = policyTriggerService;
    }

    //Cursor - Enhanced ApplyTankScopeFilter with HighPriorityOnly support
    public IQueryable<Tank> ApplyTankScopeFilter (IQueryable<Tank> query, ReconciliationTankScope scope) {
        if (scope == null)
            return query;

        // Apply existing filters...
        if (scope.SiteIds?.Any () == true) {
            query = query.Where (t => scope.SiteIds.Contains (t.SiteId));
        }

        if (scope.TankIds?.Any () == true) {
            query = query.Where (t => scope.TankIds.Contains (t.Id));
        }

        //Cursor - Add support for HighPriorityOnly flag
        if (scope.HighPriorityOnly == true) {
            // TODO: Implement priority filtering when Priority property is available on Tank entity
            // query = query.Where (t => t.Priority >= TankPriorityEnum.High);
        }

        return query;
    }

    //Cursor - Enhanced IsPolicyDueForExecution with event-driven support
    public async Task<bool> IsPolicyDueForExecution (ReconciliationPolicy policy, CancellationToken cancellationToken = default) {
        if (policy == null || !policy.IsActive)
            return false;

        // Handle different execution types
        switch (policy.ExecutionType?.ToLower ()) {
            case "scheduled":
                return await IsScheduledPolicyDue (policy, cancellationToken);

            case "eventdriven":
                //Cursor - Event-driven hook placeholder for external signals
                return await IsEventDrivenPolicyTriggered (policy, cancellationToken);

            case "manual":
                return false; // Manual policies are not automatically due

            default:
                return false;
        }
    }

    private async Task<bool> IsScheduledPolicyDue (ReconciliationPolicy policy, CancellationToken cancellationToken) {
        // Get last execution
        var lastExecution = await _context.ReconciliationPolicyExecutions
            .Where (e => e.PolicyId == policy.Id)
            .OrderByDescending (e => e.ExecutionStartTime)
            .FirstOrDefaultAsync (cancellationToken);

        if (lastExecution == null)
            return true; // Never executed, so it's due

        // Check based on schedule frequency
        var timeSinceLastExecution = DateTime.UtcNow - lastExecution.ExecutionStartTime;

        return policy.ScheduleFrequencyHours.HasValue &&
            timeSinceLastExecution.TotalHours >= policy.ScheduleFrequencyHours.Value;
    }

    //Cursor - Event-driven policy trigger check with Redis implementation
    private async Task<bool> IsEventDrivenPolicyTriggered (ReconciliationPolicy policy, CancellationToken cancellationToken) {
        try {
            // Check for pending triggers in Redis
            return await _policyTriggerService.HasPendingTriggersAsync (policy.Id, cancellationToken);
        } catch (Exception ex) {
            // Log error and fallback to database check if Redis fails
            // Check for pending event signals in database as fallback
            try {
                var pendingEvents = await _context.ReconciliationEventTriggers
                    .Where (e => e.PolicyId == policy.Id && !e.IsProcessed)
                    .AnyAsync (cancellationToken);

                return pendingEvents;
            } catch {
                // If both Redis and database fail, return false to avoid blocking
                return false;
            }
        }
    }

    //Cursor - Evaluate if tanks need reconciliation based on policy criteria
    public async Task<List<Tank>> GetTanksRequiringReconciliation (ReconciliationPolicy policy, CancellationToken cancellationToken = default) {
        var tanksQuery = _context.Tanks.AsQueryable ();

        // Apply scope filters
        if (policy.TankScope != null) {
            tanksQuery = ApplyTankScopeFilter (tanksQuery, policy.TankScope);
        }

        // Apply additional criteria based on policy thresholds
        var tanks = await tanksQuery.ToListAsync (cancellationToken);

        var tanksNeedingReconciliation = new List<Tank> ();

        foreach (var tank in tanks) {
            if (await DoesTankNeedReconciliation (tank, policy, cancellationToken)) {
                tanksNeedingReconciliation.Add (tank);
            }
        }

        return tanksNeedingReconciliation;
    }

    //Cursor - Mark policy triggers as processed after execution
    public async Task MarkPolicyTriggersProcessedAsync (int policyId, CancellationToken cancellationToken = default) {
        try {
            await _policyTriggerService.MarkTriggersProcessedAsync (policyId, cancellationToken);
        } catch (Exception ex) {
            // Log error but don't throw to avoid blocking policy execution
            // TODO: Add proper logging here
        }
    }

    //Cursor - Publish a trigger event for a policy (used by external systems)
    public async Task PublishPolicyTriggerAsync (int policyId, string triggerReason, object? metadata = null, CancellationToken cancellationToken = default) {
        await _policyTriggerService.PublishPolicyTriggerAsync (policyId, triggerReason, metadata, cancellationToken);
    }

    private async Task<bool> DoesTankNeedReconciliation (Tank tank, ReconciliationPolicy policy, CancellationToken cancellationToken) {
        // Get latest tank readings and compare with expected values
        var latestReading = await _context.TankVolumeHistories
            .Where (tvh => tvh.TankId == tank.Id)
            .OrderByDescending (tvh => tvh.Timestamp)
            .FirstOrDefaultAsync (cancellationToken);

        if (latestReading == null)
            return false;

        // Check variance thresholds
        var varianceThreshold = policy.VarianceThresholdLiters ?? 1.0m;
        var percentageThreshold = policy.VarianceThresholdPercentage ?? 1.0m;

        // Calculate expected vs actual variance
        // This would need to be implemented based on business logic
        var expectedVolume = await CalculateExpectedVolume (tank, cancellationToken);
        var actualVolume = latestReading.NewVolume ?? 0; // Using Volume instead of CurrentVolume, default to 0 if null

        var absoluteVariance = Math.Abs (expectedVolume - actualVolume);
        var percentageVariance = expectedVolume > 0 ? absoluteVariance / expectedVolume * 100 : 0;

        return absoluteVariance > varianceThreshold || percentageVariance > percentageThreshold;
    }

    //Cursor - Calculate expected volume based on all fuel movements within specified time window
    private async Task<decimal> CalculateExpectedVolume(Tank tank, CancellationToken cancellationToken = default)
    {
        try
        {
            // Define time window for calculation (24 hours)
            var cutoffTime = DateTime.UtcNow.AddHours(-24);

            // Step 1: Get starting volume (24 hours ago)
            var startingVolumeReading = await _context.TankVolumeHistories
                .Where(tvh => tvh.TankId == tank.Id && tvh.Timestamp >= cutoffTime)
                .OrderBy(tvh => tvh.Timestamp)
                .FirstOrDefaultAsync(cancellationToken);

            decimal startingVolume = startingVolumeReading?.NewVolume ?? tank.CurrentStock ?? 0;

            // Step 2: Get all ADDITIONS (fuel coming IN)

            // Deliveries to this tank
            var deliveries = await _context.Deliveries
                .Where(d => d.TankId == tank.Id && d.DeliveryDate >= cutoffTime)
                .ToListAsync(cancellationToken);
            var deliveryVolume = deliveries.Sum(d => d.ManualDeliveryAmount);

            // Transfers IN to this tank from other tanks
            var transfersIn = await _context.TankTransfers
                .Where(tt => tt.DestinationTankId == tank.Id && tt.TransferDate >= cutoffTime)
                .ToListAsync(cancellationToken);
            var transferInVolume = transfersIn.Sum(t => t.Amount ?? 0);

            // Step 3: Get all SUBTRACTIONS (fuel going OUT)

            // Fuel sold through pumps
            var pumpTransactions = await _context.Pumptransactions
                .Where(pt => pt.TankId == tank.Id && pt.DateTime >= cutoffTime)
                .ToListAsync(cancellationToken);
            var consumptionVolume = pumpTransactions.Sum(pt => pt.TotalVolume ?? 0);

            // Transfers OUT from this tank to other tanks
            var transfersOut = await _context.TankTransfers
                .Where(tt => tt.SourceTankId == tank.Id && tt.TransferDate >= cutoffTime)
                .ToListAsync(cancellationToken);
            var transferOutVolume = transfersOut.Sum(t => t.Amount ?? 0);

            // Step 4: Calculate expected volume
            var expectedVolume = startingVolume + deliveryVolume + transferInVolume - consumptionVolume - transferOutVolume;

            // Make sure result is not negative
            return Math.Max(0, expectedVolume);
        }
        catch (Exception ex)
        {
            // If calculation fails, return current stock as fallback
            return tank.CurrentStock ?? 0;
        }
    }
}