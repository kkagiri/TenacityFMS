/**
 * File: DataSourceManager.PumpTransactions.cs
 * Purpose: Provides dashboard data sources for live PTS fueling visibility and recent pump transactions.
 * Dependencies: GpsdataContext, ITransactionContextService, UploadStatus, Pumptransaction, Ptsdevice
 * Last Modified: 2026-03-11
 *
 * Key Functions:
 * - GetPumpTransactionDataAsync(): Routes pump-transaction dashboard sources to live summary, live list, or recent table builders.
 * - BuildPtsActiveFuelingSummaryAsync(): Produces a big-stat payload for currently fueling PTS devices.
 * - BuildPtsActiveFuelingCurrentAsync(): Produces a table payload listing all currently fueling PTS devices.
 * - BuildPumpTransactionsRecentAsync(): Produces a 10-row recent transaction table ordered by recorded time.
 */
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using FMS.Application.Features.Dashboard;
using FMS.Application.Features.PTS.Services;
using FMS.Domain.Entities.PTS.PTSStatus;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using StackExchange.Redis;

namespace FMS.Application.Services.Dashboard
{
    public partial class DataSourceManager
    {
        private const string PtsActiveFuelingSummaryDataSource = "pts_active_fueling_summary";
        private const string PtsActiveFuelingCurrentDataSource = "pts_active_fueling_current";
        private const string PumpTransactionsRecentDataSource = "pump_transactions_recent";

        private static readonly string[] PumpTransactionDataSourceKeys =
        {
            PtsActiveFuelingSummaryDataSource,
            PtsActiveFuelingCurrentDataSource,
            PumpTransactionsRecentDataSource
        };

        private bool IsPumpTransactionDataSource(string canonicalSource)
        {
            return PumpTransactionDataSourceKeys.Contains(canonicalSource, StringComparer.OrdinalIgnoreCase);
        }

        private async Task<object> GetPumpTransactionDataAsync(
            string canonicalSource,
            DashboardMetricRequestDto request,
            string accessMode,
            string aggregationInterval = "daily")
        {
            return canonicalSource switch
            {
                PtsActiveFuelingSummaryDataSource => await BuildPtsActiveFuelingSummaryAsync(request),
                PtsActiveFuelingCurrentDataSource => await BuildPtsActiveFuelingCurrentAsync(request),
                PumpTransactionsRecentDataSource => await BuildPumpTransactionsRecentAsync(request),
                _ => new { error = $"Unsupported pump transaction data source: {canonicalSource}", timestamp = DateTime.UtcNow }
            };
        }

        private async Task<object> BuildPtsActiveFuelingSummaryAsync(DashboardMetricRequestDto request)
        {
            var activeEntries = await GetActiveFuelingEntriesAsync(request);
            var now = DateTime.UtcNow;
            var activePtsCount = activeEntries.Select(entry => entry.DeviceId).Distinct(StringComparer.OrdinalIgnoreCase).Count();
            var activePumpCount = activeEntries.Count;
            var activeSitesCount = activeEntries
                .Where(entry => !string.IsNullOrWhiteSpace(entry.SiteName))
                .Select(entry => entry.SiteName)
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .Count();

            return new
            {
                current = new
                {
                    value = (decimal)activePtsCount,
                    unit = "pts",
                    timestamp = now,
                    label = activePtsCount > 0 ? "PTS Fueling Now" : "No Active Fueling"
                },
                change = BuildChangePayload(activePtsCount, activePtsCount),
                total = activePtsCount,
                categories = new List<object>
                {
                    new { key = "Active PTS", value = activePtsCount },
                    new { key = "Active Pumps", value = activePumpCount }
                },
                items = activeEntries
                    .OrderBy(entry => entry.DeviceName, StringComparer.OrdinalIgnoreCase)
                    .ThenBy(entry => entry.PumpId)
                    .Select(entry => new
                    {
                        id = $"{entry.DeviceId}-{entry.PumpId}-{entry.TransactionId}",
                        text = $"{entry.DeviceName} · Pump {entry.PumpId}",
                        value = entry.Volume ?? 0m,
                        type = entry.Mode,
                        timestamp = entry.StatusTimestamp,
                        description = string.IsNullOrWhiteSpace(entry.TargetName)
                            ? entry.SiteName
                            : $"{entry.TargetName} · {entry.SiteName}"
                    })
                    .Cast<object>()
                    .ToList(),
                additionalInfo = new
                {
                    sites_count = activeSitesCount,
                    vehicles_count = activePumpCount
                },
                summary = new
                {
                    activePtsCount,
                    activePumpCount,
                    activeSitesCount,
                    latestUpdate = activeEntries.OrderByDescending(entry => entry.StatusTimestamp).Select(entry => entry.StatusTimestamp).FirstOrDefault()
                },
                metadata = GetDataSourceMetadata(PtsActiveFuelingSummaryDataSource)
            };
        }

        private async Task<object> BuildPtsActiveFuelingCurrentAsync(DashboardMetricRequestDto request)
        {
            var activeEntries = await GetActiveFuelingEntriesAsync(request);
            var groupedRows = activeEntries
                .GroupBy(entry => (entry.DeviceId, entry.DeviceName, entry.SiteName))
                .Select(group => new Dictionary<string, object?>
                {
                    ["ptsName"] = group.Key.DeviceName,
                    ["ptsId"] = group.Key.DeviceId,
                    ["site"] = string.IsNullOrWhiteSpace(group.Key.SiteName) ? "Unassigned" : group.Key.SiteName,
                    ["activePumps"] = group.Count(),
                    ["pumpNumbers"] = string.Join(", ", group.Select(item => item.PumpId).Distinct().OrderBy(item => item)),
                    ["targets"] = string.Join(" | ", group
                        .Select(item => item.TargetName)
                        .Where(item => !string.IsNullOrWhiteSpace(item))
                        .Select(item => item!)
                        .Distinct(StringComparer.OrdinalIgnoreCase)),
                    ["transactions"] = string.Join(", ", group.Select(item => item.TransactionId).Distinct().OrderBy(item => item)),
                    ["lastUpdated"] = group.Max(item => item.StatusTimestamp),
                    ["connectionType"] = string.Join(", ", group
                        .Select(item => item.ConnectionType)
                        .Where(item => !string.IsNullOrWhiteSpace(item))
                        .Select(item => item!)
                        .Distinct(StringComparer.OrdinalIgnoreCase))
                })
                .OrderByDescending(row => Convert.ToInt32(row["activePumps"] ?? 0))
                .ThenBy(row => row["ptsName"]?.ToString(), StringComparer.OrdinalIgnoreCase)
                .ToList();

            return new
            {
                current = new
                {
                    value = groupedRows.Count,
                    unit = "pts",
                    timestamp = DateTime.UtcNow,
                    label = "Currently Fueling PTS"
                },
                total = groupedRows.Count,
                rows = groupedRows,
                columns = BuildActiveFuelingTableColumns(),
                lastUpdated = groupedRows
                    .Select(row => row.TryGetValue("lastUpdated", out var value) ? value as DateTime? : null)
                    .Where(value => value.HasValue)
                    .Select(value => value!.Value)
                    .DefaultIfEmpty(DateTime.UtcNow)
                    .Max(),
                summary = new
                {
                    activePtsCount = groupedRows.Count,
                    activePumpCount = activeEntries.Count
                },
                metadata = GetDataSourceMetadata(PtsActiveFuelingCurrentDataSource)
            };
        }

        private async Task<object> BuildPumpTransactionsRecentAsync(DashboardMetricRequestDto request)
        {
            var transactionQuery = _context.Pumptransactions
                .AsNoTracking()
                .Where(transaction => !transaction.IsTransferMode);

            if (request.SiteIds != null && request.SiteIds.Any())
            {
                transactionQuery = transactionQuery.Where(transaction =>
                    (transaction.Tank != null && request.SiteIds.Contains(transaction.Tank.SiteId)) ||
                    (transaction.Pts.Site.HasValue && request.SiteIds.Contains(transaction.Pts.Site.Value)));
            }

            if (request.VehicleIds != null && request.VehicleIds.Any())
            {
                transactionQuery = transactionQuery.Where(transaction => transaction.VehicleId.HasValue && request.VehicleIds.Contains(transaction.VehicleId.Value));
            }

            if (request.TankIds != null && request.TankIds.Any())
            {
                transactionQuery = transactionQuery.Where(transaction => transaction.TankId.HasValue && request.TankIds.Contains(transaction.TankId.Value));
            }

            var recentTransactions = await transactionQuery
                .OrderByDescending(transaction => transaction.DateTime)
                .Select(transaction => new
                {
                    transaction.Id,
                    transaction.Transaction,
                    transaction.DateTime,
                    transaction.DateTimeStart,
                    PtsName = transaction.Pts.PtsName,
                    transaction.PtsId,
                    SiteName = transaction.Tank != null
                        ? transaction.Tank.Site.Name
                        : transaction.Pts.SiteNavigation != null
                            ? transaction.Pts.SiteNavigation.Name
                            : null,
                    transaction.Pump,
                    transaction.Nozzle,
                    VehicleDisplay = transaction.Vehicle != null
                        ? (!string.IsNullOrWhiteSpace(transaction.Vehicle.NumberPlate)
                            ? transaction.Vehicle.NumberPlate
                            : !string.IsNullOrWhiteSpace(transaction.Vehicle.VehicleCode)
                                ? transaction.Vehicle.VehicleCode
                                : $"Vehicle {transaction.VehicleId}")
                        : "Walk-in",
                    TankName = transaction.Tank != null ? transaction.Tank.Name : null,
                    transaction.Volume,
                    transaction.Amount,
                    DriverName = transaction.Employee != null ? transaction.Employee.FullName : null,
                    transaction.HasBeenProcessed,
                    transaction.FuelGradeName
                })
                .Take(10)
                .ToListAsync();

            var rows = recentTransactions
                .Select((transaction, index) => new Dictionary<string, object?>
                {
                    ["recordNumber"] = index + 1,
                    ["transactionId"] = transaction.Transaction ?? transaction.Id,
                    ["recordedAt"] = transaction.DateTime,
                    ["startedAt"] = transaction.DateTimeStart,
                    ["ptsName"] = string.IsNullOrWhiteSpace(transaction.PtsName) ? transaction.PtsId : transaction.PtsName,
                    ["site"] = string.IsNullOrWhiteSpace(transaction.SiteName) ? "Unassigned" : transaction.SiteName,
                    ["pump"] = transaction.Pump,
                    ["nozzle"] = transaction.Nozzle,
                    ["vehicle"] = transaction.VehicleDisplay,
                    ["tank"] = string.IsNullOrWhiteSpace(transaction.TankName) ? "Unknown tank" : transaction.TankName,
                    ["fuelGrade"] = string.IsNullOrWhiteSpace(transaction.FuelGradeName) ? "Unknown" : transaction.FuelGradeName,
                    ["volume"] = transaction.Volume ?? 0m,
                    ["amount"] = transaction.Amount ?? 0m,
                    ["driver"] = string.IsNullOrWhiteSpace(transaction.DriverName) ? "Unknown" : transaction.DriverName,
                    ["processed"] = transaction.HasBeenProcessed
                })
                .ToList();

            return new
            {
                current = new
                {
                    value = rows.Count,
                    unit = "transactions",
                    timestamp = recentTransactions.FirstOrDefault()?.DateTime ?? DateTime.UtcNow,
                    label = "Recent Transactions"
                },
                total = rows.Count,
                rows,
                columns = BuildRecentPumpTransactionColumns(),
                lastUpdated = recentTransactions.FirstOrDefault()?.DateTime ?? DateTime.UtcNow,
                summary = new
                {
                    transactionCount = rows.Count,
                    totalVolume = recentTransactions.Sum(transaction => transaction.Volume ?? 0m),
                    totalAmount = recentTransactions.Sum(transaction => transaction.Amount ?? 0m),
                    processedCount = recentTransactions.Count(transaction => transaction.HasBeenProcessed)
                },
                metadata = GetDataSourceMetadata(PumpTransactionsRecentDataSource)
            };
        }

        private async Task<List<(string DeviceId, string DeviceName, string SiteName, int PumpId, int? Nozzle, int TransactionId, decimal? Volume, decimal? Amount, string Mode, string TargetName, string FueledByUserName, DateTime? AuthorizedAt, DateTime StatusTimestamp, string ConnectionType)>> GetActiveFuelingEntriesAsync(
            DashboardMetricRequestDto request)
        {
            var redisConnection = _serviceProvider.GetService<IConnectionMultiplexer>();
            var transactionContextService = _serviceProvider.GetService<ITransactionContextService>();

            if (redisConnection == null)
            {
                _logger.LogWarning("IConnectionMultiplexer is not registered - pump transaction dashboard widgets will return empty live results");
                return new List<(string, string, string, int, int?, int, decimal?, decimal?, string, string, string, DateTime?, DateTime, string)>();
            }

            var redisDb = redisConnection.GetDatabase();

            var devices = await _context.Ptsdevices
                .AsNoTracking()
                .Where(device => device.IsActive == 1)
                .Where(device => request.SiteIds == null || !request.SiteIds.Any() || (device.Site.HasValue && request.SiteIds.Contains(device.Site.Value)))
                .Select(device => new
                {
                    DeviceId = device.Ptsid,
                    DeviceName = string.IsNullOrWhiteSpace(device.PtsName) ? device.Ptsid : device.PtsName,
                    SiteName = device.SiteNavigation != null ? device.SiteNavigation.Name : null
                })
                .ToListAsync();

            var rawEntries = new List<(string DeviceId, string DeviceName, string SiteName, int PumpId, int? Nozzle, int TransactionId, decimal? Volume, decimal? Amount, int? VehicleId, int? TankId, string? UserId, DateTime? AuthorizedAt, DateTime StatusTimestamp, string? ConnectionType)>();

            foreach (var device in devices)
            {
                var status = await GetLatestDeviceStatusAsync(redisDb, device.DeviceId);
                if (status?.Pumps?.FillingStatus?.Ids == null || !status.Pumps.FillingStatus.Ids.Any())
                {
                    continue;
                }

                var fillingStatus = status.Pumps.FillingStatus;
                var statusTimestamp = await GetLatestDeviceStatusTimestampAsync(redisDb, device.DeviceId) ?? status.DateTime;

                for (var index = 0; index < fillingStatus.Ids.Count; index++)
                {
                    var pumpId = fillingStatus.Ids[index];
                    if (!pumpId.HasValue)
                    {
                        continue;
                    }

                    var transactionId = fillingStatus.Transactions != null && fillingStatus.Transactions.Count > index
                        ? fillingStatus.Transactions[index]
                        : 0;

                    var transactionContext = transactionId > 0 && transactionContextService != null
                        ? await transactionContextService.GetTransactionContextAsync(device.DeviceId, transactionId)
                        : null;

                    rawEntries.Add((
                        device.DeviceId,
                        device.DeviceName,
                        device.SiteName ?? "Unassigned",
                        pumpId.Value,
                        fillingStatus.Nozzles != null && fillingStatus.Nozzles.Count > index ? fillingStatus.Nozzles[index] : null,
                        transactionId,
                        fillingStatus.Volumes != null && fillingStatus.Volumes.Count > index ? fillingStatus.Volumes[index] : null,
                        fillingStatus.Amounts != null && fillingStatus.Amounts.Count > index ? fillingStatus.Amounts[index] : null,
                        transactionContext?.VehicleId,
                        transactionContext?.TankId,
                        transactionContext?.UserId,
                        transactionContext?.AuthorizedAt,
                        statusTimestamp,
                        transactionContext?.ConnectionType));
                }
            }

            var vehicleIds = rawEntries.Where(entry => entry.VehicleId.HasValue).Select(entry => entry.VehicleId!.Value).Distinct().ToList();
            var tankIds = rawEntries.Where(entry => entry.TankId.HasValue).Select(entry => entry.TankId!.Value).Distinct().ToList();
            var userIds = rawEntries.Where(entry => !string.IsNullOrWhiteSpace(entry.UserId)).Select(entry => entry.UserId!).Distinct(StringComparer.OrdinalIgnoreCase).ToList();

            var vehicleLookup = vehicleIds.Any()
                ? await _context.Vehicles
                    .AsNoTracking()
                    .Where(vehicle => vehicleIds.Contains(vehicle.VehicleId))
                    .Select(vehicle => new
                    {
                        vehicle.VehicleId,
                        DisplayName = !string.IsNullOrWhiteSpace(vehicle.NumberPlate)
                            ? vehicle.NumberPlate
                            : !string.IsNullOrWhiteSpace(vehicle.VehicleCode)
                                ? vehicle.VehicleCode
                                : $"Vehicle {vehicle.VehicleId}"
                    })
                    .ToDictionaryAsync(vehicle => vehicle.VehicleId, vehicle => vehicle.DisplayName)
                : new Dictionary<int, string>();

            var tankLookup = tankIds.Any()
                ? await _context.Tanks
                    .AsNoTracking()
                    .Where(tank => tankIds.Contains(tank.Id))
                    .ToDictionaryAsync(tank => tank.Id, tank => tank.Name)
                : new Dictionary<int, string>();

            var userLookup = userIds.Any()
                ? await _context.Users
                    .AsNoTracking()
                    .Where(user => userIds.Contains(user.Id))
                    .ToDictionaryAsync(user => user.Id, user => user.UserName ?? user.Email ?? user.Id)
                : new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);

            return rawEntries
                .Select(entry =>
                {
                    var targetName = entry.VehicleId.HasValue && vehicleLookup.TryGetValue(entry.VehicleId.Value, out var vehicleName)
                        ? vehicleName
                        : entry.TankId.HasValue && tankLookup.TryGetValue(entry.TankId.Value, out var tankName)
                            ? $"Tank {tankName}"
                            : "Unknown target";

                    var fueledByUserName = !string.IsNullOrWhiteSpace(entry.UserId) && userLookup.TryGetValue(entry.UserId, out var userName)
                        ? userName
                        : "Unknown";

                    var mode = entry.VehicleId.HasValue ? "Vehicle" : entry.TankId.HasValue ? "Transfer" : "Fueling";

                    return (
                        entry.DeviceId,
                        entry.DeviceName,
                        entry.SiteName,
                        entry.PumpId,
                        entry.Nozzle,
                        entry.TransactionId,
                        entry.Volume,
                        entry.Amount,
                        mode,
                        targetName,
                        fueledByUserName,
                        entry.AuthorizedAt,
                        entry.StatusTimestamp,
                        string.IsNullOrWhiteSpace(entry.ConnectionType) ? "Unknown" : entry.ConnectionType);
                })
                .OrderBy(entry => entry.DeviceName, StringComparer.OrdinalIgnoreCase)
                .ThenBy(entry => entry.PumpId)
                .ToList();
        }

        private async Task<UploadStatus?> GetLatestDeviceStatusAsync(IDatabase redisDb, string deviceId)
        {
            try
            {
                var statusJson = await redisDb.StringGetAsync($"device:{deviceId}:status");
                if (statusJson.IsNullOrEmpty)
                {
                    return null;
                }

                return JsonSerializer.Deserialize<UploadStatus>(statusJson!);
            }
            catch (JsonException jsonException)
            {
                _logger.LogError(jsonException, "Error deserializing latest device status for {DeviceId}", deviceId);
                return null;
            }
            catch (Exception exception)
            {
                _logger.LogError(exception, "Error retrieving latest device status for {DeviceId}", deviceId);
                return null;
            }
        }

        private async Task<DateTime?> GetLatestDeviceStatusTimestampAsync(IDatabase redisDb, string deviceId)
        {
            try
            {
                var timestampValue = await redisDb.StringGetAsync($"device:{deviceId}:status:timestamp");
                if (timestampValue.IsNullOrEmpty)
                {
                    return null;
                }

                return DateTime.TryParse(timestampValue!, out var timestamp)
                    ? timestamp
                    : null;
            }
            catch (Exception exception)
            {
                _logger.LogError(exception, "Error retrieving latest device status timestamp for {DeviceId}", deviceId);
                return null;
            }
        }

        private static List<object> BuildActiveFuelingTableColumns()
        {
            return new List<object>
            {
                new { field = "ptsName", title = "PTS", type = "text" },
                new { field = "site", title = "Site", type = "text" },
                new { field = "activePumps", title = "Active Pumps", type = "number" },
                new { field = "pumpNumbers", title = "Pumps", type = "text" },
                new { field = "targets", title = "Fueling", type = "text" },
                new { field = "transactions", title = "Transactions", type = "text" },
                new { field = "connectionType", title = "Connection", type = "text" },
                new { field = "lastUpdated", title = "Last Updated", type = "datetime" }
            };
        }

        private static List<object> BuildRecentPumpTransactionColumns()
        {
            return new List<object>
            {
                new { field = "transactionId", title = "Transaction", type = "number" },
                new { field = "recordedAt", title = "Recorded", type = "datetime" },
                new { field = "ptsName", title = "PTS", type = "text" },
                new { field = "site", title = "Site", type = "text" },
                new { field = "pump", title = "Pump", type = "number" },
                new { field = "nozzle", title = "Nozzle", type = "number" },
                new { field = "vehicle", title = "Vehicle", type = "text" },
                new { field = "tank", title = "Tank", type = "text" },
                new { field = "fuelGrade", title = "Fuel Grade", type = "text" },
                new { field = "volume", title = "Volume", type = "number" },
                new { field = "amount", title = "Amount", type = "number" },
                new { field = "driver", title = "Driver", type = "text" },
                new { field = "processed", title = "Processed", type = "boolean" }
            };
        }
    }
}