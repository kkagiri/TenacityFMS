//Cursor: Service for direct HTTP communication with PTS devices
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using FMS.Application.Communication;
using FMS.Application.Communication.Connection;
using FMS.Application.Infrastructure.DistCacheTracker;
using FMS.Domain.Entities;
using FMS.Domain.Entities.PTS;
using FMS.Domain.PTSCommon;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json.Linq;

namespace FMS.Application.Services {
    public interface IDirectHttpTransactionService {
        Task<PumpTransactionResult> QueryTransactionDirectAsync (string deviceId, int pumpId, int? transactionId = null);
        Task<PumpStatusResult> QueryPumpStatusDirectAsync (string deviceId, int pumpId);
        Task<bool> CloseTransactionDirectAsync (string deviceId, int pumpId, int transactionId);
        Task<bool> IsDeviceReachableAsync (string deviceId);
    }

    public class DirectHttpTransactionService : IDirectHttpTransactionService {
        private readonly IDeviceHttpCommandPusher _httpCommandPusher;
        private readonly DeviceConnectionTracker _connectionTracker;
        private readonly ILogger<DirectHttpTransactionService> _logger;

        //Cursor: Default port for PTS devices (can be made configurable)
        private const int DEFAULT_PTS_PORT = 8080;

        public DirectHttpTransactionService (
            IDeviceHttpCommandPusher httpCommandPusher,
            DeviceConnectionTracker connectionTracker,
            ILogger<DirectHttpTransactionService> logger) {
            _httpCommandPusher = httpCommandPusher;
            _connectionTracker = connectionTracker;
            _logger = logger;
        }

        public async Task<PumpTransactionResult> QueryTransactionDirectAsync (string deviceId, int pumpId, int? transactionId = null) {
            try {
                _logger.LogDebug ("[DirectHTTP] Querying transaction for device {DeviceId}, pump {PumpId}, transaction {TransactionId}",
                    deviceId, pumpId, transactionId);

                var connection = await _connectionTracker.GetHttpConnection (deviceId);
                if (connection == null) {
                    _logger.LogWarning ("[DirectHTTP] No HTTP connection found for device {DeviceId}", deviceId);
                    return new PumpTransactionResult { Success = false, ErrorMessage = "Device not reachable via HTTP" };
                }

                // Create PTSMessage for transaction query
                var ptsMessage = CreateTransactionQueryMessage (pumpId, transactionId);

                //Cursor: Use LastKnownIp and default port since HttpConnectionInfo doesn't store these details
                var result = await _httpCommandPusher.SendPTSMessageAsync (
                    connection.LastKnownIp,
                    DEFAULT_PTS_PORT,
                    ptsMessage,
                    bearerToken : null); // No bearer token stored in HttpConnectionInfo

                if (!result.Success) {
                    _logger.LogWarning ("[DirectHTTP] Transaction query failed for device {DeviceId}: {ErrorCode}",
                        deviceId, result.ErrorCode);
                    return new PumpTransactionResult {
                        Success = false,
                            ErrorMessage = $"HTTP query failed with code {result.ErrorCode}"
                    };
                }

                if (result.Response?.Packets?.Count > 0) {
                    var responsePacket = result.Response.Packets[0];
                    if (responsePacket.Error == true) {
                        _logger.LogWarning ("[DirectHTTP] Device returned error for transaction query: {Code} - {Message}",
                            responsePacket.Code, responsePacket.Message);
                        return new PumpTransactionResult {
                            Success = false,
                                ErrorMessage = responsePacket.Message ?? "Device error"
                        };
                    }

                    // Parse transaction data from response
                    var transactionData = ParseTransactionFromResponse (responsePacket.Data);
                    return new PumpTransactionResult {
                        Success = true,
                            Transaction = transactionData
                    };
                }

                return new PumpTransactionResult { Success = false, ErrorMessage = "No response data" };

            } catch (Exception ex) {
                _logger.LogError (ex, "[DirectHTTP] Error querying transaction for device {DeviceId}, pump {PumpId}",
                    deviceId, pumpId);
                return new PumpTransactionResult { Success = false, ErrorMessage = ex.Message };
            }
        }

        public async Task<PumpStatusResult> QueryPumpStatusDirectAsync (string deviceId, int pumpId) {
            try {
                _logger.LogDebug ("[DirectHTTP] Querying pump status for device {DeviceId}, pump {PumpId}",
                    deviceId, pumpId);

                var connection = await _connectionTracker.GetHttpConnection (deviceId);
                if (connection == null) {
                    _logger.LogWarning ("[DirectHTTP] No HTTP connection found for device {DeviceId}", deviceId);
                    return new PumpStatusResult { Success = false, ErrorMessage = "Device not reachable via HTTP" };
                }

                // Create PTSMessage for status query
                var ptsMessage = CreateStatusQueryMessage (pumpId);

                //Cursor: Use LastKnownIp and default port
                var result = await _httpCommandPusher.SendPTSMessageAsync (
                    connection.LastKnownIp,
                    DEFAULT_PTS_PORT,
                    ptsMessage,
                    bearerToken : null);

                if (!result.Success) {
                    _logger.LogWarning ("[DirectHTTP] Status query failed for device {DeviceId}: {ErrorCode}",
                        deviceId, result.ErrorCode);
                    return new PumpStatusResult {
                        Success = false,
                            ErrorMessage = $"HTTP query failed with code {result.ErrorCode}"
                    };
                }

                if (result.Response?.Packets?.Count > 0) {
                    var responsePacket = result.Response.Packets[0];
                    if (responsePacket.Error == true) {
                        _logger.LogWarning ("[DirectHTTP] Device returned error for status query: {Code} - {Message}",
                            responsePacket.Code, responsePacket.Message);
                        return new PumpStatusResult {
                            Success = false,
                                ErrorMessage = responsePacket.Message ?? "Device error"
                        };
                    }

                    // Parse status data from response
                    var statusData = ParseStatusFromResponse (responsePacket.Data);
                    return new PumpStatusResult {
                        Success = true,
                            Status = statusData
                    };
                }

                return new PumpStatusResult { Success = false, ErrorMessage = "No response data" };

            } catch (Exception ex) {
                _logger.LogError (ex, "[DirectHTTP] Error querying pump status for device {DeviceId}, pump {PumpId}",
                    deviceId, pumpId);
                return new PumpStatusResult { Success = false, ErrorMessage = ex.Message };
            }
        }

        public async Task<bool> CloseTransactionDirectAsync (string deviceId, int pumpId, int transactionId) {
            try {
                _logger.LogInformation ("[DirectHTTP] Closing transaction {TransactionId} for device {DeviceId}, pump {PumpId}",
                    transactionId, deviceId, pumpId);

                var connection = await _connectionTracker.GetHttpConnection (deviceId);
                if (connection == null) {
                    _logger.LogWarning ("[DirectHTTP] No HTTP connection found for device {DeviceId}", deviceId);
                    return false;
                }

                // Create PTSMessage for transaction closure
                var ptsMessage = CreateCloseTransactionMessage (pumpId, transactionId);

                //Cursor: Use LastKnownIp and default port
                var result = await _httpCommandPusher.SendPTSMessageAsync (
                    connection.LastKnownIp,
                    DEFAULT_PTS_PORT,
                    ptsMessage,
                    bearerToken : null);

                if (!result.Success) {
                    _logger.LogWarning ("[DirectHTTP] Transaction closure failed for device {DeviceId}: {ErrorCode}",
                        deviceId, result.ErrorCode);
                    return false;
                }

                if (result.Response?.Packets?.Count > 0) {
                    var responsePacket = result.Response.Packets[0];
                    if (responsePacket.Error == true) {
                        _logger.LogWarning ("[DirectHTTP] Device returned error for transaction closure: {Code} - {Message}",
                            responsePacket.Code, responsePacket.Message);
                        return false;
                    }

                    _logger.LogInformation ("[DirectHTTP] Transaction {TransactionId} successfully closed for device {DeviceId}, pump {PumpId}",
                        transactionId, deviceId, pumpId);
                    return true;
                }

                return false;

            } catch (Exception ex) {
                _logger.LogError (ex, "[DirectHTTP] Error closing transaction {TransactionId} for device {DeviceId}, pump {PumpId}",
                    transactionId, deviceId, pumpId);
                return false;
            }
        }

        public async Task<bool> IsDeviceReachableAsync (string deviceId) {
            try {
                var connection = await _connectionTracker.GetHttpConnection (deviceId);
                if (connection == null) {
                    return false;
                }

                // Simple ping-like request to check device availability
                var ptsMessage = CreatePingMessage ();

                //Cursor: Use LastKnownIp and default port
                var result = await _httpCommandPusher.SendPTSMessageAsync (
                    connection.LastKnownIp,
                    DEFAULT_PTS_PORT,
                    ptsMessage,
                    bearerToken : null);

                return result.Success;

            } catch (Exception ex) {
                _logger.LogDebug ("[DirectHTTP] Device {DeviceId} not reachable: {Error}", deviceId, ex.Message);
                return false;
            }
        }

        // Helper methods to create PTSMessage objects
        private PTSMessage CreateTransactionQueryMessage (int pumpId, int? transactionId) {
            var packet = new Packet {
                Id = GeneratePacketId (),
                Type = "PumpGetTransactionInformation",
                Data = transactionId.HasValue ?
                JObject.FromObject (new { Pump = pumpId, Transaction = transactionId.Value }) :
                JObject.FromObject (new { Pump = pumpId })
            };

            return new PTSMessage {
                Protocol = "jsonPTS",
                    PtsId = "DirectHTTP_Query",
                    Packets = new List<Packet> { packet } //Cursor: Use List<Packet> instead of array
            };
        }

        private PTSMessage CreateStatusQueryMessage (int pumpId) {
            var packet = new Packet {
                Id = GeneratePacketId (),
                Type = "PumpGetStatus",
                Data = JObject.FromObject (new { Pump = pumpId })
            };

            return new PTSMessage {
                Protocol = "jsonPTS",
                    PtsId = "DirectHTTP_Status",
                    Packets = new List<Packet> { packet } //Cursor: Use List<Packet> instead of array
            };
        }

        private PTSMessage CreateCloseTransactionMessage (int pumpId, int transactionId) {
            var packet = new Packet {
                Id = GeneratePacketId (),
                Type = "PumpCloseTransaction",
                Data = JObject.FromObject (new { Pump = pumpId, Transaction = transactionId })
            };

            return new PTSMessage {
                Protocol = "jsonPTS",
                    PtsId = "DirectHTTP_Close",
                    Packets = new List<Packet> { packet } //Cursor: Use List<Packet> instead of array
            };
        }

        private PTSMessage CreatePingMessage () {
            var packet = new Packet {
                Id = GeneratePacketId (),
                Type = "Ping",
                Data = JObject.FromObject (new { })
            };

            return new PTSMessage {
                Protocol = "jsonPTS",
                    PtsId = "DirectHTTP_Ping",
                    Packets = new List<Packet> { packet } //Cursor: Use List<Packet> instead of array
            };
        }

        private Pumptransaction ParseTransactionFromResponse (JObject data) {
            if (data == null) return null;

            return new Pumptransaction {
                Pump = data.Value<int?> ("Pump"),
                    Transaction = data.Value<int?> ("Transaction"),
                    Nozzle = data.Value<int?> ("Nozzle"),
                    FuelGradeId = data.Value<int?> ("FuelGradeId"),
                    FuelGradeName = data.Value<string> ("FuelGradeName"),
                    Volume = data.Value<decimal?> ("Volume"),
                    Tcvolume = data.Value<decimal?> ("TCVolume"),
                    Price = data.Value<decimal?> ("Price"),
                    Amount = data.Value<decimal?> ("Amount"),
                    DateTime = data.Value<DateTime?> ("DateTime") ?? DateTime.UtcNow,
                    DateTimeStart = data.Value<DateTime?> ("DateTimeStart"),
                    Tag = data.Value<string> ("Tag"),
                    UserId = data.Value<int?> ("UserId"),
                    ConfigurationId = data.Value<string> ("ConfigurationId")
            };
        }

        private object ParseStatusFromResponse (JObject data) {
            if (data == null) return null;

            var statusType = data.Value<string> ("Type");
            return new {
                Type = statusType,
                    Pump = data.Value<int?> ("Pump"),
                    Data = data
            };
        }

        private int GeneratePacketId () {
            return new Random ().Next (1000, 9999);
        }
    }

    // Result classes
    public class PumpTransactionResult {
        public bool Success { get; set; }
        public string ErrorMessage { get; set; }
        public Pumptransaction Transaction { get; set; }
    }

    public class PumpStatusResult {
        public bool Success { get; set; }
        public string ErrorMessage { get; set; }
        public object Status { get; set; }
    }
}