using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.ATG;
using FMS.Application.Features.EventEngine.Engine;
using FMS.Application.Features.EventEngine.Events;
using FMS.Application.Handlers.Interface;
using FMS.Application.Features.Notification.DTOs;
using FMS.Domain.Entities;
using FMS.Domain.Entities.PTS;
using FMS.Domain.PTSCommon;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json.Linq;
using StackExchange.Redis;

namespace FMS.Application.Handlers
{
    [PacketType("UploadAlertRecord")]
    public class UploadAlertRecordHandler : IPacketHandler
    {
        private readonly ILogger<UploadAlertRecordHandler> _logger;
        private readonly GpsdataContext _context;
        private readonly IDatabase _redisDb;
        private readonly IEventExpressionEngine _eventEngine;

        public UploadAlertRecordHandler(
            ILogger<UploadAlertRecordHandler> logger,
            GpsdataContext context,
            IConnectionMultiplexer redisConnection,
            IEventExpressionEngine eventEngine)
        {
            _logger = logger ??
                throw new ArgumentNullException(nameof(logger));
            _context = context ??
                throw new ArgumentNullException(nameof(context));
            _redisDb = redisConnection?.GetDatabase() ??
                throw new ArgumentNullException(nameof(redisConnection));
            _eventEngine = eventEngine ??
                throw new ArgumentNullException(nameof(eventEngine));
        }

        public string PacketType => "UploadAlertRecord";

        public async Task<Packet> HandlePacketAsync(string deviceId, Packet packet)
        {
            var responsePacket = new Packet
            {
                Id = packet.Id,
                Type = packet.Type
            };

            try
            {
                if (packet.Data == null)
                {
                    _logger.LogWarning("Missing alert data from device {DeviceId}, packet {PacketId}. ACKing to advance device queue.",
                        deviceId, packet.Id);
                    responsePacket.Error = null;
                    responsePacket.Code = null;
                    responsePacket.Message = "OK";
                    return responsePacket;
                }

                var alertDto = packet.Data.ToObject<AlertRecordDto>();
                if (alertDto == null)
                {
                    _logger.LogWarning("Invalid alert data format from device {DeviceId}, packet {PacketId}. ACKing to advance device queue.",
                        deviceId, packet.Id);
                    responsePacket.Error = null;
                    responsePacket.Code = null;
                    responsePacket.Message = "OK";
                    return responsePacket;
                }

                //Cursor: Set device ID if not provided
                if (string.IsNullOrEmpty(alertDto.PtsId))
                    alertDto.PtsId = deviceId;

                // IMPROVEMENT: Process alert with timeout protection to prevent blocking UploadStatus
                var processingTask = ProcessAlertRecordAsync(deviceId, alertDto);
                var timeoutTask = Task.Delay(TimeSpan.FromSeconds(15));
                var completedTask = await Task.WhenAny(processingTask, timeoutTask);

                FMSResponse result;
                if (completedTask == timeoutTask)
                {
                    // Processing timed out - acknowledge receipt to device but log error
                    _logger.LogError("Timeout processing alert record for device {DeviceId}, type {DeviceType}, code {Code}",
                        deviceId, alertDto.DeviceType, alertDto.Code);

                    // Fire-and-forget: Store alert record in background for retry
                    _ = Task.Run(async () =>
                    {
                        try
                        {
                            await StoreFailedAlertForRetryAsync(deviceId, alertDto);
                        }
                        catch (Exception ex)
                        {
                            _logger.LogError(ex, "Failed to store alert for retry: {DeviceId}", deviceId);
                        }
                    });

                    responsePacket.Error = null; // ACK so device advances
                    responsePacket.Message = "OK";
                    responsePacket.Code = null;
                    return responsePacket;
                }

                result = await processingTask;

                // ALWAYS return OK — never block device queue due to server-side issues
                responsePacket.Error = null;
                responsePacket.Code = null;
                responsePacket.Message = "OK";

                if (result.IsSuccess)
                {
                    _logger.LogInformation("Successfully processed alert record for device {DeviceId}, type {DeviceType}, code {Code}",
                        deviceId, alertDto.DeviceType, alertDto.Code);
                }
                else
                {
                    _logger.LogWarning("Failed to process alert record for device {DeviceId}: {Message}. ACKing to advance device queue.",
                        deviceId, result.Message);
                }

                return responsePacket;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing alert record packet for device {DeviceId}. ACKing to advance device queue.", deviceId);
                // NEVER return Error:true — it causes infinite device retry per protocol spec
                responsePacket.Error = null;
                responsePacket.Code = null;
                responsePacket.Message = "OK";
                return responsePacket;
            }
        }

        private async Task<FMSResponse> ProcessAlertRecordAsync(string deviceId, AlertRecordDto alertDto)
        {
            try
            {
                //Cursor: Validate alert data
                var validationErrors = new List<string>();

                if (string.IsNullOrEmpty(alertDto.DeviceType))
                    validationErrors.Add("Device type is required");

                if (alertDto.Code <= 0)
                    validationErrors.Add("Alert code is required and must be greater than 0");

                if (string.IsNullOrEmpty(alertDto.State))
                    validationErrors.Add("Alert state is required");

                if (validationErrors.Any())
                    return FMSResponse.ValidationFailed(validationErrors);

                //Cursor: Determine alarm type for alert record
                var alarmType = GetAlarmTypeFromAlert(alertDto);

                //Cursor: Store alert record in database (AlarmId left null since Alarm table is removed)
                var alertRecord = new PTSAlertRecord
                {
                    PtsId = alertDto.PtsId,
                    DeviceType = alertDto.DeviceType,
                    DeviceNumber = alertDto.DeviceNumber,
                    AlertCode = alertDto.Code,
                    State = alertDto.State,
                    DateTime = alertDto.DateTime,
                    ConfigurationId = alertDto.ConfigurationId,
                    AlarmId = null,
                    ProcessedAt = DateTime.UtcNow
                };

                _context.PTSAlertRecords.Add(alertRecord);
                await _context.SaveChangesAsync();

                //Cursor: Process alarm notifications based on state
                if (alertDto.State == "Started" || alertDto.State == "Detected")
                {
                    await ProcessAlarmNotificationAsync(deviceId, alertDto, alarmType);
                }

                //Cursor: Store alert in Redis for real-time monitoring
                await StoreAlertInRedisAsync(deviceId, alertDto, alarmType);

                _logger.LogInformation("Processed alert record: Device {DeviceId}, Type {DeviceType}, Code {Code}, State {State}",
                    deviceId, alertDto.DeviceType, alertDto.Code, alertDto.State);

                return FMSResponse.SuccessResponse("Alert record processed successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing alert record for device {DeviceId}", deviceId);
                return FMSResponse.FailedResponse($"Error processing alert record: {ex.Message}"); //Cursor: Use FailedResponse instead of Failed
            }
        }

        private async Task ProcessAlarmNotificationAsync(string deviceId, AlertRecordDto alertDto, string alarmType)
        {
            try
            {
                // IMPROVEMENT: Use timeout-protected lookups for device/tank context
                Ptsdevice device = null;
                Tank tank = null;

                try
                {
                    var deviceTask = _context.Ptsdevices.Include(d => d.SiteNavigation).FirstOrDefaultAsync(d => d.Ptsid == deviceId);
                    var tankTask = _context.Tanks.FirstOrDefaultAsync(t => t.PtsId == deviceId);
                    var timeoutTask = Task.Delay(TimeSpan.FromSeconds(5));

                    var completedTask = await Task.WhenAny(Task.WhenAll(deviceTask, tankTask), timeoutTask);

                    if (completedTask != timeoutTask)
                    {
                        device = await deviceTask;
                        tank = await tankTask;
                    }
                    else
                    {
                        _logger.LogWarning("Timeout loading device/tank context for alert processing - using minimal context");
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Non-critical: Failed to load device/tank context for alert");
                }

                // PTS alert context for event engine processing
                _logger.LogDebug("PTS alert context: DeviceType={DeviceType}, Code={Code}, State={State}, Site={SiteId}",
                    alertDto.DeviceType, alertDto.Code, alertDto.State, tank?.SiteId ?? device?.Site);

                // Check if we should process this alarm based on state and deduplication logic
                bool shouldProcessAlarm = await ShouldProcessAlarmAsync(deviceId, alertDto, alarmType);

                if (!shouldProcessAlarm)
                {
                    _logger.LogDebug("Skipping alarm processing for {DeviceId} {AlarmType} - duplicate or within cooldown",
                        deviceId, alarmType);
                    return;
                }

                // Only process alarm handlers for "Started" or "Detected" states
                if (alertDto.State == "Started" || alertDto.State == "Detected")
                {
                    //Cursor: Process specific alarm types via event expression engine
                    var alertSeverity = GetAlarmSeverity(alertDto);
                    var alertDescription = GetAlarmDescription(alertDto);
                    var alertAlarmMessage = GetAlarmMessage(alertDto);

                    switch (alertDto.DeviceType.ToUpper())
                    {
                        case "PUMP":
                            var pumpEvent = new PumpAlarmEvent
                            {
                                SiteId = tank?.SiteId ?? device?.Site,
                                PtsDeviceId = deviceId,
                                Severity = alertSeverity,
                                Message = alertAlarmMessage,
                                PumpNumber = alertDto.DeviceNumber,
                                AlarmCode = alertDto.Code.ToString(),
                                AlarmDescription = alertDescription,
                            };
                            await _eventEngine.ProcessAsync(pumpEvent);
                            break;
                        case "PROBE":
                            var probeEvent = new TankLevelEvent
                            {
                                SiteId = tank?.SiteId ?? device?.Site,
                                TankId = tank?.Id,
                                PtsDeviceId = deviceId,
                                Severity = alertSeverity,
                                Message = alertAlarmMessage,
                                TankName = tank?.Name ?? "",
                            };
                            probeEvent.Data["AlertCode"] = alertDto.Code;
                            probeEvent.Data["AlertDescription"] = alertDescription;
                            await _eventEngine.ProcessAsync(probeEvent);
                            break;
                        default: // PTS, PRICEBOARD, READER, etc.
                            var deviceEvent = new DeviceStatusEvent
                            {
                                SiteId = tank?.SiteId ?? device?.Site,
                                PtsDeviceId = deviceId,
                                Severity = alertSeverity,
                                Message = alertAlarmMessage,
                                DeviceName = deviceId,
                                DeviceType = alertDto.DeviceType,
                                ErrorCode = alertDto.Code.ToString(),
                                ErrorDescription = alertDescription,
                            };
                            await _eventEngine.ProcessAsync(deviceEvent);
                            break;
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing alarm notification for device {DeviceId}, alert code {Code}",
                    deviceId, alertDto.Code);
            }
        }

        private async Task<bool> ShouldProcessAlarmAsync(string deviceId, AlertRecordDto alertDto, string alarmType)
        {
            try
            {
                if (alertDto.State == "Resolved" || alertDto.State == "Stopped" || alertDto.State == "Cleared")
                {
                    return true;
                }

                var cooldownKey = $"alarm_cooldown:{deviceId}:{alarmType}:{alertDto.Code}";
                var cooldownExists = await _redisDb.KeyExistsAsync(cooldownKey);

                if (cooldownExists)
                {
                    _logger.LogDebug("Alarm {AlarmType} for device {DeviceId} is in cooldown period",
                        alarmType, deviceId);
                    return false;
                }

                await _redisDb.StringSetAsync(cooldownKey, "1", TimeSpan.FromMinutes(5));

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking alarm processing conditions for device {DeviceId}", deviceId);
                return true;
            }
        }

        private async Task StoreAlertInRedisAsync(string deviceId, AlertRecordDto alertDto, string alarmType)
        {
            try
            {
                var alertKey = $"alert:{deviceId}:{alertDto.DeviceType}:{alertDto.Code}";
                var alertData = new
                {
                    DeviceId = deviceId,
                    AlertCode = alertDto.Code,
                    DeviceType = alertDto.DeviceType,
                    DeviceNumber = alertDto.DeviceNumber,
                    State = alertDto.State,
                    DateTime = alertDto.DateTime,
                    AlarmType = alarmType,
                    ProcessedAt = DateTime.UtcNow
                };

                var alertJson = JsonSerializer.Serialize(alertData);
                await _redisDb.StringSetAsync(alertKey, alertJson, TimeSpan.FromHours(24));

                var deviceAlertsKey = $"device:{deviceId}:alerts";
                await _redisDb.ListLeftPushAsync(deviceAlertsKey, alertJson);
                await _redisDb.ListTrimAsync(deviceAlertsKey, 0, 99);
                await _redisDb.KeyExpireAsync(deviceAlertsKey, TimeSpan.FromDays(7));

                _logger.LogDebug("Stored alert in Redis: {AlertKey}", alertKey);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error storing alert in Redis for device {DeviceId}", deviceId);
            }
        }

        private string GetAlarmTypeFromAlert(AlertRecordDto alertDto)
        {
            var deviceType = alertDto.DeviceType.ToUpper();
            var code = alertDto.Code;

            return deviceType
            switch
            {
                "PTS" => code
                switch
                {
                    1 => "PTSLowBattery",
                    2 => "PTSHighTemperature",
                    3 => "PTSPowerDown",
                    4 => "PTSRestart",
                    _ => $"PTSUnknownAlert{code}"
                },
                "PUMP" => code
                switch
                {
                    1 => "PumpOffline",
                    20 => "PumpOverfilling",
                    21 => "PumpOverfillingNozzle1",
                    22 => "PumpOverfillingNozzle2",
                    23 => "PumpOverfillingNozzle3",
                    24 => "PumpOverfillingNozzle4",
                    25 => "PumpOverfillingNozzle5",
                    26 => "PumpOverfillingNozzle6",
                    30 => "PumpOfflineMode",
                    31 => "PumpOfflineModeNozzle1",
                    32 => "PumpOfflineModeNozzle2",
                    33 => "PumpOfflineModeNozzle3",
                    34 => "PumpOfflineModeNozzle4",
                    35 => "PumpOfflineModeNozzle5",
                    36 => "PumpOfflineModeNozzle6",
                    _ => $"PumpUnknownAlert{code}"
                },
                "PROBE" => code
                switch
                {
                    1 => "ProbeOffline",
                    2 => "ProbeError",
                    3 => "TankCriticalHighLevel",
                    4 => "TankHighLevel",
                    5 => "TankLowLevel",
                    6 => "TankCriticalLowLevel",
                    7 => "TankHighWaterLevel",
                    8 => "TankLeakage",
                    _ => $"ProbeUnknownAlert{code}"
                },
                "PRICEBOARD" => code
                switch
                {
                    1 => "PriceBoardOffline",
                    2 => "PriceBoardError",
                    _ => $"PriceBoardUnknownAlert{code}"
                },
                "READER" => code
                switch
                {
                    1 => "ReaderOffline",
                    2 => "ReaderError",
                    _ => $"ReaderUnknownAlert{code}"
                },
                _ => $"{deviceType}UnknownAlert{code}"
            };
        }

        private string GetAlarmDescription(AlertRecordDto alertDto)
        {
            var deviceType = alertDto.DeviceType.ToUpper();
            var code = alertDto.Code;

            return deviceType
            switch
            {
                "PTS" => code
                switch
                {
                    1 => "Low battery voltage detected",
                    2 => "High CPU temperature detected",
                    3 => "Power down detected",
                    4 => "Restart detected",
                    _ => $"Unknown PTS alert code {code}"
                },
                "PUMP" => code
                switch
                {
                    1 => "Pump offline state detected",
                    20 => "Overfilling detected",
                    >=
                    21 and <= 26 => $"Overfilling detected for nozzle {code - 20}",
                    30 => "Filling in offline mode detected",
                    >=
                    31 and <= 36 => $"Filling in offline mode detected for nozzle {code - 30}",
                    _ => $"Unknown pump alert code {code}"
                },
                "PROBE" => code
                switch
                {
                    1 => "Probe offline state detected",
                    2 => "Probe error detected",
                    3 => "Critical high product level detected",
                    4 => "High product level detected",
                    5 => "Low product level detected",
                    6 => "Critical low product level detected",
                    7 => "High water level detected",
                    8 => "Tank leakage detected",
                    _ => $"Unknown probe alert code {code}"
                },
                "PRICEBOARD" => code
                switch
                {
                    1 => "Price board offline state detected",
                    2 => "Price board error detected",
                    _ => $"Unknown price board alert code {code}"
                },
                "READER" => code
                switch
                {
                    1 => "Reader offline state detected",
                    2 => "Reader error detected",
                    _ => $"Unknown reader alert code {code}"
                },
                _ => $"Unknown alert: {deviceType} code {code}"
            };
        }

        private string GetAlarmSeverity(AlertRecordDto alertDto)
        {
            var deviceType = alertDto.DeviceType.ToUpper();
            var code = alertDto.Code;

            return deviceType
            switch
            {
                "PTS" => code
                switch
                {
                    1 => "Medium", // Low battery
                    2 => "High", // High temperature
                    3 => "High", // Power down
                    4 => "Low", // Restart
                    _ => "Medium"
                },
                "PUMP" => code
                switch
                {
                    1 => "High", // Offline
                    >=
                    20 and <= 26 => "Critical", // Overfilling
                    >=
                    30 and <= 36 => "High", // Offline mode
                    _ => "Medium"
                },
                "PROBE" => code
                switch
                {
                    1 => "High", // Offline
                    2 => "High", // Error
                    3 => "Critical", // Critical high level
                    4 => "High", // High level
                    5 => "High", // Low level
                    6 => "Critical", // Critical low level
                    7 => "High", // High water
                    8 => "Critical", // Leakage
                    _ => "Medium"
                },
                _ => "Medium"
            };
        }

        private string GetAlarmPriority(AlertRecordDto alertDto)
        {
            var severity = GetAlarmSeverity(alertDto);
            return severity
            switch
            {
                "Critical" => "Critical",
                "High" => "High",
                "Medium" => "Medium",
                "Low" => "Low",
                _ => "Medium"
            };
        }

        private string GetAlarmMessage(AlertRecordDto alertDto)
        {
            var description = GetAlarmDescription(alertDto);
            var deviceInfo = alertDto.DeviceNumber > 0 ? $" (Device #{alertDto.DeviceNumber})" : "";

            return $"{description}{deviceInfo} - State: {alertDto.State}";
        }

        private async Task StoreFailedAlertForRetryAsync(string deviceId, AlertRecordDto alertDto)
        {
            try
            {
                var retryKey = $"failed_alert:{deviceId}:{DateTime.UtcNow.Ticks}";
                var alertData = new
                {
                    DeviceId = deviceId,
                    AlertDto = alertDto,
                    FailedAt = DateTime.UtcNow,
                    RetryCount = 0
                };

                var alertJson = JsonSerializer.Serialize(alertData);
                await _redisDb.StringSetAsync(retryKey, alertJson, TimeSpan.FromHours(24));

                // Add to retry queue
                var retryQueueKey = "failed_alerts:retry_queue";
                await _redisDb.ListLeftPushAsync(retryQueueKey, retryKey);
                await _redisDb.KeyExpireAsync(retryQueueKey, TimeSpan.FromDays(7));

                _logger.LogInformation("Stored failed alert for retry: Device {DeviceId}, Type {DeviceType}, Code {Code}",
                    deviceId, alertDto.DeviceType, alertDto.Code);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to store alert for retry in Redis for device {DeviceId}", deviceId);
            }
        }
    }

    //Cursor: DTO for alert record data
    public class AlertRecordDto
    {
        public string PtsId { get; set; } = null!;
        public DateTime DateTime { get; set; }
        public string DeviceType { get; set; } = null!;
        public int DeviceNumber { get; set; }
        public string State { get; set; } = null!;
        public int Code { get; set; }
        public string ConfigurationId { get; set; } = null!;
    }
}