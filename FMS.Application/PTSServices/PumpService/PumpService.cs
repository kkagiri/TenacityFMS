using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Sockets;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Command.PTSCommand.Common;
using FMS.Application.Common;
using FMS.Application.Communication.SignalR;
using FMS.Application.Features.PTS;
using FMS.Application.Infrastructure.ErrorCodes.Common;
using FMS.Application.Infrastructure.Expections.Base;
using FMS.Application.PTSServices.PumpService;
using FMS.Domain.Entities;
using FMS.Domain.Entities.PTS;
using FMS.Domain.Entities.PTS.Enums;
using FMS.Domain.Entities.Util;
using FMS.PTS.DataStruct;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json.Linq;

namespace FMS.PTS.WindowsService.Services.Pump {
    /// <summary>
    /// Service for managing pump operations via PTS devices.
    ///
    /// Error Handling Notes:
    /// - CommandExecutor can return both PTS device errors (0-58, 1000-1008) and system errors (HTTP codes like 404, 408, 500)
    /// - Only PTS error codes should be cast to PtsErrorCode enum
    /// - Use PtsErrorCodeHelper.IsPtsErrorCode() to validate before casting
    /// - System errors should be handled with their original error messages
    /// </summary>
    public class PumpService : IPumpService {
        private readonly ICommandExecutor _commandExecution;
        private readonly ILogger<PumpService> _logger;

        private readonly IHubContext<FrontEndHub> _hubContext;
        private readonly SemaphoreSlim _authorizationLock = new (1, 1);

        private int _lastTransactionId = 0;
        private readonly object _transactionLock = new object ();

        public PumpService (ILogger<PumpService> logger, IHubContext<FrontEndHub> hubContext, ICommandExecutor commandExecutor) {
            _commandExecution = commandExecutor;
            _logger = logger;
            _hubContext = hubContext;
        }

        public Task<PumpTransaction?> GetTransactionAsync (int pumpId, string transactionId) {
            throw new NotImplementedException ();
        }

        /// <summary>
        /// Gets detailed information about a specific pump transaction
        /// </summary>
        /// <param name="pTSDeviceId">ID of the PTS device</param>
        /// <param name="pumpId">Pump number (1-50)</param>
        /// <param name="transactionId">Transaction ID to retrieve, or null for the last transaction</param>
        /// <returns>Transaction details if found</returns>
        public async Task<Pumptransaction> GetPumpTransactionInfoAsync (string pTSDeviceId, int pumpId, int? transactionId) {
            //Cursor: Start implementation
            try {
                if (string.IsNullOrEmpty (pTSDeviceId)) throw new ArgumentNullException (nameof (pTSDeviceId), "Device ID cannot be empty");
                if (pumpId <= 0 || pumpId > 50) throw new ArgumentException ("Invalid pump number. Must be between 1 and 50.");

                // Create command data for the request
                object commandData;
                if (transactionId.HasValue && transactionId.Value > 0) {
                    commandData = new {
                        Pump = pumpId,
                        Transaction = transactionId.Value
                    };
                } else {
                    // If transaction ID is not provided, get the last transaction
                    commandData = new { Pump = pumpId };
                }

                // Execute the command to get transaction information
                var result = await _commandExecution.ExecuteCommandAsync (pTSDeviceId, "PumpGetTransactionInformation", commandData);

                if (!result.Success) {
                    // Only treat as PTS error code if it's within the known PTS error range
                    if (result.Code.HasValue && PtsErrorCodeHelper.IsPtsErrorCode (result.Code.Value)) {
                        var errorCode = (PtsErrorCode) result.Code.Value;
                        var errorMessage = EnumExtensions.GetDescription (errorCode);
                        throw new PTSDeviceException (errorMessage);
                    } else {
                        // This is a system/infrastructure error
                        _logger.LogError ("System error during transaction retrieval for device {DeviceId}, pump {PumpId}. Error code: {ErrorCode}, Message: {Message}",
                            pTSDeviceId, pumpId, result.Code, result.Message);
                        throw new PTSDeviceException (result.Message ?? "Failed to get transaction information.");
                    }
                }

                // Parse the response
                if (result.CommandData == null) {
                    throw new InvalidOperationException ("PumpGetTransactionInformation response data is missing");
                }

                try {
                    // Convert CommandData to JObject for property access
                    var responseData = JObject.FromObject (result.CommandData);

                    // Extract transaction details
                    var transaction = new Pumptransaction {
                        PtsId = pTSDeviceId,
                        Pump = pumpId,
                        Transaction = responseData.Value<int?> ("Transaction"),
                        Nozzle = responseData.Value<int?> ("Nozzle"),
                        FuelGradeId = responseData.Value<int?> ("FuelGradeId"),
                        FuelGradeName = responseData.Value<string> ("FuelGradeName"),
                        Volume = responseData.Value<decimal?> ("Volume"),
                        Tcvolume = responseData.Value<decimal?> ("TCVolume"),
                        Price = responseData.Value<decimal?> ("Price"),
                        Amount = responseData.Value<decimal?> ("Amount"),
                        DateTime = responseData.Value<DateTime?> ("DateTime") ?? DateTime.UtcNow,
                        DateTimeStart = responseData.Value<DateTime?> ("DateTimeStart"),
                        Tag = responseData.Value<string> ("Tag"),
                        UserId = responseData.Value<int?> ("UserId"),
                        ConfigurationId = responseData.Value<string> ("ConfigurationId")
                    };

                    _logger.LogInformation ("Retrieved transaction {Transaction} for device {DeviceId}, pump {Pump}",
                        transaction.Transaction, pTSDeviceId, pumpId);

                    return transaction;
                } catch (Exception ex) {
                    _logger.LogError (ex, "Error parsing transaction response for device {DeviceId}, pump {Pump}, transaction {Transaction}",
                        pTSDeviceId, pumpId, transactionId);
                    throw new PTSDeviceException ("Error processing transaction information response");
                }
            } catch (Exception ex) {
                _logger.LogError (ex, "Error getting transaction information for device {DeviceId}, pump {Pump}, transaction {Transaction}",
                    pTSDeviceId, pumpId, transactionId);
                throw;
            }
        }

        /// <summary>
        ///Sets preset and nozzle price, allows filling for specified nozzle
        /// </summary>
        /// <param name="pumpAuthorizeData"></param>
        /// <returns> Confirms pumps successful authorization and its transaction number</returns>
        public async Task<PumpAuthorizeConfirmation> PumpAuthorizeAsync (string pTSDeviceId, PumpAuthorizeData pumpAuthorizeData) {
            try {
                if (pTSDeviceId == null) throw new ArgumentNullException ("PTSDeviceId cannot be Empty");

                if (pumpAuthorizeData.Pump <= 0 || pumpAuthorizeData.Pump > 50) throw new ArgumentException ("Invalid pump number. Must be between 1 and 50.");

                // Execute command using the CommandExecutor
                // "PumpAuthorize" is the commandType used in the packet

                await _authorizationLock.WaitAsync ();

                var commandData = CreateAuthorizationData (pumpAuthorizeData);

                //Cursor: Add logging to debug command data structure
                _logger.LogDebug ("Created authorization data for pump {Pump}: {CommandData}",
                    pumpAuthorizeData.Pump, Newtonsoft.Json.JsonConvert.SerializeObject (commandData));

                _logger.LogInformation ("Attempting to authorize pump {Pump} on device {DeviceId} with transaction {Transaction}",
                    pumpAuthorizeData.Pump, pTSDeviceId, pumpAuthorizeData.Transaction);

                //var transactionId = PacketIdGenerator.GetNextId();
                var result = await _commandExecution.ExecuteCommandAsync (pTSDeviceId, "PumpAuthorize", commandData);

                if (!result.Success) {
                    // Only treat as PTS error code if it's within the known PTS error range
                    // PTS error codes: 0-58 (protocol errors) and 1000-1008 (communication errors)
                    if (result.Code.HasValue && PtsErrorCodeHelper.IsPtsErrorCode (result.Code.Value)) {
                        var errorCode = (PtsErrorCode) result.Code.Value;
                        var errorMessage = EnumExtensions.GetDescription (errorCode);

                        //Cursor: Enhanced logging for better diagnostics
                        _logger.LogError ("PTS device {DeviceId} returned error code {ErrorCode} ({ErrorCodeValue}): {ErrorMessage} for pump {Pump}",
                            pTSDeviceId, errorCode, result.Code.Value, errorMessage, pumpAuthorizeData.Pump);

                        // Check for specific error conditions
                        if (errorCode == PtsErrorCode.JSONPTS_ERROR_NOT_FOUND) {
                            _logger.LogWarning ("Device {DeviceId} not authorized. This could mean: 1) Device not found in system, 2) Pump {Pump} not configured, 3) Device offline, or 4) Authentication failed",
                                pTSDeviceId, pumpAuthorizeData.Pump);
                        }

                        throw new PTSDeviceException (errorMessage);
                    } else {
                        // This is a system/infrastructure error (HTTP codes like 404, 408, 500, etc.)
                        _logger.LogError ("System error during pump authorization for device {DeviceId}, pump {Pump}. Error code: {ErrorCode}, Message: {Message}",
                            pTSDeviceId, pumpAuthorizeData.Pump, result.Code, result.Message);

                        // Categorize system errors by code
                        if (result.Code == 408 || result.Code == 504) {
                            throw PTSDeviceException.NetworkError (result.Message ?? "Network timeout occurred");
                        } else {
                            throw PTSDeviceException.SystemError (result.Message ?? "System error occurred");
                        }
                    }
                }
                try {
                    if (result.CommandData == null) {
                        throw new InvalidOperationException ("PumpAuthorize response data is missing");
                    }
                    // Convert CommandData to JObject for safer property access
                    var responseData = JObject.FromObject (result.CommandData);

                    // Safely extract pump number
                    if (!responseData.TryGetValue ("Pump", out var pumpToken) || pumpToken.Type != JTokenType.Integer) {
                        throw new InvalidOperationException ("Invalid or missing Pump data in response");
                    }

                    var pump = pumpToken.Value<int> ();

                    var data = result.CommandData;
                    if (!responseData.TryGetValue ("Transaction", out var transactionToken) || transactionToken.Type != JTokenType.Integer) {
                        throw new InvalidOperationException ("Invalid or missing Transaction data in response");
                    }
                    var transaction = transactionToken.Value<int> ();

                    // Validate the response data
                    if (pump != pumpAuthorizeData.Pump) {
                        throw new InvalidOperationException ($"Response pump number {pump} does not match request pump number {pumpAuthorizeData.Pump}");
                    }

                    _logger.LogInformation ("Successfully authorized pump {Pump} on device {DeviceId}. PTS assigned transaction ID: {Transaction}",
                        pump, pTSDeviceId, transaction);

                    return new PumpAuthorizeConfirmation {
                        Pump = pump,
                            Transaction = transaction
                    };

                } catch (Exception ex) when (ex is not PTSDeviceException) {
                    _logger.LogError (ex, "Error processing pump authorization response for pump {Pump} on device {DeviceId}: {Message}",
                        pumpAuthorizeData.Pump, pTSDeviceId, ex.Message);
                    throw PTSDeviceException.SystemError ($"Error processing pump authorization response: {ex.Message}");
                }
            } catch (PTSDeviceException) {
                // Re-throw PTSDeviceException as-is to preserve error type and message
                throw;
            } catch (Exception ex) {
                _logger.LogError (ex, "Unexpected error authorizing pump {Pump} for transaction {Transaction}: {Message}",
                    pumpAuthorizeData.Pump, pumpAuthorizeData.Transaction, ex.Message);
                throw PTSDeviceException.SystemError ($"Unexpected error during pump authorization: {ex.Message}");
            } finally {
                _authorizationLock.Release (); //Cursor: Ensure semaphore is always released
            }

        }

        private JObject CreateAuthorizationData (PumpAuthorizeData pumpAuthorizeData) {

            var authData = new Dictionary<string, object> { { "Pump", pumpAuthorizeData.Pump }
                };

            switch (pumpAuthorizeData.NozzleOrFuelIdSelector) {

                case NozzleOrFuelIdSelector.NOZZLE:
                    authData.Add ("Nozzle", pumpAuthorizeData.Nozzle);
                    break;
                case NozzleOrFuelIdSelector.NOZZLES:
                    JArray nozzles = new JArray ();
                    for (int i = 0; i < pumpAuthorizeData.Nozzles?.Count; i++) {
                        nozzles.Add (pumpAuthorizeData.Nozzles?[i]);
                    }
                    authData.Add ("Nozzles", nozzles);
                    break;
                case NozzleOrFuelIdSelector.FUELGRADEID:
                    authData.Add ("FuelGradeId", pumpAuthorizeData.FuelGradeId);
                    break;
                case NozzleOrFuelIdSelector.FUELGRADEIDS:
                    JArray fuelGradeIds = new JArray ();
                    for (int i = 0; i < pumpAuthorizeData.FuelGradeIds?.Count; i++) {
                        fuelGradeIds.Add (pumpAuthorizeData.FuelGradeIds?[i]);
                    }
                    authData.Add ("FuelGradeIds", fuelGradeIds);
                    break;

                case NozzleOrFuelIdSelector.NONE:
                default:
                    break;
            }

            //add type and does if not full tank

            authData.Add ("Type", EnumerationHelper.GetEnumDescription (pumpAuthorizeData.Type));

            if (pumpAuthorizeData.Type != PumpAuthorizeType.FULLTANK) {
                authData.Add ("Dose", pumpAuthorizeData.Dose);
            }

            if (pumpAuthorizeData.TransactionEnabled) {
                authData.Add ("Transaction", pumpAuthorizeData.Transaction);
            }
            if (pumpAuthorizeData.PriceEnabled) {
                authData.Add ("Price", pumpAuthorizeData.Price);
            }

            authData.Add ("AutoCloseTransaction", pumpAuthorizeData.AutoCloseTransaction);

            return JObject.FromObject (authData);

        }

        public async Task<FMSResponseMessage<object>> GetPumpStatusAsync (string pTSDeviceId, int pumpId) {
            try {
                var commandData = new { Pump = pumpId };
                var result = await _commandExecution.ExecuteCommandAsync (pTSDeviceId, "PumpGetStatus", commandData);
                if (!result.Success) {
                    _logger.LogWarning ("Failed to get pump status for pump {PumpId} on device {DeviceId}. Error: {ErrorMessage}", pumpId, pTSDeviceId, result.Message);
                    return new FMSResponseMessage<object> (false, result.Message ?? "Failed to retrieve pump status", null!);
                }

                // Parse the commandData from the result into a pump status object
                if (result.CommandData == null) {
                    return new FMSResponseMessage<object> (false, "No data returned from device", null!);
                }
                var pumpStatus = ParsePumpStatus (result.CommandData);

                var statusType = GetPumpStatusString (pumpStatus);
                _logger.LogDebug ("Parsed pump status: {StatusType}", statusType);

                // Convert the status object into the final anonymous DTO with fields as needed
                var dto = ConvertPumpStatusToDto (pumpStatus);

                await _hubContext.Clients.All.SendAsync ("PumpStatusUpdate", dto);
                return new FMSResponseMessage<object> (true, "Pump status retrieved successfully", dto);

            } catch (Exception ex) {
                _logger.LogError (ex, "Error getting pump status for pump {Pump}", pumpId);
                return new FMSResponseMessage<object> (false, ex.Message, null!);

            }
        }
        private PumpStatusBase ParsePumpStatus (object commandData) {
            // commandData assumed to be a JObject or similar structure with a "Type" field
            if (commandData is Newtonsoft.Json.Linq.JObject jObj) {
                var statusType = jObj["Type"]?.ToString ();
                if (string.IsNullOrEmpty (statusType)) throw new ArgumentException ("No Type field found in commandData");
                return statusType
                switch {
                    "PumpIdleStatus" => jObj.ToObject<PumpIdleStatus> () ??
                        throw new InvalidOperationException ("Failed to deserialize PumpIdleStatus"),
                            "PumpFillingStatus" => jObj.ToObject<PumpFillingStatus> () ??
                            throw new InvalidOperationException ("Failed to deserialize PumpFillingStatus"),
                                "PumpOfflineStatus" => jObj.ToObject<PumpOfflineStatus> () ??
                                throw new InvalidOperationException ("Failed to deserialize PumpOfflineStatus"),
                                    "PumpPrices" => jObj.ToObject<PumpPrices> () ??
                                    throw new InvalidOperationException ("Failed to deserialize PumpPrices"),
                                        "PumpTag" => jObj.ToObject<PumpTag> () ??
                                        throw new InvalidOperationException ("Failed to deserialize PumpTag"),
                                            "PumpDisplayData" => jObj.ToObject<PumpDisplayData> () ??
                                            throw new InvalidOperationException ("Failed to deserialize PumpDisplayData"),
                                                "PumpTotals" => jObj.ToObject<PumpTotals> () ??
                                                throw new InvalidOperationException ("Failed to deserialize PumpTotals"),
                                                    "PumpEndOfTransactionStatus" => jObj.ToObject<PumpEndOfTransactionStatus> () ??
                                                    throw new InvalidOperationException ("Failed to deserialize PumpEndOfTransactionStatus"),
                                                        _ =>
                                                        throw new ArgumentException ($"Unsupported pump status type: {statusType}")
                };
            }

            throw new ArgumentException ("commandData is not a JObject");
        }

        private string GetPumpStatusString (PumpStatusBase pumpStatus) {
            return pumpStatus
            switch {
                PumpIdleStatus _ => "PumpIdleStatus",
                    PumpFillingStatus _ => "PumpFillingStatus",
                    PumpOfflineStatus _ => "PumpOfflineStatus",
                    PumpPrices _ => "PumpPrices",
                    PumpTag _ => "PumpTag",
                    PumpDisplayData _ => "PumpDisplayData",
                    PumpTotals _ => "PumpTotals",
                    PumpEndOfTransactionStatus _ => "PumpEndOfTransactionStatus",
                    _ =>
                    throw new ArgumentException ($"Unsupported pump status type: {pumpStatus.GetType().Name}")
            };
        }
        private object ConvertPumpStatusToDto (PumpStatusBase pumpStatus) {

            switch (pumpStatus) {
                case PumpIdleStatus idleStatus:
                    return new {
                        Pump = idleStatus.Pump ?? 0,
                            Transaction = idleStatus.Transaction, // Added from protocol spec
                            NozzleUp = idleStatus.NozzleUp,
                            Nozzle = idleStatus.NozzleUp, // Same as NozzleUp per spec
                            LastNozzle = idleStatus.LastNozzle,
                            FuelGradeId = idleStatus.FuelGradeId, // If present in model
                            LastFuelGradeId = idleStatus.LastFuelGradeId, // If present in model
                            FuelGradeName = idleStatus.FuelGradeName, // If present in model
                            LastFuelGradeName = idleStatus.LastFuelGradeName, // If present in model
                            LastVolume = Math.Round (idleStatus.LastVolume, 2),
                            LastPrice = Math.Round (idleStatus.LastPrice, 2),
                            LastAmount = Math.Round (idleStatus.LastAmount, 2),
                            LastTransaction = idleStatus.LastTransaction,
                            LastTotalVolume = idleStatus.LastTotalVolume,
                            LastTotalAmount = idleStatus.LastTotalAmount,
                            LastDateTimeStart = idleStatus.LastDateTimeStart?.ToString ("yyyy-MM-ddTHH:mm:ss"),
                            LastDateTime = idleStatus.LastDateTime?.ToString ("yyyy-MM-ddTHH:mm:ss"),
                            Request = idleStatus.Request,
                            User = idleStatus.User ?? string.Empty,
                            Tag = idleStatus.Tag // Optional field

                    };

                case PumpFillingStatus fillingStatus:
                    return new {
                        Pump = fillingStatus.Pump ?? 0,
                            Nozzle = fillingStatus.Nozzle,
                            Volume = Math.Round (fillingStatus.Volume, 2),
                            TCVolume = Math.Round (fillingStatus.TCVolume, 2),
                            Price = Math.Round (fillingStatus.Price, 2),
                            Amount = Math.Round (fillingStatus.Amount, 2),
                            Transaction = fillingStatus.Transaction,
                            User = fillingStatus.User ?? string.Empty
                    };

                case PumpEndOfTransactionStatus endOfTransactionStatus:
                    return new {
                        Pump = endOfTransactionStatus.Pump ?? 0,
                            Nozzle = endOfTransactionStatus.Nozzle,
                            Volume = Math.Round (endOfTransactionStatus.Volume, 2),
                            TCVolume = Math.Round (endOfTransactionStatus.TCVolume, 2),
                            Price = Math.Round (endOfTransactionStatus.Price, 2),
                            Amount = Math.Round (endOfTransactionStatus.Amount, 2),
                            Transaction = endOfTransactionStatus.Transaction,
                            User = endOfTransactionStatus.User ?? string.Empty

                    };

                case PumpTotals totalsStatus:
                    return new {
                        Pump = totalsStatus.Pump ?? 0,
                            Nozzle = totalsStatus.Nozzle,
                            Volume = totalsStatus.Volume.HasValue ? Math.Round (totalsStatus.Volume.Value, 2) : (double?) null,
                            Price = totalsStatus.Price.HasValue ? Math.Round (totalsStatus.Price.Value, 2) : (double?) null,
                            Amount = totalsStatus.Amount.HasValue ? Math.Round (totalsStatus.Amount.Value, 2) : (double?) null,
                            Transaction = totalsStatus.Transaction,
                            User = totalsStatus.User ?? string.Empty
                    };

                case PumpPrices pricesStatus:
                    return new {
                        Pump = pricesStatus.Pump ?? 0,
                            Prices = pricesStatus.Prices?.Select (p => Math.Round (p, 2)).ToList () ?? new List<double> (),
                            User = pricesStatus.User ?? string.Empty
                    };
                case PumpTag tagStatus:
                    return new {
                        Pump = tagStatus.Pump ?? 0,
                            Nozzle = tagStatus.Nozzle,
                            Tag = tagStatus.Tag ?? string.Empty,
                            User = tagStatus.User ?? string.Empty
                    };
                case PumpDisplayData displayStatus:
                    return new {
                        Pump = displayStatus.Pump ?? 0,
                            LastNozzle = displayStatus.LastNozzle,
                            Volume = Math.Round (displayStatus.Volume, 2),
                            Amount = Math.Round (displayStatus.Amount, 2),
                            LastTransaction = displayStatus.LastTransaction,
                            User = displayStatus.User ?? string.Empty
                    };

                case PumpOfflineStatus offlineStatus:
                    return new {
                        Pump = offlineStatus.Pump ?? 0,
                            User = offlineStatus.User ?? string.Empty
                    };

                default:
                    throw new ArgumentException ($"Unsupported pump status type: {pumpStatus.GetType().Name}");

            }

        }

        public async Task<FMSResponseMessage> StopPumpAsync (string pTSDeviceId, int pumpId) {
            //Cursor: Restore implementation
            try {
                var commandData = new { Pump = pumpId };

                var result = await _commandExecution.ExecuteCommandAsync (pTSDeviceId, "PumpStop", commandData);

                if (!result.Success) return new FMSResponseMessage (false, result.Message ?? "Failed to stop pump.");

                return new FMSResponseMessage (true, "Pump stopped successfully.");
            } catch (Exception ex) {
                _logger.LogError (ex, "Error stopping pump {Pump}", pumpId);
                return new FMSResponseMessage (false, ex.Message);
            }
        }

        public async Task<FMSResponseMessage> EmergencyStopPumpAsync (string pTSDeviceId, int pumpId) {

            if (pTSDeviceId == null) throw new ArgumentNullException (nameof (pTSDeviceId));

            var commandData = new { Pump = pumpId };
            try {
                var result = await _commandExecution.ExecuteCommandAsync (pTSDeviceId, "PumpEmergencyStop", commandData);

                if (!result.Success) {
                    // Only treat as PTS error code if it's within the known PTS error range
                    if (result.Code.HasValue && PtsErrorCodeHelper.IsPtsErrorCode (result.Code.Value)) {
                        var errorCode = (PtsErrorCode) result.Code.Value;
                        var errorMessage = EnumExtensions.GetDescription (errorCode);
                        throw new PTSDeviceException (errorMessage);
                    } else {
                        // This is a system/infrastructure error
                        _logger.LogError ("System error during emergency stop for device {DeviceId}, pump {PumpId}. Error code: {ErrorCode}, Message: {Message}",
                            pTSDeviceId, pumpId, result.Code, result.Message);
                        throw new PTSDeviceException (result.Message ?? "Failed to emergency stop pump.");
                    }
                }

                return new FMSResponseMessage (true, "Pump stopped successfully.");

            } catch (Exception ex) {
                _logger.LogError (ex, "Error stopping pump {Pump}", pumpId);
                return new FMSResponseMessage (false, ex.Message);
            }
        }

        public Task<FMSResponseMessage> SuspendPumpAsync (string pTSDeviceId, int pumpId) {
            throw new NotImplementedException ();
        }

        public Task<FMSResponseMessage> ResumePumpAsync (string pTSDeviceId, int pumpId) {
            throw new NotImplementedException ();
        }

        public async Task<FMSResponseMessage> ClosePumpTransactionAsync (string pTSDeviceId, int pumpId, int transactionId) {
            //Cursor: Implement transaction close functionality
            try {
                if (string.IsNullOrEmpty (pTSDeviceId))
                    throw new ArgumentNullException (nameof (pTSDeviceId), "Device ID cannot be empty");

                if (pumpId <= 0 || pumpId > 50)
                    throw new ArgumentException ("Invalid pump number. Must be between 1 and 50.");

                if (transactionId <= 0)
                    throw new ArgumentException ("Invalid transaction ID. Must be greater than 0.");

                var commandData = new {
                    Pump = pumpId,
                    Transaction = transactionId
                };

                _logger.LogInformation ("Closing transaction {TransactionId} for pump {PumpId} on device {DeviceId}",
                    transactionId, pumpId, pTSDeviceId);

                var result = await _commandExecution.ExecuteCommandAsync (pTSDeviceId, "PumpCloseTransaction", commandData);

                if (!result.Success) {
                    if (result.Code.HasValue) {
                        var errorCode = (PtsErrorCode) result.Code.Value;
                        var errorMessage = EnumExtensions.GetDescription (errorCode);
                        _logger.LogWarning ("Failed to close transaction {TransactionId} for pump {PumpId}: {Error}",
                            transactionId, pumpId, errorMessage);
                        return new FMSResponseMessage (false, errorMessage);
                    }

                    _logger.LogWarning ("Failed to close transaction {TransactionId} for pump {PumpId}: {Message}",
                        transactionId, pumpId, result.Message);
                    return new FMSResponseMessage (false, result.Message ?? "Failed to close pump transaction");
                }

                _logger.LogInformation ("Successfully closed transaction {TransactionId} for pump {PumpId} on device {DeviceId}",
                    transactionId, pumpId, pTSDeviceId);

                return new FMSResponseMessage (true, "Transaction closed successfully");

            } catch (Exception ex) {
                _logger.LogError (ex, "Error closing transaction {TransactionId} for pump {PumpId} on device {DeviceId}",
                    transactionId, pumpId, pTSDeviceId);
                return new FMSResponseMessage (false, ex.Message);
            }
        }

        public Task<FMSResponseMessage> GetPumpTotalsAsync (string pTSDeviceId, int pumpId, int? nozzle, int? fuelGradeId) {
            throw new NotImplementedException ();
        }

        public Task<FMSResponseMessage> GetPumpPricesAsync (string pTSDeviceId, int pumpId) {
            throw new NotImplementedException ();
        }

        public Task<FMSResponseMessage> SetPumpPricesAsync (string pTSDeviceId, int pumpId, double[] prices) {
            throw new NotImplementedException ();
        }

        public Task<FMSResponseMessage> GetPumpDisplayDataAsync (string pTSDeviceId, int pumpId) {
            throw new NotImplementedException ();
        }

        public async Task<FMSResponseMessage<PumpTagResponseDTO>> GetPumpTagAsync (string pTSDeviceId, int pumpId, int nozzle) {
            try {
                if (pumpId <= 0 || pumpId > 50) {
                    throw new ArgumentException ("Invalid pump number. Must be between 1 and 50.");
                }
                var commandData = new { Pump = pumpId, Nozzle = nozzle };
                var result = await _commandExecution.ExecuteCommandAsync (pTSDeviceId, "PumpTag", commandData);

                if (!result.Success) {
                    // Only treat as PTS error code if it's within the known PTS error range
                    if (result.Code.HasValue && PtsErrorCodeHelper.IsPtsErrorCode (result.Code.Value)) {
                        var errorCode = (PtsErrorCode) result.Code.Value;
                        var errorMessage = EnumExtensions.GetDescription (errorCode);
                        return new FMSResponseMessage<PumpTagResponseDTO> (false, errorMessage, null!);
                    } else {
                        // This is a system/infrastructure error
                        _logger.LogError ("System error during pump tag retrieval for device {DeviceId}, pump {PumpId}. Error code: {ErrorCode}, Message: {Message}",
                            pTSDeviceId, pumpId, result.Code, result.Message);
                        return new FMSResponseMessage<PumpTagResponseDTO> (false, result.Message ?? "Failed to get pump tag.", null!);
                    }
                }

                try {
                    if (result.CommandData == null) {
                        return new FMSResponseMessage<PumpTagResponseDTO> (false, "PumpGetTag response data is missing", null!);
                    }

                    //parse the PTS message
                    var responseData = JObject.FromObject (result.CommandData);

                    var tagRepsonce = new PumpTagResponseDTO {
                        Pump = responseData["Pump"]?.Value<int> () ?? 0,
                        Nozzle = responseData["Nozzle"]?.Value<int> () ?? 0,
                        Tag = responseData["Tag"]?.Value<string> () ?? string.Empty,
                        User = responseData["User"]?.Value<string> () ?? string.Empty
                    };

                    return new FMSResponseMessage<PumpTagResponseDTO> (true, "Pump tag retrieved successfully", tagRepsonce);

                } catch (Exception ex) when (ex is not PTSDeviceException) {
                    _logger.LogError (ex, "Error getting pump tag for pump {Pump} and nozzle {Nozzle}", pumpId, nozzle);
                    return new FMSResponseMessage<PumpTagResponseDTO> (false, "Error processing Pump tag Response", null!);
                }

            } catch (Exception ex) {
                _logger.LogError (ex, "Error getting pump tag for pump {Pump} and nozzle {Nozzle}", pumpId, nozzle);
                return new FMSResponseMessage<PumpTagResponseDTO> (false, ex.Message, null!);
            }
        }

        public Task<FMSResponseMessage> GetPumpAdditionalMeasurementsAsync (string pTSDeviceId, int pumpId) {
            throw new NotImplementedException ();
        }

        public Task<FMSResponseMessage> SetPumpLightsAsync (string pTSDeviceId, int pumpId, string state) {
            throw new NotImplementedException ();
        }

        public Task<PumpAutomaticOperation> GetPumpAutomaticOperationAsync (string pTSDeviceId, int pumpId) {
            throw new NotImplementedException ();
        }

        public Task<FMSResponseMessage> SetPumpAutomaticOperationAsync (string pTSDeviceId, int pumpId, string state) {
            throw new NotImplementedException ();
        }

        public Task<FMSResponseMessage> SetSimulateFillingOnDartInputAsync (string pTSDeviceId, int pumpId, string state, int nozzleUp) {
            throw new NotImplementedException ();
        }

        public void InitializePumpState (string pTSDeviceId, int pumpId) {
            throw new NotImplementedException ();
        }
    }
}