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
        /// Gets all accumulators from GPS Gate for all vehicles (batch operation)
        /// </summary>
        /// <param name="pageSize">Number of records per page (default 1000)</param>
        /// <param name="cancellationToken">Cancellation token</param>
        /// <returns>All accumulator records</returns>
        Task<List<GPSGateAccumulator>> GetAllAccumulatorsAsync(int pageSize = 1000, CancellationToken cancellationToken = default);

        /// <summary>
        /// Updates an accumulator value in GPS Gate
        /// </summary>
        Task<bool> UpdateAccumulatorAsync(int accumulatorId, int userId, int accumulatorTypeId, double value, string timestamp, CancellationToken cancellationToken = default);

        /// <summary>
        /// Creates a new accumulator value in GPS Gate (for vehicles without existing accumulator)
        /// </summary>
        /// <param name="userId">GPSGate user ID for the vehicle</param>
        /// <param name="accumulatorTypeId">Accumulator type (1=Odometer, 2=Engine Hours)</param>
        /// <param name="value">Initial value</param>
        /// <param name="timestamp">Timestamp in ISO format</param>
        /// <param name="cancellationToken">Cancellation token</param>
        /// <returns>Created accumulator ID, or 0 if failed</returns>
        Task<int> CreateAccumulatorAsync(int userId, int accumulatorTypeId, double value, string timestamp, CancellationToken cancellationToken = default);

        /// <summary>
        /// Gets the unit label for an accumulator type name
        /// </summary>
        string GetAccumulatorUnit(string typeName);
    }
}
