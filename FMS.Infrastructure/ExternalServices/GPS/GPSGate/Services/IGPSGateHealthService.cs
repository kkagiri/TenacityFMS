using System.Threading.Tasks;
using FMS.Application.Common;

namespace FMS.Infrastructure.ExternalServices.GPS.GPSGate.Services
{
    /// <summary>
    /// Service for GPS system health monitoring
    /// </summary>
    public interface IGPSGateHealthService
    {
        /// <summary>
        /// Validate connection to GPSGate API
        /// </summary>
        Task<FMSResponse<bool>> ValidateConnectionAsync();

        /// <summary>
        /// Get comprehensive system health status
        /// </summary>
        Task<FMSResponse<SystemHealthStatusDTO>> GetSystemHealthAsync();

        /// <summary>
        /// Ping the GPSGate API
        /// </summary>
        Task<FMSResponse<double>> PingAsync();
    }

    public class SystemHealthStatusDTO
    {
        public bool IsApiAccessible { get; set; }
        public double ResponseTimeMs { get; set; }
        public int TotalVehicles { get; set; }
        public int OnlineVehicles { get; set; }
        public int OfflineVehicles { get; set; }
        public string Status { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
    }
}
