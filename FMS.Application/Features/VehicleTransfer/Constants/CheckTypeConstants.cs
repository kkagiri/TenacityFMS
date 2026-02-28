/**
 * File: CheckTypeConstants.cs
 * Purpose: Defines the allowed CheckType values for vehicle transfer checkup templates.
 * Dependencies: None
 * Last Modified: 2026-02-27
 *
 * Key Components:
 * - CheckTypeConstants: Static class with valid check type string constants and validation helper.
 */
using System;
using System.Collections.Generic;

namespace FMS.Application.Features.VehicleTransfer.Constants;

/// <summary>
/// Valid check-type values for checkup template items.
/// </summary>
public static class CheckTypeConstants
{
    public const string Check = "CHECK";
    public const string CheckAndTest = "CHECK & TEST";
    public const string CheckAndLubricate = "CHECK & LUBRICATE";
    public const string CheckAndClean = "CHECK & CLEAN";
    public const string CheckPercent = "CHECK %";
    public const string TestAndCheck = "TEST & CHECK";
    public const string Drain = "DRAIN";
    public const string Refill = "REFILL";
    public const string Inspect = "INSPECT";

    /// <summary>
    /// All allowed check type values (case-insensitive comparison recommended).
    /// </summary>
    public static IReadOnlyList<string> All { get; } = new[]
    {
        Check,
        CheckAndTest,
        CheckAndLubricate,
        CheckAndClean,
        CheckPercent,
        TestAndCheck,
        Drain,
        Refill,
        Inspect
    };

    /// <summary>
    /// Returns true when <paramref name="value"/> is null/empty (allowed) or matches a known type.
    /// </summary>
    public static bool IsValid(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return true; // optional field

        foreach (var allowed in All)
        {
            if (string.Equals(allowed, value.Trim(), StringComparison.OrdinalIgnoreCase))
                return true;
        }

        return false;
    }

    /// <summary>
    /// Normalises a value to its canonical upper-case form, or returns null if empty.
    /// </summary>
    public static string? Normalise(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return null;

        var trimmed = value.Trim();
        foreach (var allowed in All)
        {
            if (string.Equals(allowed, trimmed, StringComparison.OrdinalIgnoreCase))
                return allowed; // canonical casing
        }

        return trimmed; // fallback — keep as-is
    }
}
