using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Domain.Entities;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Queries.Database.PTSQueries.PTSDeviceQueries {
    public record GetPTSDeviceByIdQuery (string DeviceId) : IRequest<Ptsdevice?>;

    //Cursor: Add DTO for device configuration specific to fueling process
    public class PtsDeviceConfigDto {
        public string PtsId { get; set; } = string.Empty;
        public bool AutoAssignUserMasterTag { get; set; }
        public bool IsActive { get; set; }
        public bool IsAuthenticated { get; set; }
        public string? ConnectionStatus { get; set; }
        public int? SiteId { get; set; }
    }

    //Cursor: Add new query for getting device configuration for fueling process
    public record GetPTSDeviceConfigQuery (string DeviceId) : IRequest<PtsDeviceConfigDto?>;

    public class GetPTSDeviceByIdQueryHandler : IRequestHandler<GetPTSDeviceByIdQuery, Ptsdevice?> {
        private readonly GpsdataContext _context;
        private readonly ILogger<GetPTSDeviceByIdQueryHandler> _logger;

        public GetPTSDeviceByIdQueryHandler (GpsdataContext context, ILogger<GetPTSDeviceByIdQueryHandler> logger) {
            _context = context;
            _logger = logger;
        }

        public async Task<Ptsdevice?> Handle (GetPTSDeviceByIdQuery request, CancellationToken cancellationToken) {
            try {
                var device = await _context.Ptsdevices.FirstOrDefaultAsync (d => d.Ptsid == request.DeviceId, cancellationToken);
                return device;
            } catch (Exception ex) {
                _logger.LogError (ex, "Error retrieving PTS device with id {DeviceId}", request.DeviceId);
                throw;
            }
        }
    }

    //Cursor: Add handler for device configuration query
    public class GetPTSDeviceConfigQueryHandler : IRequestHandler<GetPTSDeviceConfigQuery, PtsDeviceConfigDto?> {
        private readonly GpsdataContext _context;
        private readonly ILogger<GetPTSDeviceConfigQueryHandler> _logger;

        public GetPTSDeviceConfigQueryHandler (GpsdataContext context, ILogger<GetPTSDeviceConfigQueryHandler> logger) {
            _context = context;
            _logger = logger;
        }

        public async Task<PtsDeviceConfigDto?> Handle (GetPTSDeviceConfigQuery request, CancellationToken cancellationToken) {
            try {
                var deviceConfig = await _context.Ptsdevices
                    .Where (d => d.Ptsid == request.DeviceId)
                    .Select (d => new PtsDeviceConfigDto {
                        PtsId = d.Ptsid,
                            AutoAssignUserMasterTag = d.AutoAssignUserMasterTag == 1,
                            IsActive = d.IsActive == 1,
                            IsAuthenticated = d.IsAuthenticated == 1,
                            ConnectionStatus = d.ConnectionStatus,
                            SiteId = d.Site
                    })
                    .FirstOrDefaultAsync (cancellationToken);

                return deviceConfig;
            } catch (Exception ex) {
                _logger.LogError (ex, "Error retrieving PTS device configuration for device {DeviceId}", request.DeviceId);
                throw;
            }
        }
    }
}