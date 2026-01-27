using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Http;

namespace FMS.Application.Features.VehicleTransfer.DTOs;

/// <summary>
/// DTO for creating a vehicle transfer with checkup report
/// </summary>
public class CreateVehicleTransferDTO
{
    [Required]
    public int VehicleId { get; set; }

    public string? DeliveryNoteNumber { get; set; }

    [Required]
    public int FromSiteId { get; set; }

    [Required]
    public int ToSiteId { get; set; }

    [Required]
    public DateTime TransferDate { get; set; }

    public int? DriverId { get; set; }
    public string? DriverName { get; set; }
    public string? DriverPhone { get; set; }
    public string? JobNumber { get; set; }

    /// <summary>
    /// Current odometer/hour reading
    /// </summary>
    public decimal? CurrentReading { get; set; }

    /// <summary>
    /// Unit for reading (hrs, km, miles)
    /// </summary>
    public string? ReadingUnit { get; set; } = "hrs";

    /// <summary>
    /// Next scheduled service reading
    /// </summary>
    public decimal? NextServiceReading { get; set; }

    public string? BatteryNumber { get; set; }
    public string? MakeModel { get; set; }
    public decimal? FuelInTank { get; set; }
    public string? SealNumber { get; set; }
    public DateTime? DepartureTime { get; set; }
    public DateTime? ArrivalTime { get; set; }
    public bool AntiTheftCheckedDeparture { get; set; }
    public bool AntiTheftCheckedArrival { get; set; }
    public bool KeysInEnvelopeChecked { get; set; }
    public string? Remarks { get; set; }
    public string? SenderName { get; set; }
    public string? SenderFunction { get; set; }
    public string? ReceiverName { get; set; }
    public string? ReceiverFunction { get; set; }
    public string? ApprovedBy { get; set; }
    public string? WorkshopManagerSign { get; set; }

    /// <summary>
    /// PDF document file
    /// </summary>
    public IFormFile? DocumentFile { get; set; }

    /// <summary>
    /// User ID creating the transfer
    /// </summary>
    public string? UserId { get; set; }

    /// <summary>
    /// Whether to send email notification
    /// </summary>
    public bool SendEmail { get; set; } = true;

    /// <summary>
    /// Email recipients (comma-separated)
    /// </summary>
    public string? EmailRecipients { get; set; }

    /// <summary>
    /// Whether to update vehicle odometer
    /// </summary>
    public bool UpdateOdometer { get; set; } = true;

    /// <summary>
    /// Whether to create maintenance entry
    /// </summary>
    public bool CreateMaintenanceEntry { get; set; } = true;

    /// <summary>
    /// Checkup items for the transfer report
    /// </summary>
    public List<CreateCheckupItemDTO>? CheckupItems { get; set; }

    /// <summary>
    /// Tyre details
    /// </summary>
    public List<CreateTyreDetailDTO>? TyreDetails { get; set; }

    /// <summary>
    /// Battery details
    /// </summary>
    public List<CreateBatteryDetailDTO>? BatteryDetails { get; set; }

    /// <summary>
    /// Service filter parts for the email
    /// </summary>
    public List<ServiceFilterPartDTO>? ServiceFilterParts { get; set; }

    // =============================================
    // GPS Equipment Checkup Section
    // =============================================

    /// <summary>
    /// GPS Device ID/Serial Number
    /// </summary>
    public string? GpsDeviceId { get; set; }

    /// <summary>
    /// GPS Device condition (Good, Fair, Damaged, Not Working)
    /// </summary>
    public string? GpsDeviceCondition { get; set; }

    /// <summary>
    /// GPS Device working status
    /// </summary>
    public bool GpsDeviceWorking { get; set; } = true;

    /// <summary>
    /// GPS Device remarks
    /// </summary>
    public string? GpsDeviceRemarks { get; set; }

    /// <summary>
    /// Fuel Sensor ID/Serial Number
    /// </summary>
    public string? FuelSensorId { get; set; }

    /// <summary>
    /// Fuel Sensor condition (Good, Fair, Damaged, Not Working)
    /// </summary>
    public string? FuelSensorCondition { get; set; }

    /// <summary>
    /// Fuel Sensor working status
    /// </summary>
    public bool FuelSensorWorking { get; set; } = true;

    /// <summary>
    /// Fuel Sensor remarks
    /// </summary>
    public string? FuelSensorRemarks { get; set; }

    /// <summary>
    /// Vehicle Manufacturer name (from vehicle details)
    /// </summary>
    public string? VehicleManufacturer { get; set; }

    /// <summary>
    /// Vehicle Model name (from vehicle details)
    /// </summary>
    public string? VehicleModelName { get; set; }
}

/// <summary>
/// DTO for creating a checkup item
/// </summary>
public class CreateCheckupItemDTO
{
    public int SerialNo { get; set; }

    [Required]
    public string Description { get; set; } = string.Empty;

    public string? CheckType { get; set; }
    public bool? IsGood { get; set; }
    public bool? IsFair { get; set; }
    public bool? IsDamaged { get; set; }
    public bool? IsWorn { get; set; }
    public decimal? WornPercentage { get; set; }
    public string? Remarks { get; set; }
}

/// <summary>
/// DTO for creating a tyre detail
/// </summary>
public class CreateTyreDetailDTO
{
    public string? Position { get; set; }
    public string? Brand { get; set; }
    public string? Size { get; set; }
    public decimal? Condition { get; set; }
    public string? Remarks { get; set; }
}

/// <summary>
/// DTO for creating a battery detail
/// </summary>
public class CreateBatteryDetailDTO
{
    public string? BatteryNumber { get; set; }
    public string? Condition { get; set; }
    public decimal? Voltage { get; set; }
    public string? Remarks { get; set; }
}
