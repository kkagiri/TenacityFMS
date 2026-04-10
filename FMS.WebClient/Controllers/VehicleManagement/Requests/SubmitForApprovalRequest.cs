/**
 * File: SubmitForApprovalRequest.cs
 * Purpose: API request model for submitting a transfer for approval with optional legacy email fields.
 * Dependencies: None
 * Last Modified: 2026-04-09
 */
namespace FMS.WebClient.Controllers.VehicleManagement;

public class SubmitForApprovalRequest
{
    public string? WorkshopManagerEmail { get; set; }
    public string? WorkshopManagerName { get; set; }
    public string? ApprovalBaseUrl { get; set; }
}
