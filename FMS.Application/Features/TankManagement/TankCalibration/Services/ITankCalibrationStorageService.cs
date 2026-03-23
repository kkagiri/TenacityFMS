/**
 * File: ITankCalibrationStorageService.cs
 * Purpose: Defines local persistence operations for tank calibration snapshots stored outside the domain layer.
 * Dependencies: System.Collections.Generic, System.Threading.Tasks, TankCalibration DTOs
 * Last Modified: 2026-03-23
 *
 * Key Functions:
 * - SaveSnapshotAsync(): Persists a full chart snapshot to local history.
 * - GetLatestSnapshotAsync(): Returns the latest snapshot for a tank and chart type.
 * - GetHistoryAsync(): Returns paged snapshot history for a tank.
 */
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Features.TankManagement.TankCalibration.DTOs;

namespace FMS.Application.Features.TankManagement.TankCalibration.Services
{
    public interface ITankCalibrationStorageService
    {
        Task<TankCalibrationSnapshotDto> SaveSnapshotAsync(TankCalibrationSnapshotDto snapshot, CancellationToken cancellationToken = default);
        Task<TankCalibrationSnapshotDto?> GetLatestSnapshotAsync(int tankId, string chartType, CancellationToken cancellationToken = default);
        Task<TankCalibrationSnapshotDto?> GetSnapshotByIdAsync(long snapshotId, CancellationToken cancellationToken = default);
        Task<(IReadOnlyList<TankCalibrationSnapshotHistoryItemDto> Items, int TotalCount)> GetHistoryAsync(
            int tankId,
            string? chartType,
            int pageNumber,
            int pageSize,
            CancellationToken cancellationToken = default);
    }
}