using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using FMS.Application.ModelsDTOs.FMS;
using FMS.Application.ModelsDTOs.FMS.Reports;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Queries.Database.FMSQuery.Consumption;

public record GetConsumptionListQuery (int PagingNo) : IRequest<List<VehicleConsumptionInfoDTO>>;

public class GetConsumptionHistoryQueryHandler : IRequestHandler<GetConsumptionListQuery, List<VehicleConsumptionInfoDTO>> {

    private readonly GpsdataContext _context;
    private readonly IMapper _mapper;
    private readonly ILogger _logger;

    public GetConsumptionHistoryQueryHandler (GpsdataContext context, IMapper mapper, ILogger<GetConsumptionHistoryQueryHandler> logger) {
        _context = context;
        _mapper = mapper;
        _logger = logger;
    }
    public async Task<List<VehicleConsumptionInfoDTO>> Handle (GetConsumptionListQuery request, CancellationToken cancellationToken) {
        try {
            var results = await _context.Vehicleconsumptions.OrderByDescending (x => x.Date).Take (request.PagingNo).ToListAsync (cancellationToken);
            return _mapper.Map<List<VehicleConsumptionInfoDTO>> (results);
        } catch (Exception ex) {
            _logger.LogError (ex, "An error occured while getting consumption list");
            throw new Exception (ex.ToString ());
        }
    }
}