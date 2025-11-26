using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.ModelsDTOs.GPSGate;

namespace FMS.Application.CommonInterface
{
    /// <summary>
    /// Interface for GPS Gate Accumulator service operations
    /// </summary>
    public interface IGPSGateAccumulatorService
    {
        /// <summary>
        /// Gets all accumulators for a specific vehicle from GPS Gate
        /// </summary>
        Task<List<GPSGateAccumulator>> GetVehicleAccumulatorsAsync(int vehicleId, CancellationToken cancellationToken = default);

        /// <summary>
        /// Gets all accumulator type definitions from GPS Gate
        /// </summary>
        Task<List<GPSGateAccumulatorType>> GetAccumulatorTypesAsync(CancellationToken cancellationToken = default);

        /// <summary>
        /// Updates an accumulator value in GPS Gate
        /// </summary>
        Task<bool> UpdateAccumulatorAsync(int accumulatorId, int userId, int accumulatorTypeId, double value, string timestamp, CancellationToken cancellationToken = default);

        /// <summary>
        /// Gets the unit label for an accumulator type name
        /// </summary>
        string GetAccumulatorUnit(string typeName);
    }
}
