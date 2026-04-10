using System;
using System.Collections.Generic;

namespace FMS.Application.Features.Vehicle.DTOs
{
    /// <summary>
    /// DTO for comprehensive GPS information including location and sensor data
    /// </summary>
    public class VehicleGPSInformationDTO
    {
        public int VehicleId { get; set; }
        public string VehicleName { get; set; } = null!;
        public string? NumberPlate { get; set; }
        public bool HasGPSInstalled { get; set; }
        public int? DeviceId { get; set; }

        // Location Information
        public decimal? Latitude { get; set; }
        public decimal? Longitude { get; set; }
        public decimal? Altitude { get; set; }
        public decimal? Speed { get; set; }
        public decimal? Heading { get; set; }
        public DateTime? LastUpdated { get; set; }
        public string? Address { get; set; }
        public bool IsOnline { get; set; }

        // Sensor Information
        public SensorHealthDTO? SensorHealth { get; set; }

        // Device Information
        public string? DeviceIMEI { get; set; }
        public string? DeviceName { get; set; }
        public string? Protocol { get; set; }
        public string? LastIP { get; set; }
        public DateTime? LastDeviceActivity { get; set; }
        public string? CustomFuelCalibration { get; set; }
        public List<VehicleTelemetryVariableDTO> TelemetryVariables { get; set; } = new();
    }

    public class VehicleTelemetryVariableDTO
    {
        public string Name { get; set; } = string.Empty;
        public string? Value { get; set; }
        public string? Type { get; set; }
        public string? Time { get; set; }
    }

    /// <summary>
    /// Sensor health information
    /// </summary>
    public class SensorHealthDTO
    {
        // GPS Signal Information
        public string? GPSSignalStrength { get; set; } // Strong, Moderate, Weak, None
        public int? SatelliteCount { get; set; }
        public bool IsPositionValid { get; set; }

        // Fuel Level (if available from sensors)
        public decimal? FuelLevel { get; set; }
        public string? FuelLevelUnit { get; set; } // Liters, Percentage, etc.

        // Other Sensor Data
        public decimal? EngineTemperature { get; set; }
        public decimal? BatteryVoltage { get; set; }
        public bool? IgnitionStatus { get; set; }
        public bool? EngineStatus { get; set; }

        // Health Status
        public string OverallHealth { get; set; } = "Unknown"; // Good, Warning, Critical, Unknown
        public DateTime? LastSensorUpdate { get; set; }
    }
}

