/**
 * File: LoginActivityDTO.cs
 * Purpose: Data transfer object for login/sign-in activity records
 * Dependencies: None
 * Last Modified: 2026-02-25
 *
 * Key Properties:
 * - Id: Primary key
 * - UserId: The user who signed in
 * - Timestamp: When the sign-in occurred
 * - IpAddress: IP address of the sign-in
 * - IsSuccessful: Whether the sign-in succeeded or failed
 */
using System;

namespace FMS.Application.Features.FMS.UserActivities;

public class LoginActivityDTO
{
    public int Id { get; set; }
    public string? UserId { get; set; }
    public DateTime Timestamp { get; set; }
    public string? IpAddress { get; set; }
    public bool IsSuccessful { get; set; }
}
