/**
 * File: EmployeeIdentityNormalizer.cs
 * Purpose: Normalizes employee identity values for duplicate checks and persistence.
 * Dependencies: System.String helpers
 * Last Modified: 2026-04-07
 *
 * Key Functions:
 * - NormalizeFullName(): Trims, collapses whitespace, and uppercases full names.
 * - NormalizeWorkNumber(): Trims and uppercases work numbers, returning null when empty.
 */
using System;

namespace FMS.Application.Features.Employee.Services;

public static class EmployeeIdentityNormalizer
{
    private const string PlaceholderWorkNumber = "NEW";

    public static string NormalizeFullName(string? fullName)
    {
        if (string.IsNullOrWhiteSpace(fullName))
        {
            return string.Empty;
        }

        string collapsed = string.Join(" ", fullName.Trim().Split(' ', StringSplitOptions.RemoveEmptyEntries));
        return collapsed.ToUpperInvariant();
    }

    public static string? NormalizeWorkNumber(string? employeeWorkNo)
    {
        if (string.IsNullOrWhiteSpace(employeeWorkNo))
        {
            return null;
        }

        string normalized = employeeWorkNo.Trim().ToUpperInvariant();
        return normalized == PlaceholderWorkNumber ? null : normalized;
    }
}