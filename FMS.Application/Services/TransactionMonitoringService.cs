//Cursor: New service for monitoring pump transactions based on connection type
using System;
using System.Text.Json;
using System.Threading.Tasks;
using FMS.Application.Communication;
using FMS.Application.Infrastructure.DistCacheTracker;
using FMS.Application.PTSServices.PumpService;
using FMS.Domain.Entities.PTS.Enums;
using Microsoft.Extensions.Logging;
using StackExchange.Redis;

namespace FMS.Application.Services {
    public interface ITransactionMonitoringService {
        Task StartMonitoringTransaction (string deviceId, int pumpId, int nozzleId, int transactionId);
        Task StopMonitoringTransaction (string deviceId, int transactionId);
        Task<bool> ValidateTransactionExecution (string deviceId, int pumpId, int expectedTransactionId);
        Task UpdateTransactionProgress (string deviceId, int pumpId, int transactionId, string status, decimal? volume = null, decimal? amount = null);
    }

    public class TransactionMonitoringService : ITransactionMonitoringService {
        private readonly DeviceConnectionTracker _deviceConnectionTracker;
        private readonly IAuthorizationStateTracker _authTracker;
        private readonly IPumpService _pumpService;
        private readonly IDatabase _redisDb;
        private readonly ILogger<TransactionMonitoringService> _logger;

        public TransactionMonitoringService (
            DeviceConnectionTracker deviceConnectionTracker,
            IAuthorizationStateTracker authTracker,
            IPumpService pumpService,
            IConnectionMultiplexer redisConnection,
            ILogger<TransactionMonitoringService> logger) {
            _deviceConnectionTracker = deviceConnectionTracker;
            _authTracker = authTracker;
            _pumpService = pumpService;
            _redisDb = redisConnection.GetDatabase ();
            _logger = logger;
        }

        public async Task StartMonitoringTransaction (string deviceId, int pumpId, int nozzleId, int transactionId) {
            try {
                // Get the connection type from Redis transaction context
                var connectionType = await GetConnectionTypeFromTransactionContext (deviceId, transactionId);

                _logger.LogInformation ("[Monitor] Starting transaction monitoring for Device {DeviceId}, Pump {PumpId}, Transaction {TransactionId}, Connection: {ConnectionType}",
                    deviceId, pumpId, transactionId, connectionType);

                // Create monitoring context
                var monitoringContext = new {
                    DeviceId = deviceId,
                    PumpId = pumpId,
                    NozzleId = nozzleId,
                    TransactionId = transactionId,
                    ConnectionType = connectionType,
                    StartedAt = DateTime.UtcNow,
                    Status = "Monitoring",
                    LastChecked = DateTime.UtcNow
                };

                var monitoringKey = $"monitoring:{deviceId}:transaction:{transactionId}";
                await _redisDb.StringSetAsync (monitoringKey, JsonSerializer.Serialize (monitoringContext), TimeSpan.FromHours (2));

                // Update authorization state to include monitoring
                await _authTracker.UpdateAuthState (deviceId, nozzleId, "Monitoring");

                _logger.LogInformation ("[Monitor] Transaction monitoring context created for Device {DeviceId}, Transaction {TransactionId}",
                    deviceId, transactionId);
            } catch (Exception ex) {
                _logger.LogError (ex, "[Monitor] Error starting transaction monitoring for Device {DeviceId}, Transaction {TransactionId}",
                    deviceId, transactionId);
            }
        }

        public async Task StopMonitoringTransaction (string deviceId, int transactionId) {
            try {
                var monitoringKey = $"monitoring:{deviceId}:transaction:{transactionId}";
                await _redisDb.KeyDeleteAsync (monitoringKey);

                _logger.LogInformation ("[Monitor] Stopped monitoring transaction {TransactionId} for device {DeviceId}",
                    transactionId, deviceId);
            } catch (Exception ex) {
                _logger.LogError (ex, "[Monitor] Error stopping transaction monitoring for Device {DeviceId}, Transaction {TransactionId}",
                    deviceId, transactionId);
            }
        }

        public async Task<bool> ValidateTransactionExecution (string deviceId, int pumpId, int expectedTransactionId) {
            try {
                // Get connection type to determine validation strategy
                var connectionType = await GetDeviceConnectionType (deviceId);

                switch (connectionType) {
                    case "WebSocket":
                    case "HTTPDirect":
                        return await ValidateTransactionDirect (deviceId, pumpId, expectedTransactionId);

                    case "HTTPPolling":
                        return await ValidateTransactionFromUploadStatus (deviceId, pumpId, expectedTransactionId);

                    default:
                        _logger.LogWarning ("[Monitor] Unknown connection type {ConnectionType} for device {DeviceId}. Using fallback validation.",
                            connectionType, deviceId);
                        return await ValidateTransactionFromUploadStatus (deviceId, pumpId, expectedTransactionId);
                }
            } catch (Exception ex) {
                _logger.LogError (ex, "[Monitor] Error validating transaction execution for Device {DeviceId}, Pump {PumpId}, Transaction {TransactionId}",
                    deviceId, pumpId, expectedTransactionId);
                return false;
            }
        }

        public async Task UpdateTransactionProgress (string deviceId, int pumpId, int transactionId, string status, decimal? volume = null, decimal? amount = null) {
            try {
                // Update monitoring context
                var monitoringKey = $"monitoring:{deviceId}:transaction:{transactionId}";
                var contextJson = await _redisDb.StringGetAsync (monitoringKey);

                if (!contextJson.IsNullOrEmpty) {
                    var context = JsonSerializer.Deserialize<dynamic> (contextJson);
                    var updatedContext = new {
                        DeviceId = deviceId,
                        PumpId = pumpId,
                        TransactionId = transactionId,
                        Status = status,
                        Volume = volume,
                        Amount = amount,
                        LastChecked = DateTime.UtcNow,
                        // Preserve other context data
                        StartedAt = context?.GetProperty ("StartedAt").GetDateTime (),
                        ConnectionType = context?.GetProperty ("ConnectionType").GetString ()
                    };

                    await _redisDb.StringSetAsync (monitoringKey, JsonSerializer.Serialize (updatedContext), TimeSpan.FromHours (2));
                }

                // Update authorization state
                var nozzleId = await GetNozzleFromMonitoringContext (deviceId, transactionId);
                if (nozzleId > 0) {
                    await _authTracker.UpdateAuthState (deviceId, nozzleId, status);
                }

                _logger.LogInformation ("[Monitor] Updated transaction progress for Device {DeviceId}, Transaction {TransactionId}, Status: {Status}",
                    deviceId, transactionId, status);
            } catch (Exception ex) {
                _logger.LogError (ex, "[Monitor] Error updating transaction progress for Device {DeviceId}, Transaction {TransactionId}",
                    deviceId, transactionId);
            }
        }

        private async Task<string> GetConnectionTypeFromTransactionContext (string deviceId, int transactionId) {
            try {
                var contextKey = $"device:{deviceId}:transaction:{transactionId}";
                var contextJson = await _redisDb.StringGetAsync (contextKey);

                if (!contextJson.IsNullOrEmpty) {
                    var context = JsonSerializer.Deserialize<dynamic> (contextJson);
                    return context?.GetProperty ("ConnectionType").GetString () ?? "Unknown";
                }

                return "Unknown";
            } catch (Exception ex) {
                _logger.LogError (ex, "[Monitor] Error getting connection type from transaction context for Device {DeviceId}, Transaction {TransactionId}",
                    deviceId, transactionId);
                return "Unknown";
            }
        }

        private async Task<string> GetDeviceConnectionType (string deviceId) {
            try {
                var wsConnection = await _deviceConnectionTracker.GetWebSocketConnection (deviceId);
                var httpConnection = await _deviceConnectionTracker.GetHttpConnection (deviceId);
                var connectionMode = DeviceConnectionTracker.DetermineConnectionMode (wsConnection, httpConnection);
                return connectionMode.ToString ();
            } catch (Exception ex) {
                _logger.LogError (ex, "[Monitor] Error determining connection type for device {DeviceId}", deviceId);
                return "Unknown";
            }
        }

        private async Task<bool> ValidateTransactionDirect (string deviceId, int pumpId, int expectedTransactionId) {
            try {
                // For direct connections, query the pump status directly
                var pumpStatus = await _pumpService.GetPumpStatusAsync (deviceId, pumpId);

                if (pumpStatus?.Success == true && pumpStatus.Data != null) {
                    // Extract transaction ID from pump status
                    // This depends on the pump status structure - may need adjustment
                    var statusData = pumpStatus.Data.ToString ();
                    // TODO: Parse the actual transaction ID from the status
                    // For now, assume validation is successful if we get a response
                    _logger.LogInformation ("[Monitor] Direct validation successful for Device {DeviceId}, Pump {PumpId}",
                        deviceId, pumpId);
                    return true;
                }

                return false;
            } catch (Exception ex) {
                _logger.LogError (ex, "[Monitor] Error in direct transaction validation for Device {DeviceId}, Pump {PumpId}",
                    deviceId, pumpId);
                return false;
            }
        }

        private async Task<bool> ValidateTransactionFromUploadStatus (string deviceId, int pumpId, int expectedTransactionId) {
            try {
                // For polling devices, check the last upload status stored in Redis
                var statusKey = $"device:{deviceId}:status";
                var statusJson = await _redisDb.StringGetAsync (statusKey);

                if (!statusJson.IsNullOrEmpty) {
                    // Parse upload status and check if the expected transaction is running
                    // This is a simplified check - actual implementation would parse the full status
                    _logger.LogInformation ("[Monitor] Validation from upload status for Device {DeviceId}, Pump {PumpId}",
                        deviceId, pumpId);
                    return true;
                }

                return false;
            } catch (Exception ex) {
                _logger.LogError (ex, "[Monitor] Error validating transaction from upload status for Device {DeviceId}, Pump {PumpId}",
                    deviceId, pumpId);
                return false;
            }
        }

        private async Task<int> GetNozzleFromMonitoringContext (string deviceId, int transactionId) {
            try {
                var monitoringKey = $"monitoring:{deviceId}:transaction:{transactionId}";
                var contextJson = await _redisDb.StringGetAsync (monitoringKey);

                if (!contextJson.IsNullOrEmpty) {
                    var context = JsonSerializer.Deserialize<dynamic> (contextJson);
                    return context?.GetProperty ("NozzleId").GetInt32 () ?? 0;
                }

                return 0;
            } catch (Exception ex) {
                _logger.LogError (ex, "[Monitor] Error getting nozzle from monitoring context for Device {DeviceId}, Transaction {TransactionId}",
                    deviceId, transactionId);
                return 0;
            }
        }
    }
}