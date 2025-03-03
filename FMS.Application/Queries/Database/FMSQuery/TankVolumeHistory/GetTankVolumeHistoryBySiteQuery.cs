using AutoMapper;
using FMS.Application.ModelsDTOs.FMS.TankVolumeHistory;
using FMS.Domain.Entities.enums;
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
    public record GetTankVolumeHistoryBySiteQuery(DateTime StartDate, DateTime EndDate, int SiteId) : IRequest<List<TankVolumeHistoryDTO>>;

    public class GetTankVolumeHistoryBySiteQueryHandler : IRequestHandler<GetTankVolumeHistoryBySiteQuery, List<TankVolumeHistoryDTO>>
    {
        private readonly GpsdataContext _context;
        private readonly ILogger<GetTankVolumeHistoryBySiteQueryHandler> _logger;
        private readonly IMapper _mapper;

        public GetTankVolumeHistoryBySiteQueryHandler(GpsdataContext context, ILogger<GetTankVolumeHistoryBySiteQueryHandler> logger, IMapper mapper)
        {
            _context = context;
            _logger = logger;
            _mapper = mapper;
        }

        public async Task<List<TankVolumeHistoryDTO>> Handle(GetTankVolumeHistoryBySiteQuery request, CancellationToken cancellationToken)
        {
            try
            {
                var tankVolumeHistories = await _context.TankVolumeHistories
                    .Include(x => x.Tank.Site)
                    .Include(x => x.RecordedByNavigation)
                    .Where(x => x.Tank.SiteId == request.SiteId &&
                                x.Timestamp.Date >= request.StartDate.Date &&
                                x.Timestamp.Date <= request.EndDate.Date)
                    .ToListAsync(cancellationToken);

                var result = new List<TankVolumeHistoryDTO>();

                foreach (var history in tankVolumeHistories)
                {
                    var dto = _mapper.Map<TankVolumeHistoryDTO>(history);

                    if (history.ChangeReason == VolumeChangeReasonEnum.Dispensing && history.ReferenceId.HasValue)
                    {
                        var fuelRefill = await _context.Fuelrefils
                            .Include(fr => fr.Vehicle)
                            .FirstOrDefaultAsync(fr => fr.Id == history.ReferenceId, cancellationToken);

                        dto.VehicleName = fuelRefill?.Vehicle?.HyoungNo ?? "N/A";
                    }
                    else
                    {
                        dto.VehicleName = "N/A";
                    }

                    result.Add(dto);
                }

                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting tank volume history list for site");
                throw;
            }
        }
    }

}
