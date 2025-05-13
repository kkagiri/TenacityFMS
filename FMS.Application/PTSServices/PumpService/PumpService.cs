using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Sockets;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Command.PTSCommand.Common;
using FMS.Application.Common;
using FMS.Application.Communication.SignalR;
using FMS.Application.Infrastructure.ErrorCodes.Common;
using FMS.Application.Infrastructure.Expections.Base;
using FMS.Application.ModelsDTOs.PTS;
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

                //var transactionId = PacketIdGenerator.GetNextId();
                var result = await _commandExecution.ExecuteCommandAsync (pTSDeviceId, "PumpAuthorize", commandData);

                if (!result.Success) {
                    if (result.Code.HasValue) {
                        var errorCode = (PtsErrorCode) result.Code.Value;
                        var errorMessage = EnumExtensions.GetDescription (errorCode);
                        throw new PTSDeviceException (errorMessage);
                    }
                    throw new PTSDeviceException (result.Message ?? "Failed to authorize pump.");
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

                    return new PumpAuthorizeConfirmation {
                        Pump = pump,
                            Transaction = transaction
                    };

                } catch (Exception ex) when (ex is not PTSDeviceException) {
                    _logger.LogError (ex, "Error authorizing pump {Pump} for transaction {Transaction}", pumpAuthorizeData.Pump, pumpAuthorizeData.Transaction);
                    throw new PTSDeviceException ("Error processing Pump authorize Response");
                }
            } catch (Exception ex) {
                _logger.LogError (ex, "Error authorizing pump {Pump} for transaction {Transaction}", pumpAuthorizeData.Pump, pumpAuthorizeData.Transaction);
                throw new PTSDeviceException ("Error authorizing pump");
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
        public Task<Pumptransaction> GetPumpTransactionInfoAsync (string pTSDeviceId, int pumpId, int? transactionId) {
            throw new NotImplementedException ();
        }

        public async Task<FMSResponseMessage> StopPumpAsync (string pTSDeviceId, int pumpId) {
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
                    if (result.Code.HasValue) {
                        var errorCode = (PtsErrorCode) result.Code.Value;
                        var errorMessage = EnumExtensions.GetDescription (errorCode);
                        throw new PTSDeviceException (errorMessage);
                    }
                    throw new PTSDeviceException (result.Message ?? "Failed to authorize pump.");

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

        public Task<FMSResponseMessage> ClosePumpTransactionAsync (string pTSDeviceId, int pumpId, int transactionId) {
            throw new NotImplementedException ();
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
                    if (result.Code.HasValue) {
                        var errorCode = (PtsErrorCode) result.Code.Value;
                        var errorMessage = EnumExtensions.GetDescription (errorCode);
                        return new FMSResponseMessage<PumpTagResponseDTO> (false, errorMessage, null!);
                    }
                    return new FMSResponseMessage<PumpTagResponseDTO> (false, result.Message ?? "Failed to get pump tag.", null!);
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