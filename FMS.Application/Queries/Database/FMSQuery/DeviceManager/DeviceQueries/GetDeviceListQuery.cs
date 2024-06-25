using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using FMS.Domain.Entities;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FMS.Application.Queries.Database.FMSQuery.DeviceManager.DeviceQueries;

public record GetDeviceListQuery(): IRequest<List<Device>>;
public class GetDeviceListQueryHandler: IRequestHandler<GetDeviceListQuery, List<Device>>
{
    private readonly GpsdataContext _context;
    public GetDeviceListQueryHandler(GpsdataContext context)
    {
        _context = context;
    }
    public async Task<List<Device>> Handle(GetDeviceListQuery request, CancellationToken cancellationToken)
    {
        return await _context.Devices.ToListAsync(cancellationToken);
    }
}