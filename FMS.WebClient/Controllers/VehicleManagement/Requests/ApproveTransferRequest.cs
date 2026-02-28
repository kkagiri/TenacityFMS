/**
 * File: ApproveTransferRequest.cs
 * Purpose: API request model for workshop manager approval action.
 * Dependencies: None
 * Last Modified: 2026-02-26
 */
namespace FMS.WebClient.Controllers.VehicleManagement;

public class ApproveTransferRequest
{
    public string? ApproverName { get; set; }
    public string? CreatorEmail { get; set; }
}
