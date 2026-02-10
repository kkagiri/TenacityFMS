/**
 * File: IInTankDeliveryDetectionService.cs
 * Purpose: Interface for In-Tank Delivery auto-detection processing service
 * Dependencies: Intankdelivery entity, IActiveAlarmService, TankVolumeHistoryIntegrationService
 * Last Modified: 2026-02-10
 *
 * Key Functions:
 * - ProcessDetectedDeliveryAsync: Main entry point for processing a PTS-detected ITD
 * - TryMatchManualDeliveryAsync: Attempts to match ITD with existing manual delivery
 */
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Domain.Entities;
using FMS.Domain.Entities.Features.TankStockManagement;

namespace FMS.Application.Features.TankManagement.Deliveries.Services
{
    public interface IInTankDeliveryDetectionService
    {
        /// <summary>
        /// Processes a detected in-tank delivery: creates alerts, ledger entries, and attempts matching
        /// </summary>
        /// <param name="delivery">The saved Intankdelivery entity</param>
        /// <param name="tank">The resolved Tank entity (can be null if tank not found)</param>
        /// <param name="cancellationToken">Cancellation token</param>
        /// <returns>Response indicating processing result</returns>
        Task<FMSResponse> ProcessDetectedDeliveryAsync(
            Intankdelivery delivery,
            Tank? tank,
            CancellationToken cancellationToken = default);

        /// <summary>
        /// Attempts to match an ITD with an existing manual delivery entry
        /// </summary>
        Task<Delivery?> TryMatchManualDeliveryAsync(
            Intankdelivery delivery,
            int tankId,
            CancellationToken cancellationToken = default);
    }
}
