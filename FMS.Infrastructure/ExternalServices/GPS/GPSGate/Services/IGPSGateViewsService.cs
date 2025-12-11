using System.Collections.Generic;
using System.Threading.Tasks;
using FMS.Application.Common;

namespace FMS.Infrastructure.ExternalServices.GPS.GPSGate.Services
{
    /// <summary>
    /// DTO for GPSGate View
    /// </summary>
    public class GPSGateViewDTO
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public int ApplicationId { get; set; }
        public List<int> TagIds { get; set; } = new();
        public bool MatchAllTags { get; set; }
        public string? StatusFilter { get; set; }
    }

    /// <summary>
    /// DTO for GPSGate User/Vehicle from tag
    /// </summary>
    public class GPSGateUserDTO
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Surname { get; set; }
        public string? Description { get; set; }
        public string? Username { get; set; }
        public string? Email { get; set; }
        public string? PhoneNumber { get; set; }
        public string? DriverId { get; set; }
        public decimal? CalculatedSpeed { get; set; }
        public string? DeviceActivity { get; set; }
        public string? LastTransport { get; set; }

        // Position data
        public decimal? Latitude { get; set; }
        public decimal? Longitude { get; set; }
        public decimal? Altitude { get; set; }
        public decimal? GroundSpeed { get; set; }
        public decimal? Heading { get; set; }
        public string? UTC { get; set; }
        public bool IsPositionValid { get; set; }

        // Device info
        public string? DeviceIMEI { get; set; }
        public string? DeviceName { get; set; }
        public string? LastIP { get; set; }
        public string? Protocol { get; set; }

        // Computed properties
        public bool IsOnline => !string.IsNullOrEmpty(DeviceActivity) && IsPositionValid;
        public bool IsMoving => GroundSpeed.HasValue && GroundSpeed > 5;
    }

    /// <summary>
    /// Service for handling GPSGate Views and Tags operations
    /// </summary>
    public interface IGPSGateViewsService
    {
        /// <summary>
        /// Get all views (groups) from GPSGate
        /// </summary>
        Task<FMSResponse<List<GPSGateViewDTO>>> GetViewsAsync();

        /// <summary>
        /// Get users/vehicles by tag ID with their current positions
        /// </summary>
        /// <param name="tagId">Tag ID</param>
        /// <param name="fromIndex">Starting index for pagination</param>
        /// <param name="pageSize">Number of records per page</param>
        Task<FMSResponse<List<GPSGateUserDTO>>> GetUsersByTagAsync(int tagId, int fromIndex = 0, int pageSize = 1000);

        /// <summary>
        /// Get all tags from GPSGate
        /// </summary>
        Task<FMSResponse<List<GPSGateTagDTO>>> GetTagsAsync();
    }

    /// <summary>
    /// DTO for GPSGate Tag
    /// </summary>
    public class GPSGateTagDTO
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? Color { get; set; }
    }
}
