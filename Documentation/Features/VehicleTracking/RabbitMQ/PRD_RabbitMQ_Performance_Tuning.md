# PRD: GPSGate RabbitMQ Consumer — Performance Tuning

**Date:** 2026-03-09
**Status:** Draft
**Author:** Engineering
**Related:** GPSGateRabbitMQConsumerService.cs

---

## 1. Background

The GPSGate RabbitMQ consumer was disabled on 2026-01-28 due to performance issues (slowness). The service consumes real-time GPS track and event messages from GPSGate via RabbitMQ and broadcasts them to frontend clients via SignalR.

Before re-enabling, two performance bottlenecks need to be addressed to prevent the same issues.

---

## 2. Problem Statement

### Problem 1: Prefetch Count Too Low

**Current:** `PrefetchCount = 10`

The RabbitMQ prefetch count controls how many unacknowledged messages the broker will deliver to the consumer at once. With 10, the consumer can only buffer 10 messages before it must acknowledge them to receive more.

**Impact:**
- With ~200+ vehicles sending position updates every 5-10 seconds, the broker queues messages faster than the consumer processes them
- Queue depth grows, messages become stale, memory pressure on RabbitMQ increases
- Latency between GPS event and frontend display increases over time

### Problem 2: Vehicle Cache Lock Serialization

**Current:** `SemaphoreSlim(1, 1)` protecting a `Dictionary<int, VehicleMapping>` with 5-minute TTL

Every incoming message must acquire the semaphore to look up the vehicle mapping. Since the semaphore allows only 1 concurrent access, all message processing is serialized at the cache lookup step — even when the cache is warm and no refresh is needed.

```
Message 1 → await _cacheLock.WaitAsync() → cache hit → release    ← blocks
Message 2 → await _cacheLock.WaitAsync() → cache hit → release    ← waits for Message 1
Message 3 → await _cacheLock.WaitAsync() → cache hit → release    ← waits for Message 2
```

**Impact:**
- Under load, messages queue up waiting for the lock even though most lookups are simple dictionary reads
- Effectively makes the consumer single-threaded regardless of prefetch count
- The lock is only needed during cache refresh (every 5 minutes), not for reads

---

## 3. Proposed Solutions

### Solution 1: Increase and Make Prefetch Configurable

**Change:** Increase default `PrefetchCount` from `10` to `50`. Keep it configurable via the database settings JSON.

**Rationale:**
- 50 allows the consumer to buffer a reasonable batch without overwhelming memory
- Configurable via DB means we can tune without redeployment
- Industry recommendation for high-throughput consumers is 20-50

**Configuration:**
```json
{
  "RabbitMQ": {
    "PrefetchCount": 50
  }
}
```

### Solution 2: Replace SemaphoreSlim with ConcurrentDictionary + Interlocked Refresh

**Change:** Replace the current locking mechanism with a lock-free read path.

**Current (slow):**
```csharp
// Every message waits for lock
private readonly SemaphoreSlim _cacheLock = new(1, 1);
private readonly Dictionary<int, VehicleMapping> _vehicleCache = new();

private async Task<VehicleMapping?> GetVehicleMappingAsync(int gpsGateUserId)
{
    await _cacheLock.WaitAsync();  // BLOCKS all readers
    try
    {
        if (DateTime.UtcNow > _vehicleCacheExpiry)
            await RefreshVehicleCacheAsync();
        return _vehicleCache.TryGetValue(gpsGateUserId, out var m) ? m : null;
    }
    finally { _cacheLock.Release(); }
}
```

**Proposed (fast):**
```csharp
// Reads are lock-free, only refresh takes a lock
private volatile IReadOnlyDictionary<int, VehicleMapping> _vehicleCache
    = new Dictionary<int, VehicleMapping>();
private volatile DateTime _vehicleCacheExpiry = DateTime.MinValue;
private int _isRefreshing = 0;  // 0 = not refreshing, 1 = refreshing

private async Task<VehicleMapping?> GetVehicleMappingAsync(int gpsGateUserId)
{
    // Lock-free read — no waiting
    var cache = _vehicleCache;

    // Check if refresh needed, but only one thread does the refresh
    if (DateTime.UtcNow > _vehicleCacheExpiry)
    {
        if (Interlocked.CompareExchange(ref _isRefreshing, 1, 0) == 0)
        {
            try
            {
                await RefreshVehicleCacheAsync();
            }
            finally
            {
                Interlocked.Exchange(ref _isRefreshing, 0);
            }
        }
        // Other threads continue with stale cache (acceptable for <5min staleness)
        cache = _vehicleCache;
    }

    return cache.TryGetValue(gpsGateUserId, out var mapping) ? mapping : null;
}

private async Task RefreshVehicleCacheAsync()
{
    // ... load from DB ...
    var newCache = new Dictionary<int, VehicleMapping>();
    // ... populate ...

    // Atomic swap — readers see old or new, never partial
    _vehicleCache = newCache;
    _vehicleCacheExpiry = DateTime.UtcNow.Add(_vehicleCacheDuration);
}
```

**Benefits:**
- Cache reads are lock-free (no `await`, no blocking)
- Only one thread refreshes at a time (via `Interlocked.CompareExchange`)
- Other threads use the stale cache during refresh (acceptable — data is at most 5 min old)
- Atomic reference swap means no partial reads

---

## 4. Additional Improvements (Lower Priority)

### 4a. Batch SignalR Broadcasting

Instead of broadcasting each message individually, batch updates every 100ms:

```csharp
// Collect updates in a ConcurrentQueue
// Timer fires every 100ms, sends batch via SignalR
// Reduces SignalR overhead from N calls to 1 call per 100ms
```

### 4b. Message Processing Metrics

Add counters to monitor:
- Messages processed per second
- Queue depth (via RabbitMQ management API)
- Cache hit/miss ratio
- SignalR broadcast latency

### 4c. Graceful Degradation

If queue depth exceeds threshold:
- Skip stale messages (older than 30 seconds)
- Only process latest position per vehicle (dedup by vehicleId)

---

## 5. Implementation Plan

| Step | Task | Priority |
|------|------|----------|
| 1 | Update DB settings with RabbitMQ config | Done |
| 2 | Uncomment service registration + hub mapping | High |
| 3 | Implement lock-free cache (Solution 2) | High |
| 4 | Increase PrefetchCount to 50 (Solution 1) | High |
| 5 | Test with live GPSGate data | High |
| 6 | Monitor queue depth + processing rate | Medium |
| 7 | Batch SignalR broadcasting (4a) | Low |
| 8 | Add metrics/logging (4b) | Low |
| 9 | Graceful degradation (4c) | Low |

---

## 6. Success Criteria

- Consumer keeps up with message rate (queue depth stays < 100)
- Frontend receives location updates within 2 seconds of GPS event
- No degradation to main application performance
- RabbitMQ memory usage stays stable

---

## 7. Rollback Plan

If issues occur after re-enabling:
1. Set `"Enabled": false` in DB settings JSON (consumer checks this on reconnect loop)
2. Or re-comment the two registration lines and redeploy
