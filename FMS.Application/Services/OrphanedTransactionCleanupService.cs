using FMS.Application.Communication;
using FMS.Application.Communication.SignalR;
using FMS.Domain.Entities;
using FMS.Persistence.DataAccess;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;

namespace FMS.Application.Services
{
    /// <summary>
    /// Service responsible for cleaning up orphaned transactions when a device disconnects.
    /// Extracts transaction data from Redis, saves incomplete transactions to database,
    /// and notifies connected clients via SignalR.
    /// </summary>
    public interface IOrphanedTransactionCleanupService
    {
        /// <summary>
        /// Cleans up orphaned transactions for a device.
        /// Should be called IMMEDIATELY when WebSocket disconnects, BEFORE removing connection from Redis.
        /// </summary>
        /// <param name="deviceId">The device ID</param>
        /// <param name="cleanupRedisKeys">Whether to also clean up Redis keys (default: true)</param>
        /// <returns>List of orphaned transaction IDs that were processed</returns>
        Task<List<int>> CleanupOrphanedTransactionsAsync(string deviceId, bool cleanupRedisKeys = true);
    }

    public class OrphanedTransactionCleanupService : IOrphanedTransactionCleanupService
    {
        private readonly ILogger<OrphanedTransactionCleanupService> _logger;
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly DeviceConnectionTracker _deviceConnectionTracker;

        public OrphanedTransactionCleanupService(
            ILogger<OrphanedTransactionCleanupService> logger,
            IServiceScopeFactory scopeFactory,
            DeviceConnectionTracker deviceConnectionTracker)
        {
            _logger = logger;
            _scopeFactory = scopeFactory;
            _deviceConnectionTracker = deviceConnectionTracker;
        }

        public async Task<List<int>> CleanupOrphanedTransactionsAsync(string deviceId, bool cleanupRedisKeys = true)
        {
            var processedTransactionIds = new List<int>();

            try
            {
                _logger.LogInformation("[{DeviceId}] Starting orphaned transaction cleanup (immediate)", deviceId);

                // Get Redis database
                var redisDb = await _deviceConnectionTracker.GetRedisDatabase();
                if (redisDb == null)
                {
                    _logger.LogWarning("[{DeviceId}] Redis database not available for orphaned transaction cleanup", deviceId);
                    return processedTransactionIds;
                }

                var server = redisDb.Multiplexer.GetServer(redisDb.Multiplexer.GetEndPoints().First());
                var orphanedTransactions = new List<OrphanedTransactionInfo>();

                // First, collect transaction context data (device:{deviceId}:transaction:*) - contains vehicle/tank info
                var transactionContextPattern = $"device:{deviceId}:transaction:*";
                var transactionContexts = new Dictionary<int, JsonElement>();

                await foreach (var key in server.KeysAsync(pattern: transactionContextPattern))
                {
                    try
                    {
                        var contextJson = await redisDb.StringGetAsync(key);
                        if (!contextJson.IsNullOrEmpty)
                        {
                            var context = JsonSerializer.Deserialize<JsonElement>(contextJson!);
                            if (context.TryGetProperty("TransactionId", out var txnIdElement))
                            {
                                transactionContexts[txnIdElement.GetInt32()] = context;
                                _logger.LogDebug("[{DeviceId}] Found transaction context for TransactionId: {TxnId}",
                                    deviceId, txnIdElement.GetInt32());
                            }
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "[{DeviceId}] Error reading transaction context {Key}", deviceId, key.ToString());
                    }
                }

                // Collect monitoring context data (monitoring:{deviceId}:transaction:*) - contains volume/amount progress
                var monitoringPattern = $"monitoring:{deviceId}:transaction:*";

                await foreach (var key in server.KeysAsync(pattern: monitoringPattern))
                {
                    try
                    {
                        var contextJson = await redisDb.StringGetAsync(key);
                        if (!contextJson.IsNullOrEmpty)
                        {
                            var monitoringContext = JsonSerializer.Deserialize<JsonElement>(contextJson!);

                            var orphanedInfo = new OrphanedTransactionInfo();

                            if (monitoringContext.TryGetProperty("TransactionId", out var txnIdElement))
                                orphanedInfo.TransactionId = txnIdElement.GetInt32();
                            if (monitoringContext.TryGetProperty("PumpId", out var pumpIdElement))
                                orphanedInfo.PumpId = pumpIdElement.GetInt32();
                            if (monitoringContext.TryGetProperty("NozzleId", out var nozzleIdElement))
                                orphanedInfo.NozzleId = nozzleIdElement.GetInt32();
                            if (monitoringContext.TryGetProperty("Volume", out var volumeElement) && volumeElement.ValueKind != JsonValueKind.Null)
                                orphanedInfo.Volume = volumeElement.GetDecimal();
                            if (monitoringContext.TryGetProperty("Amount", out var amountElement) && amountElement.ValueKind != JsonValueKind.Null)
                                orphanedInfo.Amount = amountElement.GetDecimal();
                            if (monitoringContext.TryGetProperty("StartedAt", out var startedAtElement))
                                orphanedInfo.StartedAt = startedAtElement.GetDateTime();
                            if (monitoringContext.TryGetProperty("Status", out var statusElement))
                                orphanedInfo.LastStatus = statusElement.GetString();

                            // Merge with transaction context data if available
                            if (orphanedInfo.TransactionId > 0 && transactionContexts.TryGetValue(orphanedInfo.TransactionId, out var txnContext))
                            {
                                if (txnContext.TryGetProperty("VehicleId", out var vehicleIdElement) && vehicleIdElement.ValueKind != JsonValueKind.Null)
                                    orphanedInfo.VehicleId = vehicleIdElement.GetInt32();
                                if (txnContext.TryGetProperty("TankId", out var tankIdElement) && tankIdElement.ValueKind != JsonValueKind.Null)
                                    orphanedInfo.TankId = tankIdElement.GetInt32();
                                if (txnContext.TryGetProperty("DestinationTankId", out var destTankIdElement) && destTankIdElement.ValueKind != JsonValueKind.Null)
                                    orphanedInfo.DestinationTankId = destTankIdElement.GetInt32();
                                if (txnContext.TryGetProperty("IsTransferMode", out var isTransferModeElement) && isTransferModeElement.ValueKind != JsonValueKind.Null)
                                    orphanedInfo.IsTransferMode = isTransferModeElement.GetBoolean();
                                if (txnContext.TryGetProperty("Odometer", out var odometerElement) && odometerElement.ValueKind != JsonValueKind.Null)
                                    orphanedInfo.Odometer = odometerElement.GetDecimal();
                            }

                            if (orphanedInfo.TransactionId > 0)
                            {
                                orphanedTransactions.Add(orphanedInfo);
                                _logger.LogInformation("[{DeviceId}] Found orphaned transaction: TxnId={TxnId}, Pump={Pump}, Volume={Volume}, Amount={Amount}",
                                    deviceId, orphanedInfo.TransactionId, orphanedInfo.PumpId, orphanedInfo.Volume, orphanedInfo.Amount);
                            }
                        }

                        // Delete the monitoring context if requested
                        if (cleanupRedisKeys)
                        {
                            await redisDb.KeyDeleteAsync(key);
                            _logger.LogDebug("[{DeviceId}] Cleaned up orphaned monitoring context: {Key}", deviceId, key.ToString());
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "[{DeviceId}] Error cleaning up monitoring context {Key}", deviceId, key.ToString());
                    }
                }

                // Also check for transactions that have context but no monitoring (authorized but not yet fueling)
                foreach (var kvp in transactionContexts)
                {
                    if (!orphanedTransactions.Any(t => t.TransactionId == kvp.Key))
                    {
                        var context = kvp.Value;
                        var orphanedInfo = new OrphanedTransactionInfo { TransactionId = kvp.Key };

                        if (context.TryGetProperty("PumpId", out var pumpIdElement))
                            orphanedInfo.PumpId = pumpIdElement.GetInt32();
                        if (context.TryGetProperty("NozzleId", out var nozzleIdElement))
                            orphanedInfo.NozzleId = nozzleIdElement.GetInt32();
                        if (context.TryGetProperty("VehicleId", out var vehicleIdElement) && vehicleIdElement.ValueKind != JsonValueKind.Null)
                            orphanedInfo.VehicleId = vehicleIdElement.GetInt32();
                        if (context.TryGetProperty("TankId", out var tankIdElement) && tankIdElement.ValueKind != JsonValueKind.Null)
                            orphanedInfo.TankId = tankIdElement.GetInt32();
                        if (context.TryGetProperty("DestinationTankId", out var destTankIdElement) && destTankIdElement.ValueKind != JsonValueKind.Null)
                            orphanedInfo.DestinationTankId = destTankIdElement.GetInt32();
                        if (context.TryGetProperty("IsTransferMode", out var isTransferModeElement) && isTransferModeElement.ValueKind != JsonValueKind.Null)
                            orphanedInfo.IsTransferMode = isTransferModeElement.GetBoolean();
                        if (context.TryGetProperty("Odometer", out var odometerElement) && odometerElement.ValueKind != JsonValueKind.Null)
                            orphanedInfo.Odometer = odometerElement.GetDecimal();
                        if (context.TryGetProperty("AuthorizedAt", out var startedAtElement))
                            orphanedInfo.StartedAt = startedAtElement.GetDateTime();

                        orphanedInfo.LastStatus = "AUTHORIZED_NOT_STARTED";
                        orphanedTransactions.Add(orphanedInfo);

                        _logger.LogInformation("[{DeviceId}] Found authorized but not-started transaction: TxnId={TxnId}",
                            deviceId, orphanedInfo.TransactionId);
                    }
                }

                // Save orphaned transactions to database as incomplete
                // Track which transactions were actually saved (have volume/amount)
                var savedTransactionIds = new HashSet<int>();

                if (orphanedTransactions.Count > 0)
                {
                    using var scope = _scopeFactory.CreateScope();
                    savedTransactionIds = await SaveIncompleteTransactionsAsync(scope, deviceId, orphanedTransactions);
                    processedTransactionIds.AddRange(savedTransactionIds);

                    // Notify connected clients about device disconnect with transaction details
                    await NotifyClientsAsync(scope, deviceId, orphanedTransactions);
                }
                else
                {
                    _logger.LogDebug("[{DeviceId}] No orphaned transactions found", deviceId);

                    // Still notify about disconnect even if no transactions
                    using var scope = _scopeFactory.CreateScope();
                    await NotifyClientsAsync(scope, deviceId, new List<OrphanedTransactionInfo>());
                }

                // Clean up transaction context keys if requested
                // IMPORTANT: Only delete contexts for transactions that were actually saved to database
                // Transactions without volume/amount should keep their context for when device reconnects
                if (cleanupRedisKeys)
                {
                    await foreach (var key in server.KeysAsync(pattern: transactionContextPattern))
                    {
                        try
                        {
                            // Extract transaction ID from key (format: device:{deviceId}:transaction:{transactionId})
                            var keyString = key.ToString();
                            var parts = keyString.Split(':');
                            if (parts.Length >= 4 && int.TryParse(parts[3], out var transactionId))
                            {
                                // Only delete if this transaction was actually saved
                                if (savedTransactionIds.Contains(transactionId))
                                {
                                    await redisDb.KeyDeleteAsync(key);
                                    _logger.LogDebug("[{DeviceId}] Cleaned up transaction context: {Key}", deviceId, keyString);
                                }
                                else
                                {
                                    _logger.LogInformation("[{DeviceId}] Preserving transaction context for unsaved transaction {TransactionId} (no volume/amount yet)",
                                        deviceId, transactionId);
                                }
                            }
                            else
                            {
                                // Can't parse transaction ID, delete the key to avoid orphaned data
                                await redisDb.KeyDeleteAsync(key);
                                _logger.LogDebug("[{DeviceId}] Cleaned up unparseable transaction context: {Key}", deviceId, keyString);
                            }
                        }
                        catch (Exception ex)
                        {
                            _logger.LogWarning(ex, "[{DeviceId}] Error cleaning up transaction context {Key}", deviceId, key.ToString());
                        }
                    }

                    // Clean up authorization states only for saved transactions
                    var authPattern = $"auth:{deviceId}:*";
                    await foreach (var key in server.KeysAsync(pattern: authPattern))
                    {
                        try
                        {
                            // Only delete auth states if there are no unsaved transactions pending
                            // This prevents clearing auth state for transactions that haven't started fueling yet
                            var unsavedTransactions = orphanedTransactions
                                .Where(t => !savedTransactionIds.Contains(t.TransactionId))
                                .ToList();

                            if (unsavedTransactions.Count == 0)
                            {
                                await redisDb.KeyDeleteAsync(key);
                                _logger.LogDebug("[{DeviceId}] Cleaned up orphaned authorization state: {Key}", deviceId, key.ToString());
                            }
                            else
                            {
                                _logger.LogInformation("[{DeviceId}] Preserving authorization state - {Count} unsaved transaction(s) pending",
                                    deviceId, unsavedTransactions.Count);
                            }
                        }
                        catch (Exception ex)
                        {
                            _logger.LogWarning(ex, "[{DeviceId}] Error cleaning up authorization state {Key}", deviceId, key.ToString());
                        }
                    }
                }

                _logger.LogInformation("[{DeviceId}] Completed orphaned transaction cleanup. Processed {Count} transaction(s)",
                    deviceId, orphanedTransactions.Count);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[{DeviceId}] Error during orphaned transaction cleanup", deviceId);
            }

            return processedTransactionIds;
        }

        private async Task NotifyClientsAsync(IServiceScope scope, string deviceId, List<OrphanedTransactionInfo> orphanedTransactions)
        {
            try
            {
                var hubContext = scope.ServiceProvider.GetService<IHubContext<PTSHub>>();
                if (hubContext != null)
                {
                    await hubContext.Clients.All.SendAsync("DeviceDisconnected", new
                    {
                        DeviceId = deviceId,
                        DisconnectedAt = DateTime.UtcNow,
                        OrphanedTransactionIds = orphanedTransactions.Select(t => t.TransactionId).ToList(),
                        OrphanedTransactions = orphanedTransactions.Select(t => new
                        {
                            t.TransactionId,
                            t.PumpId,
                            t.NozzleId,
                            t.VehicleId,
                            t.TankId,
                            t.DestinationTankId,
                            t.IsTransferMode,
                            t.Volume,
                            t.Amount,
                            t.Odometer,
                            t.StartedAt,
                            t.LastStatus,
                            SavedToDatabase = (t.Volume ?? 0) > 0 || (t.Amount ?? 0) > 0
                        }).ToList(),
                        Message = orphanedTransactions.Count > 0
                            ? $"Device disconnected with {orphanedTransactions.Count} active transaction(s). Data has been saved."
                            : "Device disconnected"
                    });
                    _logger.LogInformation("[{DeviceId}] Broadcasted DeviceDisconnected event with {Count} orphaned transactions",
                        deviceId, orphanedTransactions.Count);
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "[{DeviceId}] Error broadcasting device disconnect notification", deviceId);
            }
        }

        private async Task<HashSet<int>> SaveIncompleteTransactionsAsync(IServiceScope scope, string deviceId, List<OrphanedTransactionInfo> orphanedTransactions)
        {
            var savedTransactionIds = new HashSet<int>();

            try
            {
                var context = scope.ServiceProvider.GetRequiredService<GpsdataContext>();

                foreach (var orphaned in orphanedTransactions)
                {
                    // Only save if there was actual fueling activity (volume or amount > 0)
                    if ((orphaned.Volume ?? 0) <= 0 && (orphaned.Amount ?? 0) <= 0)
                    {
                        _logger.LogInformation("[{DeviceId}] Skipping save for transaction {TransactionId} - no volume/amount dispensed (will preserve Redis context)",
                            deviceId, orphaned.TransactionId);
                        continue;
                    }

                    // Check if transaction already exists (might have been saved before disconnect)
                    var existingTransaction = await context.Pumptransactions
                        .FirstOrDefaultAsync(pt => pt.PtsId == deviceId && pt.Transaction == orphaned.TransactionId);

                    if (existingTransaction != null)
                    {
                        // Update existing transaction with latest values
                        existingTransaction.Volume = orphaned.Volume;
                        existingTransaction.Amount = orphaned.Amount;
                        existingTransaction.DateTime = DateTime.UtcNow;
                        existingTransaction.HasBeenProcessed = false; // Mark as incomplete/needs review

                        _logger.LogInformation("[{DeviceId}] Updated existing incomplete transaction {TransactionId} with Volume: {Volume}, Amount: {Amount}",
                            deviceId, orphaned.TransactionId, orphaned.Volume, orphaned.Amount);

                        savedTransactionIds.Add(orphaned.TransactionId);
                    }
                    else
                    {
                        // Create new incomplete transaction record
                        var incompleteTransaction = new Pumptransaction
                        {
                            PtsId = deviceId,
                            Transaction = orphaned.TransactionId,
                            Pump = orphaned.PumpId,
                            Nozzle = orphaned.NozzleId,
                            VehicleId = orphaned.VehicleId,
                            TankId = orphaned.TankId,
                            DestinationTankId = orphaned.DestinationTankId,
                            IsTransferMode = orphaned.IsTransferMode,
                            Volume = orphaned.Volume,
                            Amount = orphaned.Amount,
                            Odometer = orphaned.Odometer,
                            DateTimeStart = orphaned.StartedAt,
                            DateTime = DateTime.UtcNow,
                            PacketId = -1, // Indicate this is a reconstructed/incomplete transaction
                            HasBeenProcessed = false, // Mark as incomplete/needs review
                            Tag = orphaned.IsTransferMode ? "INCOMPLETE:DISCONNECT:TRANSFER" : "INCOMPLETE:DISCONNECT" // Mark reason for incomplete status
                        };

                        context.Pumptransactions.Add(incompleteTransaction);

                        _logger.LogInformation("[{DeviceId}] Saved incomplete transaction {TransactionId} - Vehicle: {VehicleId}, Tank: {TankId}, DestinationTank: {DestinationTankId}, IsTransfer: {IsTransfer}, Volume: {Volume}, Amount: {Amount}",
                            deviceId, orphaned.TransactionId, orphaned.VehicleId, orphaned.TankId, orphaned.DestinationTankId, orphaned.IsTransferMode, orphaned.Volume, orphaned.Amount);

                        savedTransactionIds.Add(orphaned.TransactionId);
                    }
                }

                await context.SaveChangesAsync();
                _logger.LogInformation("[{DeviceId}] Successfully saved {Count} incomplete transaction(s) to database",
                    deviceId, savedTransactionIds.Count);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[{DeviceId}] Error saving incomplete transactions to database", deviceId);
            }

            return savedTransactionIds;
        }

        /// <summary>
        /// Helper class to hold orphaned transaction information
        /// </summary>
        private class OrphanedTransactionInfo
        {
            public int TransactionId { get; set; }
            public int PumpId { get; set; }
            public int NozzleId { get; set; }
            public int? VehicleId { get; set; }
            public int? TankId { get; set; }
            public int? DestinationTankId { get; set; }
            public bool IsTransferMode { get; set; }
            public decimal? Volume { get; set; }
            public decimal? Amount { get; set; }
            public decimal? Odometer { get; set; }
            public DateTime? StartedAt { get; set; }
            public string? LastStatus { get; set; }
        }
    }
}
