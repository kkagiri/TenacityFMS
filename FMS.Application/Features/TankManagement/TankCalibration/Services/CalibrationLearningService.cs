/**
 * File: CalibrationLearningService.cs
 * Purpose: Extracts FMS learned-calibration data points, maintains interval coverage, and builds learned-chart outputs.
 * Dependencies: GpsdataContext, ISystemConfigurationService, Tank calibration DTOs
 * Last Modified: 2026-03-24
 *
 * Key Functions:
 * - ExtractDataPointsFromDispensingAsync(): Correlates pump transactions with stable before/after tank measurements.
 * - ExtractDataPointsFromDeliveriesAsync(): Converts in-tank deliveries into learned-calibration observations.
 * - GetAccumulationSummaryAsync(): Returns interval readiness and coverage for a tank.
 * - GenerateLearnedChartAsync()/CompareChartsAsync(): Produces learned snapshots and interval deviation output.
 *
 * Stability Validation:
 *   Uses UploadStatusProbeReading (10-30s interval time-series) instead of Tankmeasurement
 *   (sparse, volume-change-only) for stability window checks, giving ~10-30 readings per
 *   5-minute window vs potentially &lt;2 from Tankmeasurement.
 */
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Features.TankManagement.TankCalibration.DTOs;
using FMS.Application.Features.TankManagement.TankCalibration.Events;
using FMS.Application.Services.Configuration;
using FMS.Domain.Entities;
using FMS.Domain.Entities.Features.TankStockManagement;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.TankManagement.TankCalibration.Services
{
    public class CalibrationLearningService : ICalibrationLearningService
    {
        private const string DispensingSourceType = "dispensing";
        private const string DeliverySourceType = "delivery";
        private const string LearnedChartSource = "fms-learned-generation";

        /// <summary>
        /// Lightweight projection shared by Tankmeasurement and UploadStatusProbeReading
        /// so stability-window logic is source-agnostic.
        /// </summary>
        private sealed record StabilityReading(DateTime DateTime, double Height);

        private readonly GpsdataContext _context;
        private readonly IMediator _mediator;
        private readonly ITankCalibrationStorageService _storageService;
        private readonly ISystemConfigurationService _systemConfigurationService;
        private readonly ILogger<CalibrationLearningService> _logger;

        public CalibrationLearningService(
            GpsdataContext context,
            IMediator mediator,
            ITankCalibrationStorageService storageService,
            ISystemConfigurationService systemConfigurationService,
            ILogger<CalibrationLearningService> logger)
        {
            _context = context;
            _mediator = mediator;
            _storageService = storageService;
            _systemConfigurationService = systemConfigurationService;
            _logger = logger;
        }

        public async Task<IReadOnlyList<CalibrationDataPointDto>> ExtractDataPointsFromDispensingAsync(
            int tankId,
            DateTime? startDateUtc,
            DateTime? endDateUtc,
            CancellationToken cancellationToken = default)
        {
            ValidateDateRange(startDateUtc, endDateUtc);

            var settings = await LoadSettingsAsync(cancellationToken);
            if (!settings.LearningEnabled)
            {
                _logger.LogInformation(
                    "Skipping dispensing calibration extraction for TankId {TankId} because Calibration.LearningEnabled is false.",
                    tankId);
                return Array.Empty<CalibrationDataPointDto>();
            }

            var transactions = await _context.Pumptransactions
                .AsNoTracking()
                .Where(transaction => transaction.TankId == tankId
                    && !transaction.IsTransferMode
                    && transaction.Volume.HasValue
                    && transaction.Volume.Value > 0
                    && (!startDateUtc.HasValue || transaction.DateTime >= startDateUtc.Value)
                    && (!endDateUtc.HasValue || transaction.DateTime <= endDateUtc.Value))
                .OrderBy(transaction => transaction.DateTimeStart ?? transaction.DateTime)
                .ThenBy(transaction => transaction.DateTime)
                .ToListAsync(cancellationToken);

            if (transactions.Count == 0)
            {
                return Array.Empty<CalibrationDataPointDto>();
            }

            var measurementWindowStart = transactions
                .Select(GetPumpTransactionStartUtc)
                .Min()
                .AddMinutes(-(settings.StabilityWindowMinutes * 2));

            var measurementWindowEnd = transactions
                .Select(transaction => transaction.DateTime)
                .Max()
                .AddMinutes(settings.StabilityWindowMinutes * 2);

            var probeReadings = await LoadProbeReadingsForStabilityAsync(
                tankId,
                measurementWindowStart,
                measurementWindowEnd,
                cancellationToken);

            var deliveries = await LoadDeliveriesAsync(
                tankId,
                measurementWindowStart,
                measurementWindowEnd,
                cancellationToken);

            var existingEventIds = (await _context.CalibrationDataPoints
                .AsNoTracking()
                .Where(dataPoint => dataPoint.TankId == tankId
                    && dataPoint.SourceType == DispensingSourceType)
                .Select(dataPoint => dataPoint.SourceEventId)
                .ToListAsync(cancellationToken))
                .ToHashSet();
            var previousUnprocessedCount = await _context.CalibrationDataPoints
                .AsNoTracking()
                .CountAsync(dataPoint => dataPoint.TankId == tankId && !dataPoint.IsProcessed, cancellationToken);

            var createdDtos = new List<CalibrationDataPointDto>();
            var newEntities = new List<CalibrationDataPoint>();

            foreach (var transaction in transactions)
            {
                if (existingEventIds.Contains(transaction.Id))
                {
                    continue;
                }

                var eventStartUtc = GetPumpTransactionStartUtc(transaction);
                var eventEndUtc = transaction.DateTime < eventStartUtc
                    ? eventStartUtc
                    : transaction.DateTime;

                var beforeReading = FindStableMeasurementBefore(probeReadings, eventStartUtc, settings);
                var afterReading = FindStableMeasurementAfter(probeReadings, eventEndUtc, settings);

                if (beforeReading == null || afterReading == null)
                {
                    continue;
                }

                if (HasOverlappingDispensingEvent(transactions, transaction, beforeReading.DateTime, afterReading.DateTime)
                    || HasOverlappingDelivery(deliveries, beforeReading.DateTime, afterReading.DateTime))
                {
                    continue;
                }

                var heightBeforeMm = Convert.ToDecimal(beforeReading.Height);
                var heightAfterMm = Convert.ToDecimal(afterReading.Height);
                var heightDeltaMm = heightBeforeMm - heightAfterMm;
                if (heightDeltaMm <= 0)
                {
                    continue;
                }

                var volumeChangeLitres = transaction.Volume!.Value;
                if (volumeChangeLitres < settings.MinVolumeChangeLitres)
                {
                    continue;
                }

                var heightIntervalMm = CalculateHeightInterval(heightBeforeMm, heightAfterMm, settings.HeightIntervalMm);
                var volumePerMm = Math.Round(volumeChangeLitres / heightDeltaMm, 6, MidpointRounding.AwayFromZero);

                var entity = new CalibrationDataPoint
                {
                    TankId = tankId,
                    HeightBefore = Math.Round(heightBeforeMm, 3, MidpointRounding.AwayFromZero),
                    HeightAfter = Math.Round(heightAfterMm, 3, MidpointRounding.AwayFromZero),
                    VolumeChange = Math.Round(volumeChangeLitres, 3, MidpointRounding.AwayFromZero),
                    HeightInterval = heightIntervalMm,
                    VolumePerMm = volumePerMm,
                    SourceType = DispensingSourceType,
                    SourceEventId = transaction.Id,
                    RecordedAtUtc = transaction.DateTime,
                    IsProcessed = false,
                };

                newEntities.Add(entity);
            }

            if (newEntities.Count == 0)
            {
                return Array.Empty<CalibrationDataPointDto>();
            }

            var executionStrategy = _context.Database.CreateExecutionStrategy();
            await executionStrategy.ExecuteAsync(async () =>
            {
                await using var databaseTransaction = await _context.Database.BeginTransactionAsync(cancellationToken);

                _context.CalibrationDataPoints.AddRange(newEntities);
                await _context.SaveChangesAsync(cancellationToken);

                await RebuildIntervalAccumulationsAsync(tankId, settings, cancellationToken);
                await databaseTransaction.CommitAsync(cancellationToken);
            });

            await PublishReadinessNotificationIfThresholdCrossedAsync(
                tankId,
                newEntities.Count,
                previousUnprocessedCount,
                settings,
                cancellationToken);

            createdDtos.AddRange(newEntities.Select(MapToDataPointDto));

            _logger.LogInformation(
                "Created {Count} dispensing calibration data points for TankId {TankId}.",
                createdDtos.Count,
                tankId);

            return createdDtos;
        }

        public async Task<IReadOnlyList<CalibrationDataPointDto>> ExtractDataPointsFromDeliveriesAsync(
            int tankId,
            DateTime? startDateUtc,
            DateTime? endDateUtc,
            CancellationToken cancellationToken = default)
        {
            ValidateDateRange(startDateUtc, endDateUtc);

            var settings = await LoadSettingsAsync(cancellationToken);
            if (!settings.LearningEnabled)
            {
                _logger.LogInformation(
                    "Skipping delivery calibration extraction for TankId {TankId} because Calibration.LearningEnabled is false.",
                    tankId);
                return Array.Empty<CalibrationDataPointDto>();
            }

            var deliveries = await _context.Intankdeliveries
                .AsNoTracking()
                .Where(delivery => delivery.TankId == tankId
                    && delivery.StartDateTime.HasValue
                    && delivery.EndDateTime.HasValue
                    && delivery.StartProductHeight.HasValue
                    && delivery.EndProductHeight.HasValue
                    && delivery.AbsoluteProductVolume.HasValue
                    && delivery.Status != "Rejected"
                    && (!startDateUtc.HasValue || delivery.EndDateTime.Value >= startDateUtc.Value)
                    && (!endDateUtc.HasValue || delivery.StartDateTime.Value <= endDateUtc.Value))
                .OrderBy(delivery => delivery.StartDateTime)
                .ThenBy(delivery => delivery.EndDateTime)
                .ToListAsync(cancellationToken);

            if (deliveries.Count == 0)
            {
                return Array.Empty<CalibrationDataPointDto>();
            }

            var measurementWindowStart = deliveries
                .Where(delivery => delivery.StartDateTime.HasValue)
                .Min(delivery => delivery.StartDateTime!.Value)
                .AddMinutes(-(settings.StabilityWindowMinutes * 2));

            var measurementWindowEnd = deliveries
                .Where(delivery => delivery.EndDateTime.HasValue)
                .Max(delivery => delivery.EndDateTime!.Value)
                .AddMinutes(settings.StabilityWindowMinutes * 2);

            var probeReadings = await LoadProbeReadingsForStabilityAsync(
                tankId,
                measurementWindowStart,
                measurementWindowEnd,
                cancellationToken);

            var existingEventIds = (await _context.CalibrationDataPoints
                .AsNoTracking()
                .Where(dataPoint => dataPoint.TankId == tankId
                    && dataPoint.SourceType == DeliverySourceType)
                .Select(dataPoint => dataPoint.SourceEventId)
                .ToListAsync(cancellationToken))
                .ToHashSet();
            var previousUnprocessedCount = await _context.CalibrationDataPoints
                .AsNoTracking()
                .CountAsync(dataPoint => dataPoint.TankId == tankId && !dataPoint.IsProcessed, cancellationToken);

            var newEntities = new List<CalibrationDataPoint>();

            foreach (var delivery in deliveries)
            {
                if (existingEventIds.Contains(delivery.DeliveryId))
                {
                    continue;
                }

                var eventStartUtc = delivery.StartDateTime!.Value;
                var eventEndUtc = delivery.EndDateTime!.Value < eventStartUtc
                    ? eventStartUtc
                    : delivery.EndDateTime.Value;

                if (!HasStableWindow(probeReadings, eventStartUtc.AddMinutes(-settings.StabilityWindowMinutes), eventStartUtc, settings)
                    || !HasStableWindow(probeReadings, eventEndUtc, eventEndUtc.AddMinutes(settings.StabilityWindowMinutes), settings))
                {
                    continue;
                }

                var heightBeforeMm = Convert.ToDecimal(delivery.StartProductHeight!.Value);
                var heightAfterMm = Convert.ToDecimal(delivery.EndProductHeight!.Value);
                var heightDeltaMm = heightAfterMm - heightBeforeMm;
                if (heightDeltaMm <= 0)
                {
                    continue;
                }

                var grossDeliveryVolumeLitres = Convert.ToDecimal(delivery.AbsoluteProductVolume!.Value);
                var dispensedDuringDeliveryLitres = delivery.PumpsDispensedVolume.HasValue
                    ? Convert.ToDecimal(delivery.PumpsDispensedVolume.Value)
                    : 0m;

                var netVolumeChangeLitres = grossDeliveryVolumeLitres - dispensedDuringDeliveryLitres;
                if (netVolumeChangeLitres < settings.MinVolumeChangeLitres)
                {
                    continue;
                }

                var heightIntervalMm = CalculateHeightInterval(heightBeforeMm, heightAfterMm, settings.HeightIntervalMm);
                var volumePerMm = Math.Round(netVolumeChangeLitres / heightDeltaMm, 6, MidpointRounding.AwayFromZero);

                newEntities.Add(new CalibrationDataPoint
                {
                    TankId = tankId,
                    HeightBefore = Math.Round(heightBeforeMm, 3, MidpointRounding.AwayFromZero),
                    HeightAfter = Math.Round(heightAfterMm, 3, MidpointRounding.AwayFromZero),
                    VolumeChange = Math.Round(netVolumeChangeLitres, 3, MidpointRounding.AwayFromZero),
                    HeightInterval = heightIntervalMm,
                    VolumePerMm = volumePerMm,
                    SourceType = DeliverySourceType,
                    SourceEventId = delivery.DeliveryId,
                    RecordedAtUtc = eventEndUtc,
                    IsProcessed = false,
                });
            }

            if (newEntities.Count == 0)
            {
                return Array.Empty<CalibrationDataPointDto>();
            }

            var executionStrategy = _context.Database.CreateExecutionStrategy();
            var createdDtos = await executionStrategy.ExecuteAsync(async () =>
            {
                await using var databaseTransaction = await _context.Database.BeginTransactionAsync(cancellationToken);

                _context.CalibrationDataPoints.AddRange(newEntities);
                await _context.SaveChangesAsync(cancellationToken);

                await RebuildIntervalAccumulationsAsync(tankId, settings, cancellationToken);
                await databaseTransaction.CommitAsync(cancellationToken);

                return newEntities.Select(MapToDataPointDto).ToList();
            });

            await PublishReadinessNotificationIfThresholdCrossedAsync(
                tankId,
                createdDtos.Count,
                previousUnprocessedCount,
                settings,
                cancellationToken);

            _logger.LogInformation(
                "Created {Count} delivery calibration data points for TankId {TankId}.",
                createdDtos.Count,
                tankId);

            return createdDtos;
        }

        public async Task<CalibrationCoverageDto> GetAccumulationSummaryAsync(
            int tankId,
            CancellationToken cancellationToken = default)
        {
            var settings = await LoadSettingsAsync(cancellationToken);
            var tank = await _context.Tanks
                .AsNoTracking()
                .Where(item => item.Id == tankId)
                .Select(item => new { item.Id, item.TankHeight })
                .FirstOrDefaultAsync(cancellationToken);

            var accumulations = await _context.CalibrationIntervalAccumulations
                .AsNoTracking()
                .Where(item => item.TankId == tankId)
                .OrderBy(item => item.IntervalStartMm)
                .ToListAsync(cancellationToken);

            var intervalLookup = accumulations.ToDictionary(item => item.IntervalStartMm);
            var configuredIntervalCount = tank?.TankHeight.HasValue == true && tank.TankHeight.Value > 0
                ? Math.Max(1, (int)Math.Ceiling(tank.TankHeight.Value / settings.HeightIntervalMm))
                : 0;

            var maxObservedIntervalCount = accumulations.Count > 0
                ? accumulations.Max(item => Math.Max(1, item.IntervalEndMm / settings.HeightIntervalMm))
                : 0;

            var totalIntervalCount = Math.Max(configuredIntervalCount, maxObservedIntervalCount);
            if (totalIntervalCount == 0 && accumulations.Count > 0)
            {
                totalIntervalCount = accumulations.Count;
            }

            var intervals = new List<CalibrationIntervalSummaryDto>();
            for (var index = 0; index < totalIntervalCount; index++)
            {
                var intervalStartMm = index * settings.HeightIntervalMm;
                if (!intervalLookup.TryGetValue(intervalStartMm, out var accumulation))
                {
                    intervals.Add(new CalibrationIntervalSummaryDto
                    {
                        IntervalStartMm = intervalStartMm,
                        IntervalEndMm = intervalStartMm + settings.HeightIntervalMm,
                        ObservationCount = 0,
                        MeanVolumePerMm = 0,
                        StdDevVolumePerMm = 0,
                        CoverageState = CalibrationCoverageStates.Empty,
                        IsReady = false,
                    });
                    continue;
                }

                var coverageState = accumulation.ObservationCount >= settings.MinObservationsPerInterval
                    ? CalibrationCoverageStates.Ready
                    : accumulation.ObservationCount > 0 || CalibrationLearningChartMath.IsSeededBaseline(accumulation)
                        ? CalibrationCoverageStates.Sparse
                        : CalibrationCoverageStates.Empty;

                intervals.Add(new CalibrationIntervalSummaryDto
                {
                    IntervalStartMm = accumulation.IntervalStartMm,
                    IntervalEndMm = accumulation.IntervalEndMm,
                    ObservationCount = accumulation.ObservationCount,
                    MeanVolumePerMm = accumulation.MeanVolumePerMm,
                    StdDevVolumePerMm = accumulation.StdDevVolumePerMm,
                    CoverageState = coverageState,
                    IsReady = string.Equals(coverageState, CalibrationCoverageStates.Ready, StringComparison.Ordinal),
                });
            }

            var readyIntervalCount = intervals.Count(item => item.IsReady);
            var sparseIntervalCount = intervals.Count(item => string.Equals(item.CoverageState, CalibrationCoverageStates.Sparse, StringComparison.Ordinal));
            var emptyIntervalCount = intervals.Count(item => string.Equals(item.CoverageState, CalibrationCoverageStates.Empty, StringComparison.Ordinal));

            return new CalibrationCoverageDto
            {
                TankId = tankId,
                HeightIntervalMm = settings.HeightIntervalMm,
                MinObservationsPerInterval = settings.MinObservationsPerInterval,
                TotalIntervalCount = intervals.Count,
                ReadyIntervalCount = readyIntervalCount,
                SparseIntervalCount = sparseIntervalCount,
                EmptyIntervalCount = emptyIntervalCount,
                CoveragePercentage = intervals.Count == 0 ? 0 : Math.Round((double)readyIntervalCount / intervals.Count * 100.0, 2),
                LastUpdatedUtc = accumulations.Count == 0 ? null : accumulations.Max(item => item.LastUpdatedUtc),
                Intervals = intervals,
            };
        }

        public async Task<TankCalibrationSnapshotDto> GenerateLearnedChartAsync(
            int tankId,
            CancellationToken cancellationToken = default)
        {
            var settings = await LoadSettingsAsync(cancellationToken);
            if (!settings.LearningEnabled)
            {
                throw new InvalidOperationException("FMS learned calibration is disabled in system configuration.");
            }

            var tank = await _context.Tanks
                .AsNoTracking()
                .Where(item => item.Id == tankId)
                .Select(item => new
                {
                    item.Id,
                    item.Name,
                    item.PtsId,
                    item.ProbeNumber,
                    item.TankHeight,
                })
                .FirstOrDefaultAsync(cancellationToken);

            if (tank == null)
            {
                throw new InvalidOperationException($"Tank {tankId} was not found.");
            }

            var accumulations = await _context.CalibrationIntervalAccumulations
                .AsNoTracking()
                .Where(item => item.TankId == tankId)
                .OrderBy(item => item.IntervalStartMm)
                .ToListAsync(cancellationToken);

            if (accumulations.Count == 0)
            {
                throw new InvalidOperationException("No learned-calibration interval accumulation data exists for this tank.");
            }

            var intervalLookup = accumulations.ToDictionary(item => item.IntervalStartMm);
            var configuredIntervalCount = tank.TankHeight.HasValue && tank.TankHeight.Value > 0
                ? Math.Max(1, (int)Math.Ceiling(tank.TankHeight.Value / settings.HeightIntervalMm))
                : 0;

            var maxObservedIntervalCount = accumulations.Max(item => Math.Max(1, item.IntervalEndMm / settings.HeightIntervalMm));
            var totalIntervalCount = Math.Max(configuredIntervalCount, maxObservedIntervalCount);

            var records = new List<TankCalibrationRecordDto>
            {
                new()
                {
                    Height = 0,
                    Volume = 0,
                }
            };

            var readyIntervalStarts = new HashSet<int>();
            var readyIntervalCount = 0;
            var seededIntervalCount = 0;
            var sparseIntervalCount = 0;
            var emptyIntervalCount = 0;
            var gapIntervalCount = 0;
            decimal cumulativeVolume = 0m;

            for (var index = 0; index < totalIntervalCount; index++)
            {
                var intervalStartMm = index * settings.HeightIntervalMm;
                if (!intervalLookup.TryGetValue(intervalStartMm, out var accumulation))
                {
                    emptyIntervalCount++;
                    gapIntervalCount++;
                    continue;
                }

                var isSeededInterval = CalibrationLearningChartMath.IsSeededBaseline(accumulation);
                if (accumulation.ObservationCount < settings.MinObservationsPerInterval && !isSeededInterval)
                {
                    sparseIntervalCount++;
                    gapIntervalCount++;
                    continue;
                }

                if (isSeededInterval)
                {
                    seededIntervalCount++;
                }
                else
                {
                    readyIntervalCount++;
                    readyIntervalStarts.Add(intervalStartMm);
                }

                cumulativeVolume += accumulation.MeanVolumePerMm * settings.HeightIntervalMm;

                records.Add(new TankCalibrationRecordDto
                {
                    Height = accumulation.IntervalEndMm,
                    Volume = (int)Math.Round(cumulativeVolume, MidpointRounding.AwayFromZero),
                });
            }

            if (readyIntervalCount == 0 && seededIntervalCount == 0 || records.Count <= 1)
            {
                throw new InvalidOperationException("No learned-calibration intervals are available from observed or seeded baseline data.");
            }

            var notes = CalibrationLearningChartMath.BuildLearnedChartNotes(
                readyIntervalCount,
                seededIntervalCount,
                sparseIntervalCount,
                emptyIntervalCount,
                totalIntervalCount,
                gapIntervalCount,
                settings.MinObservationsPerInterval);

            var snapshot = new TankCalibrationSnapshotDto
            {
                TankId = tank.Id,
                TankName = tank.Name,
                PtsDeviceId = tank.PtsId ?? string.Empty,
                ProbeNumber = tank.ProbeNumber ?? 0,
                ChartType = TankCalibrationChartTypes.FmsLearned,
                Source = LearnedChartSource,
                TotalRecords = records.Count,
                RecordedAtUtc = DateTime.UtcNow,
                RecordedBy = "System",
                Notes = notes,
                Records = records,
            };

            var executionStrategy = _context.Database.CreateExecutionStrategy();
            var savedSnapshot = await executionStrategy.ExecuteAsync(async () =>
            {
                await using var databaseTransaction = await _context.Database.BeginTransactionAsync(cancellationToken);

                var trackedDataPoints = await _context.CalibrationDataPoints
                    .Where(item => item.TankId == tankId)
                    .ToListAsync(cancellationToken);

                foreach (var dataPoint in trackedDataPoints)
                {
                    dataPoint.IsProcessed = readyIntervalStarts.Contains(dataPoint.HeightInterval);
                }

                await _context.SaveChangesAsync(cancellationToken);
                var persistedSnapshot = await _storageService.SaveSnapshotAsync(snapshot, cancellationToken);
                await databaseTransaction.CommitAsync(cancellationToken);

                return persistedSnapshot;
            });

            _logger.LogInformation(
                "Generated FMS learned calibration chart for TankId {TankId} with {RecordCount} records and {ReadyIntervalCount}/{TotalIntervalCount} ready intervals.",
                tankId,
                savedSnapshot.TotalRecords,
                readyIntervalCount,
                totalIntervalCount);

            return savedSnapshot;
        }

        public async Task<IReadOnlyList<CalibrationComparisonDto>> CompareChartsAsync(
            int tankId,
            long? referenceSnapshotId,
            long? comparedSnapshotId,
            string? comparedChartType,
            CancellationToken cancellationToken = default)
        {
            var settings = await LoadSettingsAsync(cancellationToken);

            var referenceSnapshot = referenceSnapshotId.HasValue
                ? await _storageService.GetSnapshotByIdAsync(referenceSnapshotId.Value, cancellationToken)
                : await _storageService.GetLatestSnapshotAsync(tankId, TankCalibrationChartTypes.FmsLearned, cancellationToken);

            if (referenceSnapshot == null)
            {
                throw new InvalidOperationException("Reference calibration snapshot was not found.");
            }

            if (referenceSnapshot.TankId != tankId)
            {
                throw new InvalidOperationException(
                    $"Reference calibration snapshot {referenceSnapshot.Id} belongs to TankId {referenceSnapshot.TankId}, not TankId {tankId}.");
            }

            TankCalibrationSnapshotDto? comparedSnapshot;
            if (comparedSnapshotId.HasValue)
            {
                comparedSnapshot = await _storageService.GetSnapshotByIdAsync(comparedSnapshotId.Value, cancellationToken);
            }
            else
            {
                if (string.IsNullOrWhiteSpace(comparedChartType))
                {
                    throw new ArgumentException("Compared snapshot ID or compared chart type must be provided.");
                }

                if (!TankCalibrationChartTypes.IsSupported(comparedChartType))
                {
                    throw new InvalidOperationException($"Unsupported compared chart type '{comparedChartType}'.");
                }

                comparedSnapshot = await _storageService.GetLatestSnapshotAsync(
                    tankId,
                    TankCalibrationChartTypes.Normalize(comparedChartType),
                    cancellationToken);
            }

            if (comparedSnapshot == null)
            {
                throw new InvalidOperationException("Compared calibration snapshot was not found.");
            }

            if (comparedSnapshot.TankId != tankId)
            {
                throw new InvalidOperationException(
                    $"Compared calibration snapshot {comparedSnapshot.Id} belongs to TankId {comparedSnapshot.TankId}, not TankId {tankId}.");
            }

            var accumulations = await _context.CalibrationIntervalAccumulations
                .AsNoTracking()
                .Where(item => item.TankId == tankId)
                .ToListAsync(cancellationToken);

            var comparisons = CalibrationLearningChartMath.BuildComparison(
                referenceSnapshot.Records,
                comparedSnapshot.Records,
                accumulations.ToDictionary(item => item.IntervalStartMm),
                settings.HeightIntervalMm,
                settings.MinObservationsPerInterval,
                TankCalibrationChartTypes.Normalize(referenceSnapshot.ChartType),
                TankCalibrationChartTypes.Normalize(comparedSnapshot.ChartType));

            _logger.LogInformation(
                "Compared calibration charts for TankId {TankId}: ReferenceSnapshotId {ReferenceSnapshotId}, ComparedSnapshotId {ComparedSnapshotId}, ResultCount {ResultCount}.",
                tankId,
                referenceSnapshot.Id,
                comparedSnapshot.Id,
                comparisons.Count);

            return comparisons;
        }

        public async Task<CalibrationCoverageDto> SeedFromSnapshotAsync(
            int tankId,
            long snapshotId,
            CancellationToken cancellationToken = default)
        {
            var settings = await LoadSettingsAsync(cancellationToken);
            if (!settings.LearningEnabled)
            {
                throw new InvalidOperationException("FMS learned calibration is disabled in system configuration.");
            }

            var tankExists = await _context.Tanks
                .AsNoTracking()
                .AnyAsync(item => item.Id == tankId, cancellationToken);

            if (!tankExists)
            {
                throw new InvalidOperationException($"Tank {tankId} was not found.");
            }

            var snapshot = await _storageService.GetSnapshotByIdAsync(snapshotId, cancellationToken);
            if (snapshot == null)
            {
                throw new InvalidOperationException($"Calibration snapshot {snapshotId} was not found.");
            }

            if (snapshot.TankId != tankId)
            {
                throw new InvalidOperationException(
                    $"Calibration snapshot {snapshotId} belongs to TankId {snapshot.TankId}, not TankId {tankId}.");
            }

            var normalizedChartType = TankCalibrationChartTypes.Normalize(snapshot.ChartType);
            if (string.Equals(normalizedChartType, TankCalibrationChartTypes.FmsLearned, StringComparison.OrdinalIgnoreCase))
            {
                throw new InvalidOperationException("An existing FMS learned chart cannot be used as a bootstrap seed snapshot.");
            }

            var normalizedRecords = snapshot.Records
                .Where(record => record.Height >= 0)
                .GroupBy(record => record.Height)
                .Select(group => group.OrderByDescending(item => item.Volume).First())
                .OrderBy(record => record.Height)
                .ToList();

            if (normalizedRecords.Count < 2)
            {
                throw new InvalidOperationException("Seed snapshot must contain at least two calibration records.");
            }

            var seededBaselines = CalibrationLearningChartMath.BuildSeededIntervalBaselines(normalizedRecords, settings.HeightIntervalMm);
            if (seededBaselines.Count == 0)
            {
                throw new InvalidOperationException("Seed snapshot does not contain any usable interval ranges for learned calibration bootstrap.");
            }

            var executionStrategy = _context.Database.CreateExecutionStrategy();
            var coverage = await executionStrategy.ExecuteAsync(async () =>
            {
                await using var databaseTransaction = await _context.Database.BeginTransactionAsync(cancellationToken);

                var accumulations = await _context.CalibrationIntervalAccumulations
                    .Where(item => item.TankId == tankId)
                    .ToListAsync(cancellationToken);

                var accumulationLookup = accumulations.ToDictionary(item => item.IntervalStartMm);
                var seededIntervals = seededBaselines.Keys.ToHashSet();
                var nowUtc = DateTime.UtcNow;

                foreach (var staleSeed in accumulations.Where(item => CalibrationLearningChartMath.IsSeededBaseline(item) && !seededIntervals.Contains(item.IntervalStartMm)))
                {
                    _context.CalibrationIntervalAccumulations.Remove(staleSeed);
                }

                foreach (var seededBaseline in seededBaselines)
                {
                    if (accumulationLookup.TryGetValue(seededBaseline.Key, out var existingAccumulation)
                        && existingAccumulation.ObservationCount > 0)
                    {
                        continue;
                    }

                    if (!accumulationLookup.TryGetValue(seededBaseline.Key, out var accumulation))
                    {
                        accumulation = new CalibrationIntervalAccumulation
                        {
                            TankId = tankId,
                            IntervalStartMm = seededBaseline.Key,
                            IntervalEndMm = seededBaseline.Key + settings.HeightIntervalMm,
                        };

                        _context.CalibrationIntervalAccumulations.Add(accumulation);
                    }

                    accumulation.ObservationCount = 0;
                    accumulation.MeanVolumePerMm = Math.Round(seededBaseline.Value, 6, MidpointRounding.AwayFromZero);
                    accumulation.StdDevVolumePerMm = 0;
                    accumulation.LastUpdatedUtc = nowUtc;
                    accumulation.SeededFromSnapshotId = snapshotId;
                }

                await _context.SaveChangesAsync(cancellationToken);
                await databaseTransaction.CommitAsync(cancellationToken);

                return await GetAccumulationSummaryAsync(tankId, cancellationToken);
            });

            _logger.LogInformation(
                "Seeded {IntervalCount} learned-calibration baseline intervals for TankId {TankId} from SnapshotId {SnapshotId} ({ChartType}).",
                seededBaselines.Count,
                tankId,
                snapshotId,
                normalizedChartType);

            return coverage;
        }

        private async Task<List<Tankmeasurement>> LoadTankMeasurementsAsync(
            int tankId,
            DateTime rangeStartUtc,
            DateTime rangeEndUtc,
            CancellationToken cancellationToken)
        {
            return await _context.Tankmeasurements
                .AsNoTracking()
                .Where(measurement => measurement.TankId == tankId
                    && measurement.ProductHeight.HasValue
                    && measurement.DateTime >= rangeStartUtc
                    && measurement.DateTime <= rangeEndUtc)
                .OrderBy(measurement => measurement.DateTime)
                .ToListAsync(cancellationToken);
        }

        private async Task<List<StabilityReading>> LoadProbeReadingsForStabilityAsync(
            int tankId,
            DateTime rangeStartUtc,
            DateTime rangeEndUtc,
            CancellationToken cancellationToken)
        {
            return await _context.UploadStatusProbeReadings
                .AsNoTracking()
                .Where(reading => reading.TankId == tankId
                    && reading.ProductHeight.HasValue
                    && reading.DateTime >= rangeStartUtc
                    && reading.DateTime <= rangeEndUtc)
                .OrderBy(reading => reading.DateTime)
                .Select(reading => new StabilityReading(reading.DateTime, reading.ProductHeight!.Value))
                .ToListAsync(cancellationToken);
        }

        private async Task<List<Intankdelivery>> LoadDeliveriesAsync(
            int tankId,
            DateTime rangeStartUtc,
            DateTime rangeEndUtc,
            CancellationToken cancellationToken)
        {
            return await _context.Intankdeliveries
                .AsNoTracking()
                .Where(delivery => delivery.TankId == tankId
                    && delivery.StartDateTime.HasValue
                    && delivery.EndDateTime.HasValue
                    && delivery.StartDateTime.Value <= rangeEndUtc
                    && delivery.EndDateTime.Value >= rangeStartUtc
                    && delivery.Status != "Rejected")
                .OrderBy(delivery => delivery.StartDateTime)
                .ToListAsync(cancellationToken);
        }

        private async Task RebuildIntervalAccumulationsAsync(
            int tankId,
            CalibrationLearningSettings settings,
            CancellationToken cancellationToken)
        {
            var allDataPoints = await _context.CalibrationDataPoints
                .Where(dataPoint => dataPoint.TankId == tankId)
                .ToListAsync(cancellationToken);

            var groupedPoints = allDataPoints
                .Where(dataPoint => dataPoint.TankId == tankId)
                .GroupBy(dataPoint => dataPoint.HeightInterval)
                .Select(group => new
                {
                    HeightInterval = group.Key,
                    ObservationCount = group.Count(),
                    MeanVolumePerMm = group.Average(item => item.VolumePerMm),
                    Values = group.Select(item => item.VolumePerMm).ToList(),
                })
                .ToList();

            var existingAccumulations = await _context.CalibrationIntervalAccumulations
                .Where(item => item.TankId == tankId)
                .ToListAsync(cancellationToken);

            var existingLookup = existingAccumulations.ToDictionary(item => item.IntervalStartMm);
            var activeIntervalKeys = groupedPoints.Select(item => item.HeightInterval).ToHashSet();

            foreach (var staleAccumulation in existingAccumulations.Where(item => !activeIntervalKeys.Contains(item.IntervalStartMm) && !CalibrationLearningChartMath.IsSeededBaseline(item)))
            {
                _context.CalibrationIntervalAccumulations.Remove(staleAccumulation);
            }

            var nowUtc = DateTime.UtcNow;
            foreach (var group in groupedPoints)
            {
                var stdDev = CalculateStandardDeviation(group.Values.Select(value => (double)value));

                if (!existingLookup.TryGetValue(group.HeightInterval, out var accumulation))
                {
                    accumulation = new CalibrationIntervalAccumulation
                    {
                        TankId = tankId,
                        IntervalStartMm = group.HeightInterval,
                        IntervalEndMm = group.HeightInterval + settings.HeightIntervalMm,
                    };

                    _context.CalibrationIntervalAccumulations.Add(accumulation);
                }

                accumulation.ObservationCount = group.ObservationCount;
                accumulation.MeanVolumePerMm = Math.Round(group.MeanVolumePerMm, 6, MidpointRounding.AwayFromZero);
                accumulation.StdDevVolumePerMm = Math.Round(Convert.ToDecimal(stdDev), 6, MidpointRounding.AwayFromZero);
                accumulation.LastUpdatedUtc = nowUtc;
            }

            await _context.SaveChangesAsync(cancellationToken);
        }

        private static StabilityReading? FindStableMeasurementBefore(
            IReadOnlyList<StabilityReading> readings,
            DateTime anchorUtc,
            CalibrationLearningSettings settings)
        {
            var latestAllowedUtc = anchorUtc.AddMinutes(-settings.StabilityWindowMinutes);

            foreach (var reading in readings
                .Where(item => item.DateTime <= latestAllowedUtc)
                .OrderByDescending(item => item.DateTime))
            {
                if (HasStableWindow(
                    readings,
                    reading.DateTime.AddMinutes(-settings.StabilityWindowMinutes),
                    reading.DateTime,
                    settings))
                {
                    return reading;
                }
            }

            return null;
        }

        private static StabilityReading? FindStableMeasurementAfter(
            IReadOnlyList<StabilityReading> readings,
            DateTime anchorUtc,
            CalibrationLearningSettings settings)
        {
            var earliestAllowedUtc = anchorUtc.AddMinutes(settings.StabilityWindowMinutes);

            foreach (var reading in readings
                .Where(item => item.DateTime >= earliestAllowedUtc)
                .OrderBy(item => item.DateTime))
            {
                if (HasStableWindow(
                    readings,
                    reading.DateTime,
                    reading.DateTime.AddMinutes(settings.StabilityWindowMinutes),
                    settings))
                {
                    return reading;
                }
            }

            return null;
        }

        private static bool HasStableWindow(
            IReadOnlyList<StabilityReading> readings,
            DateTime windowStartUtc,
            DateTime windowEndUtc,
            CalibrationLearningSettings settings)
        {
            if (windowEndUtc <= windowStartUtc)
            {
                return false;
            }

            var windowReadings = readings
                .Where(item => item.DateTime >= windowStartUtc
                    && item.DateTime <= windowEndUtc)
                .OrderBy(item => item.DateTime)
                .ToList();

            if (windowReadings.Count < 2)
            {
                return false;
            }

            var coveredMinutes = (windowReadings[^1].DateTime - windowReadings[0].DateTime).TotalMinutes;
            if (coveredMinutes < settings.StabilityWindowMinutes * 0.75)
            {
                return false;
            }

            var heights = windowReadings.Select(item => item.Height).ToList();
            var varianceMm = heights.Max() - heights.Min();
            return varianceMm <= (double)settings.MaxHeightVarianceMm;
        }

        private static bool HasOverlappingDispensingEvent(
            IReadOnlyList<Pumptransaction> transactions,
            Pumptransaction currentTransaction,
            DateTime windowStartUtc,
            DateTime windowEndUtc)
        {
            return transactions.Any(transaction => transaction.Id != currentTransaction.Id
                && IsOverlapping(
                    GetPumpTransactionStartUtc(transaction),
                    transaction.DateTime < GetPumpTransactionStartUtc(transaction)
                        ? GetPumpTransactionStartUtc(transaction)
                        : transaction.DateTime,
                    windowStartUtc,
                    windowEndUtc));
        }

        private static bool HasOverlappingDelivery(
            IReadOnlyList<Intankdelivery> deliveries,
            DateTime windowStartUtc,
            DateTime windowEndUtc)
        {
            return deliveries.Any(delivery => delivery.StartDateTime.HasValue
                && delivery.EndDateTime.HasValue
                && IsOverlapping(
                    delivery.StartDateTime.Value,
                    delivery.EndDateTime.Value < delivery.StartDateTime.Value ? delivery.StartDateTime.Value : delivery.EndDateTime.Value,
                    windowStartUtc,
                    windowEndUtc));
        }

        private static bool IsOverlapping(
            DateTime firstStartUtc,
            DateTime firstEndUtc,
            DateTime secondStartUtc,
            DateTime secondEndUtc)
        {
            return firstStartUtc <= secondEndUtc && firstEndUtc >= secondStartUtc;
        }

        private static DateTime GetPumpTransactionStartUtc(Pumptransaction transaction)
        {
            return transaction.DateTimeStart ?? transaction.DateTime;
        }

        private static int CalculateHeightInterval(decimal heightBeforeMm, decimal heightAfterMm, int heightIntervalMm)
        {
            var averageHeightMm = (heightBeforeMm + heightAfterMm) / 2m;
            if (averageHeightMm < 0)
            {
                averageHeightMm = 0;
            }

            return (int)Math.Floor(averageHeightMm / heightIntervalMm) * heightIntervalMm;
        }

        private static double CalculateStandardDeviation(IEnumerable<double> values)
        {
            var items = values.ToList();
            if (items.Count <= 1)
            {
                return 0;
            }

            var mean = items.Average();
            var variance = items.Sum(item => Math.Pow(item - mean, 2)) / items.Count;
            return Math.Sqrt(variance);
        }

        private async Task<CalibrationLearningSettings> LoadSettingsAsync(CancellationToken cancellationToken)
        {
            return new CalibrationLearningSettings(
                await _systemConfigurationService.GetCalibrationLearningEnabledAsync(cancellationToken),
                await _systemConfigurationService.GetCalibrationHeightIntervalMmAsync(cancellationToken),
                await _systemConfigurationService.GetCalibrationMinObservationsPerIntervalAsync(cancellationToken),
                await _systemConfigurationService.GetCalibrationStabilityWindowMinutesAsync(cancellationToken),
                await _systemConfigurationService.GetCalibrationMaxHeightVarianceMmAsync(cancellationToken),
                await _systemConfigurationService.GetCalibrationMinVolumeChangeLitresAsync(cancellationToken),
                await _systemConfigurationService.GetCalibrationBackgroundTriggerThresholdAsync(cancellationToken));
        }

        private async Task PublishReadinessNotificationIfThresholdCrossedAsync(
            int tankId,
            int newPointCount,
            int previousUnprocessedCount,
            CalibrationLearningSettings settings,
            CancellationToken cancellationToken)
        {
            if (newPointCount <= 0 || settings.BackgroundTriggerThreshold <= 0)
            {
                return;
            }

            var currentUnprocessedCount = await _context.CalibrationDataPoints
                .AsNoTracking()
                .CountAsync(dataPoint => dataPoint.TankId == tankId && !dataPoint.IsProcessed, cancellationToken);

            if (previousUnprocessedCount >= settings.BackgroundTriggerThreshold
                || currentUnprocessedCount < settings.BackgroundTriggerThreshold)
            {
                return;
            }

            var coverage = await GetAccumulationSummaryAsync(tankId, cancellationToken);
            await _mediator.Publish(
                new CalibrationDataReadyNotification(
                    tankId,
                    newPointCount,
                    currentUnprocessedCount,
                    coverage.CoveragePercentage,
                    DateTime.UtcNow),
                cancellationToken);
        }

        private static CalibrationDataPointDto MapToDataPointDto(CalibrationDataPoint entity)
        {
            return new CalibrationDataPointDto
            {
                Id = entity.Id,
                TankId = entity.TankId,
                HeightBeforeMm = entity.HeightBefore,
                HeightAfterMm = entity.HeightAfter,
                VolumeChangeLitres = entity.VolumeChange,
                HeightIntervalMm = entity.HeightInterval,
                VolumePerMm = entity.VolumePerMm,
                SourceType = entity.SourceType,
                SourceEventId = entity.SourceEventId,
                RecordedAtUtc = entity.RecordedAtUtc,
                IsProcessed = entity.IsProcessed,
            };
        }

        private static void ValidateDateRange(DateTime? startDateUtc, DateTime? endDateUtc)
        {
            if (startDateUtc.HasValue && endDateUtc.HasValue && endDateUtc.Value < startDateUtc.Value)
            {
                throw new ArgumentException("End date must be greater than or equal to start date.");
            }
        }

        private sealed record CalibrationLearningSettings(
            bool LearningEnabled,
            int HeightIntervalMm,
            int MinObservationsPerInterval,
            int StabilityWindowMinutes,
            decimal MaxHeightVarianceMm,
            decimal MinVolumeChangeLitres,
            int BackgroundTriggerThreshold);
    }
}