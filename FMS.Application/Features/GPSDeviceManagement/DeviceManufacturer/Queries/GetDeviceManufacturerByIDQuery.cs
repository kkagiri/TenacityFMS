using System.Threading;
using System.Threading.Tasks;
using FMS.Domain.Entities;
using FMS.Persistence.DataAccess;
using MediatR;

namespace FMS.Application.Queries.Database.FMSQuery.DeviceManager.DeviceManufacturerQueries;

// Get DeviceManufacturer by ID Query
public record GetDeviceManufacturerByIdQuery(int Id) : IRequest<Devicemanufacturer>;

public class GetDeviceManufacturerByIdQueryHandler : IRequestHandler<GetDeviceManufacturerByIdQuery, Devicemanufacturer>
{
    private readonly GpsdataContext _context;

    public GetDeviceManufacturerByIdQueryHandler(GpsdataContext context)
    {
        _context = context;
    }

    public async Task<Devicemanufacturer> Handle(GetDeviceManufacturerByIdQuery request, CancellationToken cancellationToken)
    {
        return await _context.Devicemanufacturers.FindAsync(request.Id);
    }
}
