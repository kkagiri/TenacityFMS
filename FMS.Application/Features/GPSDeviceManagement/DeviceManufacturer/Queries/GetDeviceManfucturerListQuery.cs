using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using FMS.Domain.Entities;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Queries.Database.FMSQuery.DeviceManager.DeviceManufacturerQueries;


public record GetDeviceManufacturerListQuery() : IRequest<List<Devicemanufacturer>>;

public class GetDeviceManufacturerListQueryHandler : IRequestHandler<GetDeviceManufacturerListQuery, List<Devicemanufacturer>>
{

    private readonly GpsdataContext _context;
    private readonly ILogger<GetDeviceManufacturerListQueryHandler> _logger;

    public GetDeviceManufacturerListQueryHandler(GpsdataContext context, ILogger<GetDeviceManufacturerListQueryHandler> logger)
    {
        _context = context;
        _logger = logger;

    }
    public async Task<List<Devicemanufacturer>> Handle(GetDeviceManufacturerListQuery request, CancellationToken cancellationToken)
    {
        try
        {
            return await _context.Devicemanufacturers.ToListAsync(cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex.Message);
            throw new Exception(ex.Message);
        }
    }
}