using System.Collections.Generic;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.Vehicle.DTOs;

namespace FMS.Application.Features.Vehicle.Services {
    public interface IGPSService {
        Task<FMSResponse<VehicleLocationDTO>> GetVehicleLocationAsync (int vehicleId);
        Task<FMSResponse<VehicleOdometerDTO>> GetVehicleOdometerAsync (int vehicleId);
        Task<FMSResponse<List<VehicleLocationDTO>>> GetAllVehicleLocationsAsync (bool onlineOnly = false, bool gpsEnabledOnly = true);
        Task<FMSResponse<bool>> IsVehicleOnlineAsync (int vehicleId);
        Task<FMSResponse<bool>> ValidateConnectionAsync ();
    }
}