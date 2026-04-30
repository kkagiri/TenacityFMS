/**
 * File:          ITrackingDriverNameService.cs
 * Purpose:       Provider-neutral contract for updating tracking-system driver metadata.
 * Dependencies:  FMSResponse
 * Last Modified: 2026-04-30
 *
 * Key Functions:
 * - UpdateDriverNameAsync(): Updates driver metadata for a vehicle.
 */
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;

namespace FMS.Application.CommonInterface;

public interface ITrackingDriverNameService
{
    Task<FMSResponse<bool>> UpdateDriverNameAsync(int vehicleId, int employeeId, CancellationToken cancellationToken = default);
    Task<FMSResponse<bool>> UpdateDriverNameByNameAsync(int vehicleId, string driverFullName, CancellationToken cancellationToken = default);
    Task<FMSResponse<bool>> UpdateDriverNameByGpsUserIdAsync(int gpsGateUserId, string driverFullName, CancellationToken cancellationToken = default);
}
