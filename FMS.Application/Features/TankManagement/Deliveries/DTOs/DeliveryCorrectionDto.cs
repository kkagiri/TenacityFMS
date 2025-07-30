using System;
using System.ComponentModel.DataAnnotations;

namespace FMS.Application.Features.TankManagement.Deliveries.DTOs;

/// <summary>
/// DTO for delivery correction data
/// </summary>
public class DeliveryCorrectionDto {
    /// <summary>
    /// Tank ID for the delivery
    /// </summary>
    [Required]
    public int TankId { get; set; }

    /// <summary>
    /// Date of the delivery
    /// </summary>
    [Required]
    public DateTime DeliveryDate { get; set; }

    /// <summary>
    /// Manual delivery amount in liters
    /// </summary>
    [Required]
    [Range (0.01, double.MaxValue, ErrorMessage = "Delivery amount must be greater than zero")]
    public decimal ManualDeliveryAmount { get; set; }

    /// <summary>
    /// Sensor recorded delivery amount (optional)
    /// </summary>
    public decimal? SensorDeliveryAmount { get; set; }

    /// <summary>
    /// Temperature at delivery (optional)
    /// </summary>
    public decimal? DeliveryTemperature { get; set; }

    /// <summary>
    /// Density at delivery (optional)
    /// </summary>
    public decimal? DeliveryDensity { get; set; }

    /// <summary>
    /// Mass at delivery (optional)
    /// </summary>
    public decimal? DeliveryMass { get; set; }

    /// <summary>
    /// Stock level before delivery
    /// </summary>
    [Required]
    [Range (0, double.MaxValue, ErrorMessage = "Stock before delivery cannot be negative")]
    public decimal StockBeforeDelivery { get; set; }

    /// <summary>
    /// Stock level after delivery
    /// </summary>
    [Required]
    [Range (0, double.MaxValue, ErrorMessage = "Stock after delivery cannot be negative")]
    public decimal StockAfterDelivery { get; set; }

    /// <summary>
    /// Price per liter
    /// </summary>
    [Range (0, double.MaxValue, ErrorMessage = "Price per liter cannot be negative")]
    public decimal PricePerLiter { get; set; }

    /// <summary>
    /// Supplier ID
    /// </summary>
    [Required]
    public int SupplierId { get; set; }

    /// <summary>
    /// Local Purchase Order number
    /// </summary>
    public string? Lponumber { get; set; }

    /// <summary>
    /// Product delivered
    /// </summary>
    public string? Product { get; set; }

    /// <summary>
    /// Reason for the correction
    /// </summary>
    [Required]
    [StringLength (200)]
    public string CorrectionReason { get; set; } = string.Empty;

    /// <summary>
    /// User making the correction
    /// </summary>
    [Required]
    public string RecordedBy { get; set; } = string.Empty;
}