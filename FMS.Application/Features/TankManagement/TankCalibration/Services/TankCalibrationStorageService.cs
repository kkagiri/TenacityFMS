/**
 * File: TankCalibrationStorageService.cs
 * Purpose: Stores and reads local tank calibration chart snapshots using EF Core and the domain entity.
 * Dependencies: GpsdataContext, System.Text.Json, TankCalibrationSnapshot entity
 * Last Modified: 2026-03-23
 *
 * Key Functions:
 * - SaveSnapshotAsync(): Inserts a local calibration snapshot row with serialized records.
 * - GetLatestSnapshotAsync(): Loads the newest snapshot for a tank/chart pair.
 * - GetHistoryAsync(): Reads paged history summaries for the calibration panel.
 */
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Features.TankManagement.TankCalibration.DTOs;
using FMS.Domain.Entities.Features.TankStockManagement;
using FMS.Persistence.DataAccess;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.TankManagement.TankCalibration.Services
{
    public class TankCalibrationStorageService : ITankCalibrationStorageService
    {
        private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);
        private readonly GpsdataContext _context;
        private readonly ILogger<TankCalibrationStorageService> _logger;

        public TankCalibrationStorageService(
            GpsdataContext context,
            ILogger<TankCalibrationStorageService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<TankCalibrationSnapshotDto> SaveSnapshotAsync(TankCalibrationSnapshotDto snapshot, CancellationToken cancellationToken = default)
        {
            var entity = new TankCalibrationSnapshot
            {
                TankId = snapshot.TankId,
                TankName = snapshot.TankName,
                PtsDeviceId = snapshot.PtsDeviceId,
                ProbeNumber = snapshot.ProbeNumber,
                ChartType = snapshot.ChartType,
                Source = snapshot.Source,
                TotalRecords = snapshot.TotalRecords,
                RecordedAtUtc = snapshot.RecordedAtUtc,
                RecordedBy = snapshot.RecordedBy,
                Notes = snapshot.Notes,
                RecordsJson = JsonSerializer.Serialize(snapshot.Records, JsonOptions)
            };

            _context.TankCalibrationSnapshots.Add(entity);
            await _context.SaveChangesAsync(cancellationToken);

            snapshot.Id = entity.Id;
            return snapshot;
        }

        public async Task<TankCalibrationSnapshotDto?> GetLatestSnapshotAsync(int tankId, string chartType, CancellationToken cancellationToken = default)
        {
            var entity = await _context.TankCalibrationSnapshots
                .AsNoTracking()
                .Where(s => s.TankId == tankId && s.ChartType == chartType)
                .OrderByDescending(s => s.RecordedAtUtc)
                .ThenByDescending(s => s.Id)
                .FirstOrDefaultAsync(cancellationToken);

            return entity == null ? null : MapToSnapshotDto(entity);
        }

        public async Task<TankCalibrationSnapshotDto?> GetSnapshotByIdAsync(long snapshotId, CancellationToken cancellationToken = default)
        {
            var entity = await _context.TankCalibrationSnapshots
                .AsNoTracking()
                .FirstOrDefaultAsync(s => s.Id == snapshotId, cancellationToken);

            return entity == null ? null : MapToSnapshotDto(entity);
        }

        public async Task<(IReadOnlyList<TankCalibrationSnapshotHistoryItemDto> Items, int TotalCount)> GetHistoryAsync(
            int tankId,
            string? chartType,
            int pageNumber,
            int pageSize,
            CancellationToken cancellationToken = default)
        {
            var normalizedPageNumber = pageNumber < 1 ? 1 : pageNumber;
            var normalizedPageSize = pageSize < 1 ? 20 : pageSize;

            var query = _context.TankCalibrationSnapshots
                .AsNoTracking()
                .Where(s => s.TankId == tankId);

            if (!string.IsNullOrWhiteSpace(chartType))
            {
                query = query.Where(s => s.ChartType == chartType);
            }

            var totalCount = await query.CountAsync(cancellationToken);

            var items = await query
                .OrderByDescending(s => s.RecordedAtUtc)
                .ThenByDescending(s => s.Id)
                .Skip((normalizedPageNumber - 1) * normalizedPageSize)
                .Take(normalizedPageSize)
                .Select(s => new TankCalibrationSnapshotHistoryItemDto
                {
                    Id = s.Id,
                    TankId = s.TankId,
                    TankName = s.TankName,
                    ChartType = s.ChartType,
                    Source = s.Source,
                    TotalRecords = s.TotalRecords,
                    RecordedAtUtc = s.RecordedAtUtc,
                    RecordedBy = s.RecordedBy,
                    Notes = s.Notes
                })
                .ToListAsync(cancellationToken);

            return (items, totalCount);
        }

        private static TankCalibrationSnapshotDto MapToSnapshotDto(TankCalibrationSnapshot entity)
        {
            return new TankCalibrationSnapshotDto
            {
                Id = entity.Id,
                TankId = entity.TankId,
                TankName = entity.TankName,
                PtsDeviceId = entity.PtsDeviceId,
                ProbeNumber = entity.ProbeNumber,
                ChartType = entity.ChartType,
                Source = entity.Source,
                TotalRecords = entity.TotalRecords,
                RecordedAtUtc = entity.RecordedAtUtc,
                RecordedBy = entity.RecordedBy,
                Notes = entity.Notes,
                Records = JsonSerializer.Deserialize<List<TankCalibrationRecordDto>>(entity.RecordsJson, JsonOptions)
                    ?? new List<TankCalibrationRecordDto>()
            };
        }
    }
}