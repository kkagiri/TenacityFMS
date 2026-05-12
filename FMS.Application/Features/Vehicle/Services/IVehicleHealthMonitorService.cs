using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.Vehicle.DTOs;

namespace FMS.Application.Features.Vehicle.Services
{
    /// <summary>
    /// Service for monitoring vehicle health and offline status
    /// </summary>
    public interface IVehicleHealthMonitorService
    {
        /// <summary>
        /// Record health check for a vehicle
        /// </summary>
        Task<FMSResponse<VehicleHealthMonitorDTO>> RecordHealthCheckAsync(int vehicleId, bool isOnline,
            decimal? latitude = null, decimal? longitude = null, string? address = null);

        /// <summary>
        /// Update offline status and reason for a vehicle
        /// </summary>
        Task<FMSResponse<VehicleHealthMonitorDTO>> UpdateOfflineStatusAsync(UpdateVehicleOfflineStatusRequest request, string updatedBy);

        /// <summary>
        /// Get latest health status for a vehicle
        /// </summary>
        Task<FMSResponse<VehicleHealthMonitorDTO>> GetLatestHealthStatusAsync(int vehicleId);

        /// <summary>
        /// Get health history for a vehicle
        /// </summary>
        Task<FMSResponse<List<VehicleHealthMonitorDTO>>> GetHealthHistoryAsync(int vehicleId, DateTime from, DateTime to);

        /// <summary>
        /// Get all offline vehicles
        /// </summary>
        Task<FMSResponse<List<VehicleHealthMonitorDTO>>> GetOfflineVehiclesAsync();

        /// <summary>
        /// Get vehicles offline for more than specified hours
        /// </summary>
        Task<FMSResponse<List<VehicleHealthMonitorDTO>>> GetLongTermOfflineVehiclesAsync(int hoursThreshold = 24);

        /// <summary>
        /// Get vehicles by offline reason
        /// </summary>
        Task<FMSResponse<List<VehicleHealthMonitorDTO>>> GetVehiclesByOfflineReasonAsync(string offlineReason);

        /// <summary>
        /// Update permanent location for a vehicle
        /// </summary>
        Task<FMSResponse<bool>> UpdatePermanentLocationAsync(int vehicleId, string location, int? workingSiteId, string updatedBy);

        /// <summary>
        /// Link vehicle offline status to issue tracking
        /// </summary>
        Task<FMSResponse<bool>> LinkToIssueTrackingAsync(int vehicleId, int issueTrackingId, string updatedBy);
    }
}
