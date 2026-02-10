/**
 * File: GetInTankDeliveriesBySiteQueryHandler.cs
 * Purpose: Handler for GetInTankDeliveriesBySiteQuery - retrieves ITD records with filtering
 * Dependencies: GpsdataContext, EF Core
 * Last Modified: 2026-02-10
 */
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.TankManagement.Deliveries.DTOs;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.TankManagement.Deliveries.Queries
{
    public class GetInTankDeliveriesBySiteQueryHandler
        : IRequestHandler<GetInTankDeliveriesBySiteQuery, FMSResponse<List<InTankDeliveryDetectionDTO>>>
    {
        private readonly GpsdataContext _context;
        private readonly ILogger<GetInTankDeliveriesBySiteQueryHandler> _logger;

        public GetInTankDeliveriesBySiteQueryHandler(
            GpsdataContext context,
            ILogger<GetInTankDeliveriesBySiteQueryHandler> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<FMSResponse<List<InTankDeliveryDetectionDTO>>> Handle(
            GetInTankDeliveriesBySiteQuery request,
            CancellationToken cancellationToken)
        {
            try
            {
                var query = _context.Intankdeliveries
                    .Include(i => i.TankNavigation)
                    .Include(i => i.MatchedDelivery)
                    .Include(i => i.Pts)
                    .AsQueryable();

                if (request.SiteId > 0)
                    query = query.Where(i => i.SiteId == request.SiteId);

                if (request.StartDate.HasValue)
                    query = query.Where(i => i.EndDateTime >= request.StartDate.Value);

                if (request.EndDate.HasValue)
                    query = query.Where(i => i.EndDateTime <= request.EndDate.Value);

                if (!string.IsNullOrEmpty(request.Status))
                    query = query.Where(i => i.Status == request.Status);

                var results = await query
                    .OrderByDescending(i => i.EndDateTime)
                    .Select(i => new InTankDeliveryDetectionDTO
                    {
                        DeliveryId = i.DeliveryId,
                        TankProbeNumber = i.Tank,
                        TankId = i.TankId,
                        TankName = i.TankNavigation != null ? i.TankNavigation.Name : null,
                        SiteId = i.SiteId,
                        PtsId = i.Ptsid,
                        FuelGradeId = i.FuelGradeId,
                        FuelGradeName = i.FuelGradeName,

                        StartDateTime = i.StartDateTime,
                        EndDateTime = i.EndDateTime,
                        StartProductVolume = i.StartProductVolume,
                        EndProductVolume = i.EndProductVolume,
                        AbsoluteProductVolume = i.AbsoluteProductVolume,
                        StartProductHeight = i.StartProductHeight,
                        EndProductHeight = i.EndProductHeight,
                        AbsoluteProductHeight = i.AbsoluteProductHeight,
                        StartTemperature = i.StartTemperature,
                        EndTemperature = i.EndTemperature,
                        PumpsDispensedVolume = i.PumpsDispensedVolume,

                        Status = i.Status,
                        IsProcessed = i.IsProcessed,
                        DetectedAt = i.DetectedAt,
                        MatchedDeliveryId = i.MatchedDeliveryId,
                        MatchedDeliveryAmount = i.MatchedDelivery != null
                            ? i.MatchedDelivery.ManualDeliveryAmount
                            : null,
                        PacketId = i.PacketId,
                        ConfigurationId = i.ConfigurationId
                    })
                    .ToListAsync(cancellationToken);

                return FMSResponse<List<InTankDeliveryDetectionDTO>>.Success(results,
                    $"Retrieved {results.Count} in-tank delivery records");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving in-tank deliveries for site {SiteId}", request.SiteId);
                return FMSResponse<List<InTankDeliveryDetectionDTO>>.Failed(
                    $"Error retrieving in-tank deliveries: {ex.Message}");
            }
        }
    }
}
