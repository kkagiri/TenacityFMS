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

namespace FMS.Application.Queries.Database.FMSQuery.TankReconciliation
{
    public record GetDailyTankReconcillationQuery (DateTime Startdate, DateTime EndDate) : IRequest<List<TankReconcillationDTO>>;

    public class GetDailyTankReconcillationQueryHandler : IRequestHandler<GetDailyTankReconcillationQuery, List<TankReconcillationDTO>>
    {
        private readonly GpsdataContext _context;
        private readonly IMapper _mapper;
        private readonly ILogger<GetDailyTankReconcillationQueryHandler> _logger;

        public GetDailyTankReconcillationQueryHandler(GpsdataContext context, IMapper mapper, ILogger<GetDailyTankReconcillationQueryHandler> logger)
        {
            _context = context;
            _mapper = mapper;
            _logger = logger;
        }

        public async Task<List<TankReconcillationDTO>> Handle(GetDailyTankReconcillationQuery request, CancellationToken cancellationToken)
        {
            try
            {
                return _mapper.Map<List<TankReconcillationDTO>>(await _context.Dailytankreconciliations.Include(x=>x.Tank.Site).Include(x=>x.Tank).Where(x=> x.ReconciliationDate.Date >= request.Startdate.Date && x.ReconciliationDate.Date <= request.EndDate.Date).ToListAsync(cancellationToken));
            }

            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting tank reconcillation list");
                throw;
            }
        }
    }
    
}
