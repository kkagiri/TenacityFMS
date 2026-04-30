/**
 * File:          ITrackingTagTransferService.cs
 * Purpose:       Provider-neutral contract for moving vehicle tracking tags when site assignments change.
 * Dependencies:  FMSResponse
 * Last Modified: 2026-04-30
 *
 * Key Functions:
 * - MoveVehicleBetweenSiteTagsAsync(): Moves a vehicle between site tags in the active tracking provider.
 */
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;

namespace FMS.Application.CommonInterface;

public interface ITrackingTagTransferService
{
    Task<FMSResponse<object>> MoveVehicleBetweenSiteTagsAsync(
        int vehicleId,
        int fromSiteId,
        int toSiteId,
        CancellationToken cancellationToken = default);
}
