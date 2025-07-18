using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
// using FMS.Application.Features.TankManagement.DailyTankReconciliation.Commands; //Cursor - Commented out as files are not active
using FMS.Application.Common; //Cursor - Add for FMSResponse
using FMS.Application.Common.Constants; //Cursor - Add for SystemConstants
using FMS.Application.Features.TankManagement.Services; //Cursor - Add for InventoryCostingService
using System.Text.Json;
using FMS.Domain.Entities;
using FMS.Domain.Entities.enums;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.AutomatedReconciliation.Services;

//Cursor - Temporary types until DailyTankReconciliation files are uncommented
public class ProcessDailyReconciliationCommand : IRequest<FMSResponse<DailyReconciliationResult>> {
    public DateTime StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public int? TankId { get; set; }
    public int? SiteId { get; set; }
    public bool ForceReprocess { get; set; } = false;
}

public class DailyReconciliationResult {
    public DateTime ProcessedDate { get; set; }
    public int TotalTanksProcessed { get; set; }
    public int RecordsCreated { get; set; }
    public int RecordsUpdated { get; set; }
    public int RecordsWithDiscrepancies { get; set; }
    public List<TankReconciliationSummary> TankSummaries { get; set; } = new ();
    public List<string> Warnings { get; set; } = new ();
    public List<string> Errors { get; set; } = new ();
    public TimeSpan ProcessingDuration { get; set; }
}

public class TankReconciliationSummary {
    public int TankId { get; set; }
    public string TankName { get; set; }
    public string SiteName { get; set; }
    public DateTime ReconciliationDate { get; set; }
    public decimal OpeningLevel { get; set; }
    public decimal ClosingLevel { get; set; }
    public decimal TotalRefills { get; set; }
    public decimal TotalDeliveries { get; set; }
    public decimal TotalTransfersIn { get; set; }
    public decimal TotalTransfersOut { get; set; }
    public decimal CalculatedClosing { get; set; }
    public decimal Variance { get; set; }
    public bool HasDiscrepancy { get; set; }
    public string Status { get; set; }
}

//Cursor - Service to integrate daily tank reconciliation with automated reconciliation policies
public class DailyReconciliationPolicyService {
    private readonly GpsdataContext _context;
    private readonly IMediator _mediator;
    private readonly ILogger<DailyReconciliationPolicyService> _logger;
    private readonly InventoryCostingService _costingService; //Cursor - Add inventory costing service

    public DailyReconciliationPolicyService (
        GpsdataContext context,
        IMediator mediator,
        ILogger<DailyReconciliationPolicyService> logger,
        InventoryCostingService costingService) { //Cursor - Inject costing service
        _context = context;
        _mediator = mediator;
        _logger = logger;
        _costingService = costingService;
    }

    //Cursor - Execute daily reconciliation as part of automated reconciliation policy
    public async Task<PolicyExecutionResult> ExecuteDailyReconciliationPolicyAsync (
        ReconciliationPolicy policy,
        CancellationToken cancellationToken = default) {
        var executionResult = new PolicyExecutionResult {
        PolicyId = policy.Id,
        StartedAt = DateTime.UtcNow,
        ExecutionId = Guid.NewGuid ()
        };

        try {
            _logger.LogInformation ("Executing daily reconciliation policy {PolicyId} - {PolicyName}",
                policy.Id, policy.Name);

            // Determine the date to process (yesterday by default for daily reconciliation)
            var targetDate = GetTargetDateForPolicy (policy);

            // Create command for daily reconciliation processing
            var command = new ProcessDailyReconciliationCommand {
                StartDate = targetDate,
                EndDate = targetDate, // Single day processing
                SiteId = GetSiteIdFromPolicy (policy),
                TankId = GetTankIdFromPolicy (policy),
                ForceReprocess = false
            };

            // Execute daily reconciliation
            var reconciliationResponse = await _mediator.Send (command, cancellationToken);

            if (reconciliationResponse.IsSuccess && reconciliationResponse.Data != null) {
                var result = reconciliationResponse.Data;

                executionResult.Success = true;
                executionResult.ProcessedTanks = result.TotalTanksProcessed;
                executionResult.DiscrepanciesFound = result.RecordsWithDiscrepancies;
                executionResult.DiscrepanciesResolved = result.RecordsCreated + result.RecordsUpdated;
                executionResult.CompletedAt = DateTime.UtcNow;

                // Create discrepancy records for significant variances
                await CreateDiscrepancyRecordsFromDailyReconciliation (result, policy, cancellationToken);

                _logger.LogInformation ("Daily reconciliation policy {PolicyId} completed successfully. " +
                    "Processed {TankCount} tanks, found {DiscrepancyCount} discrepancies",
                    policy.Id, result.TotalTanksProcessed, result.RecordsWithDiscrepancies);
            } else {
                executionResult.Success = false;
                executionResult.ErrorMessage = reconciliationResponse.Message;
                executionResult.CompletedAt = DateTime.UtcNow;

                _logger.LogError ("Daily reconciliation policy {PolicyId} failed: {ErrorMessage}",
                    policy.Id, reconciliationResponse.Message);
            }

            return executionResult;
        } catch (Exception ex) {
            _logger.LogError (ex, "Error executing daily reconciliation policy {PolicyId}", policy.Id);

            executionResult.Success = false;
            executionResult.ErrorMessage = ex.Message;
            executionResult.CompletedAt = DateTime.UtcNow;

            return executionResult;
        }
    }

    //Cursor - Create discrepancy records from daily reconciliation results for automated processing
    private async Task CreateDiscrepancyRecordsFromDailyReconciliation (
        DailyReconciliationResult result,
        ReconciliationPolicy policy,
        CancellationToken cancellationToken) {
        var discrepancyThreshold = policy.DiscrepancyThreshold ?? 5.0m; // Default 5L threshold
        var significantDiscrepancies = result.TankSummaries
            .Where (ts => ts.HasDiscrepancy && ts.Variance > discrepancyThreshold)
            .ToList ();

        if (!significantDiscrepancies.Any ()) {
            _logger.LogDebug ("No significant discrepancies found above threshold {Threshold}L", discrepancyThreshold);
            return;
        }

        // Get the policy execution record
        var policyExecution = await _context.ReconciliationPolicyExecutions
            .Where (pe => pe.PolicyId == policy.Id)
            .OrderByDescending (pe => pe.ExecutionStartTime)
            .FirstOrDefaultAsync (cancellationToken);

        if (policyExecution == null) {
            _logger.LogWarning ("No policy execution record found for policy {PolicyId}", policy.Id);
            return;
        }

        // Create discrepancy records
        var discrepancyRecords = new List<ReconciliationDiscrepancy> ();

        foreach (var tankSummary in significantDiscrepancies) {
            //Cursor - Use inventory costing service for accurate business impact calculation
            var businessImpact = await CalculateBusinessImpactUsingCostingService (tankSummary.Variance, tankSummary.TankId, cancellationToken);

            var discrepancyRecord = new ReconciliationDiscrepancy {
                PolicyExecutionId = policyExecution.Id,
                TankId = tankSummary.TankId,
                DetectedAt = DateTime.UtcNow,
                CurrentStock = tankSummary.ClosingLevel,
                ExpectedStock = tankSummary.CalculatedClosing,
                AbsoluteVariance = tankSummary.Variance,
                PercentageVariance = tankSummary.OpeningLevel > 0 ? (tankSummary.Variance / tankSummary.OpeningLevel) * 100 : 0,
                Severity = DetermineDiscrepancySeverity (tankSummary.Variance, discrepancyThreshold),
                IsResolved = false,
                AnalysisNotes = $"Daily reconciliation discrepancy detected on {tankSummary.ReconciliationDate:yyyy-MM-dd}. " +
                $"Opening: {tankSummary.OpeningLevel}L, Closing: {tankSummary.ClosingLevel}L, " +
                $"Expected: {tankSummary.CalculatedClosing}L, Variance: {tankSummary.Variance}L",
                BusinessImpactScore = businessImpact
            };

            discrepancyRecords.Add (discrepancyRecord);
        }

        _context.ReconciliationDiscrepancies.AddRange (discrepancyRecords);
        await _context.SaveChangesAsync (cancellationToken);

        _logger.LogInformation ("Created {Count} discrepancy records from daily reconciliation for policy {PolicyId}",
            discrepancyRecords.Count, policy.Id);
    }

    //Cursor - Calculate business impact using the inventory costing service
    private async Task<decimal> CalculateBusinessImpactUsingCostingService (decimal variance, int tankId, CancellationToken cancellationToken = default) {
        try {
            var costResponse = await _costingService.GetWeightedAverageCostAsync (tankId, cancellationToken);
            if (costResponse.IsSuccess) {
                var costPerLiter = costResponse.Data;
                var businessImpact = Math.Abs (variance) * costPerLiter;

                _logger.LogDebug ("Business impact calculated for Tank {TankId}: Variance {Variance}L × Cost {Cost} KES/L = {Impact} KES",
                    tankId, variance, costPerLiter, businessImpact);

                return businessImpact;
            } else {
                _logger.LogWarning ("Failed to get weighted average cost for tank {TankId}: {Error}. Using fallback calculation.",
                    tankId, costResponse.Message);
                return Math.Abs (variance) * 150.0m; // Fallback to 150 KES per liter
            }
        } catch (Exception ex) {
            _logger.LogError (ex, "Error calculating business impact for tank {TankId}, using fallback", tankId);
            return Math.Abs (variance) * 150.0m; // Fallback to 150 KES per liter
        }
    }

    //Cursor - Determine target date for policy execution
    private DateTime GetTargetDateForPolicy (ReconciliationPolicy policy) {
        // For daily reconciliation, typically process previous day's data
        var targetDate = DateTime.Today.AddDays (-1);

        // Check if policy has specific configuration for target date
        if (!string.IsNullOrEmpty (policy.ScheduleConfiguration)) {
            try {
                var config = JsonSerializer.Deserialize<Dictionary<string, object>> (policy.ScheduleConfiguration);
                if (config != null && config.ContainsKey ("TargetDateOffset")) {
                    if (int.TryParse (config["TargetDateOffset"].ToString (), out var offset)) {
                        targetDate = DateTime.Today.AddDays (offset);
                    }
                }
            } catch {
                // Use default if configuration parsing fails
            }
        }

        return targetDate;
    }

    //Cursor - Extract site ID from policy scope configuration
    private int? GetSiteIdFromPolicy (ReconciliationPolicy policy) {
        if (policy.TankScope?.SiteIds?.Any () == true) {
            return policy.TankScope.SiteIds.First (); // For daily reconciliation, process one site at a time
        }

        return null;
    }

    //Cursor - Extract tank ID from policy scope configuration
    private int? GetTankIdFromPolicy (ReconciliationPolicy policy) {
        if (policy.TankScope?.TankIds?.Any () == true) {
            return policy.TankScope.TankIds.First (); // For daily reconciliation, process one tank at a time
        }

        return null;
    }

    //Cursor - Determine discrepancy severity based on variance
    private DiscrepancySeverity DetermineDiscrepancySeverity (decimal variance, decimal threshold) {
        var ratio = variance / threshold;

        return ratio
        switch { >=
            5.0m => DiscrepancySeverity.Critical, >=
                3.0m => DiscrepancySeverity.High, >=
                2.0m => DiscrepancySeverity.Medium,
                _ => DiscrepancySeverity.Low
        };
    }

    //Cursor - Get current stock value using weighted average costing
    public async Task<decimal> GetCurrentStockValueAsync (int tankId, decimal currentStockLiters, CancellationToken cancellationToken = default) {
        var valuationResponse = await _costingService.GetStockValuationAsync (tankId, currentStockLiters, cancellationToken);
        return valuationResponse.IsSuccess ? valuationResponse.Data.TotalValue : 0;
    }

    //Cursor - Get stock movement impact for reporting
    public async Task<StockMovementImpact> GetStockMovementImpactAsync (int tankId, decimal previousStock, decimal currentStock, CancellationToken cancellationToken = default) {
        var impactResponse = await _costingService.CalculateMovementCostImpactAsync (tankId, previousStock, currentStock, "Reconciliation", cancellationToken);

        if (impactResponse.IsSuccess) {
            var costImpact = impactResponse.Data;
            return new StockMovementImpact {
                TankId = tankId,
                    PreviousStockLiters = costImpact.PreviousStockLiters,
                    CurrentStockLiters = costImpact.CurrentStockLiters,
                    StockMovementLiters = costImpact.StockMovementLiters,
                    WeightedAverageCostPerLiter = costImpact.CostPerLiter,
                    PreviousStockValue = costImpact.PreviousStockValue,
                    CurrentStockValue = costImpact.CurrentStockValue,
                    ValueImpact = costImpact.CostImpact,
                    MovementType = costImpact.MovementType,
                    Currency = costImpact.Currency
            };
        }

        // Fallback to simple calculation
        return new StockMovementImpact {
            TankId = tankId,
                PreviousStockLiters = previousStock,
                CurrentStockLiters = currentStock,
                StockMovementLiters = currentStock - previousStock,
                WeightedAverageCostPerLiter = 150.0m,
                PreviousStockValue = previousStock * 150.0m,
                CurrentStockValue = currentStock * 150.0m,
                ValueImpact = Math.Abs (currentStock - previousStock) * 150.0m,
                MovementType = currentStock > previousStock ? "Increase" : currentStock < previousStock ? "Decrease" : "No Change",
                Currency = "KES"
        };
    }

    //Cursor - Check if policy is configured for daily reconciliation
    public bool IsDailyReconciliationPolicy (ReconciliationPolicy policy) {
        return policy.ExecutionType == FMS.Domain.Entities.enums.ReconciliationPolicyType.Scheduled ||
            policy.Name?.ToLower ().Contains ("daily") == true ||
            policy.Description?.ToLower ().Contains ("daily reconciliation") == true;
    }

    //Cursor - Create a default daily reconciliation policy
    public async Task<ReconciliationPolicy> CreateDefaultDailyReconciliationPolicyAsync (
        string name = "Daily Tank Reconciliation",
        string description = "Automated daily tank reconciliation processing",
        CancellationToken cancellationToken = default) {
        var policy = new ReconciliationPolicy {
        Name = name,
        Description = description,
        ExecutionType = ReconciliationPolicyType.Scheduled,
        ScheduleFrequencyHours = 24, // Run daily
        IsActive = true,
        DiscrepancyThreshold = 5.0m,
        DiscrepancyPercentageThreshold = 2.0m,
        CreatedBy = SystemConstants.Defaults.SystemTriggeredBy,
        CreatedOn = DateTime.UtcNow,
        ScheduleConfiguration = System.Text.Json.JsonSerializer.Serialize (new Dictionary<string, object> {
        ["TargetDateOffset"] = -1, // Process previous day
        ["CreateDiscrepancyRecords"] = true,
        ["AutoResolveSmallVariances"] = true,
        ["SmallVarianceThreshold"] = 2.0m
        })
        };

        _context.ReconciliationPolicies.Add (policy);
        await _context.SaveChangesAsync (cancellationToken);

        _logger.LogInformation ("Created default daily reconciliation policy with ID {PolicyId}", policy.Id);
        return policy;
    }
}

//Cursor - Stock movement impact model for reporting
public class StockMovementImpact {
    public int TankId { get; set; }
    public decimal PreviousStockLiters { get; set; }
    public decimal CurrentStockLiters { get; set; }
    public decimal StockMovementLiters { get; set; }
    public decimal WeightedAverageCostPerLiter { get; set; }
    public decimal PreviousStockValue { get; set; }
    public decimal CurrentStockValue { get; set; }
    public decimal ValueImpact { get; set; }
    public string MovementType { get; set; }
    public string Currency { get; set; }
}