using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.Vehicle.DTOs;

namespace FMS.Infrastructure.ExternalServices.GPS.GPSGate.Services
{
    /// <summary>
    /// Service for handling GPS events and alerts
    /// </summary>
    public interface IGPSGateEventService
    {
        /// <summary>
        /// Get all events for a vehicle within a time range
        /// </summary>
        Task<FMSResponse<List<GPSEventDTO>>> GetVehicleEventsAsync(int vehicleId, DateTime from, DateTime to);

        /// <summary>
        /// Get all events for all vehicles within a time range
        /// </summary>
        Task<FMSResponse<List<GPSEventDTO>>> GetAllEventsAsync(DateTime from, DateTime to);

        /// <summary>
        /// Acknowledge an event
        /// </summary>
        Task<FMSResponse<bool>> AcknowledgeEventAsync(int eventId, string acknowledgedBy);

        /// <summary>
        /// Get unacknowledged critical events
        /// </summary>
        Task<FMSResponse<List<GPSEventDTO>>> GetCriticalUnacknowledgedEventsAsync();
    }
}
