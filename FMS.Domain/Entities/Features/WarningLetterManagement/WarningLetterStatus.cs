/**
 * File: WarningLetterStatus.cs
 * Purpose: Defines lifecycle states for generated warning letters.
 * Dependencies: None
 * Last Modified: 2026-04-06
 */
namespace FMS.Domain.Entities.Features.WarningLetterManagement;

public enum WarningLetterStatus
{
    Draft = 0,
    Finalized = 1,
    Sent = 2,
    Acknowledged = 3
}