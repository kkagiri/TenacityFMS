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
using FMS.Application.Handlers.Interface;
using FMS.Application.Services; //Cursor - Add FMSResponse import
using FMS.Application.Features.Notification.DTOs;
using FMS.Application.Features.Notification.Services.Integration;
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
        private readonly IAlarmHandlerService _alarmHandlerService;
        private readonly AlarmHandlerActiveAlarmIntegration _activeAlarmIntegration;
        private readonly IDatabase _redisDb;

        public UploadAlertRecordHandler(
            ILogger<UploadAlertRecordHandler> logger,
            GpsdataContext context,
            IAlarmHandlerService alarmHandlerService,
            AlarmHandlerActiveAlarmIntegration activeAlarmIntegration,
            IConnectionMultiplexer redisConnection)
        {
            _logger = logger ??
                throw new ArgumentNullException(nameof(logger));
            _context = context ??
                throw new ArgumentNullException(nameof(context));
            _alarmHandlerService = alarmHandlerService ??
                throw new ArgumentNullException(nameof(alarmHandlerService));
            _activeAlarmIntegration = activeAlarmIntegration ??
                throw new ArgumentNullException(nameof(activeAlarmIntegration));
            _redisDb = redisConnection?.GetDatabase() ??
                throw new ArgumentNullException(nameof(redisConnection));
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
                    responsePacket.Error = true;
                    responsePacket.Code = 400;
                    responsePacket.Message = "Missing alert data";
                    return responsePacket;
                }

                var alertDto = packet.Data.ToObject<AlertRecordDto>();
                if (alertDto == null)
                {
                    responsePacket.Error = true;
                    responsePacket.Code = 400;
                    responsePacket.Message = "Invalid alert data format";
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

                    responsePacket.Error = false; // Still acknowledge to prevent device retry storm
                    responsePacket.Message = "Alert queued for processing";
                    responsePacket.Code = 202; // Accepted
                    return responsePacket;
                }

                result = await processingTask;

                responsePacket.Error = !result.IsSuccess;
                responsePacket.Message = result.Message;
                responsePacket.Code = result.IsSuccess ? 200 : 500;

                if (result.IsSuccess)
                {
                    _logger.LogInformation("Successfully processed alert record for device {DeviceId}, type {DeviceType}, code {Code}",
                        deviceId, alertDto.DeviceType, alertDto.Code);
                }
                else
                {
                    _logger.LogWarning("Failed to process alert record for device {DeviceId}: {Message}",
                        deviceId, result.Message);
                }

                return responsePacket;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing alert record packet for device {DeviceId}", deviceId);
                responsePacket.Error = true;
                responsePacket.Code = 500;
                responsePacket.Message = "Error processing alert record packet";
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

                //Cursor: Find or create alarm record
                var alarmType = GetAlarmTypeFromAlert(alertDto);
                var alarm = await _context.Alarms.FirstOrDefaultAsync(a => a.Name == alarmType);

                if (alarm == null)
                {
                    //Cursor: Create new alarm type
                    alarm = new Alarm
                    {
                        Name = alarmType,
                        Description = GetAlarmDescription(alertDto)
                        // Category = alertDto.DeviceType, //Cursor: Property doesn't exist on Alarm entity
                        // Severity = GetAlarmSeverity(alertDto), //Cursor: Property doesn't exist on Alarm entity
                        // IsActive = true, //Cursor: Property doesn't exist on Alarm entity
                        // CreatedAt = DateTime.UtcNow //Cursor: Property doesn't exist on Alarm entity
                    };

                    _context.Alarms.Add(alarm);
                    await _context.SaveChangesAsync();

                    _logger.LogInformation("Created new alarm type: {AlarmType}", alarmType);
                }

                //Cursor: Store alert record in database
                var alertRecord = new PTSAlertRecord
                {
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

                _context.PTSAlertRecords.Add(alertRecord);
                await _context.SaveChangesAsync();

                //Cursor: Process alarm notifications based on state
                if (alertDto.State == "Started" || alertDto.State == "Detected")
                {
                    await ProcessAlarmNotificationAsync(deviceId, alertDto, alarm);
                }

                //Cursor: Store alert in Redis for real-time monitoring
                await StoreAlertInRedisAsync(deviceId, alertDto, alarm);

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

        private async Task ProcessAlarmNotificationAsync(string deviceId, AlertRecordDto alertDto, Alarm alarm)
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

                var alarmRequest = new CreateAlarmNotificationRequest
                {
                    AlarmType = alarm.Name,
                    AlarmId = alarm.Id,
                    Category = alertDto.DeviceType,
                    Message = GetAlarmMessage(alertDto),
                    Priority = GetAlarmPriority(alertDto),
                    TriggeredBy = "System",
                    SiteId = tank?.SiteId ?? device?.Site, //Cursor on changes to code - Get SiteId from tank or device
                    PtsDeviceId = device?.Ptsid, //Cursor on changes to code - Use PtsDeviceId
                    TankId = tank?.Id,
                    Data = new
                    {
                        AlertCode = alertDto.Code,
                        DeviceType = alertDto.DeviceType,
                        DeviceNumber = alertDto.DeviceNumber,
                        State = alertDto.State,
                        ConfigurationId = alertDto.ConfigurationId,
                        PtsId = alertDto.PtsId
                    }
                };

                // Check if we should process this alarm based on state and deduplication logic
                bool shouldProcessAlarm = await ShouldProcessAlarmAsync(deviceId, alertDto, alarm);

                if (!shouldProcessAlarm)
                {
                    _logger.LogDebug("Skipping alarm processing for {DeviceId} {AlarmType} - duplicate or within cooldown",
                        deviceId, alarm.Name);
                    return;
                }

                // Handle ActiveAlarm creation/update with deduplication
                await HandleActiveAlarmAsync(deviceId, alertDto, alarm, device, tank);

                // Only process alarm handlers for "Started" or "Detected" states
                if (alertDto.State == "Started" || alertDto.State == "Detected")
                {
                    //Cursor: Process specific alarm types
                    switch (alertDto.DeviceType.ToUpper())
                    {
                        case "PUMP":
                            await _alarmHandlerService.ProcessPumpAlarmAsync(alarmRequest);
                            break;
                        case "PROBE":
                            await _alarmHandlerService.ProcessTankAlarmAsync(alarmRequest);
                            break;
                        case "PTS":
                            await _alarmHandlerService.ProcessDeviceAlarmAsync(alarmRequest);
                            break;
                        default:
                            await _alarmHandlerService.ProcessGenericAlarmAsync(alarmRequest);
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

        private async Task<bool> ShouldProcessAlarmAsync(string deviceId, AlertRecordDto alertDto, Alarm alarm)
        {
            try
            {
                // Always process "Resolved", "Stopped", or "Cleared" states to close active alarms
                if (alertDto.State == "Resolved" || alertDto.State == "Stopped" || alertDto.State == "Cleared")
                {
                    return true;
                }

                // For "Started" or "Detected" states, check for recent duplicates using Redis cooldown
                var cooldownKey = $"alarm_cooldown:{deviceId}:{alarm.Name}:{alertDto.Code}";
                var cooldownExists = await _redisDb.KeyExistsAsync(cooldownKey);

                if (cooldownExists)
                {
                    _logger.LogDebug("Alarm {AlarmType} for device {DeviceId} is in cooldown period",
                        alarm.Name, deviceId);
                    return false;
                }

                // Set cooldown for 5 minutes to prevent duplicate processing
                await _redisDb.StringSetAsync(cooldownKey, "1", TimeSpan.FromMinutes(5));

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking alarm processing conditions for device {DeviceId}", deviceId);
                // Default to processing the alarm if check fails
                return true;
            }
        }

        private async Task HandleActiveAlarmAsync(string deviceId, AlertRecordDto alertDto, Alarm alarm, Ptsdevice device, Tank tank)
        {
            try
            {
                // Create unique alarm identifier for deduplication
                var alarmIdentifier = CreateAlarmIdentifier(deviceId, alertDto, alarm);

                // Check if there's an existing active alarm for this identifier
                var existingActiveAlarm = await FindExistingActiveAlarmAsync(alarmIdentifier, deviceId, alarm.Id, tank?.Id);

                if (alertDto.State == "Started" || alertDto.State == "Detected")
                {
                    if (existingActiveAlarm != null && existingActiveAlarm.State != "Resolved")
                    {
                        // Update existing alarm timestamp and data
                        await UpdateExistingActiveAlarmAsync(existingActiveAlarm, alertDto);
                        _logger.LogDebug("Updated existing ActiveAlarm {ActiveAlarmId} for {AlarmType}",
                            existingActiveAlarm.Id, alarm.Name);
                    }
                    else
                    {
                        // Create new ActiveAlarm record
                        await CreateNewActiveAlarmAsync(deviceId, alertDto, alarm, device, tank);
                    }
                }
                else if (alertDto.State == "Resolved" || alertDto.State == "Stopped" || alertDto.State == "Cleared")
                {
                    if (existingActiveAlarm != null && existingActiveAlarm.State != "Resolved")
                    {
                        // Resolve the existing alarm
                        await ResolveActiveAlarmAsync(existingActiveAlarm, alertDto);
                        _logger.LogInformation("Resolved ActiveAlarm {ActiveAlarmId} for {AlarmType}",
                            existingActiveAlarm.Id, alarm.Name);
                    }
                }
                else if (alertDto.State == "Finished")
                {
                    if (existingActiveAlarm != null && existingActiveAlarm.State != "Resolved")
                    {
                        // Resolve the existing alarm
                        await ResolveActiveAlarmAsync(existingActiveAlarm, alertDto);
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error handling ActiveAlarm for device {DeviceId}, alarm {AlarmType}",
                    deviceId, alarm.Name);
            }
        }

        private string CreateAlarmIdentifier(string deviceId, AlertRecordDto alertDto, Alarm alarm)
        {
            // Create unique identifier based on device, alarm type, and specific alert code
            return $"{deviceId}:{alarm.Name}:{alertDto.Code}:{alertDto.DeviceNumber}";
        }

        private async Task<Domain.Entities.ActiveAlarm> FindExistingActiveAlarmAsync(string alarmIdentifier, string deviceId, int alarmId, int? tankId)
        {
            // Look for existing active alarm using multiple criteria
            var query = _context.ActiveAlarms
                .Where(aa => aa.AlarmHandlerId == alarmId && aa.PtsDeviceId == deviceId && aa.State != "Resolved");

            if (tankId.HasValue)
            {
                query = query.Where(aa => aa.TankId == tankId);
            }

            // Also check by alarm identifier stored in additional data
            var existingAlarm = await query
                .Where(aa => aa.AdditionalData != null && aa.AdditionalData.Contains(alarmIdentifier))
                .OrderByDescending(aa => aa.TriggeredAt)
                .FirstOrDefaultAsync();

            return existingAlarm;
        }

        private async Task UpdateExistingActiveAlarmAsync(Domain.Entities.ActiveAlarm existingAlarm, AlertRecordDto alertDto)
        {
            // Update timestamp to show latest occurrence
            existingAlarm.TriggeredAt = DateTime.UtcNow;

            // Update severity and priority based on latest alert
            var severity = GetAlarmSeverity(alertDto);
            var priority = GetAlarmPriority(alertDto);

            existingAlarm.Severity = severity
            switch
            {
                "Critical" => FMS.Domain.Entities.enums.DiscrepancySeverity.Critical,
                "High" => FMS.Domain.Entities.enums.DiscrepancySeverity.High,
                "Medium" => FMS.Domain.Entities.enums.DiscrepancySeverity.Medium,
                "Low" => FMS.Domain.Entities.enums.DiscrepancySeverity.Low,
                _ => FMS.Domain.Entities.enums.DiscrepancySeverity.Medium
            };

            existingAlarm.Priority = priority;
            existingAlarm.Message = GetAlarmMessage(alertDto);

            // Check if we should escalate based on repeated occurrences
            var timeSinceTriggered = DateTime.UtcNow - existingAlarm.TriggeredAt;
            if (timeSinceTriggered.TotalMinutes > 15 && existingAlarm.EscalationLevel < 3)
            {
                existingAlarm.EscalationLevel++;
                existingAlarm.LastEscalatedAt = DateTime.UtcNow;
            }

            // Update additional data with latest alert information and occurrence tracking
            var existingData = string.IsNullOrEmpty(existingAlarm.AdditionalData) ?
                new { OccurrenceCount = 0 } :
                JsonSerializer.Deserialize<dynamic>(existingAlarm.AdditionalData);

            var updatedData = new
            {
                LatestAlert = new
                {
                    alertDto.Code,
                    alertDto.DeviceType,
                    alertDto.DeviceNumber,
                    alertDto.State,
                    alertDto.ConfigurationId,
                    ProcessedAt = DateTime.UtcNow,
                    Severity = severity,
                    Priority = priority
                },
                OccurrenceCount = (existingData?.OccurrenceCount ?? 0) + 1,
                LastUpdate = DateTime.UtcNow,
                EscalationLevel = existingAlarm.EscalationLevel,
                TotalMinutesActive = (int)timeSinceTriggered.TotalMinutes
            };

            existingAlarm.AdditionalData = JsonSerializer.Serialize(updatedData);

            await _context.SaveChangesAsync();
        }
        private async Task CreateNewActiveAlarmAsync(string deviceId, AlertRecordDto alertDto, Alarm alarm, Ptsdevice device, Tank tank)
        {
            var activeAlarmRequest = new CreateAlarmNotificationRequest
            {
                AlarmType = alarm.Name,
                AlarmId = alarm.Id,
                Category = alertDto.DeviceType,
                Message = GetAlarmMessage(alertDto),
                Priority = GetAlarmPriority(alertDto),
                TriggeredBy = "PTS",
                SiteId = tank?.SiteId ?? device?.Site ?? 1,
                PtsDeviceId = device?.Ptsid,
                TankId = tank?.Id,
                Data = new
                {
                    AlarmIdentifier = CreateAlarmIdentifier(deviceId, alertDto, alarm),
                    AlertCode = alertDto.Code,
                    alertDto.DeviceType,
                    alertDto.DeviceNumber,
                    alertDto.State,
                    alertDto.ConfigurationId,
                    alertDto.PtsId,
                    ProcessedAt = DateTime.UtcNow
                }
            };

            var activeAlarm = await _activeAlarmIntegration.CreateActiveAlarmFromAlarmHandler(
                activeAlarmRequest,
                alarm.Id,
                CancellationToken.None);

            if (activeAlarm != null)
            {
                _logger.LogInformation("Created new ActiveAlarm {ActiveAlarmId} for PTS alert {DeviceType} code {Code}",
                    activeAlarm.Id, alertDto.DeviceType, alertDto.Code);
            }
            else
            {
                _logger.LogWarning("Failed to create ActiveAlarm for PTS alert {DeviceType} code {Code}",
                    alertDto.DeviceType, alertDto.Code);
            }
        }

        private async Task ResolveActiveAlarmAsync(Domain.Entities.ActiveAlarm existingAlarm, AlertRecordDto alertDto)
        {
            existingAlarm.State = "Resolved";
            existingAlarm.ResolvedAt = DateTime.UtcNow;
            existingAlarm.ResolvedBy = "PTS_AutoResolved";
            existingAlarm.ResolutionNotes = $"Automatically resolved by PTS alert state: {alertDto.State}";

            // Update additional data with resolution information
            var resolutionData = new
            {
                ResolvedByAlert = new
                {
                    alertDto.Code,
                    alertDto.DeviceType,
                    alertDto.State,
                    ProcessedAt = DateTime.UtcNow
                },
                AutoResolved = true
            };

            existingAlarm.AdditionalData = JsonSerializer.Serialize(resolutionData);

            await _context.SaveChangesAsync();
        }

        private async Task StoreAlertInRedisAsync(string deviceId, AlertRecordDto alertDto, Alarm alarm)
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
                    AlarmType = alarm.Name,
                    // Severity = alarm.Severity, //Cursor: Property doesn't exist on Alarm entity
                    ProcessedAt = DateTime.UtcNow
                };

                var alertJson = JsonSerializer.Serialize(alertData);
                await _redisDb.StringSetAsync(alertKey, alertJson, TimeSpan.FromHours(24));

                //Cursor: Also store in device alerts list
                var deviceAlertsKey = $"device:{deviceId}:alerts";
                await _redisDb.ListLeftPushAsync(deviceAlertsKey, alertJson);
                await _redisDb.ListTrimAsync(deviceAlertsKey, 0, 99); // Keep last 100 alerts
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