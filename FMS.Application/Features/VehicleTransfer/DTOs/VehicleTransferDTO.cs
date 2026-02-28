/**
 * File: VehicleTransferDTO.cs
 * Purpose: Data contracts for vehicle transfer aggregate and child inspection details.
 * Dependencies: None
 * Last Modified: 2026-02-26
 */
using System;
using System.Collections.Generic;

namespace FMS.Application.Features.VehicleTransfer.DTOs;

/// <summary>
/// Data Transfer Object for Vehicle Transfer
/// </summary>
public class VehicleTransferDTO
{
    public int TransferId { get; set; }
    public int VehicleId { get; set; }
    public string? VehicleHyoungNo { get; set; }
    public string? VehicleNumberPlate { get; set; }
    public string? DeliveryNoteNumber { get; set; }
    public int FromSiteId { get; set; }
    public string? FromSiteName { get; set; }
    public int ToSiteId { get; set; }
    public string? ToSiteName { get; set; }
    public DateTime TransferDate { get; set; }
    public int? DriverId { get; set; }
    public string? DriverName { get; set; }
    public string? DriverPhone { get; set; }
    public string? JobNumber { get; set; }
    public decimal? CurrentReading { get; set; }
    public string? ReadingUnit { get; set; }
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
    public string Status { get; set; } = "Draft";
    public string? Remarks { get; set; }
    public string? ServiceFilterParts { get; set; }
    public string? SenderName { get; set; }
    public string? SenderFunction { get; set; }
    public string? ReceiverName { get; set; }
    public string? ReceiverFunction { get; set; }
    public string? ApprovedBy { get; set; }
    public string? WorkshopManagerSign { get; set; }

    // Notification workflow fields
    public string? ReceiverUserId { get; set; }
    public string? ReceiverUserName { get; set; }
    public string? ApproverUserId { get; set; }
    public string? ApproverUserName { get; set; }
    public DateTime? DispatchedAt { get; set; }
    public DateTime? ReceivedAt { get; set; }
    public int ReminderCount { get; set; }

    public string? DocumentUrl { get; set; }
    public string? DocumentFileName { get; set; }
    public bool EmailSent { get; set; }
    public DateTime? EmailSentDate { get; set; }
    public string? CreatedBy { get; set; }
    public string? ModifiedBy { get; set; }
    public DateTime DateCreated { get; set; }
    public DateTime? DateModified { get; set; }

    // GPS Equipment Checkup
    public string? GpsDeviceId { get; set; }
    public string? GpsDeviceCondition { get; set; }
    public bool GpsDeviceWorking { get; set; }
    public string? GpsDeviceRemarks { get; set; }
    public string? FuelSensorId { get; set; }
    public string? FuelSensorCondition { get; set; }
    public bool FuelSensorWorking { get; set; }
    public string? FuelSensorRemarks { get; set; }
    public string? VehicleManufacturer { get; set; }
    public string? VehicleModelName { get; set; }

    // Related data
    public List<VehicleTransferCheckupItemDTO>? CheckupItems { get; set; }
    public List<VehicleTransferTyreDetailDTO>? TyreDetails { get; set; }
    public List<VehicleTransferBatteryDetailDTO>? BatteryDetails { get; set; }
    public List<ServiceFilterPartDTO>? ServiceFilterPartsList { get; set; }
}

/// <summary>
/// Checkup item DTO
/// </summary>
public class VehicleTransferCheckupItemDTO
{
    public int Id { get; set; }
    public int TransferId { get; set; }
    public int SerialNo { get; set; }
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
/// Tyre detail DTO
/// </summary>
public class VehicleTransferTyreDetailDTO
{
    public int Id { get; set; }
    public int TransferId { get; set; }
    public string? Position { get; set; }
    public string? Brand { get; set; }
    public string? Size { get; set; }
    public decimal? Condition { get; set; }
    public string? Remarks { get; set; }
}

/// <summary>
/// Battery detail DTO
/// </summary>
public class VehicleTransferBatteryDetailDTO
{
    public int Id { get; set; }
    public int TransferId { get; set; }
    public string? BatteryNumber { get; set; }
    public string? Condition { get; set; }
    public decimal? Voltage { get; set; }
    public string? Remarks { get; set; }
}

/// <summary>
/// Service filter part DTO for email content
/// </summary>
public class ServiceFilterPartDTO
{
    public int Number { get; set; }
    public string? Description { get; set; }
    public string? PartNumber { get; set; }
    public int Quantity { get; set; } = 1;
}
