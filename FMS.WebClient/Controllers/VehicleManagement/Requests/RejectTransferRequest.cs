/**
 * File: RejectTransferRequest.cs
 * Purpose: API request model for rejecting a pending transfer approval.
 * Dependencies: None
 * Last Modified: 2026-02-26
 */
namespace FMS.WebClient.Controllers.VehicleManagement;

public class RejectTransferRequest
{
    public string Reason { get; set; } = string.Empty;
    public string? CreatorEmail { get; set; }
}
