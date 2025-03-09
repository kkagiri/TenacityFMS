using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using FMS.Domain.Entities;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FMS.Application.Queries.Database.FMSQuery.DeviceManager.DeviceModelQueries;

public record GetDeviceModelListQuery() : IRequest<List<Devicemodel>>;

public class GetDeviceModelListQueryHandler : IRequestHandler<GetDeviceModelListQuery, List<Devicemodel>>
{
    private readonly GpsdataContext _context;
    public GetDeviceModelListQueryHandler(GpsdataContext context)
    {
        _context = context;
    }

    public async Task<List<Devicemodel>> Handle(GetDeviceModelListQuery request, CancellationToken cancellationToken)
    {
        try
        {
            var deviceModels = await _context.Devicemodels.ToListAsync(cancellationToken);
            return deviceModels;
        }
        catch (Exception ex)
        {
            throw new Exception("Error in GetDeviceModelListQueryHandler", ex);
        }

    }
}