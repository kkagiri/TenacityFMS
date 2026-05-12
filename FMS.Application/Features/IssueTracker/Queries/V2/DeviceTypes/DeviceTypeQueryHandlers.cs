using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.IssueTracker.DTOs.V2;
using FMS.Domain.Entities;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.IssueTracker.Queries.V2.DeviceTypes;

public class GetDeviceTypesQueryHandler : IRequestHandler<GetDeviceTypesQuery, FMSResponse<List<DeviceTypeDTO>>>
{
    private readonly GpsdataContext _context;
    private readonly ILogger<GetDeviceTypesQueryHandler> _logger;

    public GetDeviceTypesQueryHandler(GpsdataContext context, ILogger<GetDeviceTypesQueryHandler> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<FMSResponse<List<DeviceTypeDTO>>> Handle(GetDeviceTypesQuery request, CancellationToken cancellationToken)
    {
        try
        {
            var deviceTypes = await _context.Devicetypes
                .Include(d => d.Issuetemplates)
                .OrderBy(d => d.Name)
                .Select(d => new DeviceTypeDTO
                {
                    Id = d.Id,
                    Name = d.Name,
                    Description = d.Description,
                    IsMonitored = d.IsMonitored,
                    MonitoringEndpoint = d.MonitoringEndpoint,
                    CreatedAt = d.CreatedAt,
                    UpdatedAt = d.UpdatedAt,
                    TemplateCount = d.Issuetemplates != null ? d.Issuetemplates.Count : 0
                })
                .ToListAsync(cancellationToken);

            return FMSResponse<List<DeviceTypeDTO>>.Success(deviceTypes);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting Device Types");
            return FMSResponse<List<DeviceTypeDTO>>.Failed($"Error getting Device Types: {ex.Message}");
        }
    }
}

public class GetDeviceTypeByIdQueryHandler : IRequestHandler<GetDeviceTypeByIdQuery, FMSResponse<DeviceTypeDTO>>
{
    private readonly GpsdataContext _context;
    private readonly ILogger<GetDeviceTypeByIdQueryHandler> _logger;

    public GetDeviceTypeByIdQueryHandler(GpsdataContext context, ILogger<GetDeviceTypeByIdQueryHandler> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<FMSResponse<DeviceTypeDTO>> Handle(GetDeviceTypeByIdQuery request, CancellationToken cancellationToken)
    {
        try
        {
            var deviceType = await _context.Devicetypes
                .Include(d => d.Issuetemplates)
                .Where(d => d.Id == request.Id)
                .Select(d => new DeviceTypeDTO
                {
                    Id = d.Id,
                    Name = d.Name,
                    Description = d.Description,
                    IsMonitored = d.IsMonitored,
                    MonitoringEndpoint = d.MonitoringEndpoint,
                    CreatedAt = d.CreatedAt,
                    UpdatedAt = d.UpdatedAt,
                    TemplateCount = d.Issuetemplates != null ? d.Issuetemplates.Count : 0
                })
                .FirstOrDefaultAsync(cancellationToken);

            if (deviceType == null)
            {
                return FMSResponse<DeviceTypeDTO>.Failed($"Device Type with ID {request.Id} not found.");
            }

            return FMSResponse<DeviceTypeDTO>.Success(deviceType);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting Device Type {Id}", request.Id);
            return FMSResponse<DeviceTypeDTO>.Failed($"Error getting Device Type: {ex.Message}");
        }
    }
}
