/**
 * File: FrontEndHUB.cs
 * Purpose: Broadcasts business-facing realtime events and tracks active frontend hub connections.
 * Dependencies: IMediator, ConnectionMonitor, SignalR Hub, ILogger
 * Last Modified: 2026-03-11
 *
 * Key Functions:
 * - OnConnectedAsync(): Registers active business hub connections for admin metrics.
 * - OnDisconnectedAsync(): Removes business hub connections from admin metrics.
 */
using System;
using System.Collections.Concurrent;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using FMS.Application.Communication.Tracker;
using FMS.Application.Features.PTSDevice.Queries;
using FMS.Domain.Entities;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Communication.SignalR
{



    /// <summary>
    /// Version: 2.0
    /// Description: Hub for frontend communication using SignalR. Only for Business functions...
    /// </summary>

    public class FrontEndHub : Hub
    {
        private readonly IMediator _mediator;
        private readonly ConnectionMonitor _connectionMonitor;
        private readonly ILogger<FrontEndHub> _logger;

        public FrontEndHub(
            IMediator mediator,
            ConnectionMonitor connectionMonitor,
            ILogger<FrontEndHub> logger)
        {
            _mediator = mediator;
            _connectionMonitor = connectionMonitor;
            _logger = logger;
        }

        public override async Task OnConnectedAsync()
        {
            _connectionMonitor.AddConnection(Context.ConnectionId);
            _logger.LogInformation("Frontend client connected: {ConnectionId}", Context.ConnectionId);

            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            _connectionMonitor.RemoveConnection(Context.ConnectionId);

            if (exception != null)
            {
                _logger.LogWarning(exception, "Frontend client disconnected with error: {ConnectionId}", Context.ConnectionId);
            }
            else
            {
                _logger.LogInformation("Frontend client disconnected: {ConnectionId}", Context.ConnectionId);
            }

            await base.OnDisconnectedAsync(exception);
        }


        // Method to broadcast tank volume history updates
        public async Task BroadcastTankVolumeHistoryUpdate(object tankVolumeData)
        {
            try
            {
                await Clients.All.SendAsync("TankVolumeHistoryUpdate", tankVolumeData);
                _logger.LogDebug("Tank volume history update broadcasted: {Data}", tankVolumeData);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error broadcasting tank volume history update");
            }
        }

        // Method to broadcast tank delivery updates
        public async Task BroadcastTankDeliveryUpdate(object deliveryData)
        {
            try
            {
                await Clients.All.SendAsync("TankDeliveryUpdate", deliveryData);
                _logger.LogDebug("Tank delivery update broadcasted: {Data}", deliveryData);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error broadcasting tank delivery update");
            }
        }

        // Method to broadcast consumption data updates
        public async Task BroadcastConsumptionUpdate(object consumptionData)
        {
            try
            {
                await Clients.All.SendAsync("ConsumptionUpdate", consumptionData);
                _logger.LogDebug("Consumption update broadcasted: {Data}", consumptionData);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error broadcasting consumption update");
            }
        }

        // Method to broadcast tank stock changes (current stock levels)
        public async Task BroadcastTankStockUpdate(object tankStockData)
        {
            try
            {
                await Clients.All.SendAsync("TankStockUpdate", tankStockData);
                _logger.LogDebug("Tank stock update broadcasted: {Data}", tankStockData);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error broadcasting tank stock update");
            }
        }

        // Method to broadcast stock adjustment updates
        public async Task BroadcastStockAdjustmentUpdate(object adjustmentData)
        {
            try
            {
                await Clients.All.SendAsync("StockAdjustmentUpdate", adjustmentData);
                _logger.LogDebug("Stock adjustment update broadcasted: {Data}", adjustmentData);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error broadcasting stock adjustment update");
            }
        }


        // Method for clients to request fresh tank data for a specific site
        public async Task RequestTankDataUpdate(string siteId, string startDate, string endDate)
        {
            try
            {
                _logger.LogInformation("Client requested tank data update for site: {SiteId}, date range: {StartDate} - {EndDate}",
                    siteId, startDate, endDate);

                // This will trigger the backend to send fresh data
                // The actual data fetching should be handled by the caller service
                await Clients.Caller.SendAsync("TankDataRefreshRequested", new
                {
                    siteId,
                    startDate,
                    endDate,
                    timestamp = DateTime.UtcNow
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing tank data refresh request");
            }
        }

        // Method to broadcast active alarm creation
        public async Task BroadcastActiveAlarmCreated(object alarmData)
        {
            try
            {
                await Clients.All.SendAsync("ActiveAlarmCreated", alarmData);
                _logger.LogInformation("Broadcasted active alarm creation: {AlarmId}",
                    alarmData.GetType().GetProperty("Id")?.GetValue(alarmData));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error broadcasting active alarm creation");
            }
        }

        // Method to broadcast active alarm updates
        public async Task BroadcastActiveAlarmUpdated(object alarmData)
        {
            try
            {
                await Clients.All.SendAsync("ActiveAlarmUpdated", alarmData);
                _logger.LogInformation("Broadcasted active alarm update: {AlarmId}",
                    alarmData.GetType().GetProperty("Id")?.GetValue(alarmData));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error broadcasting active alarm update");
            }
        }

        // Method to broadcast alarm state changes
        public async Task BroadcastActiveAlarmStateChanged(int alarmId, string newState)
        {
            try
            {
                await Clients.All.SendAsync("ActiveAlarmStateChanged", new { alarmId, newState });
                _logger.LogInformation("Broadcasted alarm state change: Alarm {AlarmId} -> {NewState}", alarmId, newState);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error broadcasting alarm state change");
            }
        }

        // Method to broadcast notification creation
        public async Task BroadcastNotificationCreated(object notificationData)
        {
            try
            {
                await Clients.All.SendAsync("NotificationCreated", notificationData);
                _logger.LogDebug("Broadcasted notification creation");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error broadcasting notification");
            }
        }

        // Method for testing alarm broadcasts
        public async Task BroadcastAlarmTest(object testData)
        {
            try
            {
                await Clients.All.SendAsync("AlarmTestBroadcast", testData);
                _logger.LogInformation("Broadcasted alarm test: {Message}",
                    testData.GetType().GetProperty("message")?.GetValue(testData));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error broadcasting alarm test");
            }
        }

        // Method to get alarm statistics (for testing)
        public async Task RequestAlarmStatistics()
        {
            try
            {
                // This would typically call a service to get statistics
                var mockStats = new
                {
                    totalActive = 15,
                    critical = 3,
                    unacknowledged = 7,
                    resolvedToday = 5,
                    timestamp = DateTime.UtcNow
                };

                await Clients.Caller.SendAsync("AlarmStatisticsUpdate", mockStats);
                _logger.LogDebug("Sent alarm statistics to client");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending alarm statistics");
            }
        }

        // Method to broadcast bulk provider assignment progress
        public async Task BroadcastBulkProviderAssignmentProgress(object progressData)
        {
            try
            {
                await Clients.All.SendAsync("BulkProviderAssignmentProgress", progressData);
                _logger.LogDebug("Bulk provider assignment progress broadcasted: {Data}", progressData);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error broadcasting bulk provider assignment progress");
            }
        }

        // Method to broadcast GPS fetch progress updates
        public async Task BroadcastGpsFetchProgress(string jobId, string status, int progressPercent, string message)
        {
            try
            {
                await Clients.All.SendAsync("GpsFetchProgress", new
                {
                    jobId,
                    status,
                    progressPercent,
                    message,
                    timestamp = DateTime.UtcNow
                });
                _logger.LogDebug("GPS fetch progress update: Job {JobId} - {Status} ({Percent}%): {Message}",
                    jobId, status, progressPercent, message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error broadcasting GPS fetch progress for job {JobId}", jobId);
            }
        }

        // Method to broadcast GPS fetch completion
        public async Task BroadcastGpsFetchCompleted(string jobId, object result)
        {
            try
            {
                await Clients.All.SendAsync("GpsFetchCompleted", new
                {
                    jobId,
                    result,
                    timestamp = DateTime.UtcNow
                });
                _logger.LogInformation("GPS fetch completed: Job {JobId}", jobId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error broadcasting GPS fetch completion for job {JobId}", jobId);
            }
        }

        // Method to broadcast GPS fetch errors
        public async Task BroadcastGpsFetchError(string jobId, string error)
        {
            try
            {
                await Clients.All.SendAsync("GpsFetchError", new
                {
                    jobId,
                    error,
                    timestamp = DateTime.UtcNow
                });
                _logger.LogError("GPS fetch error: Job {JobId} - {Error}", jobId, error);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error broadcasting GPS fetch error for job {JobId}", jobId);
            }
        }
    }
}
