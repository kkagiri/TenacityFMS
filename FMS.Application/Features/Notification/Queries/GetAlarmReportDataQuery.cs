/**
 * File: GetAlarmReportDataQuery.cs
 * Purpose: Retrieves report-friendly alarm records from persisted PTS alert uploads with optional filters.
 * Dependencies: MediatR, EF Core, FMSResponse, AlarmReportRecordDto
 * Last Modified: 2026-03-24
 */
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.Notification.DTOs.Notification;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.Notification.Queries
{
    public record GetAlarmReportDataQuery : IRequest<FMSResponse<List<AlarmReportRecordDto>>>
    {
        public DateTime? StartDate { get; init; }
        public DateTime? EndDate { get; init; }
        public string? PtsId { get; init; }
        public string? DeviceType { get; init; }
        public string? State { get; init; }
        public int? Take { get; init; } = 5000;
    }

    public class GetAlarmReportDataQueryHandler : IRequestHandler<GetAlarmReportDataQuery, FMSResponse<List<AlarmReportRecordDto>>>
    {
        private readonly GpsdataContext _context;
        private readonly ILogger<GetAlarmReportDataQueryHandler> _logger;

        public GetAlarmReportDataQueryHandler(
            GpsdataContext context,
            ILogger<GetAlarmReportDataQueryHandler> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<FMSResponse<List<AlarmReportRecordDto>>> Handle(GetAlarmReportDataQuery request, CancellationToken cancellationToken)
        {
            try
            {
                var requestedEndDate = request.EndDate ?? DateTime.UtcNow;
                var endDate = requestedEndDate.TimeOfDay == TimeSpan.Zero
                    ? requestedEndDate.Date.AddDays(1).AddTicks(-1)
                    : requestedEndDate;
                var startDate = request.StartDate ?? endDate.AddDays(-7);

                var query = _context.PTSAlertRecords
                    .AsNoTracking()
                    .Where(record => record.DateTime >= startDate && record.DateTime <= endDate);

                if (!string.IsNullOrWhiteSpace(request.PtsId))
                {
                    var ptsId = request.PtsId.Trim();
                    query = query.Where(record => record.PtsId == ptsId);
                }

                if (!string.IsNullOrWhiteSpace(request.DeviceType))
                {
                    var deviceType = request.DeviceType.Trim().ToUpperInvariant();
                    query = query.Where(record => record.DeviceType == deviceType);
                }

                if (!string.IsNullOrWhiteSpace(request.State))
                {
                    var state = request.State.Trim();
                    query = query.Where(record => record.State == state);
                }

                query = query.OrderByDescending(record => record.DateTime);

                if (request.Take.HasValue && request.Take.Value > 0)
                {
                    query = query.Take(request.Take.Value);
                }

                var alertRows = await query
                    .Select(record => new
                    {
                        record.Id,
                        record.DateTime,
                        record.PtsId,
                        record.DeviceType,
                        record.DeviceNumber,
                        record.AlertCode,
                        record.State,
                        record.ConfigurationId,
                        record.AlarmId,
                    })
                    .ToListAsync(cancellationToken);

                var mapped = alertRows
                    .Select(record => new AlarmReportRecordDto
                    {
                        Id = record.Id,
                        OccurredAt = record.DateTime,
                        PtsId = record.PtsId,
                        DeviceType = record.DeviceType,
                        DeviceNumber = record.DeviceNumber,
                        AlertCode = record.AlertCode,
                        State = record.State,
                        AlarmType = ResolveAlarmType(record.DeviceType, record.AlertCode),
                        Description = ResolveAlarmDescription(record.DeviceType, record.AlertCode),
                        Severity = ResolveAlarmSeverity(record.DeviceType, record.AlertCode),
                        ConfigurationId = record.ConfigurationId,
                        AlarmId = record.AlarmId,
                    })
                    .ToList();

                return FMSResponse<List<AlarmReportRecordDto>>.Success(mapped, "Alarm report data retrieved successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving alarm report data");
                return FMSResponse<List<AlarmReportRecordDto>>.Failed("Error retrieving alarm report data");
            }
        }

        private static string ResolveAlarmType(string deviceType, int code)
        {
            return (deviceType ?? string.Empty).ToUpperInvariant() switch
            {
                "PTS" => code switch
                {
                    1 => "PTSLowBattery",
                    2 => "PTSHighTemperature",
                    3 => "PTSPowerDown",
                    4 => "PTSRestart",
                    _ => $"PTSUnknownAlert{code}",
                },
                "PUMP" => code switch
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
                    _ => $"PumpUnknownAlert{code}",
                },
                "PROBE" => code switch
                {
                    1 => "ProbeOffline",
                    2 => "ProbeError",
                    3 => "TankCriticalHighLevel",
                    4 => "TankHighLevel",
                    5 => "TankLowLevel",
                    6 => "TankCriticalLowLevel",
                    7 => "TankHighWaterLevel",
                    8 => "TankLeakage",
                    _ => $"ProbeUnknownAlert{code}",
                },
                "PRICEBOARD" => code switch
                {
                    1 => "PriceBoardOffline",
                    2 => "PriceBoardError",
                    _ => $"PriceBoardUnknownAlert{code}",
                },
                "READER" => code switch
                {
                    1 => "ReaderOffline",
                    2 => "ReaderError",
                    _ => $"ReaderUnknownAlert{code}",
                },
                _ => $"{deviceType}UnknownAlert{code}",
            };
        }

        private static string ResolveAlarmDescription(string deviceType, int code)
        {
            return (deviceType ?? string.Empty).ToUpperInvariant() switch
            {
                "PTS" => code switch
                {
                    1 => "Low battery voltage detected",
                    2 => "High CPU temperature detected",
                    3 => "Power down detected",
                    4 => "Restart detected",
                    _ => $"Unknown PTS alert code {code}",
                },
                "PUMP" => code switch
                {
                    1 => "Pump offline state detected",
                    20 => "Overfilling detected",
                    >= 21 and <= 26 => $"Overfilling detected for nozzle {code - 20}",
                    30 => "Filling in offline mode detected",
                    >= 31 and <= 36 => $"Filling in offline mode detected for nozzle {code - 30}",
                    _ => $"Unknown pump alert code {code}",
                },
                "PROBE" => code switch
                {
                    1 => "Probe offline state detected",
                    2 => "Probe error detected",
                    3 => "Critical high product level detected",
                    4 => "High product level detected",
                    5 => "Low product level detected",
                    6 => "Critical low product level detected",
                    7 => "High water level detected",
                    8 => "Tank leakage detected",
                    _ => $"Unknown probe alert code {code}",
                },
                "PRICEBOARD" => code switch
                {
                    1 => "Price board offline state detected",
                    2 => "Price board error detected",
                    _ => $"Unknown price board alert code {code}",
                },
                "READER" => code switch
                {
                    1 => "Reader offline state detected",
                    2 => "Reader error detected",
                    _ => $"Unknown reader alert code {code}",
                },
                _ => $"Unknown alert: {deviceType} code {code}",
            };
        }

        private static string ResolveAlarmSeverity(string deviceType, int code)
        {
            return (deviceType ?? string.Empty).ToUpperInvariant() switch
            {
                "PTS" => code switch
                {
                    1 => "Medium",
                    2 => "High",
                    3 => "High",
                    4 => "Low",
                    _ => "Medium",
                },
                "PUMP" => code switch
                {
                    1 => "High",
                    >= 20 and <= 26 => "Critical",
                    >= 30 and <= 36 => "High",
                    _ => "Medium",
                },
                "PROBE" => code switch
                {
                    1 => "High",
                    2 => "High",
                    3 => "Critical",
                    4 => "High",
                    5 => "High",
                    6 => "Critical",
                    7 => "High",
                    8 => "Critical",
                    _ => "Medium",
                },
                _ => "Medium",
            };
        }
    }
}