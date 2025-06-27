using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Handlers.Interface;
using FMS.Application.ModelsDTOs.ATG;
using FMS.Application.Services; //Cursor - Add FMSResponse import
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

namespace FMS.Application.Handlers {
    [PacketType ("UploadAlertRecord")]
    public class UploadAlertRecordHandler : IPacketHandler {
        private readonly ILogger<UploadAlertRecordHandler> _logger;
        private readonly GpsdataContext _context;
        private readonly IAlarmHandlerService _alarmHandlerService;
        private readonly IDatabase _redisDb;

        public UploadAlertRecordHandler (
            ILogger<UploadAlertRecordHandler> logger,
            GpsdataContext context,
            IAlarmHandlerService alarmHandlerService,
            IConnectionMultiplexer redisConnection) {
            _logger = logger ??
                throw new ArgumentNullException (nameof (logger));
            _context = context ??
                throw new ArgumentNullException (nameof (context));
            _alarmHandlerService = alarmHandlerService ??
                throw new ArgumentNullException (nameof (alarmHandlerService));
            _redisDb = redisConnection?.GetDatabase () ??
                throw new ArgumentNullException (nameof (redisConnection));
        }

        public string PacketType => "UploadAlertRecord";

        public async Task<Packet> HandlePacketAsync (string deviceId, Packet packet) {
            var responsePacket = new Packet {
                Id = packet.Id,
                Type = packet.Type
            };

            try {
                if (packet.Data == null) {
                    responsePacket.Error = true;
                    responsePacket.Code = 400;
                    responsePacket.Message = "Missing alert data";
                    return responsePacket;
                }

                var alertDto = packet.Data.ToObject<AlertRecordDto> ();
                if (alertDto == null) {
                    responsePacket.Error = true;
                    responsePacket.Code = 400;
                    responsePacket.Message = "Invalid alert data format";
                    return responsePacket;
                }

                //Cursor: Set device ID if not provided
                if (string.IsNullOrEmpty (alertDto.PtsId))
                    alertDto.PtsId = deviceId;

                //Cursor: Process the alert record
                var result = await ProcessAlertRecordAsync (deviceId, alertDto);

                responsePacket.Error = !result.IsSuccess;
                responsePacket.Message = result.Message;
                responsePacket.Code = result.IsSuccess ? 200 : 500;

                if (result.IsSuccess) {
                    _logger.LogInformation ("Successfully processed alert record for device {DeviceId}, type {DeviceType}, code {Code}",
                        deviceId, alertDto.DeviceType, alertDto.Code);
                } else {
                    _logger.LogWarning ("Failed to process alert record for device {DeviceId}: {Message}",
                        deviceId, result.Message);
                }

                return responsePacket;
            } catch (Exception ex) {
                _logger.LogError (ex, "Error processing alert record packet for device {DeviceId}", deviceId);
                responsePacket.Error = true;
                responsePacket.Code = 500;
                responsePacket.Message = "Error processing alert record packet";
                return responsePacket;
            }
        }

        private async Task<FMSResponse> ProcessAlertRecordAsync (string deviceId, AlertRecordDto alertDto) {
            try {
                //Cursor: Validate alert data
                var validationErrors = new List<string> ();

                if (string.IsNullOrEmpty (alertDto.DeviceType))
                    validationErrors.Add ("Device type is required");

                if (alertDto.Code <= 0)
                    validationErrors.Add ("Alert code is required and must be greater than 0");

                if (string.IsNullOrEmpty (alertDto.State))
                    validationErrors.Add ("Alert state is required");

                if (validationErrors.Any ())
                    return FMSResponse.ValidationFailed (validationErrors);

                //Cursor: Find or create alarm record
                var alarmType = GetAlarmTypeFromAlert (alertDto);
                var alarm = await _context.Alarms.FirstOrDefaultAsync (a => a.Name == alarmType);

                if (alarm == null) {
                    //Cursor: Create new alarm type
                    alarm = new Alarm {
                    Name = alarmType,
                    Description = GetAlarmDescription (alertDto)
                    // Category = alertDto.DeviceType, //Cursor: Property doesn't exist on Alarm entity
                    // Severity = GetAlarmSeverity(alertDto), //Cursor: Property doesn't exist on Alarm entity
                    // IsActive = true, //Cursor: Property doesn't exist on Alarm entity
                    // CreatedAt = DateTime.UtcNow //Cursor: Property doesn't exist on Alarm entity
                    };

                    _context.Alarms.Add (alarm);
                    await _context.SaveChangesAsync ();

                    _logger.LogInformation ("Created new alarm type: {AlarmType}", alarmType);
                }

                //Cursor: Store alert record in database
                var alertRecord = new AlertRecord {
                    PtsId = alertDto.PtsId,
                    DeviceType = alertDto.DeviceType,
                    DeviceNumber = alertDto.DeviceNumber,
                    AlertCode = alertDto.Code,
                    State = alertDto.State,
                    DateTime = alertDto.DateTime,
                    ConfigurationId = alertDto.ConfigurationId,
                    AlarmId = alarm.Id,
                    ProcessedAt = DateTime.UtcNow
                };

                _context.AlertRecords.Add (alertRecord);
                await _context.SaveChangesAsync ();

                //Cursor: Process alarm notifications based on state
                if (alertDto.State == "Started" || alertDto.State == "Detected") {
                    await ProcessAlarmNotificationAsync (deviceId, alertDto, alarm);
                }

                //Cursor: Store alert in Redis for real-time monitoring
                await StoreAlertInRedisAsync (deviceId, alertDto, alarm);

                _logger.LogInformation ("Processed alert record: Device {DeviceId}, Type {DeviceType}, Code {Code}, State {State}",
                    deviceId, alertDto.DeviceType, alertDto.Code, alertDto.State);

                return FMSResponse.SuccessResponse ("Alert record processed successfully");
            } catch (Exception ex) {
                _logger.LogError (ex, "Error processing alert record for device {DeviceId}", deviceId);
                return FMSResponse.FailedResponse ($"Error processing alert record: {ex.Message}"); //Cursor: Use FailedResponse instead of Failed
            }
        }

        private async Task ProcessAlarmNotificationAsync (string deviceId, AlertRecordDto alertDto, Alarm alarm) {
            try {
                //Cursor: Find associated device, tank, or pump - fix Device property
                var device = await _context.Ptsdevices.Include (d => d.SiteNavigation).FirstOrDefaultAsync (d => d.Ptsid == deviceId); //Cursor on changes to code - Use Ptsdevices
                var tank = await _context.Tanks.FirstOrDefaultAsync (t => t.PtsId == deviceId);

                var alarmRequest = new CreateAlarmNotificationRequest {
                    AlarmType = alarm.Name,
                    AlarmId = alarm.Id,
                    Category = alertDto.DeviceType,
                    Message = GetAlarmMessage (alertDto),
                    Priority = GetAlarmPriority (alertDto),
                    TriggeredBy = "System",
                    SiteId = tank?.SiteId ?? device?.Site, //Cursor on changes to code - Get SiteId from tank or device
                    PtsDeviceId = device?.Ptsid, //Cursor on changes to code - Use PtsDeviceId
                    TankId = tank?.Id,
                    Data = new {
                    AlertCode = alertDto.Code,
                    DeviceType = alertDto.DeviceType,
                    DeviceNumber = alertDto.DeviceNumber,
                    State = alertDto.State,
                    ConfigurationId = alertDto.ConfigurationId,
                    PtsId = alertDto.PtsId
                    }
                };

                //Cursor: Process specific alarm types
                switch (alertDto.DeviceType.ToUpper ()) {
                    case "PUMP":
                        await _alarmHandlerService.ProcessPumpAlarmAsync (alarmRequest);
                        break;
                    case "PROBE":
                        await _alarmHandlerService.ProcessTankAlarmAsync (alarmRequest);
                        break;
                    case "PTS":
                        await _alarmHandlerService.ProcessDeviceAlarmAsync (alarmRequest);
                        break;
                    default:
                        await _alarmHandlerService.ProcessGenericAlarmAsync (alarmRequest);
                        break;
                }
            } catch (Exception ex) {
                _logger.LogError (ex, "Error processing alarm notification for device {DeviceId}, alert code {Code}",
                    deviceId, alertDto.Code);
            }
        }

        private async Task StoreAlertInRedisAsync (string deviceId, AlertRecordDto alertDto, Alarm alarm) {
            try {
                var alertKey = $"alert:{deviceId}:{alertDto.DeviceType}:{alertDto.Code}";
                var alertData = new {
                    DeviceId = deviceId,
                    AlertCode = alertDto.Code,
                    DeviceType = alertDto.DeviceType,
                    DeviceNumber = alertDto.DeviceNumber,
                    State = alertDto.State,
                    DateTime = alertDto.DateTime,
                    AlarmType = alarm.Name,
                    // Severity = alarm.Severity, //Cursor: Property doesn't exist on Alarm entity
                    ProcessedAt = DateTime.UtcNow
                };

                var alertJson = JsonSerializer.Serialize (alertData);
                await _redisDb.StringSetAsync (alertKey, alertJson, TimeSpan.FromHours (24));

                //Cursor: Also store in device alerts list
                var deviceAlertsKey = $"device:{deviceId}:alerts";
                await _redisDb.ListLeftPushAsync (deviceAlertsKey, alertJson);
                await _redisDb.ListTrimAsync (deviceAlertsKey, 0, 99); // Keep last 100 alerts
                await _redisDb.KeyExpireAsync (deviceAlertsKey, TimeSpan.FromDays (7));

                _logger.LogDebug ("Stored alert in Redis: {AlertKey}", alertKey);
            } catch (Exception ex) {
                _logger.LogError (ex, "Error storing alert in Redis for device {DeviceId}", deviceId);
            }
        }

        private string GetAlarmTypeFromAlert (AlertRecordDto alertDto) {
            var deviceType = alertDto.DeviceType.ToUpper ();
            var code = alertDto.Code;

            return deviceType
            switch {
                "PTS" => code
                switch {
                    1 => "PTSLowBattery",
                    2 => "PTSHighTemperature",
                    3 => "PTSPowerDown",
                    4 => "PTSRestart",
                    _ => $"PTSUnknownAlert{code}"
                    },
                    "PUMP" => code
                    switch {
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
                    switch {
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
                    switch {
                    1 => "PriceBoardOffline",
                    2 => "PriceBoardError",
                    _ => $"PriceBoardUnknownAlert{code}"
                    },
                    "READER" => code
                    switch {
                    1 => "ReaderOffline",
                    2 => "ReaderError",
                    _ => $"ReaderUnknownAlert{code}"
                    },
                    _ => $"{deviceType}UnknownAlert{code}"
            };
        }

        private string GetAlarmDescription (AlertRecordDto alertDto) {
            var deviceType = alertDto.DeviceType.ToUpper ();
            var code = alertDto.Code;

            return deviceType
            switch {
                "PTS" => code
                switch {
                    1 => "Low battery voltage detected",
                    2 => "High CPU temperature detected",
                    3 => "Power down detected",
                    4 => "Restart detected",
                    _ => $"Unknown PTS alert code {code}"
                    },
                    "PUMP" => code
                    switch {
                    1 => "Pump offline state detected",
                    20 => "Overfilling detected", >=
                    21 and <= 26 => $"Overfilling detected for nozzle {code - 20}",
                    30 => "Filling in offline mode detected", >=
                    31 and <= 36 => $"Filling in offline mode detected for nozzle {code - 30}",
                    _ => $"Unknown pump alert code {code}"
                    },
                    "PROBE" => code
                    switch {
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
                    switch {
                    1 => "Price board offline state detected",
                    2 => "Price board error detected",
                    _ => $"Unknown price board alert code {code}"
                    },
                    "READER" => code
                    switch {
                    1 => "Reader offline state detected",
                    2 => "Reader error detected",
                    _ => $"Unknown reader alert code {code}"
                    },
                    _ => $"Unknown alert: {deviceType} code {code}"
            };
        }

        private string GetAlarmSeverity (AlertRecordDto alertDto) {
            var deviceType = alertDto.DeviceType.ToUpper ();
            var code = alertDto.Code;

            return deviceType
            switch {
                "PTS" => code
                switch {
                    1 => "Medium", // Low battery
                    2 => "High", // High temperature
                    3 => "High", // Power down
                    4 => "Low", // Restart
                    _ => "Medium"
                    },
                    "PUMP" => code
                    switch {
                    1 => "High", // Offline
                    >=
                    20 and <= 26 => "Critical", // Overfilling
                    >=
                    30 and <= 36 => "High", // Offline mode
                    _ => "Medium"
                    },
                    "PROBE" => code
                    switch {
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

        private string GetAlarmPriority (AlertRecordDto alertDto) {
            var severity = GetAlarmSeverity (alertDto);
            return severity
            switch {
                "Critical" => "Critical",
                "High" => "High",
                "Medium" => "Medium",
                "Low" => "Low",
                _ => "Medium"
            };
        }

        private string GetAlarmMessage (AlertRecordDto alertDto) {
            var description = GetAlarmDescription (alertDto);
            var deviceInfo = alertDto.DeviceNumber > 0 ? $" (Device #{alertDto.DeviceNumber})" : "";

            return $"{description}{deviceInfo} - State: {alertDto.State}";
        }
    }

    //Cursor: DTO for alert record data
    public class AlertRecordDto {
        public string PtsId { get; set; }
        public DateTime DateTime { get; set; }
        public string DeviceType { get; set; }
        public int DeviceNumber { get; set; }
        public string State { get; set; }
        public int Code { get; set; }
        public string ConfigurationId { get; set; }
    }
}