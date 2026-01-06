using System;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using StackExchange.Redis;

namespace FMS.Application.Features.PTS.Services
{
    /// <summary>
    /// Service for retrieving fuel grade prices from device status cached in Redis.
    /// Used for Volume/Amount presets to work correctly with dose cutoff.
    /// </summary>
    public class FuelPriceService : IFuelPriceService
    {
        private readonly IDatabase _redisDb;
        private readonly ILogger<FuelPriceService> _logger;

        public FuelPriceService(
            IConnectionMultiplexer redisConnection,
            ILogger<FuelPriceService> logger)
        {
            _redisDb = redisConnection.GetDatabase();
            _logger = logger;
        }

        /// <inheritdoc/>
        public async Task<decimal> GetFuelGradePriceAsync(string deviceId, int nozzleId, int? fuelGradeId)
        {
            try
            {
                // Get the cached upload status from Redis
                var statusKey = $"device:{deviceId}:status";
                var statusJson = await _redisDb.StringGetAsync(statusKey);

                if (statusJson.IsNullOrEmpty)
                {
                    _logger.LogDebug("[FuelPrice] No cached status found for device {DeviceId}", deviceId);
                    return 0;
                }

                var status = JsonSerializer.Deserialize<JsonElement>(statusJson);

                // Check if FuelGrades array exists
                if (!status.TryGetProperty("FuelGrades", out var fuelGradesElement) ||
                    fuelGradesElement.ValueKind != JsonValueKind.Array)
                {
                    _logger.LogDebug("[FuelPrice] No FuelGrades array found in cached status for device {DeviceId}", deviceId);
                    return 0;
                }

                var fuelGrades = fuelGradesElement.EnumerateArray().ToList();
                if (fuelGrades.Count == 0)
                {
                    _logger.LogDebug("[FuelPrice] FuelGrades array is empty for device {DeviceId}", deviceId);
                    return 0;
                }

                // If a specific fuel grade ID was requested, find it
                if (fuelGradeId.HasValue && fuelGradeId.Value > 0)
                {
                    foreach (var grade in fuelGrades)
                    {
                        if (grade.TryGetProperty("Id", out var idProp) && idProp.GetInt32() == fuelGradeId.Value)
                        {
                            if (grade.TryGetProperty("Price", out var priceProp))
                            {
                                var price = priceProp.GetDecimal();
                                _logger.LogDebug("[FuelPrice] Found price {Price} for fuel grade {FuelGradeId} on device {DeviceId}",
                                    price, fuelGradeId.Value, deviceId);
                                return price;
                            }
                        }
                    }
                }

                // Otherwise use the first fuel grade's price (most common case for single-product sites)
                var firstGrade = fuelGrades[0];
                if (firstGrade.TryGetProperty("Price", out var firstPriceProp))
                {
                    var price = firstPriceProp.GetDecimal();
                    _logger.LogDebug("[FuelPrice] Using first fuel grade price {Price} for device {DeviceId}",
                        price, deviceId);
                    return price;
                }

                return 0;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "[FuelPrice] Error getting fuel grade price from cached status for device {DeviceId}", deviceId);
                return 0;
            }
        }
    }
}
