/**
 * File: GetUploadStatusProbeReadingHistoryQuery.cs
 * Purpose: Query + handler to retrieve UploadStatus probe reading history for charting.
 *          Returns the same DTO as TankMeasurement history so both sources render on the same charts.
 * Dependencies: MediatR, FMSResponse, GpsdataContext
 * Last Modified: 2026-03-25
 */
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.TankManagement.TankMeasurements.DTOs;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.TankManagement.TankMeasurements.Queries
{
    public record GetUploadStatusProbeReadingHistoryQuery(
        int TankId,
        DateTime? StartDate = null,
        DateTime? EndDate = null
    ) : IRequest<FMSResponse<List<TankMeasurementHistoryDto>>>;

    public class GetUploadStatusProbeReadingHistoryQueryHandler
        : IRequestHandler<GetUploadStatusProbeReadingHistoryQuery, FMSResponse<List<TankMeasurementHistoryDto>>>
    {
        private readonly GpsdataContext _context;
        private readonly ILogger<GetUploadStatusProbeReadingHistoryQueryHandler> _logger;

        public GetUploadStatusProbeReadingHistoryQueryHandler(
            GpsdataContext context,
            ILogger<GetUploadStatusProbeReadingHistoryQueryHandler> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<FMSResponse<List<TankMeasurementHistoryDto>>> Handle(
            GetUploadStatusProbeReadingHistoryQuery request,
            CancellationToken cancellationToken)
        {
            try
            {
                if (request.TankId <= 0)
                {
                    return FMSResponse<List<TankMeasurementHistoryDto>>.Failed("Invalid Tank ID");
                }

                var query = _context.UploadStatusProbeReadings
                    .AsNoTracking()
                    .Where(r => r.TankId == request.TankId);

                if (request.StartDate.HasValue)
                {
                    query = query.Where(r => r.DateTime >= request.StartDate.Value);
                }

                if (request.EndDate.HasValue)
                {
                    query = query.Where(r => r.DateTime <= request.EndDate.Value);
                }

                var results = await query
                    .OrderBy(r => r.DateTime)
                    .Select(r => new TankMeasurementHistoryDto
                    {
                        TankId = r.TankId ?? 0,
                        DateTime = r.DateTime,
                        ProductVolume = r.ProductVolume.HasValue ? (decimal?)r.ProductVolume.Value : null,
                        Temperature = r.Temperature.HasValue ? (decimal?)r.Temperature.Value : null,
                        WaterHeight = r.WaterHeight.HasValue ? (decimal?)r.WaterHeight.Value : null,
                        ProductHeight = r.ProductHeight.HasValue ? (decimal?)r.ProductHeight.Value : null,
                        WaterVolume = r.WaterVolume.HasValue ? (decimal?)r.WaterVolume.Value : null,
                        Source = "UploadStatus"
                    })
                    .ToListAsync(cancellationToken);

                return FMSResponse<List<TankMeasurementHistoryDto>>.Success(
                    results,
                    $"Retrieved {results.Count} upload status probe reading history points");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving upload status probe reading history for TankId {TankId}", request.TankId);
                return FMSResponse<List<TankMeasurementHistoryDto>>.Failed(
                    $"Error retrieving upload status probe reading history: {ex.Message}");
            }
        }
    }
}
