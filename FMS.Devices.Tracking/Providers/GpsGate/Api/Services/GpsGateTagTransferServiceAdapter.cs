using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.CommonInterface;
using FMS.Application.Features.VehicleTransfer.Commands;

namespace FMS.Infrastructure.ExternalServices.GPS.GPSGate.Services;

/// <summary>
/// Adapter service that bridges the Application layer's IGpsGateTagTransferService
/// with the Infrastructure layer's IGpsGateTagManagementService
/// </summary>
public class GpsGateTagTransferServiceAdapter : IGpsGateTagTransferService, ITrackingTagTransferService
{
    private readonly IGpsGateTagManagementService _tagManagementService;

    public GpsGateTagTransferServiceAdapter(IGpsGateTagManagementService tagManagementService)
    {
        _tagManagementService = tagManagementService;
    }

    public async Task<FMSResponse<object>> MoveVehicleBetweenSiteTagsAsync(
        int vehicleId,
        int fromSiteId,
        int toSiteId,
        CancellationToken cancellationToken = default)
    {
        var result = await _tagManagementService.MoveVehicleBetweenSiteTagsAsync(
            vehicleId,
            fromSiteId,
            toSiteId,
            cancellationToken);

        if (result.IsSuccess)
        {
            return FMSResponse<object>.Success(result.Data!, result.Message);
        }

        return FMSResponse<object>.Failed(result.Message);
    }
}
