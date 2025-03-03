using AutoMapper;
using FMS.Application.ModelsDTOs.FMS;
using FMS.Application.Queries.Database.FMSQuery.UserManagement.Permissions;
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

namespace FMS.Application.Queries.Database.FMSQuery.Consumption
{
    public record class GetModifiedVehicleConsumptionDaily(DateTime startDate) : IRequest<List<VehicleConsumptionInfoDTO>>;


    public class GetModifiedVehicleCosumptionDailyHandler : IRequestHandler<GetModifiedVehicleConsumptionDaily, List<VehicleConsumptionInfoDTO>>
    {
        private readonly GpsdataContext _context;
        private readonly ILogger<GetModifiedVehicleCosumptionDailyHandler> _logger;
        private readonly IMapper _mapper;

        public GetModifiedVehicleCosumptionDailyHandler(IMapper mapper, GpsdataContext context, ILogger<GetModifiedVehicleCosumptionDailyHandler> logger)
        {
            _context = context;
            _logger = logger;
            _mapper = mapper;
        }

        public async Task<List<VehicleConsumptionInfoDTO>> Handle(GetModifiedVehicleConsumptionDaily request, CancellationToken cancellationToken)
        {
            try
            {
                var EndDate = request.startDate.AddDays(-1).AddTicks(-1); //minus one day to from start date
                var result = await _context.Vehicleconsumptions
                    .Include(v => v.Vehicle)
                    .Where(v => v.Date >= request.startDate && v.Date <= EndDate && v.IsModified == 1)
                    .ToListAsync(cancellationToken);

                return _mapper.Map<List<VehicleConsumptionInfoDTO>>(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex.Message);
                throw;
            }
        }
    }

}
