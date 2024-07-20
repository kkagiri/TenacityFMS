using AutoMapper;
using AutoMapper.Configuration.Annotations;
using FMS.Application.Common;
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
   public record  GetTankVolumeHistoryByTankIdQuery(int TankId) : IRequest<FMSResponseMessage<List<TankVolumeHistoryDTO>>>;

    public class GetTankVolumeHistoryByTankIdQueryHandler : IRequestHandler<GetTankVolumeHistoryByTankIdQuery, FMSResponseMessage<List<TankVolumeHistoryDTO>>>
    {
        private readonly GpsdataContext _context;
        private readonly IMapper _mapper;

        private readonly ILogger<GetTankVolumeHistoryByTankIdQueryHandler> _logger;

        public GetTankVolumeHistoryByTankIdQueryHandler(GpsdataContext context, IMapper mapper, ILogger<GetTankVolumeHistoryByTankIdQueryHandler> logger)
        {
            _context = context;
            _mapper = mapper;
            _logger = logger;
        }

        public async Task<FMSResponseMessage<List<TankVolumeHistoryDTO>>> Handle(GetTankVolumeHistoryByTankIdQuery request, CancellationToken cancellationToken)
        {
            try
            {
                var tank = await _context.Tanks.FirstOrDefaultAsync(t => t.Id == request.TankId, cancellationToken);
                if (tank == null) return new FMSResponseMessage<List<TankVolumeHistoryDTO>>(false, $"Tank with ID {request.TankId} does not exist", null);

                var response = _mapper.Map<List<TankVolumeHistoryDTO>>(await _context.TankVolumeHistories.Where(x => x.TankId == request.TankId).ToListAsync(cancellationToken));
            
               return new FMSResponseMessage<List<TankVolumeHistoryDTO>>(true, "Tank Volume History List", response);
            }

            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting tank volume history list");
                throw;
            }
        }
    }
  
}
