using AutoMapper;
using FMS.Application.ModelsDTOs.FMS.TankVolumeHistory;
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

namespace FMS.Application.Queries.Database.FMSQuery.TankVolumeHistory
{
  public record GetTankVolumeHistoryByDateRangeQuery(DateTime StartDate, DateTime EndDate) : IRequest<List<TankVolumeHistoryDTO>>;

    public class GetTankVolumeHistoryByDateRangeQueryHandler : IRequestHandler<GetTankVolumeHistoryByDateRangeQuery, List<TankVolumeHistoryDTO>>
    {

        private readonly GpsdataContext _contenxt;
        private readonly ILogger<GetTankVolumeHistoryByDateRangeQueryHandler> _logger;
        private readonly IMapper _mapper;

        public GetTankVolumeHistoryByDateRangeQueryHandler(GpsdataContext context, ILogger<GetTankVolumeHistoryByDateRangeQueryHandler> logger, IMapper mapper)
        {
            _contenxt = context;
            _logger = logger;
            _mapper = mapper;
        }
        public async Task<List<TankVolumeHistoryDTO>> Handle(GetTankVolumeHistoryByDateRangeQuery request, CancellationToken cancellationToken)
        {
           try
            {
              return _mapper.Map<List<TankVolumeHistoryDTO>>(await _contenxt.TankVolumeHistories.Include(x=>x.Tank.Site).
                  Where(x => x.Timestamp.Date >= request.StartDate.Date && x.Timestamp.Date <= request.EndDate.Date  ).ToListAsync(cancellationToken));
                }
                catch (Exception ex)
            {
                 _logger.LogError(ex, "Error getting tank volume history list");
                 throw;
            }
            }
        }
    }
    

