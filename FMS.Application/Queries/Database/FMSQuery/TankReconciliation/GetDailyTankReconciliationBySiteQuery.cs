using AutoMapper;
using FMS.Application.ModelsDTOs.FMS.TankReconciliation;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace FMS.Application.Queries.Database.FMSQuery.TankReconciliation;

   public record GetDailyTankReconciliationBySiteQuery(DateTime Startdate, DateTime EndDate, int SiteId) : IRequest<List<TankReconcillationDTO>>;
    
    public class GetDailyTankReconciliationBySiteQueryHandler : IRequestHandler<GetDailyTankReconciliationBySiteQuery, List<TankReconcillationDTO>>
{
        private readonly GpsdataContext _context;
        private readonly IMapper _mapper;
        private readonly ILogger<GetDailyTankReconciliationBySiteQueryHandler> _logger;

        public GetDailyTankReconciliationBySiteQueryHandler(GpsdataContext context, IMapper mapper, ILogger<GetDailyTankReconciliationBySiteQueryHandler> logger)
    {
            _context = context;
            _mapper = mapper;
            _logger = logger;
        }

        public async Task<List<TankReconcillationDTO>> Handle(GetDailyTankReconciliationBySiteQuery request, CancellationToken cancellationToken)
    {
            try
        {
                return _mapper.Map<List<TankReconcillationDTO>>(await _context.Dailytankreconciliations.Include(x => x.Tank.Site).Include(x => x.Tank)
                                       .Where(x =>x.Tank.SiteId  == request.SiteId && x.ReconciliationDate.Date >=request.Startdate.Date && x.ReconciliationDate.Date <=request.EndDate.Date)
                                       .ToListAsync(cancellationToken));
            }
            catch (Exception ex)
        {
                _logger.LogError(ex, "Error getting tank reconciliation list");
                throw;
            }
        }
    }

    
