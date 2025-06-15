# Automated Reconciliation System Documentation

## Overview

The Automated Reconciliation System is a comprehensive solution for detecting and resolving fuel tank volume discrepancies in the FMS (Fuel Management System). It provides scheduled and event-driven reconciliation capabilities with configurable policies, real-time monitoring, and detailed analytics.

## System Architecture

### Core Components

1. **AutomatedReconciliationBackgroundService** - Main background service that orchestrates reconciliation cycles
2. **AutomatedReconciliationService** - Core service coordinating the reconciliation workflow
3. **PolicyEvaluationEngine** - Evaluates which policies should be executed and when
4. **DiscrepancyDetectionService** - Detects volume discrepancies based on policy thresholds
5. **ReconciliationOrchestrationService** - Orchestrates the reconciliation execution process
6. **TankVolumeHistoryIntegrationService** - Handles tank volume adjustments and history tracking
7. **PolicyTriggerService** - Redis-based service for event-driven policy triggers

### Data Entities

- **ReconciliationPolicy** - Defines reconciliation rules and schedules
- **ReconciliationPolicyExecution** - Tracks policy execution history and results
- **ReconciliationDiscrepancy** - Records detected discrepancies and their resolution status
- **TankVolumeHistory** - Maintains tank volume change history and reconciliation records

## Execution Flow

### 1. Background Service Initialization
```csharp
// Background service starts with configurable interval (default: 15 minutes)
var executionInterval = GetExecutionInterval(); // From configuration
while (!stoppingToken.IsCancellationRequested)
{
    await ExecuteReconciliationCycleAsync(stoppingToken);
    await Task.Delay(executionInterval, stoppingToken);
}
```

### 2. Policy Evaluation Phase
The system evaluates all active policies to determine which require execution:

#### Scheduled Policies
```csharp
// Check if enough time has passed since last execution
var timeSinceLastExecution = DateTime.UtcNow - lastExecution.StartedAt;
return policy.ScheduleFrequencyHours.HasValue &&
       timeSinceLastExecution.TotalHours >= policy.ScheduleFrequencyHours.Value;
```

#### Event-Driven Policies
```csharp
// Check for pending triggers in Redis
return await _policyTriggerService.HasPendingTriggersAsync(policy.Id, cancellationToken);
```

### 3. Tank Scope Filtering
Policies define which tanks to evaluate based on configurable criteria:

```csharp
public IQueryable<Tank> ApplyTankScopeFilter(IQueryable<Tank> query, ReconciliationTankScope scope)
{
    if (scope.SiteIds?.Any() == true)
        query = query.Where(t => scope.SiteIds.Contains(t.SiteId));

    if (scope.TankIds?.Any() == true)
        query = query.Where(t => scope.TankIds.Contains(t.Id));

    if (scope.FuelTypes?.Any() == true)
        query = query.Where(t => scope.FuelTypes.Contains(t.FuelType));

    if (scope.HighPriorityOnly == true)
        query = query.Where(t => t.Priority >= TankPriorityEnum.High);

    return query;
}
```

### 4. Discrepancy Detection
For each eligible tank, the system calculates volume variances:

```csharp
public async Task<DiscrepancyDetectionResult> DetectDiscrepancies(
    Tank tank,
    ReconciliationPolicy policy,
    CancellationToken cancellationToken = default)
{
    var varianceThresholdLiters = policy.VarianceThresholdLiters ?? _defaultVarianceThresholdLiters;
    var varianceThresholdPercentage = policy.VarianceThresholdPercentage ?? _defaultVarianceThresholdPercentage;

    var discrepancyResult = await CalculateDiscrepancy(tank, varianceThresholdLiters, varianceThresholdPercentage, cancellationToken);

    if (discrepancyResult.IsSignificant)
    {
        // Publish domain event for downstream alerting
        await _mediator.Publish(new DiscrepancyDetectedEvent
        {
            TankId = tank.Id,
            PolicyId = policy.Id,
            VarianceLiters = discrepancyResult.VarianceLiters,
            VariancePercentage = discrepancyResult.VariancePercentage,
            DetectedAt = DateTime.UtcNow,
            Severity = DetermineDiscrepancySeverity(discrepancyResult)
        }, cancellationToken);
    }

    return discrepancyResult;
}
```

### 5. Reconciliation Execution
When discrepancies are found, the system performs reconciliation:

```csharp
public async Task<ReconciliationExecutionResult> ExecuteReconciliationAsync(
    PolicyEvaluationResult policyResult,
    List<DetectedDiscrepancy> discrepancies,
    CancellationToken cancellationToken = default)
{
    // Create policy execution record
    var policyExecution = await CreatePolicyExecutionRecordAsync(policyResult, discrepancies.Count, executionStartTime, cancellationToken);

    // Process each discrepancy
    foreach (var discrepancy in discrepancies)
    {
        var discrepancyResult = await ProcessDiscrepancyAsync(policyExecution, discrepancy, cancellationToken);
        // Update reconciliation counters and records
    }

    // Finalize execution record with results
    await FinalizeExecutionRecordAsync(policyExecution, result, cancellationToken);

    return result;
}
```

### 6. Tank Volume Reconciliation
The core reconciliation logic updates tank current stock:

```csharp
public async Task<FMSResponseMessage> ReconcileTankCurrentStockAsync(
    int tankId,
    string recordedBy,
    CancellationToken cancellationToken = default)
{
    var tank = await _context.Tanks.FirstOrDefaultAsync(t => t.Id == tankId, cancellationToken);
    var latestRecord = await _context.TankVolumeHistories
        .Where(h => h.TankId == tankId)
        .OrderByDescending(h => h.Timestamp)
        .FirstOrDefaultAsync(cancellationToken);

    if (latestRecord?.NewVolume.HasValue == true && tank.CurrentStock != latestRecord.NewVolume.Value)
    {
        var oldStock = tank.CurrentStock ?? 0;
        var newStock = latestRecord.NewVolume.Value;
        var difference = newStock - oldStock;

        // Update tank current stock
        tank.CurrentStock = newStock;
        tank.LastStockUpdate = DateTime.UtcNow;

        // Create reconciliation volume history record
        var reconciliationRecord = new TankVolumeHistory
        {
            TankId = tankId,
            Timestamp = DateTime.UtcNow,
            VolumeChange = difference,
            NewVolume = newStock,
            ChangeReason = VolumeChangeReasonEnum.AutomatedReconciliation,
            RecordedBy = recordedBy,
            ReferenceType = "AutomatedReconciliation",
            CreatedOn = DateTime.UtcNow
        };

        _context.TankVolumeHistories.Add(reconciliationRecord);
        await _context.SaveChangesAsync(cancellationToken);
    }

    return new FMSResponseMessage(true, "Reconciliation completed successfully");
}
```

## Event-Driven Architecture

### Policy Trigger System
The system supports event-driven reconciliation through Redis-based triggers:

```csharp
public interface IPolicyTriggerService
{
    Task PublishPolicyTriggerAsync(int policyId, string triggerReason, object? metadata = null, CancellationToken cancellationToken = default);
    Task<bool> HasPendingTriggersAsync(int policyId, CancellationToken cancellationToken = default);
    Task MarkTriggersProcessedAsync(int policyId, CancellationToken cancellationToken = default);
    Task SubscribeToPolicyTriggersAsync(CancellationToken cancellationToken = default);
}
```

### Trigger Extension Methods
Common trigger scenarios are provided as extension methods:

```csharp
// Tank variance trigger
await policyTriggerService.TriggerTankVariancePolicyAsync(
    policyId, tankId, varianceAmount, variancePercentage, cancellationToken);

// Post-delivery trigger
await policyTriggerService.TriggerPostDeliveryPolicyAsync(
    policyId, deliveryId, tankId, deliveredAmount, cancellationToken);

// Manual trigger
await policyTriggerService.TriggerManualPolicyAsync(
    policyId, requestedBy, reason, cancellationToken);
```

### Domain Events
The system publishes domain events for integration and alerting:

1. **DiscrepancyDetectedEvent** - Published when significant variance is detected
2. **ReconciliationExecutionCompletedEvent** - Published when reconciliation cycle completes

## Configuration

### Background Service Configuration
```json
{
  "AutomatedReconciliation": {
    "ExecutionIntervalMinutes": 15
  }
}
```

### Policy Configuration
Policies support various configuration options:

- **ExecutionType**: "Scheduled", "EventDriven", or "Manual"
- **ScheduleFrequencyHours**: Frequency for scheduled policies
- **VarianceThresholdLiters**: Absolute variance threshold
- **VarianceThresholdPercentage**: Percentage variance threshold
- **TankScope**: Defines which tanks to include (SiteIds, TankIds, FuelTypes, HighPriorityOnly)

## API Endpoints

### Policy Management
- `GET /api/v1/automated-reconciliation/policies` - List policies with filtering
- `GET /api/v1/automated-reconciliation/policies/{id}` - Get policy by ID
- `POST /api/v1/automated-reconciliation/policies` - Create new policy
- `PUT /api/v1/automated-reconciliation/policies/{id}` - Update policy
- `DELETE /api/v1/automated-reconciliation/policies/{id}` - Delete policy

### Execution Monitoring
- `GET /api/v1/automated-reconciliation/executions` - List executions with filtering
- `GET /api/v1/automated-reconciliation/executions/{id}` - Get execution details
- `POST /api/v1/automated-reconciliation/executions/manual-trigger` - Trigger manual execution

### Analytics and Reporting
- `GET /api/v1/automated-reconciliation/discrepancies` - List discrepancies
- `GET /api/v1/automated-reconciliation/analytics/dashboard` - Get analytics dashboard
- `GET /api/v1/automated-reconciliation/system/health` - System health status

## Error Handling and Logging

### Structured Logging
The system uses structured logging with correlation IDs:

```csharp
using var scope = _logger.BeginScope(new Dictionary<string, object>
{
    ["Operation"] = "ReconciliationCycle",
    ["CycleId"] = cycleResult.CycleId,
    ["StartTime"] = cycleResult.StartedAt
});
```

### Error Recovery
- Individual policy failures don't stop the entire cycle
- Redis failures fall back to database checks
- Background service continues running even after errors with retry logic

## Performance Considerations

### Parallel Processing
Policies can be evaluated and executed in parallel where appropriate.

### Caching
Tank scope queries and policy configurations are cached to improve performance.

### Database Optimization
- Proper indexing on policy execution queries
- Efficient tank scope filtering
- Pagination for large result sets

## Security and Permissions

### Authorization
All API endpoints require JWT authentication with specific permissions:
- `_Read_tankReconciliation` - View reconciliation data
- `_Create_tankReconciliation` - Create policies
- `_Update_tankReconciliation` - Update policies
- `_Delete_tankReconciliation` - Delete policies
- `_Execute_tankReconciliation` - Trigger manual executions

### Audit Trail
All reconciliation activities are logged with user tracking and timestamps.

## Monitoring and Alerting

### Health Checks
The system provides health check endpoints for monitoring:
- Background service status
- Redis connectivity
- Database connectivity
- Policy execution success rates

### Metrics
Key metrics are tracked and can be exposed for monitoring:
- Reconciliation cycle duration
- Success/failure rates
- Discrepancy detection rates
- Volume variance statistics

## Troubleshooting

### Common Issues
1. **Policies not executing**: Check schedule frequency and last execution time
2. **Event-driven policies not triggering**: Verify Redis connectivity and trigger events
3. **High discrepancy rates**: Review policy thresholds and tank reading accuracy
4. **Performance issues**: Check database indexes and query optimization

### Diagnostic Commands
Manual execution can be triggered for testing and diagnostics:

```csharp
POST /api/v1/automated-reconciliation/executions/manual-trigger
{
    "policyId": 1,
    "reason": "Diagnostic test",
    "siteId": 1,
    "tankIds": [1, 2, 3]
}
```