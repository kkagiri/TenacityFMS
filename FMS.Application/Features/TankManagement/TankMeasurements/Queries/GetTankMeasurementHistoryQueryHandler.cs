/**
 * File: GetTankMeasurementHistoryQueryHandler.cs
 * Purpose: Handles tank measurement history retrieval for a given tank and date range.
 * Dependencies: GpsdataContext, EF Core
 * Last Modified: 2026-02-12
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
    public class GetTankMeasurementHistoryQueryHandler
        : IRequestHandler<GetTankMeasurementHistoryQuery, FMSResponse<List<TankMeasurementHistoryDto>>>
    {
        private readonly GpsdataContext _context;
        private readonly ILogger<GetTankMeasurementHistoryQueryHandler> _logger;

        public GetTankMeasurementHistoryQueryHandler(
            GpsdataContext context,
            ILogger<GetTankMeasurementHistoryQueryHandler> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<FMSResponse<List<TankMeasurementHistoryDto>>> Handle(
            GetTankMeasurementHistoryQuery request,
            CancellationToken cancellationToken)
        {
            try
            {
                if (request.TankId <= 0)
                {
                    return FMSResponse<List<TankMeasurementHistoryDto>>.Failed("Invalid Tank ID");
                }

                var query = _context.Tankmeasurements
                    .AsNoTracking()
                    .Where(tm => tm.TankId == request.TankId);

                if (request.StartDate.HasValue)
                {
                    query = query.Where(tm => tm.DateTime >= request.StartDate.Value);
                }

                if (request.EndDate.HasValue)
                {
                    query = query.Where(tm => tm.DateTime <= request.EndDate.Value);
                }

                var results = await query
                    .OrderBy(tm => tm.DateTime)
                    .Select(tm => new TankMeasurementHistoryDto
                    {
                        TankId = tm.TankId ?? 0,
                        DateTime = tm.DateTime,
                        ProductVolume = tm.ProductVolume.HasValue ? (decimal?)tm.ProductVolume.Value : null,
                        Temperature = tm.Temperature.HasValue ? (decimal?)tm.Temperature.Value : null,
                        WaterHeight = tm.WaterHeight.HasValue ? (decimal?)tm.WaterHeight.Value : null,
                        ProductHeight = tm.ProductHeight.HasValue ? (decimal?)tm.ProductHeight.Value : null,
                        WaterVolume = tm.WaterVolume.HasValue ? (decimal?)tm.WaterVolume.Value : null,
                        Source = "TankMeasurement"
                    })
                    .ToListAsync(cancellationToken);

                return FMSResponse<List<TankMeasurementHistoryDto>>.Success(
                    results,
                    $"Retrieved {results.Count} tank measurement history points");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving tank measurement history for TankId {TankId}", request.TankId);
                return FMSResponse<List<TankMeasurementHistoryDto>>.Failed(
                    $"Error retrieving tank measurement history: {ex.Message}");
            }
        }
    }
}
