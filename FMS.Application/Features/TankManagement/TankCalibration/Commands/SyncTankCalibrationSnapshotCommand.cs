/**
 * File: SyncTankCalibrationSnapshotCommand.cs
 * Purpose: Pulls a chart from a linked PTS probe and persists it as a local tank calibration snapshot.
 * Dependencies: MediatR, FMSResponse, IPTSConfigService, ITankCalibrationStorageService
 * Last Modified: 2026-03-23
 *
 * Key Behaviors:
 * - Reads manual, interval-volume, or automatic chart data in protocol-sized batches.
 * - Normalizes chart rows and stores them as local snapshot history.
 */
using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.PTS.DTOs;
using FMS.Application.Features.TankManagement.TankCalibration.DTOs;
using FMS.Application.Features.TankManagement.TankCalibration.Services;
using FMS.Application.PTSServices.PTSConfigService;
using MediatR;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.TankManagement.TankCalibration.Commands
{
    public record SyncTankCalibrationSnapshotCommand(
        int TankId,
        string TankName,
        string PtsDeviceId,
        int ProbeNumber,
        string ChartType,
        string? RecordedBy,
        string Source,
        string? Notes = null) : IRequest<FMSResponse<TankCalibrationSnapshotDto>>;

    public class SyncTankCalibrationSnapshotCommandHandler : IRequestHandler<SyncTankCalibrationSnapshotCommand, FMSResponse<TankCalibrationSnapshotDto>>
    {
        private const int MaxBatchSize = 100;
        private readonly IPTSConfigService _ptsConfigService;
        private readonly ITankCalibrationStorageService _storageService;
        private readonly ILogger<SyncTankCalibrationSnapshotCommandHandler> _logger;

        public SyncTankCalibrationSnapshotCommandHandler(
            IPTSConfigService ptsConfigService,
            ITankCalibrationStorageService storageService,
            ILogger<SyncTankCalibrationSnapshotCommandHandler> logger)
        {
            _ptsConfigService = ptsConfigService;
            _storageService = storageService;
            _logger = logger;
        }

        public async Task<FMSResponse<TankCalibrationSnapshotDto>> Handle(SyncTankCalibrationSnapshotCommand request, CancellationToken cancellationToken)
        {
            try
            {
                if (!TankCalibrationChartTypes.IsSupported(request.ChartType))
                {
                    return FMSResponse<TankCalibrationSnapshotDto>.ValidationFailed(new List<string> { "Unsupported calibration chart type." });
                }

                var normalizedChartType = TankCalibrationChartTypes.Normalize(request.ChartType);
                var totalResult = await GetTotalRecordsAsync(request, normalizedChartType);
                if (!totalResult.IsSuccess || totalResult.Data == null)
                {
                    return FMSResponse<TankCalibrationSnapshotDto>.Failed(totalResult.Message);
                }

                var totalRecords = totalResult.Data.TotalNumber;
                var records = await ReadAllRecordsAsync(request, normalizedChartType, totalRecords);

                var snapshot = new TankCalibrationSnapshotDto
                {
                    TankId = request.TankId,
                    TankName = request.TankName,
                    PtsDeviceId = request.PtsDeviceId,
                    ProbeNumber = request.ProbeNumber,
                    ChartType = normalizedChartType,
                    Source = request.Source,
                    TotalRecords = totalRecords,
                    RecordedAtUtc = DateTime.UtcNow,
                    RecordedBy = request.RecordedBy,
                    Notes = request.Notes,
                    Records = records
                };

                var savedSnapshot = await _storageService.SaveSnapshotAsync(snapshot, cancellationToken);
                return FMSResponse<TankCalibrationSnapshotDto>.Success(savedSnapshot, "Tank calibration snapshot synced successfully.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex,
                    "Error syncing tank calibration snapshot for TankId {TankId}, Device {DeviceId}, Probe {ProbeNumber}, ChartType {ChartType}",
                    request.TankId,
                    request.PtsDeviceId,
                    request.ProbeNumber,
                    request.ChartType);
                return FMSResponse<TankCalibrationSnapshotDto>.Failed("Failed to sync tank calibration snapshot.");
            }
        }

        private async Task<FMSResponse<ProbeChartTotalRecordsResponse>> GetTotalRecordsAsync(SyncTankCalibrationSnapshotCommand request, string chartType)
        {
            return chartType switch
            {
                TankCalibrationChartTypes.Manual => await _ptsConfigService.GetTankCalibrationChartTotalRecordsNumberAsync(request.PtsDeviceId, request.ProbeNumber),
                TankCalibrationChartTypes.IntervalVolume => await _ptsConfigService.GetTankIntervalVolumeChartTotalRecordsNumberAsync(request.PtsDeviceId, request.ProbeNumber),
                _ => await _ptsConfigService.GetTankAutomaticCalibrationChartTotalRecordsNumberAsync(request.PtsDeviceId, request.ProbeNumber)
            };
        }

        private async Task<List<TankCalibrationRecordDto>> ReadAllRecordsAsync(SyncTankCalibrationSnapshotCommand request, string chartType, int totalRecords)
        {
            var normalizedRecords = new List<TankCalibrationRecordDto>();
            if (totalRecords <= 0)
            {
                return normalizedRecords;
            }

            for (var start = 1; start <= totalRecords; start += MaxBatchSize)
            {
                var take = Math.Min(MaxBatchSize, totalRecords - start + 1);

                if (chartType == TankCalibrationChartTypes.IntervalVolume)
                {
                    var batchResult = await _ptsConfigService.GetTankIntervalVolumeChartRecordsAsync(request.PtsDeviceId, request.ProbeNumber, start, take);
                    if (!batchResult.IsSuccess || batchResult.Data == null)
                    {
                        throw new InvalidOperationException(batchResult.Message);
                    }

                    foreach (var record in batchResult.Data.Records)
                    {
                        normalizedRecords.Add(new TankCalibrationRecordDto
                        {
                            Height = record.Height,
                            Volume = record.Volume,
                            PassesNumber = record.PassesNumber
                        });
                    }

                    continue;
                }

                var chartResult = chartType == TankCalibrationChartTypes.Manual
                    ? await _ptsConfigService.GetTankCalibrationChartRecordsAsync(request.PtsDeviceId, request.ProbeNumber, start, take)
                    : await _ptsConfigService.GetTankAutomaticCalibrationChartRecordsAsync(request.PtsDeviceId, request.ProbeNumber, start, take);

                if (!chartResult.IsSuccess || chartResult.Data == null)
                {
                    throw new InvalidOperationException(chartResult.Message);
                }

                foreach (var record in chartResult.Data.Records)
                {
                    normalizedRecords.Add(new TankCalibrationRecordDto
                    {
                        Height = record.Height,
                        Volume = record.Volume
                    });
                }
            }

            return normalizedRecords;
        }
    }
}