using System;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using FMS.Persistence;
using FMS.Persistence.DataAccess;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using StackExchange.Redis;

namespace FMS.Application.Communication.Redis;

//Cursor - Redis-based policy trigger service for event-driven reconciliation
public class PolicyTriggerService : IPolicyTriggerService {
    private readonly IRedisPublisher _redisPublisher;
    private readonly IRedisSubscriber _redisSubscriber;
    private readonly IConnectionMultiplexer _redis;
    private readonly GpsdataContext _context;
    private readonly ILogger<PolicyTriggerService> _logger;

    private const string POLICY_TRIGGER_CHANNEL_PREFIX = "FMS:PolicyTrigger:";
    private const string PENDING_TRIGGERS_KEY_PREFIX = "FMS:PendingTriggers:";

    public PolicyTriggerService (
        IRedisPublisher redisPublisher,
        IRedisSubscriber redisSubscriber,
        IConnectionMultiplexer redis,
        GpsdataContext context,
        ILogger<PolicyTriggerService> logger) {
        _redisPublisher = redisPublisher;
        _redisSubscriber = redisSubscriber;
        _redis = redis;
        _context = context;
        _logger = logger;
    }

    //Cursor - Publish policy trigger event to Redis
    public async Task PublishPolicyTriggerAsync (int policyId, string triggerReason, object? metadata = null, CancellationToken cancellationToken = default) {
        try {
        var triggerEvent = new PolicyTriggerEvent {
        PolicyId = policyId,
        TriggerReason = triggerReason,
        Timestamp = DateTime.UtcNow,
        Metadata = metadata
            };

            var message = JsonSerializer.Serialize (triggerEvent);
            var channel = $"{POLICY_TRIGGER_CHANNEL_PREFIX}{policyId}";

            // Publish to channel
            await _redisPublisher.PublishAsync (channel, message);

            // Also store as pending trigger
            var database = _redis.GetDatabase ();
            var pendingKey = $"{PENDING_TRIGGERS_KEY_PREFIX}{policyId}";
            await database.ListLeftPushAsync (pendingKey, message);
            await database.KeyExpireAsync (pendingKey, TimeSpan.FromHours (24)); // Expire after 24 hours

            _logger.LogInformation ("Published policy trigger for policy {PolicyId}: {Reason}", policyId, triggerReason);
        } catch (Exception ex) {
            _logger.LogError (ex, "Error publishing policy trigger for policy {PolicyId}", policyId);
            throw;
        }
    }

    //Cursor - Check for pending triggers in Redis
    public async Task<bool> HasPendingTriggersAsync (int policyId, CancellationToken cancellationToken = default) {
        try {
            var database = _redis.GetDatabase ();
            var pendingKey = $"{PENDING_TRIGGERS_KEY_PREFIX}{policyId}";
            var count = await database.ListLengthAsync (pendingKey);

            return count > 0;
        } catch (Exception ex) {
            _logger.LogError (ex, "Error checking pending triggers for policy {PolicyId}", policyId);
            return false;
        }
    }

    //Cursor - Mark triggers as processed by removing from Redis list
    public async Task MarkTriggersProcessedAsync (int policyId, CancellationToken cancellationToken = default) {
        try {
            var database = _redis.GetDatabase ();
            var pendingKey = $"{PENDING_TRIGGERS_KEY_PREFIX}{policyId}";
            await database.KeyDeleteAsync (pendingKey);

            _logger.LogInformation ("Marked triggers as processed for policy {PolicyId}", policyId);
        } catch (Exception ex) {
            _logger.LogError (ex, "Error marking triggers as processed for policy {PolicyId}", policyId);
            throw;
        }
    }
    public async Task<int> GetPendingTriggerCountAsync(int policyId, CancellationToken cancellationToken = default)
    {
        try
        {
            var database = _redis.GetDatabase();
            var pendingKey = $"{PENDING_TRIGGERS_KEY_PREFIX}{policyId}";
            var count = await database.ListLengthAsync(pendingKey);

            return (int)count;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting pending trigger count for policy {PolicyId}", policyId);
            return 0;
        }
    }
    //Cursor - Subscribe to policy trigger events
    public async Task SubscribeToPolicyTriggersAsync (CancellationToken cancellationToken = default) {
        try {
            var channel = $"{POLICY_TRIGGER_CHANNEL_PREFIX}*";
            await _redisSubscriber.SubscribeAsync (channel, (redisChannel, redisValue) => {
                try {
                    var triggerEvent = JsonSerializer.Deserialize<PolicyTriggerEvent> (redisValue);
                    _logger.LogInformation ("Received policy trigger event for policy {PolicyId}: {Reason}",
                        triggerEvent.PolicyId, triggerEvent.TriggerReason);

                    // Here you could trigger immediate policy evaluation
                    // This is where you'd integrate with your reconciliation orchestration service
                } catch (Exception ex) {
                    _logger.LogError (ex, "Error processing policy trigger event: {Message}", redisValue);
                }
            });

            _logger.LogInformation ("Subscribed to policy trigger events");
        } catch (Exception ex) {
            _logger.LogError (ex, "Error subscribing to policy trigger events");
            throw;
        }
    }
}

//Cursor - Policy trigger event data structure
public class PolicyTriggerEvent {
    public int PolicyId { get; set; }
    public string TriggerReason { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; }
    public object? Metadata { get; set; }
}