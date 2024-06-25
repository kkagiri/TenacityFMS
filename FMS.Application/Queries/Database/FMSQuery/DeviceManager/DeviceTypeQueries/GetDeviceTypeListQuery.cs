using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using FMS.Domain.Entities;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Queries.Database.FMSQuery.DeviceManager.DeviceTypeQueries;

public record GetDeviceTypeListQuery : IRequest<List<Devicetype>>;

public class GetDeviceTypeLIstQueryHandler : IRequestHandler<GetDeviceTypeListQuery, List<Devicetype>>
{
    private readonly GpsdataContext _context;
    private readonly ILogger<GetDeviceTypeByIdQueryHandler> _logger;

    public GetDeviceTypeLIstQueryHandler(GpsdataContext context, ILogger<GetDeviceTypeByIdQueryHandler> logger)
    {
        _context = context;
        _logger = logger;

    }

    public async Task<List<Devicetype>> Handle(GetDeviceTypeListQuery request, CancellationToken cancellationToken)
    {
        try
        {
            return await _context.Devicetypes.ToListAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching device type list");
            throw new Exception("Error fetching device type list");
        }
    }
}

