//Cursor - Service for broadcasting tank stock-related updates via SignalR
using System;
using System.Threading.Tasks;
using FMS.Application.Communication.SignalR;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Communication.SignalR {
    public interface ITankStockSignalRService {
        Task BroadcastTankVolumeHistoryUpdate (object data);
        Task BroadcastTankDeliveryUpdate (object data);
        Task BroadcastConsumptionUpdate (object data);
        Task BroadcastTankStockUpdate (object data);
        Task BroadcastStockAdjustmentUpdate (object data);
        Task BroadcastTankDashboardUpdate (object data);
    }

    public class TankStockSignalRService : ITankStockSignalRService {
        private readonly IHubContext<FrontEndHub> _hubContext;
        private readonly ILogger<TankStockSignalRService> _logger;

        public TankStockSignalRService (
            IHubContext<FrontEndHub> hubContext,
            ILogger<TankStockSignalRService> logger) {
            _hubContext = hubContext;
            _logger = logger;
        }

        public async Task BroadcastTankVolumeHistoryUpdate (object data) {
            try {
                await _hubContext.Clients.All.SendAsync ("TankVolumeHistoryUpdate", data);
                _logger.LogDebug ("Tank volume history update broadcasted via SignalR");
            } catch (Exception ex) {
                _logger.LogError (ex, "Error broadcasting tank volume history update");
            }
        }

        public async Task BroadcastTankDeliveryUpdate (object data) {
            try {
                await _hubContext.Clients.All.SendAsync ("TankDeliveryUpdate", data);
                _logger.LogDebug ("Tank delivery update broadcasted via SignalR");
            } catch (Exception ex) {
                _logger.LogError (ex, "Error broadcasting tank delivery update");
            }
        }

        public async Task BroadcastConsumptionUpdate (object data) {
            try {
                await _hubContext.Clients.All.SendAsync ("ConsumptionUpdate", data);
                _logger.LogDebug ("Consumption update broadcasted via SignalR");
            } catch (Exception ex) {
                _logger.LogError (ex, "Error broadcasting consumption update");
            }
        }

        public async Task BroadcastTankStockUpdate (object data) {
            try {
                await _hubContext.Clients.All.SendAsync ("TankStockUpdate", data);
                _logger.LogDebug ("Tank stock update broadcasted via SignalR");
            } catch (Exception ex) {
                _logger.LogError (ex, "Error broadcasting tank stock update");
            }
        }

        public async Task BroadcastStockAdjustmentUpdate (object data) {
            try {
                await _hubContext.Clients.All.SendAsync ("StockAdjustmentUpdate", data);
                _logger.LogDebug ("Stock adjustment update broadcasted via SignalR");
            } catch (Exception ex) {
                _logger.LogError (ex, "Error broadcasting stock adjustment update");
            }
        }

        public async Task BroadcastTankDashboardUpdate (object data) {
            try {
                await _hubContext.Clients.All.SendAsync ("TankDashboardUpdate", data);
                _logger.LogDebug ("Tank dashboard update broadcasted via SignalR");
            } catch (Exception ex) {
                _logger.LogError (ex, "Error broadcasting tank dashboard update");
            }
        }
    }
}