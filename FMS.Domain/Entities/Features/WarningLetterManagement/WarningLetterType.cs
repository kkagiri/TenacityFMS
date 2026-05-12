/**
 * File: WarningLetterType.cs
 * Purpose: Defines supported warning letter categories for employee discipline workflows.
 * Dependencies: None
 * Last Modified: 2026-04-06
 */
namespace FMS.Domain.Entities.Features.WarningLetterManagement;

public enum WarningLetterType
{
    ExcessFuelConsumption = 1,
    ExcessiveSpeed = 2,
    ExcessiveIdling = 3
}