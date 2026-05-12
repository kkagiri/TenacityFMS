/**
 * File: ICalibrationLearningService.cs
 * Purpose: Defines the application-layer contract for extracting, summarizing, seeding, and generating FMS learned calibration data.
 * Dependencies: System, System.Collections.Generic, System.Threading.Tasks, TankCalibration DTOs
 * Last Modified: 2026-03-24
 *
 * Key Functions:
 * - ExtractDataPointsFromDispensingAsync(): Builds learned-calibration data points from dispensing events.
 * - ExtractDataPointsFromDeliveriesAsync(): Builds learned-calibration data points from delivery events.
 * - GetAccumulationSummaryAsync(): Returns interval coverage and readiness for a tank.
 * - GenerateLearnedChartAsync(): Produces a persisted FMS learned chart snapshot.
 * - SeedFromSnapshotAsync(): Seeds interval baselines from an existing chart snapshot.
 * - CompareChartsAsync(): Normalizes learned and PTS charts to common intervals and reports deviation.
 */
using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Features.TankManagement.TankCalibration.DTOs;

namespace FMS.Application.Features.TankManagement.TankCalibration.Services
{
    public interface ICalibrationLearningService
    {
        Task<IReadOnlyList<CalibrationDataPointDto>> ExtractDataPointsFromDispensingAsync(
            int tankId,
            DateTime? startDateUtc,
            DateTime? endDateUtc,
            CancellationToken cancellationToken = default);

        Task<IReadOnlyList<CalibrationDataPointDto>> ExtractDataPointsFromDeliveriesAsync(
            int tankId,
            DateTime? startDateUtc,
            DateTime? endDateUtc,
            CancellationToken cancellationToken = default);

        Task<CalibrationCoverageDto> GetAccumulationSummaryAsync(
            int tankId,
            CancellationToken cancellationToken = default);

        Task<TankCalibrationSnapshotDto> GenerateLearnedChartAsync(
            int tankId,
            CancellationToken cancellationToken = default);

        Task<CalibrationCoverageDto> SeedFromSnapshotAsync(
            int tankId,
            long snapshotId,
            CancellationToken cancellationToken = default);

        Task<IReadOnlyList<CalibrationComparisonDto>> CompareChartsAsync(
            int tankId,
            long? referenceSnapshotId,
            long? comparedSnapshotId,
            string? comparedChartType,
            CancellationToken cancellationToken = default);
    }
}