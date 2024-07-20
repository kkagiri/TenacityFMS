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
    public record GetTankVolumeHistoryQuery : IRequest<List<TankVolumeHistoryDTO>>;

    public class GetTankVolumeHistoryQueryHandler : IRequestHandler<GetTankVolumeHistoryQuery, List<TankVolumeHistoryDTO>>
    {
        private readonly GpsdataContext _contenxt;
        private readonly ILogger<GetTankVolumeHistoryQueryHandler> _logger;
        private readonly IMapper _mapper;

        public GetTankVolumeHistoryQueryHandler(GpsdataContext context, ILogger<GetTankVolumeHistoryQueryHandler> logger, IMapper mapper)
        {
            _contenxt = context;
            _logger = logger;
            _mapper = mapper;
        }
        public async Task<List<TankVolumeHistoryDTO>> Handle(GetTankVolumeHistoryQuery request, CancellationToken cancellationToken)
        {
           try
            {
                return _mapper.Map<List<TankVolumeHistoryDTO>>(await _contenxt.TankVolumeHistories.ToListAsync(cancellationToken));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting tank volume history list");
                throw;
            }
        }
    }   
   
}
