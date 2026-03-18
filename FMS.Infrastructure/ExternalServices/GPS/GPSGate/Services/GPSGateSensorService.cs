using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.Vehicle.DTOs;
using FMS.Infrastructure.VehicleTracking.Models.GPSGate;
using FMS.Persistence.DataAccess;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Infrastructure.ExternalServices.GPS.GPSGate.Services
{
    public class GPSGateSensorService : IGPSGateSensorService
    {
        private readonly IDbContextFactory<GpsdataContext> _contextFactory;
        private readonly HttpClient _httpClient;
        private readonly ILogger<GPSGateSensorService> _logger;
        private readonly IGPSGateConfigurationProvider _configurationProvider;
        private readonly IGPSGateGeocodingService _geocodingService;

        public GPSGateSensorService(
            IDbContextFactory<GpsdataContext> contextFactory,
            HttpClient httpClient,
            IGPSGateConfigurationProvider configurationProvider,
            IGPSGateGeocodingService geocodingService,
            ILogger<GPSGateSensorService> logger)
        {
            _contextFactory = contextFactory;
            _httpClient = httpClient;
            _configurationProvider = configurationProvider;
            _geocodingService = geocodingService;
            _logger = logger;
        }
        public async Task<FMSResponse<VehicleGPSInformationDTO>> GetVehicleGPSInformationAsync(int vehicleId)
        {
            try
            {
                await using var context = await _contextFactory.CreateDbContextAsync();
                var vehicle = await context.Vehicles
                    .Where(v => v.VehicleId == vehicleId)
                    .FirstOrDefaultAsync();

                if (vehicle == null)
                    return FMSResponse<VehicleGPSInformationDTO>.Failed("Vehicle not found");

                // Try to get device ID from vehicle_provider_mappings first (new way)
                var providerMapping = await context.VehicleProviderMappings
                    .Include(m => m.ProviderConfiguration)
                    .Where(m => m.VehicleId == vehicleId
                        && m.IsActive
                        && m.ProviderConfiguration.Name == "GPSGate"
                        && m.ProviderConfiguration.IsEnabled)
                    .FirstOrDefaultAsync();

                var externalDeviceId = providerMapping?.ExternalDeviceId;

                if (string.IsNullOrEmpty(externalDeviceId))
                    return FMSResponse<VehicleGPSInformationDTO>.Failed("Vehicle doesn't have an active GPS provider mapping configured.");

                var (baseUrl, applicationId, authHeader) = await _configurationProvider.GetProviderSettingsAsync();

                var statusUrl = $"{baseUrl}/applications/{applicationId}/users/{externalDeviceId}/status";

                using var statusRequest = new HttpRequestMessage(HttpMethod.Get, statusUrl);
                statusRequest.Headers.Authorization = authHeader;
                var statusResponse = await _httpClient.SendAsync(statusRequest);

                using var deviceRequest = new HttpRequestMessage(HttpMethod.Get, $"{baseUrl}/applications/{applicationId}/users/{externalDeviceId}");
                deviceRequest.Headers.Authorization = authHeader;
                var deviceResponse = await _httpClient.SendAsync(deviceRequest);

                var gpsInfo = new VehicleGPSInformationDTO
                {
                    VehicleId = vehicleId,
                    VehicleName = vehicle.HyoungNo ?? string.Empty,
                    NumberPlate = vehicle.NumberPlate,
                    HasGPSInstalled = providerMapping != null || vehicle.HasGPSInstalled == 1,
                    DeviceId = ParseExternalDeviceId(externalDeviceId),
                    IsOnline = false,
                    SensorHealth = new SensorHealthDTO
                    {
                        OverallHealth = "Unknown",
                        IsPositionValid = false
                    }
                };

                if (statusResponse.IsSuccessStatusCode)
                {
                    var statusContent = await statusResponse.Content.ReadAsStringAsync();
                    var gpsData = JsonSerializer.Deserialize<GPSGateUserStatus>(statusContent, new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true
                    });

                    if (gpsData?.Position != null)
                    {
                        gpsInfo.Latitude = (decimal)gpsData.Position.Latitude;
                        gpsInfo.Longitude = (decimal)gpsData.Position.Longitude;
                        gpsInfo.Altitude = gpsData.Position.Altitude.HasValue ? (decimal)gpsData.Position.Altitude : null;
                        gpsInfo.Speed = gpsData.Velocity?.GroundSpeed.HasValue == true ? (decimal)gpsData.Velocity.GroundSpeed : null;
                        gpsInfo.Heading = gpsData.Velocity?.Heading.HasValue == true ? (decimal)gpsData.Velocity.Heading : null;
                        gpsInfo.LastUpdated = DateTime.TryParse(gpsData.UTC, out var lastUpdate) ? lastUpdate : DateTime.UtcNow;
                        gpsInfo.IsOnline = true;
                        gpsInfo.SensorHealth.IsPositionValid = true;
                        gpsInfo.SensorHealth.LastSensorUpdate = gpsInfo.LastUpdated;

                        if (gpsData.Variables != null && gpsData.Variables.Any())
                        {
                            ParseSensorVariables(gpsData.Variables, gpsInfo.SensorHealth);
                        }
                        else
                        {
                            gpsInfo.SensorHealth.GPSSignalStrength = "Unknown";
                            gpsInfo.SensorHealth.OverallHealth = "Unknown";
                        }
                    }
                }

                if (deviceResponse.IsSuccessStatusCode)
                {
                    var deviceContent = await deviceResponse.Content.ReadAsStringAsync();
                    var deviceData = JsonSerializer.Deserialize<GPSGateUser>(deviceContent, new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true
                    });

                    if (deviceData?.Devices != null && deviceData.Devices.Any())
                    {
                        var device = deviceData.Devices.FirstOrDefault();
                        gpsInfo.DeviceIMEI = device?.IMEI;
                        gpsInfo.DeviceName = device?.Name;
                        gpsInfo.Protocol = device?.ProtocolID;
                        gpsInfo.LastIP = device?.LastIP;
                        gpsInfo.LastDeviceActivity = DateTime.TryParse(deviceData.DeviceActivity, out var activityTime) ? activityTime : null;
                    }
                }

                if (gpsInfo.SensorHealth != null)
                {
                    gpsInfo.SensorHealth.FuelLevelUnit = gpsInfo.SensorHealth.FuelLevelUnit ?? "Liters";

                    if (gpsInfo.SensorHealth.OverallHealth == "Unknown")
                    {
                        if (gpsInfo.SensorHealth.IsPositionValid && gpsInfo.SensorHealth.SatelliteCount.HasValue && gpsInfo.SensorHealth.SatelliteCount > 0)
                            gpsInfo.SensorHealth.OverallHealth = "Good";
                        else if (gpsInfo.SensorHealth.IsPositionValid)
                            gpsInfo.SensorHealth.OverallHealth = "Warning";
                        else
                            gpsInfo.SensorHealth.OverallHealth = "Unknown";
                    }
                }

                // Perform reverse geocoding to get address if we have valid coordinates
                if (gpsInfo.Latitude.HasValue && gpsInfo.Longitude.HasValue)
                {
                    try
                    {
                        var geocodeResult = await _geocodingService.ReverseGeocodeAsync(gpsInfo.Longitude.Value, gpsInfo.Latitude.Value);
                        if (geocodeResult.IsSuccess && geocodeResult.Data != null)
                        {
                            gpsInfo.Address = geocodeResult.Data.FormattedResult;
                            _logger.LogDebug("Geocoded vehicle {VehicleId} location to: {Address}", vehicleId, gpsInfo.Address);
                        }
                    }
                    catch (Exception geocodeEx)
                    {
                        // Don't fail the entire operation if geocoding fails
                        _logger.LogWarning(geocodeEx, "Failed to geocode location for vehicle {VehicleId}", vehicleId);
                    }
                }

                return FMSResponse<VehicleGPSInformationDTO>.Success(gpsInfo);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving GPS information for vehicle {VehicleId}", vehicleId);
                return FMSResponse<VehicleGPSInformationDTO>.Failed($"Error retrieving GPS information: {ex.Message}");
            }
        }

        public async Task<FMSResponse<VehicleOdometerDTO>> GetVehicleOdometerAsync(int vehicleId)
        {
            try
            {
                await using var context = await _contextFactory.CreateDbContextAsync();
                var vehicle = await context.Vehicles
                    .Where(v => v.VehicleId == vehicleId)
                    .FirstOrDefaultAsync();

                if (vehicle == null)
                    return FMSResponse<VehicleOdometerDTO>.Failed("Vehicle not found");

                // Try to get device ID from vehicle_provider_mappings first (new way)
                var providerMapping = await context.VehicleProviderMappings
                    .Include(m => m.ProviderConfiguration)
                    .Where(m => m.VehicleId == vehicleId
                        && m.IsActive
                        && m.ProviderConfiguration.Name == "GPSGate"
                        && m.ProviderConfiguration.IsEnabled)
                    .FirstOrDefaultAsync();

                var externalDeviceId = providerMapping?.ExternalDeviceId;

                if (string.IsNullOrEmpty(externalDeviceId))
                    return FMSResponse<VehicleOdometerDTO>.Failed("Vehicle doesn't have an active GPS provider mapping configured");

                var (baseUrl, applicationId, authHeader) = await _configurationProvider.GetProviderSettingsAsync();

                using var request = new HttpRequestMessage(HttpMethod.Get, $"{baseUrl}/applications/{applicationId}/accumulators?UserId={externalDeviceId}");
                request.Headers.Authorization = authHeader;
                var response = await _httpClient.SendAsync(request);

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogWarning("Failed to get odometer data for vehicle {VehicleId}. Status: {StatusCode}",
                        vehicleId, response.StatusCode);
                    return FMSResponse<VehicleOdometerDTO>.Failed("Failed to retrieve odometer data from GPS provider");
                }

                var content = await response.Content.ReadAsStringAsync();
                var accumulators = JsonSerializer.Deserialize<List<GPSGateAccumulator>>(content, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

                var odometerData = accumulators?.FirstOrDefault(a => a.AccumulatorTypeId == 1);

                var odometerDto = new VehicleOdometerDTO
                {
                    VehicleId = vehicleId,
                    VehicleName = vehicle.HyoungNo ?? string.Empty,
                    NumberPlate = vehicle.NumberPlate,
                    CurrentOdometer = odometerData?.Value.HasValue == true ? (decimal)odometerData.Value / 1000 : 0,
                    TotalDistance = odometerData?.Value.HasValue == true ? (decimal)odometerData.Value / 1000 : 0,
                    LastUpdated = DateTime.TryParse(odometerData?.Timestamp, out var lastUpdate) ? lastUpdate : DateTime.UtcNow,
                    Unit = "km",
                    HasGPSInstalled = providerMapping != null || vehicle.HasGPSInstalled == 1,
                    DeviceId = ParseExternalDeviceId(externalDeviceId)
                };

                return FMSResponse<VehicleOdometerDTO>.Success(odometerDto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving odometer data for vehicle {VehicleId}", vehicleId);
                return FMSResponse<VehicleOdometerDTO>.Failed($"Error retrieving odometer data: {ex.Message}");
            }
        }

        public async Task<FMSResponse<decimal?>> GetFuelLevelAsync(int vehicleId)
        {
            var gpsInfo = await GetVehicleGPSInformationAsync(vehicleId);
            return gpsInfo.IsSuccess
                ? FMSResponse<decimal?>.Success(gpsInfo.Data?.SensorHealth?.FuelLevel)
                : FMSResponse<decimal?>.Failed(gpsInfo.Message ?? "Failed to retrieve fuel level");
        }

        public async Task<FMSResponse<decimal?>> GetEngineTemperatureAsync(int vehicleId)
        {
            var gpsInfo = await GetVehicleGPSInformationAsync(vehicleId);
            return gpsInfo.IsSuccess
                ? FMSResponse<decimal?>.Success(gpsInfo.Data?.SensorHealth?.EngineTemperature)
                : FMSResponse<decimal?>.Failed(gpsInfo.Message ?? "Failed to retrieve engine temperature");
        }

        public async Task<FMSResponse<decimal?>> GetBatteryVoltageAsync(int vehicleId)
        {
            var gpsInfo = await GetVehicleGPSInformationAsync(vehicleId);
            return gpsInfo.IsSuccess
                ? FMSResponse<decimal?>.Success(gpsInfo.Data?.SensorHealth?.BatteryVoltage)
                : FMSResponse<decimal?>.Failed(gpsInfo.Message ?? "Failed to retrieve battery voltage");
        }

        public async Task<FMSResponse<bool?>> GetIgnitionStatusAsync(int vehicleId)
        {
            var gpsInfo = await GetVehicleGPSInformationAsync(vehicleId);
            return gpsInfo.IsSuccess
                ? FMSResponse<bool?>.Success(gpsInfo.Data?.SensorHealth?.IgnitionStatus)
                : FMSResponse<bool?>.Failed(gpsInfo.Message ?? "Failed to retrieve ignition status");
        }

        public async Task<FMSResponse<bool?>> GetEngineStatusAsync(int vehicleId)
        {
            var gpsInfo = await GetVehicleGPSInformationAsync(vehicleId);
            return gpsInfo.IsSuccess
                ? FMSResponse<bool?>.Success(gpsInfo.Data?.SensorHealth?.EngineStatus)
                : FMSResponse<bool?>.Failed(gpsInfo.Message ?? "Failed to retrieve engine status");
        }

        private static int? ParseExternalDeviceId(string? externalDeviceId)
        {
            return int.TryParse(externalDeviceId, out var parsedDeviceId) ? parsedDeviceId : null;
        }

        private void ParseSensorVariables(List<GPSGateVariable> variables, SensorHealthDTO sensorHealth)
        {
            foreach (var variable in variables)
            {
                if (string.IsNullOrWhiteSpace(variable.Name) || string.IsNullOrWhiteSpace(variable.Value))
                    continue;

                var variableName = variable.Name.Trim().ToLower();
                var variableValue = variable.Value.Trim();
                var variableType = variable.Type?.ToLower();

                try
                {
                    switch (variableName)
                    {
                        case "satellitecount":
                            if (int.TryParse(variableValue, System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out var satelliteCount))
                            {
                                sensorHealth.SatelliteCount = satelliteCount;
                                sensorHealth.GPSSignalStrength = satelliteCount >= 8 ? "Strong" :
                                                                 satelliteCount >= 4 ? "Moderate" :
                                                                 satelliteCount > 0 ? "Weak" : "None";
                            }
                            break;

                        case "battery voltage":
                        case "batteryvoltage":
                        case "voltage":
                            if (decimal.TryParse(variableValue, System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out var batteryVoltage))
                            {
                                // Use the non-zero value (Voltage is usually the correct one)
                                if (batteryVoltage > 0 || sensorHealth.BatteryVoltage == null)
                                {
                                    sensorHealth.BatteryVoltage = batteryVoltage;
                                }
                            }
                            break;

                        case "fuel level":
                        case "fuellevel":
                            // Use "Fuel level" (calculated) over "Rawfuel"
                            if (decimal.TryParse(variableValue, System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out var fuelLevel))
                            {
                                sensorHealth.FuelLevel = fuelLevel;
                                sensorHealth.FuelLevelUnit = "Liters";
                            }
                            break;

                        case "rawfuel":
                            // Only use raw fuel if we don't have calculated fuel level yet
                            if (sensorHealth.FuelLevel == null)
                            {
                                if (decimal.TryParse(variableValue, System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out var rawFuel))
                                {
                                    sensorHealth.FuelLevel = rawFuel;
                                    sensorHealth.FuelLevelUnit = "Liters";
                                }
                            }
                            break;

                        case "ignition":
                            if (bool.TryParse(variableValue, out var ignition))
                            {
                                sensorHealth.IgnitionStatus = ignition;
                            }
                            break;

                        case "engine":
                        case "enginestatus":
                            if (bool.TryParse(variableValue, out var engineStatus))
                            {
                                sensorHealth.EngineStatus = engineStatus;
                            }
                            break;

                        case "enginetemperature":
                        case "temperature":
                        case "engtemp":
                            if (decimal.TryParse(variableValue, System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out var engineTemp))
                            {
                                sensorHealth.EngineTemperature = engineTemp;
                            }
                            break;

                        // Additional variables - logged but not critical
                        case "customanalog1":
                        case "harshaccelerationdigital":
                        case "harshturningdigital":
                        case "harshbreakingdigital":
                        case "digitalinput1":
                        case "speed":
                        case "_odometer":
                        case "_datetimeserver":
                            // These are informational - ignore silently
                            break;

                        default:
                            _logger.LogDebug("Unhandled sensor variable: {Name} = {Value}", variable.Name, variableValue);
                            break;
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Error parsing sensor variable {VariableName} with value {Value}", variable.Name, variableValue);
                }
            }

            var healthFactors = new List<string>();

            if (sensorHealth.IsPositionValid && sensorHealth.SatelliteCount.HasValue && sensorHealth.SatelliteCount > 0)
                healthFactors.Add("GPS");

            if (sensorHealth.BatteryVoltage.HasValue && sensorHealth.BatteryVoltage >= 12.0m && sensorHealth.BatteryVoltage <= 14.5m)
                healthFactors.Add("Battery");

            if (healthFactors.Count >= 2)
                sensorHealth.OverallHealth = "Good";
            else if (healthFactors.Count == 1)
                sensorHealth.OverallHealth = "Warning";
            else if (sensorHealth.IsPositionValid)
                sensorHealth.OverallHealth = "Warning";
            else
                sensorHealth.OverallHealth = "Unknown";
        }
    }
}
