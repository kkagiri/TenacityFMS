using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using FMS.Application.Common;
using FMS.Application.Features.FMS.TankStock;
using FMS.Domain.Entities.enums;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Queries.Database.FMSQuery.TankStock;

//Cursor - Get Stock Adjustments Query with filtering capabilities
public record GetStockAdjustmentsQuery (
    int? SiteId = null,
    int? TankId = null,
    DateTime? StartDate = null,
    DateTime? EndDate = null
) : IRequest<FMSResponse<List<StockAdjustmentDTO>>>;

public class GetStockAdjustmentsQueryHandler : IRequestHandler<GetStockAdjustmentsQuery, FMSResponse<List<StockAdjustmentDTO>>> {
    private readonly GpsdataContext _context;
    private readonly IMapper _mapper;
    private readonly ILogger<GetStockAdjustmentsQueryHandler> _logger;

    public GetStockAdjustmentsQueryHandler (GpsdataContext context, IMapper mapper, ILogger<GetStockAdjustmentsQueryHandler> logger) {
        _context = context;
        _mapper = mapper;
        _logger = logger;
    }

    public async Task<FMSResponse<List<StockAdjustmentDTO>>> Handle (GetStockAdjustmentsQuery request, CancellationToken cancellationToken) {
        try {
            // Cursor - Query StockAdjustments table directly instead of TankVolumeHistory
            var query = _context.StockAdjustments
                .Include (sa => sa.Tank)
                .Include (sa => sa.Site)
                .Include (sa => sa.CreatedByNavigation)
                .Include (sa => sa.ApprovedByNavigation)
                .AsQueryable ();

            // Apply filters
            if (request.SiteId.HasValue) {
                query = query.Where (sa => sa.SiteId == request.SiteId.Value);
            }

            if (request.TankId.HasValue) {
                query = query.Where (sa => sa.TankId == request.TankId.Value);
            }

            if (request.StartDate.HasValue) {
                query = query.Where (sa => sa.AdjustmentDate >= request.StartDate.Value);
            }

            if (request.EndDate.HasValue) {
                query = query.Where (sa => sa.AdjustmentDate <= request.EndDate.Value);
            }

            var adjustmentRecords = await query
                .OrderByDescending (sa => sa.AdjustmentDate)
                .ToListAsync (cancellationToken);

            // Cursor - Map to StockAdjustmentDTO from StockAdjustment entity
            var adjustmentDTOs = adjustmentRecords.Select (sa => new StockAdjustmentDTO {
                Id = sa.Id,
                    TankId = sa.TankId,
                    SiteId = sa.SiteId,
                    AdjustmentDate = sa.AdjustmentDate,
                    CurrentVolume = sa.PreviousVolume,
                    NewVolume = sa.NewVolume,
                    AdjustmentType = sa.AdjustmentType,
                    ReasonCode = (int) sa.ReasonCode,
                    Reason = sa.Reason,
                    Notes = sa.Notes,
                    CreatedBy = sa.CreatedBy,
                    CreatedOn = sa.CreatedOn,
                    Status = sa.Status,
                    ApprovedBy = sa.ApprovedBy,
                    ApprovedOn = sa.ApprovedOn,
                    TankVolumeHistoryId = sa.TankVolumeHistoryId,
                    TankName = sa.Tank?.Name,
                    SiteName = sa.Site?.Name,
                    CreatedByName = sa.CreatedByNavigation?.UserName,
                    ApprovedByName = sa.ApprovedByNavigation?.UserName
            }).ToList ();

            return FMSResponse<List<StockAdjustmentDTO>>.Success (adjustmentDTOs, $"Retrieved {adjustmentDTOs.Count} stock adjustments");
        } catch (Exception ex) {
            _logger.LogError (ex, "Error retrieving stock adjustments with filters: SiteId={SiteId}, TankId={TankId}", request.SiteId, request.TankId);
            return FMSResponse<List<StockAdjustmentDTO>>.SystemError ("An error occurred while retrieving stock adjustments");
        }
    }
}