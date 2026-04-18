/**
 * File:          WarningLetterCandidatesReportDataBuilder.cs
 * Purpose:       Builds normalized jsreport payloads for warning letter candidates reports.
 * Dependencies:  WarningLetterCandidatesReportDataDto, WarningLetterType
 * Last Modified: 2026-04-17
 *
 * Key Functions:
 * - Build(): Maps warning letter candidate query results into the HTML/PDF/Excel template payload
 */
using System;
using System.Globalization;
using System.Linq;
using FMS.Application.Features.WarningLetter.DTOs;
using FMS.Domain.Entities.Features.WarningLetterManagement;

namespace FMS.WebClient.Services.Reporting;

internal static class WarningLetterCandidatesReportDataBuilder
{
    public static object Build(
        WarningLetterCandidatesReportDataDto dto,
        string reportTitle)
    {
        var records = dto.Records
            .Select((record, index) => new
            {
                rowNumber = index + 1,
                rowNum = index + 1,
                record.ConsumptionId,
                letterType = record.LetterTypeName,
                letterTypeName = record.LetterTypeName,
                metricDate = record.MetricDate,
                period = record.Period,
                siteName = string.IsNullOrWhiteSpace(record.SiteName) ? "-" : record.SiteName,
                vehicleHyoungNo = string.IsNullOrWhiteSpace(record.VehicleHyoungNo) ? "-" : record.VehicleHyoungNo,
                numberPlate = string.IsNullOrWhiteSpace(record.NumberPlate) ? "-" : record.NumberPlate,
                vehicleTypeName = string.IsNullOrWhiteSpace(record.VehicleTypeName) ? "-" : record.VehicleTypeName,
                employeeName = string.IsNullOrWhiteSpace(record.EmployeeName) ? "-" : record.EmployeeName,
                expectedValue = record.ExpectedValue,
                actualValue = record.ActualValue,
                excessValue = record.ExcessValue,
                expectedFormatted = FormatExpectedMetric(record.ExpectedValue, record.LetterType),
                actualFormatted = FormatActualMetric(record.ActualValue, record.LetterType),
                excessFormatted = FormatExcessMetric(record.ExcessValue, record.LetterType),
                fuelPrice = record.FuelPrice,
                fuelPriceFormatted = record.FuelPrice.HasValue
                    ? record.FuelPrice.Value.ToString("N2", CultureInfo.InvariantCulture)
                    : "-",
                excessCost = record.ExcessCost,
                excessCostFormatted = record.ExcessCost.HasValue
                    ? record.ExcessCost.Value.ToString("N2", CultureInfo.InvariantCulture)
                    : "-",
                violationSummary = record.ViolationSummary,
            })
            .ToList();

        return new
        {
            reportTitle,
            generatedAt = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss"),
            generatedBy = "System",
            reportId = $"RPT-{DateTime.UtcNow:yyyyMMddHHmmss}",
            records,
            data = records,
            items = records,
            transactions = records,
            summary = new
            {
                totalRecords = records.Count,
                totalCandidates = dto.Summary.TotalCandidates,
                excessFuelCount = dto.Summary.ExcessFuelCount,
                excessiveSpeedCount = dto.Summary.ExcessiveSpeedCount,
                excessiveIdlingCount = dto.Summary.ExcessiveIdlingCount,
                uniqueSites = dto.Summary.UniqueSites,
                uniqueVehicles = dto.Summary.UniqueVehicles,
                uniqueEmployees = dto.Summary.UniqueEmployees,
            },
        };
    }

    private static string FormatExpectedMetric(decimal value, WarningLetterType letterType)
        => letterType switch
        {
            WarningLetterType.ExcessFuelConsumption => $"{value.ToString("N2", CultureInfo.InvariantCulture)} km/l",
            WarningLetterType.ExcessiveSpeed => $"{value.ToString("N2", CultureInfo.InvariantCulture)} km/h",
            WarningLetterType.ExcessiveIdling => $"{value.ToString("N2", CultureInfo.InvariantCulture)} hrs",
            _ => value.ToString("N2", CultureInfo.InvariantCulture)
        };

    private static string FormatActualMetric(decimal value, WarningLetterType letterType)
        => letterType switch
        {
            WarningLetterType.ExcessFuelConsumption => $"{value.ToString("N2", CultureInfo.InvariantCulture)} km/l",
            WarningLetterType.ExcessiveSpeed => $"{value.ToString("N2", CultureInfo.InvariantCulture)} km/h",
            WarningLetterType.ExcessiveIdling => $"{value.ToString("N2", CultureInfo.InvariantCulture)} hrs",
            _ => value.ToString("N2", CultureInfo.InvariantCulture)
        };

    private static string FormatExcessMetric(decimal value, WarningLetterType letterType)
        => letterType switch
        {
            WarningLetterType.ExcessFuelConsumption => $"{value.ToString("N2", CultureInfo.InvariantCulture)} l",
            WarningLetterType.ExcessiveSpeed => $"{value.ToString("N2", CultureInfo.InvariantCulture)} km/h",
            WarningLetterType.ExcessiveIdling => $"{value.ToString("N2", CultureInfo.InvariantCulture)} hrs",
            _ => value.ToString("N2", CultureInfo.InvariantCulture)
        };
}