using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using FMS.Application.ModelsDTOs.FMS;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Queries.Database.FMSQuery.Consumption;

public record GetUnmodifiedConsumptionQuery(DateTime startDate):IRequest<List<VehicleConsumptionInfoDTO>>;

public class GetUnmodifiedConsumptionQueryHandler : IRequestHandler<GetUnmodifiedConsumptionQuery, List<VehicleConsumptionInfoDTO>>
{
    private readonly GpsdataContext _context;
    private readonly IMapper _mapper;
    private readonly ILogger<GetUnmodifiedConsumptionQueryHandler> _logger;
    public GetUnmodifiedConsumptionQueryHandler(GpsdataContext context, IMapper mapper,ILogger<GetUnmodifiedConsumptionQueryHandler> logger)
    {
        _context = context;
        
        _mapper = mapper;
    }

    public async Task<List<VehicleConsumptionInfoDTO>> Handle(GetUnmodifiedConsumptionQuery request, CancellationToken cancellationToken)
    {

        try
        {

        var EndDate = request.startDate.AddDays(-1).AddTicks(-1); //add one day to from start date
        var result = await _context.Vehicleconsumptions
            .Include(v => v.Vehicle)
            .Where(v => v.Date >= request.startDate && v.Date <=EndDate && v.IsModified == 0 && v.ReportId == null)
            .ToListAsync(cancellationToken);

           if(result==null ) throw new NullReferenceException("result is null");
        return _mapper.Map<List<VehicleConsumptionInfoDTO>>(result);
        } catch (Exception ex)
        {
            _logger.LogError(ex, "Error Fetching history consumption Data");
            throw;
        }
    }
}