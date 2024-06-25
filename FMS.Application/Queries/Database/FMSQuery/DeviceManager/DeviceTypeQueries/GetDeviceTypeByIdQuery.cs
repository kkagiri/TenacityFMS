using System;
using System.Threading;
using System.Threading.Tasks;
using FMS.Domain.Entities;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Queries.Database.FMSQuery.DeviceManager.DeviceTypeQueries;


public record GetDeviceTypeByIdQuery(int Id) : IRequest<Devicetype>;

public class GetDeviceTypeByIdQueryHandler : IRequestHandler<GetDeviceTypeByIdQuery, Devicetype>
{
    private readonly GpsdataContext _context;

    private readonly ILogger<GetDeviceTypeByIdQueryHandler> _logger;

    public GetDeviceTypeByIdQueryHandler(GpsdataContext contextm, ILogger<GetDeviceTypeByIdQueryHandler> logger)
    {
        _context = contextm;
        _logger = logger;
    }
    

    public async Task<Devicetype> Handle(GetDeviceTypeByIdQuery request, CancellationToken cancellationToken)
    {
        try{
        return await _context.Devicetypes.FindAsync(request.Id);
        }
        catch(Exception ex)
        {
            _logger.LogError(ex,"Error in GetDeviceTypeByIdQueryHandler");
            throw new Exception("Error in GetDeviceTypeByIdQueryHandler");
        }
    }
}