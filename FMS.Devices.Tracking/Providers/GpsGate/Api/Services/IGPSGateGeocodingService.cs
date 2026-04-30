using System.Threading.Tasks;
using FMS.Application.Common;

namespace FMS.Infrastructure.ExternalServices.GPS.GPSGate.Services
{
    /// <summary>
    /// DTO for reverse geocoding response
    /// </summary>
    public class ReverseGeocodeResultDTO
    {
        public string? GeocoderProviderSource { get; set; }
        public string? Address { get; set; }
        public string? FormattedResult { get; set; }
        public decimal Latitude { get; set; }
        public decimal Longitude { get; set; }
        public decimal? Altitude { get; set; }
    }

    /// <summary>
    /// Service for handling reverse geocoding operations via GPSGate
    /// </summary>
    public interface IGPSGateGeocodingService
    {
        /// <summary>
        /// Perform reverse geocoding to get address from coordinates
        /// </summary>
        /// <param name="longitude">Longitude coordinate</param>
        /// <param name="latitude">Latitude coordinate</param>
        /// <returns>Reverse geocode result with formatted address</returns>
        Task<FMSResponse<ReverseGeocodeResultDTO>> ReverseGeocodeAsync(decimal longitude, decimal latitude);

        /// <summary>
        /// Perform reverse geocoding for a vehicle using its current location
        /// </summary>
        /// <param name="vehicleId">Vehicle ID</param>
        /// <returns>Reverse geocode result with formatted address</returns>
        Task<FMSResponse<ReverseGeocodeResultDTO>> ReverseGeocodeVehicleAsync(int vehicleId);
    }
}
