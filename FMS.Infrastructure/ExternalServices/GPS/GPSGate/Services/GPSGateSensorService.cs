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
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace FMS.Infrastructure.ExternalServices.GPS.GPSGate.Services
{
    public class GPSGateSensorService : IGPSGateSensorService
    {
        private readonly GpsdataContext _context;
        private readonly HttpClient _httpClient;
        private readonly ILogger<GPSGateSensorService> _logger;
        private readonly string _apiKey;
        private readonly string _baseUrl;
        private readonly int _applicationId;

        public GPSGateSensorService(
            GpsdataContext context,
            HttpClient httpClient,
            IConfiguration configuration,
            ILogger<GPSGateSensorService> logger)
        {
            _context = context;
            _httpClient = httpClient;
            _logger = logger;

            _apiKey = configuration["GPSGate:ApiKey"] ?? throw new ArgumentNullException("GPSGate:ApiKey not configured");
            _baseUrl = configuration["GPSGate:BaseUrl"] ?? throw new ArgumentNullException("GPSGate:BaseUrl not configured");
            _applicationId = int.Parse(configuration["GPSGate:ApplicationId"] ?? "1");

            _httpClient.DefaultRequestHeaders.Add("Authorization", _apiKey);
        }

        public async Task<FMSResponse<VehicleGPSInformationDTO>> GetVehicleGPSInformationAsync(int vehicleId)
        {
            try
            {
                var vehicle = await _context.Vehicles
                    .Where(v => v.VehicleId == vehicleId && v.HasGPSInstalled == 1)
                    .FirstOrDefaultAsync();

                if (vehicle == null)
                    return FMSResponse<VehicleGPSInformationDTO>.Failed("Vehicle not found or doesn't have GPS installed");

                var statusResponse = await _httpClient.GetAsync(
                    $"{_baseUrl}/applications/{_applicationId}/users/{vehicle.DeviceId}/status");

                var deviceResponse = await _httpClient.GetAsync(
                    $"{_baseUrl}/applications/{_applicationId}/users/{vehicle.DeviceId}");

                var gpsInfo = new VehicleGPSInformationDTO
                {
                    VehicleId = vehicleId,
                    VehicleName = vehicle.HyoungNo ?? string.Empty,
                    NumberPlate = vehicle.NumberPlate,
                    HasGPSInstalled = vehicle.HasGPSInstalled == 1,
                    DeviceId = vehicle.DeviceId,
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
                            ParseSensorVariables(gpsData.Variables, gpsInfo.SensorHealth);
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
                var vehicle = await _context.Vehicles
                    .Where(v => v.VehicleId == vehicleId && v.HasGPSInstalled == 1)
                    .FirstOrDefaultAsync();

                if (vehicle == null)
                    return FMSResponse<VehicleOdometerDTO>.Failed("Vehicle not found or doesn't have GPS installed");

                if (!vehicle.DeviceId.HasValue)
                    return FMSResponse<VehicleOdometerDTO>.Failed("Vehicle doesn't have a GPS device ID configured");

                var response = await _httpClient.GetAsync(
                    $"{_baseUrl}/applications/{_applicationId}/accumulators?UserId={vehicle.DeviceId}");

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
                    HasGPSInstalled = vehicle.HasGPSInstalled == 1,
                    DeviceId = vehicle.DeviceId
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

        private void ParseSensorVariables(List<GPSGateVariable> variables, SensorHealthDTO sensorHealth)
        {
            foreach (var variable in variables)
            {
                if (string.IsNullOrWhiteSpace(variable.Name) || string.IsNullOrWhiteSpace(variable.Value))
                    continue;

                var variableName = variable.Name.Trim();
                var variableValue = variable.Value.Trim();
                var variableType = variable.Type?.ToLower();

                try
                {
                    switch (variableName.ToLower())
                    {
                        case "satellitecount":
                            if (int.TryParse(variableValue, out var satelliteCount))
                            {
                                sensorHealth.SatelliteCount = satelliteCount;
                                sensorHealth.GPSSignalStrength = satelliteCount >= 8 ? "Strong" :
                                                                 satelliteCount >= 4 ? "Moderate" :
                                                                 satelliteCount > 0 ? "Weak" : "None";
                            }
                            break;

                        case "batteryvoltage":
                        case "voltage":
                            if (decimal.TryParse(variableValue, out var batteryVoltage))
                                sensorHealth.BatteryVoltage = batteryVoltage;
                            break;

                        case "fuel level":
                        case "fuellevel":
                        case "rawfuel":
                            if (decimal.TryParse(variableValue, out var fuelLevel))
                            {
                                sensorHealth.FuelLevel = fuelLevel;
                                sensorHealth.FuelLevelUnit = "Liters";
                            }
                            break;

                        case "ignition":
                            if (variableType == "boolean" && bool.TryParse(variableValue, out var ignition))
                                sensorHealth.IgnitionStatus = ignition;
                            break;

                        case "engine":
                        case "enginestatus":
                            if (variableType == "boolean" && bool.TryParse(variableValue, out var engineStatus))
                                sensorHealth.EngineStatus = engineStatus;
                            break;

                        case "enginetemperature":
                        case "temperature":
                        case "engtemp":
                            if (decimal.TryParse(variableValue, out var engineTemp))
                                sensorHealth.EngineTemperature = engineTemp;
                            break;
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Error parsing sensor variable {VariableName} with value {Value}", variableName, variableValue);
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
