/**
 * File: PumpTransactionReportDataBuilder.cs
 * Purpose: Builds normalized jsreport payloads for pump transaction reports.
 * Dependencies: PumpTransactionDto
 * Last Modified: 2026-03-11
 *
 * Key Functions:
 * - Build(): Maps pumptransaction query results into the HTML/PDF/Excel template payload
 */
using System;
using System.Collections.Generic;
using System.Linq;
using FMS.Application.Features.ATG;

namespace FMS.WebClient.Services.Reporting
{
    /// <summary>
    /// Creates a consistent payload for pump transaction report rendering.
    /// </summary>
    internal static class PumpTransactionReportDataBuilder
    {
        public static object Build(
            IEnumerable<PumpTransactionDto> transactions,
            string? reportTitle,
            DateTime? dateFrom,
            DateTime? dateTo,
            string generatedBy,
            string? siteName = null,
            string? tankName = null,
            string? vehicleName = null,
            string? fuelGrade = null)
        {
            var transactionList = transactions.ToList();
            var averageConsumptions = transactionList
                .Where(t => t.FuelEfficiency.HasValue && t.FuelEfficiency.Value > 0)
                .Select(t => t.FuelEfficiency!.Value)
                .ToList();

            var subtitleParts = new List<string>();
            if (!string.IsNullOrWhiteSpace(siteName)) subtitleParts.Add(siteName);
            if (!string.IsNullOrWhiteSpace(tankName)) subtitleParts.Add(tankName);
            if (!string.IsNullOrWhiteSpace(vehicleName)) subtitleParts.Add(vehicleName);
            if (!string.IsNullOrWhiteSpace(fuelGrade)) subtitleParts.Add(fuelGrade);

            return new
            {
                reportTitle = reportTitle ?? "Pump Transaction Report",
                reportSubtitle = subtitleParts.Count > 0
                    ? string.Join(" — ", subtitleParts)
                    : "Pump transaction activity from pumptransaction records.",
                generatedAt = DateTime.Now.ToString("dd MMM yyyy, hh:mm tt"),
                generatedBy,
                dateFrom = dateFrom?.ToString("dd MMM yyyy") ?? "All",
                dateTo = dateTo?.ToString("dd MMM yyyy") ?? "All",
                reportId = $"RPT-{DateTime.Now:yyyyMMdd-HHmmss}",
                currentPage = 1,
                totalPages = 1,
                siteName,
                tankName,
                vehicleName,
                fuelGrade,
                summary = new
                {
                    totalTransactions = transactionList.Count,
                    totalVolume = transactionList.Sum(t => t.Volume).ToString("N2"),
                    totalAmount = transactionList.Sum(t => t.Amount).ToString("N2"),
                    uniqueVehicles = transactionList
                        .Where(t => t.VehicleId.HasValue)
                        .Select(t => t.VehicleId)
                        .Distinct()
                        .Count(),
                    avgConsumption = averageConsumptions.Count > 0
                        ? averageConsumptions.Average().ToString("N2")
                        : "-",
                    currency = "KES"
                },
                transactions = transactionList.Select((t, index) => new
                {
                    rowNumber = (index + 1).ToString("D3"),
                    dateTime = new
                    {
                        date = t.DateTime.ToString("dd MMM yyyy"),
                        time = t.DateTime.ToString("hh:mm tt")
                    },
                    ptsName = !string.IsNullOrWhiteSpace(t.PtsName) ? t.PtsName : (t.SiteName ?? "-"),
                    pump = t.Pump > 0 ? $"Pump {t.Pump:00}" : "-",
                    vehicleNumberPlate = !string.IsNullOrWhiteSpace(t.VehicleNumberPlate)
                        ? t.VehicleNumberPlate
                        : (!string.IsNullOrWhiteSpace(t.VehicleName) ? t.VehicleName : "-"),
                    volume = t.Volume.ToString("N2"),
                    consumption = t.FuelEfficiency.HasValue
                        ? (t.IsKmPerLiter
                            ? $"{t.FuelEfficiency.Value:N2} km/L"
                            : $"{t.FuelEfficiency.Value:N2} L/hr")
                        : "-",
                    amount = t.Amount.ToString("N2"),
                    odometer = t.Odometer.HasValue ? t.Odometer.Value.ToString("N0") : "-",
                    employeeName = FirstNonEmpty(t.EmployeeName, t.DriverName, t.UserName, t.FueledByUserName, "-")
                }).ToList()
            };
        }

        private static string FirstNonEmpty(params string?[] values)
        {
            foreach (var value in values)
            {
                if (!string.IsNullOrWhiteSpace(value))
                {
                    return value;
                }
            }

            return "-";
        }
    }
}