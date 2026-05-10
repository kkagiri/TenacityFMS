/**
 * File: TankMeasurementBroadcastService.cs
 * Purpose: Periodically broadcasts latest tank measurements over PTSHub for real-time monitoring.
 * Dependencies: BackgroundService, GpsdataContext, IHubContext<PTSHub>, ISystemConfigurationService
 * Last Modified: 2026-02-12
 *
 * Key Functions:
 * - ExecuteAsync: Polls tank measurements table for new records and broadcasts updates.
 */
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Communication.SignalR;
using FMS.Persistence.DataAccess;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace FMS.WebClient.Services.SignalR
{
    public class TankMeasurementBroadcastService : BackgroundService
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<TankMeasurementBroadcastService> _logger;
        private readonly IHubContext<PTSHub> _hubContext;

        private DateTime _lastSeenUtc = DateTime.UtcNow.AddMinutes(-5);

        public TankMeasurementBroadcastService(
            IServiceScopeFactory scopeFactory,
            ILogger<TankMeasurementBroadcastService> logger,
            IHubContext<PTSHub> hubContext)
        {
            _scopeFactory = scopeFactory;
            _logger = logger;
            _hubContext = hubContext;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    var intervalSeconds = await GetSignalRPushIntervalSecondsAsync(stoppingToken);

                    if (intervalSeconds <= 0)
                    {
                        intervalSeconds = 10;
                    }

                    await BroadcastNewMeasurementsAsync(stoppingToken);
                    await Task.Delay(TimeSpan.FromSeconds(intervalSeconds), stoppingToken);
                }
                catch (OperationCanceledException)
                {
                    // graceful shutdown
                    break;
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Tank measurement broadcast loop error");
                    await Task.Delay(TimeSpan.FromSeconds(10), stoppingToken);
                }
            }
        }

        private async Task<int> GetSignalRPushIntervalSecondsAsync(CancellationToken cancellationToken)
        {
            using var scope = _scopeFactory.CreateScope();
            var systemConfigurationService = scope.ServiceProvider
                .GetRequiredService<FMS.Application.Services.Configuration.ISystemConfigurationService>();

            return await systemConfigurationService.GetTankMeasurementSignalRPushIntervalSecondsAsync(cancellationToken);
        }

        private async Task BroadcastNewMeasurementsAsync(CancellationToken cancellationToken)
        {
            using var scope = _scopeFactory.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<GpsdataContext>();

            // NOTE:
            // Avoid GroupBy(...).Select(FirstOrDefault()) here because Pomelo EF translation can throw
            // KeyNotFoundException (EmptyProjectionMember) under certain query shapes.
            // We fetch new rows ordered by DateTime and select latest per tank in-memory.
            var rawNewMeasurements = await context.Tankmeasurements
                .AsNoTracking()
                .Where(tm => tm.DateTime > _lastSeenUtc)
                .OrderByDescending(tm => tm.DateTime)
                .ToListAsync(cancellationToken);

            var newMeasurements = rawNewMeasurements
                .Where(tm => tm != null)
                .GroupBy(tm => tm.TankId)
                .Select(g => g.First())
                .ToList();

            if (newMeasurements.Count == 0)
            {
                return;
            }

            var newestTimestamp = newMeasurements.Max(m => m!.DateTime);
            _lastSeenUtc = newestTimestamp;

            foreach (var tm in newMeasurements)
            {
                if (tm == null) continue;

                await _hubContext.Clients.All.SendAsync("TankMeasurementUpdate", new
                {
                    TankId = tm.TankId,
                    DateTime = tm.DateTime,
                    ProductVolume = tm.ProductVolume,
                    Temperature = tm.Temperature,
                    WaterHeight = tm.WaterHeight,
                    ProductHeight = tm.ProductHeight,
                    WaterVolume = tm.WaterVolume,
                    Status = tm.Status,
                    PtsId = tm.Ptsid
                }, cancellationToken);
            }
        }
    }
}
