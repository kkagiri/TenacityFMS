/**
 * File: WarningLetterSummaryBuilder.cs
 * Purpose: Generates a default warning letter violation summary when the caller does not provide one.
 * Dependencies: WarningLetterType, System.Globalization
 * Last Modified: 2026-04-07
 */
using System;
using System.Globalization;
using FMS.Domain.Entities.Features.WarningLetterManagement;

namespace FMS.Application.Features.WarningLetter.Services;

internal static class WarningLetterSummaryBuilder
{
    public static string Resolve(
        string? providedSummary,
        WarningLetterType letterType,
        DateTime periodStart,
        DateTime periodEnd,
        decimal? expectedValue,
        decimal? actualValue,
        decimal? excessValue)
    {
        if (!string.IsNullOrWhiteSpace(providedSummary))
        {
            return providedSummary.Trim();
        }

        var periodText = periodStart.Date == periodEnd.Date
            ? $"on {periodStart.ToString("dd MMM yyyy", CultureInfo.InvariantCulture)}"
            : $"between {periodStart.ToString("dd MMM yyyy", CultureInfo.InvariantCulture)} and {periodEnd.ToString("dd MMM yyyy", CultureInfo.InvariantCulture)}";

        return letterType switch
        {
            WarningLetterType.ExcessiveSpeed =>
                $"Vehicle exceeded the configured speed limit {periodText}. Recorded speed was {FormatDecimal(actualValue)} km/h against a limit of {FormatDecimal(expectedValue)} km/h, resulting in an excess of {FormatDecimal(excessValue)} km/h.",
            WarningLetterType.ExcessiveIdling =>
                $"Vehicle idling hours exceeded the configured threshold {periodText}. Recorded idling was {FormatDecimal(actualValue)} hours against an allowance of {FormatDecimal(expectedValue)} hours, resulting in an excess of {FormatDecimal(excessValue)} hours.",
            _ =>
                $"Vehicle fuel efficiency dropped below the expected average {periodText}. Recorded efficiency was {FormatDecimal(actualValue)} km/l against an expected {FormatDecimal(expectedValue)} km/l, resulting in an estimated loss of {FormatDecimal(excessValue)} litres."
        };
    }

    private static string FormatDecimal(decimal? value)
    {
        return value.HasValue
            ? value.Value.ToString("N2", CultureInfo.InvariantCulture)
            : "0.00";
    }
}