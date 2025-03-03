using System;
using System.Threading;
using System.Threading.Tasks;
using FMS.Domain.Entities;
using FMS.Persistence.DataAccess;
using MediatR;

namespace FMS.Application.Queries.Database.FMSQuery.DeviceManager.DeviceModelQueries;

public record GetDeviceModelByIdQuery(int Id) : IRequest<Devicemodel>;

public class GetDeviceModelByIdQueryHandler : IRequestHandler<GetDeviceModelByIdQuery, Devicemodel>
{
    private readonly GpsdataContext _context;
    public GetDeviceModelByIdQueryHandler(GpsdataContext context)
    {
        _context = context;
    }

    public async Task<Devicemodel> Handle(GetDeviceModelByIdQuery request, CancellationToken cancellationToken)
    {
        try
        {
            var deviceModel = await _context.Devicemodels.FindAsync(request.Id, cancellationToken);
            return deviceModel;
        }
        catch (Exception ex)
        {
            throw new Exception("Error in GetDeviceModelByIdQueryHandler", ex);
        }

    }
}