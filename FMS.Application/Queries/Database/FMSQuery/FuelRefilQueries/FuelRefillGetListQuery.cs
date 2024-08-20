using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using FMS.Application.ModelsDTOs.FMS.FuelRefil;
using FMS.Domain.Entities;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Queries.Database.FMSQuery.FuelRefilQueries;

public record FuelRefillGetListQuery(int Take = 100,int Skip =0) : IRequest<List<FuelRefilDTO>>;

public class FuelRefillGetListQueryHandler : IRequestHandler<FuelRefillGetListQuery, List<FuelRefilDTO>>
{

    private readonly GpsdataContext _context;
    private readonly ILogger<FuelRefillGetListQueryHandler> _logger;
    private readonly IMapper _mapper;

     public FuelRefillGetListQueryHandler(GpsdataContext context, ILogger<FuelRefillGetListQueryHandler> logger, IMapper mapper)
     {
        _context = context;
        _logger = logger;
        _mapper = mapper;
     }

    public async Task<List<FuelRefilDTO>> Handle(FuelRefillGetListQuery request, CancellationToken cancellationToken)
    {
        try{
               var fuelRefils = await _context.Fuelrefils.OrderByDescending(x => x.Date)
               .Skip(request.Skip).Take(request.Take)
               .ToListAsync(cancellationToken);



                 var fuelRefilDTOs = _mapper.Map<List<FuelRefilDTO>>(fuelRefils);
                    return fuelRefilDTOs;
        } 
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching fuel refil data");
            throw new Exception(ex.Message);
        }
    }
}
