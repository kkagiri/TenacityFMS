using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using FMS.Application.ModelsDTOs.FMS.TankStock;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Queries.Database.FMSQuery.TankStock;

public record GetTankStockListQuery : IRequest<List<TankStockDTO>>;

 public class GetTankStockListQueryHandler : IRequestHandler<GetTankStockListQuery,List<TankStockDTO>>
{
    private readonly GpsdataContext _context;
    private readonly IMapper _mapper;

    private readonly ILogger<GetTankStockListQueryHandler> _logger;

    public GetTankStockListQueryHandler (GpsdataContext context, IMapper mapper, ILogger<GetTankStockListQueryHandler> logger)
    {
        _context = context;
        _mapper = mapper;
        _logger = logger;
    }

    public async Task<List<TankStockDTO>> Handle(GetTankStockListQuery request, CancellationToken cancellationToken)
    {
        try
        {
            var tankStocks = await _context.Tankstocks
            .Select(ts => new TankStockDTO
            {
                EntryId = ts.EntryId,
                TankId = ts.TankId,
                EntryDate = ts.EntryDate,
                EntryType = string.IsNullOrEmpty(ts.EntryType)
                    ? EntryType.TankReconciliation
                    : Enum.Parse<EntryType>(ts.EntryType),
                ManualStartLevel = ts.ManualStartLevel,
                ManualEndLevel = ts.ManualEndLevel,
                ManualDeliveryAmount = ts.ManualDeliveryAmount,
                SensorStartLevel = ts.SensorStartLevel,
                SensorEndLevel = ts.SensorEndLevel,
                SensorDeliveryAmount = ts.SensorDeliveryAmount,
                RecordedBy = ts.RecordedBy,
                SiteId = ts.SiteId,
                DeliveryDensity = ts.DeliveryDensity,
                DeliveryTemperature = ts.DeliveryTemperature,
                DeliveryMass = ts.DeliveryMass,
                Product = ts.Product

            })
            .ToListAsync(cancellationToken);

            return tankStocks;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting tank stock list");
            throw;
        }

        
    }
}
