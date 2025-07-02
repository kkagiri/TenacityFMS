# Redis Policy Trigger Service Documentation

## Overview

The Redis Policy Trigger Service provides a distributed, event-driven architecture for triggering automated reconciliation policies in real-time. It uses Redis pub/sub and list operations to handle policy triggers efficiently across multiple service instances.

## Architecture

### Components

1. **PolicyTriggerService** - Core Redis-based implementation
2. **IPolicyTriggerService** - Service interface for dependency injection
3. **PolicyTriggerExtensions** - Extension methods for common trigger scenarios
4. **PolicyTriggerBackgroundService** - Background service for Redis subscription

### Redis Data Structures

#### Policy Trigger Channels
- **Pattern**: `FMS:PolicyTrigger:{policyId}`
- **Purpose**: Real-time policy trigger notifications
- **Example**: `FMS:PolicyTrigger:123`

#### Pending Triggers List
- **Pattern**: `FMS:PendingTriggers:{policyId}`
- **Purpose**: Persistent storage of pending triggers
- **TTL**: 24 hours (configurable)
- **Example**: `FMS:PendingTriggers:123`

## Service Interface

```csharp
public interface IPolicyTriggerService
{
    /// <summary>
    /// Publishes a trigger event for a specific policy
    /// </summary>
    Task PublishPolicyTriggerAsync(int policyId, string triggerReason, object? metadata = null, CancellationToken cancellationToken = default);

    /// <summary>
    /// Checks if there are pending trigger events for a policy
    /// </summary>
    Task<bool> HasPendingTriggersAsync(int policyId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Marks trigger events as processed for a policy
    /// </summary>
    Task MarkTriggersProcessedAsync(int policyId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Subscribes to policy trigger events
    /// </summary>
    Task SubscribeToPolicyTriggersAsync(CancellationToken cancellationToken = default);
}
```

## Implementation Details

### Publishing Policy Triggers

```csharp
public async Task PublishPolicyTriggerAsync(int policyId, string triggerReason, object? metadata = null, CancellationToken cancellationToken = default)
{
    try {
        var triggerEvent = new PolicyTriggerEvent {
            PolicyId = policyId,
            TriggerReason = triggerReason,
            Timestamp = DateTime.UtcNow,
            Metadata = metadata
        };

        var message = JsonSerializer.Serialize(triggerEvent);
        var channel = $"{POLICY_TRIGGER_CHANNEL_PREFIX}{policyId}";

        // Publish to channel for real-time processing
        await _redisPublisher.PublishAsync(channel, message);

        // Store as pending trigger for persistence
        var database = _redis.GetDatabase();
        var pendingKey = $"{PENDING_TRIGGERS_KEY_PREFIX}{policyId}";
        await database.ListLeftPushAsync(pendingKey, message);
        await database.KeyExpireAsync(pendingKey, TimeSpan.FromHours(24));

        _logger.LogInformation("Published policy trigger for policy {PolicyId}: {Reason}", policyId, triggerReason);
    } catch (Exception ex) {
        _logger.LogError(ex, "Error publishing policy trigger for policy {PolicyId}", policyId);
        throw;
    }
}
```

### Checking Pending Triggers

```csharp
public async Task<bool> HasPendingTriggersAsync(int policyId, CancellationToken cancellationToken = default)
{
    try {
        var database = _redis.GetDatabase();
        var pendingKey = $"{PENDING_TRIGGERS_KEY_PREFIX}{policyId}";
        var count = await database.ListLengthAsync(pendingKey);

        return count > 0;
    } catch (Exception ex) {
        _logger.LogError(ex, "Error checking pending triggers for policy {PolicyId}", policyId);
        return false; // Fail-safe: return false to avoid blocking
    }
}
```

### Marking Triggers as Processed

```csharp
public async Task MarkTriggersProcessedAsync(int policyId, CancellationToken cancellationToken = default)
{
    try {
        var database = _redis.GetDatabase();
        var pendingKey = $"{PENDING_TRIGGERS_KEY_PREFIX}{policyId}";
        await database.KeyDeleteAsync(pendingKey);

        _logger.LogInformation("Marked triggers as processed for policy {PolicyId}", policyId);
    } catch (Exception ex) {
        _logger.LogError(ex, "Error marking triggers as processed for policy {PolicyId}", policyId);
        throw;
    }
}
```

## Extension Methods

### Common Trigger Scenarios

#### Tank Variance Trigger
```csharp
public static async Task TriggerTankVariancePolicyAsync(
    this IPolicyTriggerService policyTriggerService,
    int policyId,
    int tankId,
    decimal varianceAmount,
    decimal variancePercentage,
    CancellationToken cancellationToken = default)
{
    var metadata = new
    {
        TankId = tankId,
        VarianceAmount = varianceAmount,
        VariancePercentage = variancePercentage,
        TriggerType = "TankVariance"
    };

    await policyTriggerService.PublishPolicyTriggerAsync(
        policyId,
        $"Tank {tankId} variance detected: {varianceAmount:F2}L ({variancePercentage:F1}%)",
        metadata,
        cancellationToken);
}
```

#### Post-Delivery Trigger
```csharp
public static async Task TriggerPostDeliveryPolicyAsync(
    this IPolicyTriggerService policyTriggerService,
    int policyId,
    int deliveryId,
    int tankId,
    decimal deliveredAmount,
    CancellationToken cancellationToken = default)
{
    var metadata = new
    {
        DeliveryId = deliveryId,
        TankId = tankId,
        DeliveredAmount = deliveredAmount,
        TriggerType = "PostDelivery"
    };

    await policyTriggerService.PublishPolicyTriggerAsync(
        policyId,
        $"Post-delivery reconciliation required for tank {tankId} after delivery {deliveryId}",
        metadata,
        cancellationToken);
}
```

#### Manual Trigger
```csharp
public static async Task TriggerManualPolicyAsync(
    this IPolicyTriggerService policyTriggerService,
    int policyId,
    string requestedBy,
    string reason,
    CancellationToken cancellationToken = default)
{
    var metadata = new
    {
        RequestedBy = requestedBy,
        Reason = reason,
        TriggerType = "Manual"
    };

    await policyTriggerService.PublishPolicyTriggerAsync(
        policyId,
        $"Manual reconciliation requested by {requestedBy}: {reason}",
        metadata,
        cancellationToken);
}
```

## Background Service Integration

### Subscription Management
```csharp
public class PolicyTriggerBackgroundService : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var scope = _serviceScopeFactory.CreateScope();
        var policyTriggerService = scope.ServiceProvider.GetRequiredService<IPolicyTriggerService>();

        await policyTriggerService.SubscribeToPolicyTriggersAsync(stoppingToken);

        // Keep service running
        await Task.Delay(Timeout.Infinite, stoppingToken);
    }
}
```

### Real-time Event Processing with Orchestration Integration
```csharp
public async Task SubscribeToPolicyTriggersAsync(CancellationToken cancellationToken = default)
{
    try {
        var channel = $"{POLICY_TRIGGER_CHANNEL_PREFIX}*";
        await _redisSubscriber.SubscribeAsync(channel, async (redisChannel, redisValue) => {
            try {
                var triggerEvent = JsonSerializer.Deserialize<PolicyTriggerEvent>(redisValue);
                _logger.LogInformation("Received policy trigger event for policy {PolicyId}: {Reason}",
                    triggerEvent.PolicyId, triggerEvent.TriggerReason);

                //Cursor - Integrated with ReconciliationOrchestrationService for real-time execution
                await ProcessPolicyTriggerEventAsync(triggerEvent, cancellationToken);

            } catch (Exception ex) {
                _logger.LogError(ex, "Error processing policy trigger event: {Message}", redisValue);
            }
        });

        _logger.LogInformation("Subscribed to policy trigger events");
    } catch (Exception ex) {
        _logger.LogError(ex, "Error subscribing to policy trigger events");
        throw;
    }
}

//Cursor - Process policy trigger event by executing the policy through AutomatedReconciliationService
private async Task ProcessPolicyTriggerEventAsync(PolicyTriggerEvent triggerEvent, CancellationToken cancellationToken)
{
    try
    {
        _logger.LogInformation("Processing policy trigger for policy {PolicyId}: {Reason}",
            triggerEvent.PolicyId, triggerEvent.TriggerReason);

        // Create a new scope for scoped services
        using var scope = _serviceProvider.CreateScope();
        var automatedReconciliationService = scope.ServiceProvider.GetRequiredService<AutomatedReconciliationService>();

        // Validate policy exists and is active
        var policy = await _context.ReconciliationPolicies
            .FirstOrDefaultAsync(p => p.Id == triggerEvent.PolicyId && p.IsActive, cancellationToken);

        if (policy == null)
        {
            _logger.LogWarning("Policy {PolicyId} not found or inactive, ignoring trigger", triggerEvent.PolicyId);
            return;
        }

        // Check if policy is event-driven
        if (!string.Equals(policy.ExecutionType, "EventDriven", StringComparison.OrdinalIgnoreCase))
        {
            _logger.LogWarning("Policy {PolicyId} is not event-driven (type: {ExecutionType}), ignoring trigger",
                triggerEvent.PolicyId, policy.ExecutionType);
            return;
        }

        // Check if there's already an execution in progress
        var hasInProgressExecution = await _context.ReconciliationPolicyExecutions
            .AnyAsync(e => e.PolicyId == triggerEvent.PolicyId &&
                e.Status == ReconciliationExecutionStatus.InProgress, cancellationToken);

        if (hasInProgressExecution)
        {
            _logger.LogInformation("Policy {PolicyId} already has an execution in progress, skipping trigger",
                triggerEvent.PolicyId);
            return;
        }

        // Execute the policy
        _logger.LogInformation("Executing triggered policy {PolicyId}", triggerEvent.PolicyId);
        var executionResult = await automatedReconciliationService.ExecuteSinglePolicyAsync(
            triggerEvent.PolicyId, cancellationToken);

        if (executionResult.Success)
        {
            _logger.LogInformation("Successfully executed triggered policy {PolicyId}. Discrepancies found: {DiscrepanciesFound}, resolved: {DiscrepanciesResolved}",
                triggerEvent.PolicyId, executionResult.DiscrepanciesFound, executionResult.DiscrepanciesResolved);

            // Mark triggers as processed
            await MarkTriggersProcessedAsync(triggerEvent.PolicyId, cancellationToken);
        }
        else
        {
            _logger.LogError("Failed to execute triggered policy {PolicyId}: {ErrorMessage}",
                triggerEvent.PolicyId, executionResult.ErrorMessage);
        }
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Error processing policy trigger event for policy {PolicyId}", triggerEvent.PolicyId);
    }
}
```

## Usage Examples

### Triggering from Tank Volume Changes
```csharp
// In TankVolumeHistoryIntegrationService
if (Math.Abs(difference) > 10 || percentageDifference > 2)
{
    var eventDrivenPolicies = await _context.ReconciliationPolicies
        .Where(p => p.IsActive && p.ExecutionType.ToLower() == "eventdriven")
        .ToListAsync(cancellationToken);

    foreach (var policy in eventDrivenPolicies)
    {
        await _policyTriggerService.TriggerTankVariancePolicyAsync(
            policy.Id,
            tank.Id,
            Math.Abs(difference),
            percentageDifference,
            cancellationToken);
    }
}
```

### Integration with Delivery System
```csharp
// After fuel delivery completion
public async Task OnDeliveryCompleted(int deliveryId, int tankId, decimal amount)
{
    var postDeliveryPolicies = await GetPostDeliveryPolicies(tankId);

    foreach (var policy in postDeliveryPolicies)
    {
        await _policyTriggerService.TriggerPostDeliveryPolicyAsync(
            policy.Id, deliveryId, tankId, amount);
    }
}
```

## Configuration

### Service Registration
```csharp
// In Program.cs
services.AddScoped<IPolicyTriggerService, PolicyTriggerService>();
services.AddHostedService<PolicyTriggerBackgroundService>();
```

### Redis Configuration
```csharp
services.AddSingleton<IConnectionMultiplexer>(sp =>
    ConnectionMultiplexer.Connect(redisConnectionString));
services.AddSingleton<IDatabase>(sp =>
    sp.GetRequiredService<IConnectionMultiplexer>().GetDatabase());
services.AddSingleton<IRedisPublisher, RedisPublisher>();
services.AddSingleton<IRedisSubscriber, RedisSubscriber>();
```

## Error Handling

### Resilience Patterns
1. **Graceful Degradation**: Service continues if Redis is unavailable
2. **Fallback Mechanisms**: Database-based triggers as backup
3. **Retry Logic**: Automatic retry for transient failures
4. **Circuit Breaker**: Prevents cascading failures

### Monitoring and Alerting
- Redis connection health checks
- Trigger publication success rates
- Pending trigger queue lengths
- Subscription status monitoring

## Orchestration Integration Benefits

### Real-time Policy Execution
- **Immediate Response**: Event-driven policies execute immediately when triggered
- **Automatic Validation**: Policy validation and duplicate prevention built-in
- **Complete Integration**: Full integration with AutomatedReconciliationService workflow
- **Comprehensive Logging**: Detailed execution tracking and metrics

### Event Flow
```
Redis Trigger Event → PolicyTriggerService → AutomatedReconciliationService → ReconciliationOrchestrationService → Tank Reconciliation
```

### Key Features
1. **Policy Validation**: Verifies policy exists and is event-driven
2. **Execution Prevention**: Prevents duplicate executions
3. **Scope Isolation**: Uses dependency injection scopes for clean service lifecycle
4. **Error Handling**: Comprehensive error handling and logging
5. **Trigger Management**: Automatic trigger cleanup after successful execution

## Performance Considerations

### Optimization Strategies
1. **Connection Pooling**: Reuse Redis connections
2. **Batch Processing**: Group multiple triggers when possible
3. **TTL Management**: Automatic cleanup of expired triggers
4. **Channel Partitioning**: Use specific channels per policy type
5. **Service Scoping**: Proper DI scope management for scalability

### Scaling Considerations
- Horizontal scaling through Redis clustering
- Load balancing across multiple service instances
- Message deduplication for exactly-once delivery
- Monitoring queue depths and processing rates
- Background service health monitoring and notification