using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FMS.Application.Features.LocationValidation.Queries;

/// <summary>
/// Query to get an overview of location settings across the system:
/// - Users with mobile bypass settings
/// - PTS devices with location validation settings
/// - Vehicles with GPS settings
/// </summary>
public class GetLocationSettingsOverviewQuery : IRequest<FMSResponse<LocationSettingsOverviewDTO>>
{
}

/// <summary>
/// DTO for location settings overview
/// </summary>
public class LocationSettingsOverviewDTO
{
    public List<UserLocationSettingsDTO> Users { get; set; } = new();
    public List<PTSDeviceLocationSettingsDTO> PTSDevices { get; set; } = new();
    public List<VehicleLocationSettingsDTO> Vehicles { get; set; } = new();

    public int TotalUsersWithBypass { get; set; }
    public int TotalUsersWithoutBypass { get; set; }
    public int TotalPTSDevicesWithLocationValidation { get; set; }
    public int TotalPTSDevicesWithoutLocationValidation { get; set; }
    public int TotalVehiclesWithGPS { get; set; }
    public int TotalVehiclesWithoutGPS { get; set; }
}

public class UserLocationSettingsDTO
{
    public string UserId { get; set; } = string.Empty;
    public string UserName { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? FullName { get; set; }
    public bool BypassLocationValidation { get; set; }
    public bool IsDeleted { get; set; }
}

public class PTSDeviceLocationSettingsDTO
{
    public string PtsId { get; set; } = string.Empty;
    public string? PtsName { get; set; }
    public string? SiteName { get; set; }
    public int? SiteId { get; set; }
    public bool EnableLocationValidation { get; set; }
    public bool RequireVehicleProximity { get; set; }
    public bool RequireMobileAppProximity { get; set; }
    public int? VehicleProximityRadius { get; set; }
    public int? MobileAppProximityRadius { get; set; }
    public bool BypassOnGPSFailure { get; set; }
    public int? MinimumGPSAccuracy { get; set; }
    public int? ProximityGracePeriodMeters { get; set; }
    public bool IsActive { get; set; }
    public string? ConnectionStatus { get; set; }
}

public class VehicleLocationSettingsDTO
{
    public int VehicleId { get; set; }
    public string HyoungNo { get; set; } = string.Empty;
    public string? NumberPlate { get; set; }
    public string? VehicleTypeName { get; set; }
    public bool HasGPSInstalled { get; set; }
    public bool IsActive { get; set; }
    public bool IsCompanyVehicle { get; set; }
}

public class GetLocationSettingsOverviewQueryHandler : IRequestHandler<GetLocationSettingsOverviewQuery, FMSResponse<LocationSettingsOverviewDTO>>
{
    private readonly GpsdataContext _context;

    public GetLocationSettingsOverviewQueryHandler(GpsdataContext context)
    {
        _context = context;
    }

    public async Task<FMSResponse<LocationSettingsOverviewDTO>> Handle(GetLocationSettingsOverviewQuery request, CancellationToken cancellationToken)
    {
        try
        {
            // Get users with location bypass settings
            var users = await _context.Users
                .Where(u => u.IsDeleted != true)
                .Select(u => new UserLocationSettingsDTO
                {
                    UserId = u.Id,
                    UserName = u.UserName ?? string.Empty,
                    Email = u.Email,
                    FullName = u.UserName, // Will be enhanced if we have a full name field
                    BypassLocationValidation = u.BypassLocationValidation,
                    IsDeleted = u.IsDeleted ?? false
                })
                .OrderByDescending(u => u.BypassLocationValidation)
                .ThenBy(u => u.UserName)
                .ToListAsync(cancellationToken);

            // Get PTS devices with location settings
            var ptsDevices = await _context.Ptsdevices
                .Include(p => p.SiteNavigation)
                .Select(p => new PTSDeviceLocationSettingsDTO
                {
                    PtsId = p.Ptsid,
                    PtsName = p.PtsName,
                    SiteName = p.SiteNavigation != null ? p.SiteNavigation.Name : null,
                    SiteId = p.Site,
                    EnableLocationValidation = p.EnableLocationValidation == 1,
                    RequireVehicleProximity = p.RequireVehicleProximity == 1,
                    RequireMobileAppProximity = p.RequireMobileAppProximity == 1,
                    VehicleProximityRadius = p.VehicleProximityRadius,
                    MobileAppProximityRadius = p.MobileAppProximityRadius,
                    BypassOnGPSFailure = p.BypassOnGPSFailure == 1,
                    MinimumGPSAccuracy = p.MinimumGPSAccuracy,
                    ProximityGracePeriodMeters = p.ProximityGracePeriodMeters,
                    IsActive = p.IsActive == 1,
                    ConnectionStatus = p.ConnectionStatus
                })
                .OrderByDescending(p => p.EnableLocationValidation)
                .ThenBy(p => p.PtsName)
                .ToListAsync(cancellationToken);

            // Get vehicles with GPS settings
            var vehicles = await _context.Vehicles
                .Include(v => v.VehicleType)
                .Where(v => v.IsActive == 1)
                .Select(v => new VehicleLocationSettingsDTO
                {
                    VehicleId = v.VehicleId,
                    HyoungNo = v.HyoungNo ?? string.Empty,
                    NumberPlate = v.NumberPlate,
                    VehicleTypeName = v.VehicleType != null ? v.VehicleType.Name : null,
                    HasGPSInstalled = v.HasGPSInstalled == 1,
                    IsActive = v.IsActive == 1,
                    IsCompanyVehicle = v.IsCompanyVehicle == 1
                })
                .OrderByDescending(v => v.HasGPSInstalled)
                .ThenBy(v => v.HyoungNo)
                .ToListAsync(cancellationToken);

            var result = new LocationSettingsOverviewDTO
            {
                Users = users,
                PTSDevices = ptsDevices,
                Vehicles = vehicles,
                TotalUsersWithBypass = users.Count(u => u.BypassLocationValidation),
                TotalUsersWithoutBypass = users.Count(u => !u.BypassLocationValidation),
                TotalPTSDevicesWithLocationValidation = ptsDevices.Count(p => p.EnableLocationValidation),
                TotalPTSDevicesWithoutLocationValidation = ptsDevices.Count(p => !p.EnableLocationValidation),
                TotalVehiclesWithGPS = vehicles.Count(v => v.HasGPSInstalled),
                TotalVehiclesWithoutGPS = vehicles.Count(v => !v.HasGPSInstalled)
            };

            return FMSResponse<LocationSettingsOverviewDTO>.Success(result);
        }
        catch (Exception ex)
        {
            return FMSResponse<LocationSettingsOverviewDTO>.Failed($"Error fetching location settings overview: {ex.Message}");
        }
    }
}
