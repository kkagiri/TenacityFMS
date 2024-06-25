using System;
using System.Threading;
using System.Threading.Tasks;
using FMS.Domain.Entities;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Queries.Database.FMSQuery.DeviceManager.DeviceQueries;

public record GetDeviceByIdQuery(int DeviceImei): IRequest<Device>;

public class GetDeviceByIdQueryHandler: IRequestHandler<GetDeviceByIdQuery, Device>
{
    private readonly GpsdataContext _context;
    private readonly ILogger<GetDeviceByIdQueryHandler> _logger;
    public GetDeviceByIdQueryHandler(GpsdataContext context, ILogger<GetDeviceByIdQueryHandler> logger)
    {
        _context = context;
        _logger = logger;
    }
    public async Task<Device> Handle(GetDeviceByIdQuery request, CancellationToken cancellationToken)
    {
        try{
        var device = await _context.Devices.FirstOrDefaultAsync(d => d.DeviceImei == request.DeviceImei, cancellationToken);
        if (device == null)
        {
                        _logger.LogError("Device not found {DeviceImei}", request.DeviceImei);

            throw new Exception("Device not found");
        }
        return device;
        }
        catch(Exception ex) 
        {
            _logger.LogError("Error in GetDeviceByIdQueryHandler ", ex);
            throw new Exception("Error in GetDeviceByIdQueryHandler");
        }
    }
}