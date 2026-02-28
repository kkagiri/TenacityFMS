/**
 * File: SubmitForApprovalRequest.cs
 * Purpose: API request model for submitting a transfer for workshop manager approval.
 * Dependencies: None
 * Last Modified: 2026-02-26
 */
namespace FMS.WebClient.Controllers.VehicleManagement;

public class SubmitForApprovalRequest
{
    public string WorkshopManagerEmail { get; set; } = string.Empty;
    public string? WorkshopManagerName { get; set; }
    public string? ApprovalBaseUrl { get; set; }
}
