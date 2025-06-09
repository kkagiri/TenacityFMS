using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.ModelsDTOs.PTS.Common;
using FMS.Domain.Entities;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.PTSDevice.Queries {
    public record GetAllowedDeviceQuery (string PtsId) : IRequest<DeviceInfoDTO?>;

    public class GetAllowedDeviceQueryHandler : IRequestHandler<GetAllowedDeviceQuery, DeviceInfoDTO?> {
        private readonly GpsdataContext _context;
        private readonly ILogger<GetAllowedDeviceQueryHandler> _logger;

        public GetAllowedDeviceQueryHandler (GpsdataContext context, ILogger<GetAllowedDeviceQueryHandler> logger) {
            _context = context;
            _logger = logger;
        }

        public async Task<DeviceInfoDTO?> Handle (GetAllowedDeviceQuery request, CancellationToken cancellationToken) {
            try {
                var device = await _context.Ptsdevices
                    .AsNoTracking ()
                    .Include (x => x.SiteNavigation)
                    .Include (x => x.Tanks)
                    .Where (x => x.Ptsid == request.PtsId && x.IsActive == 1)
                    .Select (x => new DeviceInfoDTO {
                        PtsId = x.Ptsid,
                            IpAddress = x.Ipaddress,
                            PortNumber = x.PortNumber,
                            IsAuthenticated = !string.IsNullOrEmpty (x.Login) && !string.IsNullOrEmpty (x.Password),
                            ProtocolSecurityType = x.ProtocolSecurityType,
                            AuthenticationType = x.AuthenticationType,
                            SiteId = x.Site,
                            SiteName = x.SiteNavigation != null ? x.SiteNavigation.Name : string.Empty,
                            WebSocketCapable = x.WebSocketCapable == 1,
                            IsActive = x.IsActive == 1,
                            AllowedForDirectCommands = x.AllowedForDirectCommands == 1,
                    }).FirstOrDefaultAsync (cancellationToken);

                if (device == null) {
                    _logger.LogWarning ("Device with PTS ID {PtsId} not found or is inactive", request.PtsId);
                    return null;
                }

                _logger.LogDebug ("Device with PTS ID {PtsId} retrieved successfully", request.PtsId);
                return device;
            } catch (Exception ex) {
                _logger.LogError (ex, "Error while getting device");
                return null;
            }
        }
    }
}