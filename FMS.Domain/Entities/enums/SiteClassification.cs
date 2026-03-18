/**
 * File: SiteClassification.cs
 * Purpose: Classifies the operational purpose of a site for trip detection analysis.
 * Dependencies: None.
 * Last Modified: 2026-03-17
 */
namespace FMS.Domain.Entities;

/// <summary>
/// Classifies the operational purpose of a site (e.g. parking, load, dump).
/// Used in geofence-based trip detection to label site visits.
/// </summary>
public enum SiteClassification
{
    Unknown = 0,
    Parking = 1,
    Load = 2,
    Dump = 3,
    Fuel = 4,
    Workshop = 5,
}
