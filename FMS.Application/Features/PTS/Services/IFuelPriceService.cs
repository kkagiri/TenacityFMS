using System.Threading.Tasks;

namespace FMS.Application.Features.PTS.Services
{
    /// <summary>
    /// Interface for retrieving fuel grade prices from device status.
    /// Used for Volume/Amount presets to work correctly with dose cutoff.
    /// </summary>
    public interface IFuelPriceService
    {
        /// <summary>
        /// Gets the fuel grade price from the device's cached upload status in Redis.
        /// According to jsonPTS protocol, the price must be sent or configured on the device
        /// for preset dose cutoff to work properly.
        /// </summary>
        /// <param name="deviceId">The PTS device ID</param>
        /// <param name="nozzleId">The nozzle being authorized (for future nozzle-specific pricing)</param>
        /// <param name="fuelGradeId">The fuel grade ID if specified</param>
        /// <returns>The fuel grade price, or 0 if not found</returns>
        Task<decimal> GetFuelGradePriceAsync(string deviceId, int nozzleId, int? fuelGradeId);
    }
}
