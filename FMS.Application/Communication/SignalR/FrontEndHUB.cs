using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;

namespace FMS.Application.Communication.SignalR
{
    public class FrontEndHub : Hub
    {
        private readonly DeviceConnectionTracker _deviceConnectionTracker;

        public FrontEndHub(DeviceConnectionTracker deviceConnectionTracker)
        {
            _deviceConnectionTracker = deviceConnectionTracker;
        }

        public override async Task OnConnectedAsync()
        {
            var user = Context.User;
            if (user.IsInRole("Admin"))
            {
                await Groups.AddToGroupAsync(Context.ConnectionId, "Admins");
                await Groups.AddToGroupAsync(Context.ConnectionId, "FuelOperators");
            }
            // Add to other groups as necessary

            // Broadcast current device status to the newly connected client
            await BroadcastConnectedDevices();
            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception exception)
        {
            // Remove from groups if added
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, "Admins");
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, "FuelOperators");
            // Remove from other groups as necessary

            await base.OnDisconnectedAsync(exception);
        }

        //Server Methods to send messages to the client
        public async Task BroadCastPumpStatus(string pumpId, string status, object extraData = null)
        {
            var message = new
            {
                pumpId = pumpId,
                status = status,
                extraData = extraData
            };
            await Clients.Group("FuelOperators").SendAsync("PumpStatusUpdate", message);
        }

        // New method to broadcast connected devices
        public async Task BroadcastConnectedDevices()
        {
            var devices = await _deviceConnectionTracker.GetConnectedDevices();
            await Clients.All.SendAsync("ConnectedDevicesStatus", devices);
        }

        // Optional: Method that can be called from client to request device status
        public async Task RequestDeviceStatus()
        {
            await BroadcastConnectedDevices();
        }

        public async Task BroadcastDashboardMetrics(object metrics)
        {
            await Clients.All.SendAsync("DashboardMetricsUpdate", metrics);
        }
    }
}