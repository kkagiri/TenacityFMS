using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using FMS.Application.Features.FMS.TankVolumeHistory;
using FMS.Domain.Entities;
using FMS.Domain.Entities.enums;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Queries.Database.FMSQuery.TankVolumeHistory {
    public record GetTankVolumeHistoryQuery : IRequest<List<TankVolumeHistoryDTO>>;

    public class GetTankVolumeHistoryQueryHandler : IRequestHandler<GetTankVolumeHistoryQuery, List<TankVolumeHistoryDTO>> {
        private readonly GpsdataContext _contenxt;
        private readonly ILogger<GetTankVolumeHistoryQueryHandler> _logger;
        private readonly IMapper _mapper;

        public GetTankVolumeHistoryQueryHandler (GpsdataContext context, ILogger<GetTankVolumeHistoryQueryHandler> logger, IMapper mapper) {
            _contenxt = context;
            _logger = logger;
            _mapper = mapper;
        }

        public async Task<List<TankVolumeHistoryDTO>> Handle (GetTankVolumeHistoryQuery request, CancellationToken cancellationToken) {
            try {
                var tankVolumeHistories = await _contenxt.TankVolumeHistories
                    .Include (tvh => tvh.Tank)
                    .Include (tvh => tvh.RecordedByNavigation)
                    .ToListAsync (cancellationToken);

                var result = new List<TankVolumeHistoryDTO> ();

                foreach (var history in tankVolumeHistories) {
                    var dto = _mapper.Map<TankVolumeHistoryDTO> (history);

                    if (history.ChangeReason == VolumeChangeReasonEnum.Dispensing && history.ReferenceId.HasValue) {
                        var fuelRefill = await _contenxt.FuelRefills
                            .Include (fr => fr.Vehicle)
                            .FirstOrDefaultAsync (fr => fr.Id == history.ReferenceId, cancellationToken);

                        dto.VehicleName = fuelRefill?.Vehicle?.HyoungNo ?? "N/A";
                    } else {
                        dto.VehicleName = "N/A";
                    }

                    result.Add (dto);
                }

                return result;
            } catch (Exception ex) {
                _logger.LogError (ex, "Error getting tank volume history list");
                throw;
            }
        }
    }
}