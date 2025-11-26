using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using FMS.Application.Common;
using FMS.Application.Features.FMS.TankReconciliation;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.TankManagement.DailyTankReconciliation.Queries;

// Query to get daily tank reconciliation records
public record GetDailyTankReconciliationQuery(DateTime StartDate, DateTime EndDate, int? SiteId = null) : IRequest<FMSResponse<List<TankReconcillationDTO>>>;

public class GetDailyTankReconciliationQueryHandler : IRequestHandler<GetDailyTankReconciliationQuery, FMSResponse<List<TankReconcillationDTO>>>
{
    private readonly GpsdataContext _context;
    private readonly IMapper _mapper;
    private readonly ILogger<GetDailyTankReconciliationQueryHandler> _logger;

    public GetDailyTankReconciliationQueryHandler(GpsdataContext context, IMapper mapper, ILogger<GetDailyTankReconciliationQueryHandler> logger)
    {
        _context = context;
        _mapper = mapper;
        _logger = logger;
    }

    public async Task<FMSResponse<List<TankReconcillationDTO>>> Handle(GetDailyTankReconciliationQuery request, CancellationToken cancellationToken)
    {
        try
        {
            var query = _context.Dailytankreconciliations
                .Include(x => x.Tank.Site)
                .Include(x => x.Tank)
                .Where(x => x.ReconciliationDate.Date >= request.StartDate.Date && x.ReconciliationDate.Date <= request.EndDate.Date);

            // Apply site filter if specified
            if (request.SiteId.HasValue)
            {
                query = query.Where(x => x.Tank.SiteId == request.SiteId.Value);
            }

            var result = await query.ToListAsync(cancellationToken);
            var dtoList = _mapper.Map<List<TankReconcillationDTO>>(result);

            return FMSResponse<List<TankReconcillationDTO>>.Success(dtoList, "Daily tank reconciliation records retrieved successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting tank reconciliation list");
            return FMSResponse<List<TankReconcillationDTO>>.SystemError("Failed to retrieve tank reconciliation records");
        }
    }
}
