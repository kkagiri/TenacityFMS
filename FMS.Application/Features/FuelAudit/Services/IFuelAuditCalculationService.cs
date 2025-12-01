using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using FMS.Domain.Entities.FuelAudit;

namespace FMS.Application.Features.FuelAudit.Services
{
    /// <summary>
    /// Service interface for fuel audit calculations
    /// </summary>
    public interface IFuelAuditCalculationService
    {
        /// <summary>
        /// Fetches fresh GPS data for the audit period
        /// </summary>
        Task FetchGPSDataAsync(
            long auditId,
            DateTime startDate,
            DateTime endDate,
            CancellationToken cancellationToken = default);

        /// <summary>
        /// Calculates tanker/storage tank reconciliation
        /// Updates audit with opening, closing, deliveries, dispensed amounts
        /// </summary>
        Task CalculateTankerReconciliationAsync(
            Domain.Entities.FuelAudit.FuelAudit audit,
            CancellationToken cancellationToken = default);

        /// <summary>
        /// Calculates fleet fuel reconciliation (all vehicles)
        /// Populates vehicle positions and calculates fleet totals
        /// </summary>
        Task CalculateFleetReconciliationAsync(
            Domain.Entities.FuelAudit.FuelAudit audit,
            bool includePickupEstimation,
            CancellationToken cancellationToken = default);

        /// <summary>
        /// Calculates variances for the audit
        /// </summary>
        Task<List<FuelAuditVariance>> CalculateVariancesAsync(
            Domain.Entities.FuelAudit.FuelAudit audit,
            CancellationToken cancellationToken = default);

        /// <summary>
        /// Generates flags based on calculated variances and thresholds
        /// </summary>
        Task<List<FuelAuditFlag>> GenerateFlagsAsync(
            Domain.Entities.FuelAudit.FuelAudit audit,
            List<FuelAuditVariance> variances,
            CancellationToken cancellationToken = default);
    }
}
