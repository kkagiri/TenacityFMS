/**
 * File: VehicleIdentifierNormalizer.cs
 * Purpose: Normalizes vehicle identifiers before persistence and duplicate checks.
 * Dependencies: VehicleDTO
 * Last Modified: 2026-04-14
 *
 * Key Functions:
 * - NormalizeVehicleDto(): Applies canonical formatting to write-path DTO fields.
 * - NormalizeHyoungNo(): Removes whitespace and uppercases HyoungNo values.
 * - NormalizeNumberPlate(): Collapses whitespace and uppercases number plate values.
 */
using System;
using System.Linq;
using FMS.Application.Features.Vehicle.DTOs;

namespace FMS.Application.Features.Vehicle;

internal static class VehicleIdentifierNormalizer
{
    public static void NormalizeVehicleDto(VehicleDTO vehicleDto)
    {
        if (vehicleDto == null)
        {
            throw new ArgumentNullException(nameof(vehicleDto));
        }

        vehicleDto.HyoungNo = NormalizeHyoungNo(vehicleDto.HyoungNo);
        vehicleDto.NumberPlate = NormalizeNumberPlate(vehicleDto.NumberPlate);
    }

    public static string NormalizeHyoungNo(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return string.Empty;
        }

        return new string(value
            .Where(character => !char.IsWhiteSpace(character))
            .Select(char.ToUpperInvariant)
            .ToArray());
    }

    public static string? NormalizeNumberPlate(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return null;
        }

        return string.Join(
            " ",
            value.Split((char[]?)null, StringSplitOptions.RemoveEmptyEntries))
            .ToUpperInvariant();
    }
}