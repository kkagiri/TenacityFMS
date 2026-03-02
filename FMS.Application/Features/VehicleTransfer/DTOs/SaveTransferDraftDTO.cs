/**
 * File: SaveTransferDraftDTO.cs
 * Purpose: DTO for creating/updating vehicle transfer drafts with partial wizard payloads.
 * Dependencies: IFormFile, transfer child DTOs
 * Last Modified: 2026-02-26
 *
 * Key Components:
 * - SaveTransferDraftDTO: Carries draft fields for save-at-stage behavior.
 */
using System;
using System.Collections.Generic;
using System.Text.Json;
using Microsoft.AspNetCore.Http;

namespace FMS.Application.Features.VehicleTransfer.DTOs;

/// <summary>
/// Draft payload for vehicle transfer workflow.
/// </summary>
public class SaveTransferDraftDTO
{
    public int? TransferId { get; set; }
    public int? VehicleId { get; set; }
    public string? DeliveryNoteNumber { get; set; }
    public int? FromSiteId { get; set; }
    public int? ToSiteId { get; set; }
    public DateTime? TransferDate { get; set; }
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
    public bool? AntiTheftCheckedDeparture { get; set; }
    public bool? AntiTheftCheckedArrival { get; set; }
    public bool? KeysInEnvelopeChecked { get; set; }
    public string? Remarks { get; set; }
    public string? SenderName { get; set; }
    public string? SenderFunction { get; set; }
    public string? ReceiverName { get; set; }
    public string? ReceiverFunction { get; set; }
    public string? ApprovedBy { get; set; }
    public string? WorkshopManagerSign { get; set; }
    public int? WorkshopManagerId { get; set; }
    /// <summary>
    /// System user ID of the designated receiver
    /// </summary>
    public string? ReceiverUserId { get; set; }
    /// <summary>
    /// System user ID of the specific approver (optional)
    /// </summary>
    public string? ApproverUserId { get; set; }
    public IFormFile? DocumentFile { get; set; }
    public string? UserId { get; set; }
    public bool? SendEmail { get; set; }
    public string? EmailRecipients { get; set; }
    public bool? UpdateOdometer { get; set; }
    public bool? CreateMaintenanceEntry { get; set; }
    public List<CreateCheckupItemDTO>? CheckupItems { get; set; }
    public List<CreateTyreDetailDTO>? TyreDetails { get; set; }
    public List<CreateBatteryDetailDTO>? BatteryDetails { get; set; }
    public List<ServiceFilterPartDTO>? ServiceFilterParts { get; set; }

    // ── JSON string fallback setters for FormData binding ──
    private static readonly JsonSerializerOptions _jsonOpts = new() { PropertyNameCaseInsensitive = true };

    public string? CheckupItemsJson
    {
        set
        {
            if (!string.IsNullOrEmpty(value) && (CheckupItems == null || CheckupItems.Count == 0))
            {
                try { CheckupItems = JsonSerializer.Deserialize<List<CreateCheckupItemDTO>>(value, _jsonOpts); } catch { }
            }
        }
    }

    public string? TyreDetailsJson
    {
        set
        {
            if (!string.IsNullOrEmpty(value) && (TyreDetails == null || TyreDetails.Count == 0))
            {
                try { TyreDetails = JsonSerializer.Deserialize<List<CreateTyreDetailDTO>>(value, _jsonOpts); } catch { }
            }
        }
    }

    public string? BatteryDetailsJson
    {
        set
        {
            if (!string.IsNullOrEmpty(value) && (BatteryDetails == null || BatteryDetails.Count == 0))
            {
                try { BatteryDetails = JsonSerializer.Deserialize<List<CreateBatteryDetailDTO>>(value, _jsonOpts); } catch { }
            }
        }
    }

    public string? ServiceFilterPartsJson
    {
        set
        {
            if (!string.IsNullOrEmpty(value) && (ServiceFilterParts == null || ServiceFilterParts.Count == 0))
            {
                try { ServiceFilterParts = JsonSerializer.Deserialize<List<ServiceFilterPartDTO>>(value, _jsonOpts); } catch { }
            }
        }
    }
    public string? GpsDeviceId { get; set; }
    public string? GpsDeviceCondition { get; set; }
    public bool? GpsDeviceWorking { get; set; }
    public string? GpsDeviceRemarks { get; set; }
    public string? FuelSensorId { get; set; }
    public string? FuelSensorCondition { get; set; }
    public bool? FuelSensorWorking { get; set; }
    public string? FuelSensorRemarks { get; set; }
    public string? VehicleManufacturer { get; set; }
    public string? VehicleModelName { get; set; }
}
