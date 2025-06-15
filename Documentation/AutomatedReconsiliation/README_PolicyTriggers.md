
# Redis-Based Policy Trigger System

This document explains how the Redis-based policy trigger system works for event-driven reconciliation policies.

## Overview

The system uses Redis pub/sub to enable real-time triggering of reconciliation policies based on various events like:
- Tank volume variances
- Fuel deliveries
- Reading anomalies
- Manual requests

## Components

### 1. IPolicyTriggerService
Interface for publishing and managing policy triggers.

### 2. PolicyTriggerService
Redis-based implementation that:
- Publishes trigger events to Redis channels
- Stores pending triggers as Redis lists
- Checks for pending triggers
- Marks triggers as processed

### 3. PolicyEvaluationEngine (Enhanced)
Updated to use Redis for event-driven policy evaluation instead of database polling.

### 4. PolicyTriggerBackgroundService
Background service that subscribes to Redis trigger events.

### 5. PolicyTriggerExtensions
Helper methods for common trigger scenarios.

## Usage Examples

### Triggering a Policy from Tank Variance
```csharp
await _policyTriggerService.TriggerTankVariancePolicyAsync(
    policyId: 123,
    tankId: 456,
    varianceAmount: 15.5m,
    variancePercentage: 3.2m
);
```

### Triggering a Policy After Delivery
```csharp
await _policyTriggerService.TriggerPostDeliveryPolicyAsync(
    policyId: 123,
    deliveryId: 789,
    tankId: 456,
    deliveredAmount: 1000.0m
);
```

### Manual Policy Trigger
```csharp
await _policyTriggerService.TriggerManualPolicyAsync(
    policyId: 123,
    requestedBy: "admin",
    reason: "Suspected leak investigation"
);
```

## Redis Channels and Keys

### Channels
- `FMS:PolicyTrigger:{policyId}` - Individual policy trigger channels
- `FMS:PolicyTrigger:*` - Pattern for subscribing to all policy triggers

### Keys
- `FMS:PendingTriggers:{policyId}` - List of pending triggers for a policy (24h TTL)

## Event-Driven Policy Execution

1. External events (tank variances, deliveries, etc.) publish triggers to Redis
2. PolicyTriggerBackgroundService receives events via Redis subscription
3. Triggers are stored as pending in Redis lists
4. PolicyEvaluationEngine checks for pending triggers when evaluating policies
5. After policy execution, triggers are marked as processed (removed from Redis)

## Configuration

The system requires Redis to be configured in the application. If Redis is not available, the system falls back to database-based event tracking.

## Error Handling

- Redis failures fall back to database checks
- Trigger publishing errors are logged but don't block operations
- Background service restarts on failures

## Benefits

- Real-time policy triggering
- Reduced database polling
- Scalable event distribution
- Fault tolerance with database fallback