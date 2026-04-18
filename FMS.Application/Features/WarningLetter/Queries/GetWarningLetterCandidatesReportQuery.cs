/**
 * File:          GetWarningLetterCandidatesReportQuery.cs
 * Purpose:       CQRS query returning warning letter candidates report data for employees without warning letters.
 * Dependencies:  MediatR, GpsdataContext, ISystemConfigurationService, FMSResponse, WarningLetterCandidatesReportDataDto
 * Last Modified: 2026-06-15
 *
 * Key Functions:
 * - Handle(): Fetches candidate consumption records filtered by site, vehicle, vehicleType
 */
using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.WarningLetter.DTOs;
using FMS.Application.Services.Configuration;
using FMS.Domain.Entities;
using FMS.Domain.Entities.Features.WarningLetterManagement;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using WarningLetterEntity = FMS.Domain.Entities.Features.WarningLetterManagement.WarningLetter;

namespace FMS.Application.Features.WarningLetter.Queries;

public class GetWarningLetterCandidatesReportQuery : IRequest<FMSResponse<WarningLetterCandidatesReportDataDto>>
{
    public int? SiteId { get; set; }
    public List<int>? VehicleIds { get; set; }
    public int? VehicleTypeId { get; set; }
    public List<int>? EmployeeIds { get; set; }
    public List<WarningLetterType>? LetterTypes { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
}

public class GetWarningLetterCandidatesReportQueryHandler : IRequestHandler<GetWarningLetterCandidatesReportQuery, FMSResponse<WarningLetterCandidatesReportDataDto>>
{
    private const string SpeedThresholdConfigKey = "WarningLetter:SpeedThresholdKmh";
    private const string IdlingThresholdConfigKey = "WarningLetter:IdlingThresholdHours";

    private readonly GpsdataContext _context;
    private readonly ISystemConfigurationService _systemConfigurationService;

    public GetWarningLetterCandidatesReportQueryHandler(GpsdataContext context, ISystemConfigurationService systemConfigurationService)
    {
        _context = context;
        _systemConfigurationService = systemConfigurationService;
    }

    public async Task<FMSResponse<WarningLetterCandidatesReportDataDto>> Handle(GetWarningLetterCandidatesReportQuery request, CancellationToken cancellationToken)
    {
        var speedThreshold = await GetDecimalConfigAsync(SpeedThresholdConfigKey, 80m, cancellationToken);
        var idlingThreshold = await GetDecimalConfigAsync(IdlingThresholdConfigKey, 2m, cancellationToken);
        var fuelPrice = await GetDecimalConfigAsync("WarningLetter:FuelPricePerLitre", 0m, cancellationToken);

        // Enforce the system-in-place date: regardless of the caller-provided start date,
        // candidates before the effective start date are excluded.
        var effectiveStartDate = await GetWarningLetterSettingsQueryHandler.GetEffectiveStartDateAsync(
            _systemConfigurationService, cancellationToken);

        var query = _context.Vehicleconsumptions
            .AsNoTracking()
            .Include(vc => vc.Site)
            .Include(vc => vc.Vehicle)
                .ThenInclude(v => v.DefaultEmployee)
            .Include(vc => vc.Vehicle)
                .ThenInclude(v => v.VehicleType)
            .AsQueryable();

        if (request.SiteId.HasValue)
            query = query.Where(vc => vc.SiteId == request.SiteId.Value);

        if (request.VehicleIds is { Count: > 0 })
            query = query.Where(vc => request.VehicleIds.Contains(vc.VehicleId));

        if (request.VehicleTypeId.HasValue)
            query = query.Where(vc => vc.Vehicle.VehicleTypeId == request.VehicleTypeId.Value);

        if (request.EmployeeIds is { Count: > 0 })
            query = query.Where(vc => vc.Vehicle.DefaultEmployeeId.HasValue && request.EmployeeIds.Contains(vc.Vehicle.DefaultEmployeeId.Value));

        // Clamp the requested start date to the effective start date (user may choose earlier,
        // but the backend enforces the cutoff).
        var resolvedStartDate = request.StartDate.HasValue && request.StartDate.Value.Date > effectiveStartDate
            ? request.StartDate.Value.Date
            : effectiveStartDate;
        query = query.Where(vc => vc.Date >= resolvedStartDate);

        if (request.EndDate.HasValue)
            query = query.Where(vc => vc.Date <= request.EndDate.Value.Date.AddDays(1).AddTicks(-1));

        // Get records that exceed any threshold
        var allCandidates = await query
            .Where(vc =>
                (vc.FuelLost ?? 0m) > 4m ||
                (vc.MaxSpeed ?? 0m) > speedThreshold ||
                (vc.EngHours ?? 0m) > idlingThreshold)
            .OrderByDescending(vc => vc.Date)
            .Take(500)
            .ToListAsync(cancellationToken);

        // Get existing warning letters for the same period to exclude duplicates
        var vehicleIds = allCandidates.Select(c => c.VehicleId).Distinct().ToList();
        var existingLetters = new List<WarningLetterEntity>();

        if (allCandidates.Count > 0 && vehicleIds.Count > 0)
        {
            var minDate = allCandidates.Min(c => c.Date.Date);
            var maxDate = allCandidates.Max(c => c.Date.Date);

            existingLetters = await _context.WarningLetters
                .AsNoTracking()
                .Where(w => vehicleIds.Contains(w.VehicleId) &&
                            w.PeriodEnd >= minDate &&
                            w.PeriodStart <= maxDate)
                .ToListAsync(cancellationToken);
        }

        var records = new List<WarningLetterCandidateReportRecordDto>();

        foreach (var candidate in allCandidates)
        {
            var letterTypes = new List<WarningLetterType>();
            if ((candidate.FuelLost ?? 0m) > 4m) letterTypes.Add(WarningLetterType.ExcessFuelConsumption);
            if ((candidate.MaxSpeed ?? 0m) > speedThreshold) letterTypes.Add(WarningLetterType.ExcessiveSpeed);
            if ((candidate.EngHours ?? 0m) > idlingThreshold) letterTypes.Add(WarningLetterType.ExcessiveIdling);

            foreach (var letterType in letterTypes)
            {
                if (request.LetterTypes is { Count: > 0 } && !request.LetterTypes.Contains(letterType))
                {
                    continue;
                }

                var hasLetter = existingLetters.Any(w => IsDuplicateCandidate(w, candidate.VehicleId, candidate.Date.Date, letterType));

                if (hasLetter) continue;

                var employeeDisplayName = !string.IsNullOrWhiteSpace(candidate.EmployeeName)
                    ? candidate.EmployeeName.Trim()
                    : candidate.Vehicle?.DefaultEmployee?.FullName ?? "Unassigned";
                var employeeWorkNo = candidate.Vehicle?.DefaultEmployee?.EmployeeWorkNo?.Trim();
                var employeeName = !string.IsNullOrWhiteSpace(employeeWorkNo) && employeeDisplayName != "Unassigned"
                    ? $"{employeeDisplayName} ({employeeWorkNo})"
                    : employeeDisplayName;

                var (expected, actual, excess, summary) = GetMetrics(candidate, letterType, speedThreshold, idlingThreshold);

                records.Add(new WarningLetterCandidateReportRecordDto
                {
                    ConsumptionId = candidate.Id,
                    LetterType = letterType,
                    LetterTypeName = letterType.ToString(),
                    MetricDate = candidate.Date.ToString("yyyy-MM-dd"),
                    Period = $"{candidate.Date:dd MMM yyyy}",
                    SiteName = candidate.Site?.Name ?? string.Empty,
                    VehicleHyoungNo = candidate.Vehicle?.HyoungNo ?? string.Empty,
                    NumberPlate = candidate.Vehicle?.NumberPlate ?? string.Empty,
                    VehicleTypeName = candidate.Vehicle?.VehicleType?.Name ?? "Unknown",
                    EmployeeName = employeeName,
                    ExpectedValue = expected,
                    ActualValue = actual,
                    ExcessValue = excess,
                    FuelPrice = letterType == WarningLetterType.ExcessFuelConsumption ? fuelPrice : null,
                    ExcessCost = letterType == WarningLetterType.ExcessFuelConsumption && fuelPrice > 0
                        ? Math.Round(excess * fuelPrice, 2)
                        : null,
                    ViolationSummary = summary,
                    HasExistingLetter = false,
                });
            }
        }

        var summary2 = new CandidatesReportSummaryDto
        {
            TotalCandidates = records.Count,
            ExcessFuelCount = records.Count(r => r.LetterType == WarningLetterType.ExcessFuelConsumption),
            ExcessiveSpeedCount = records.Count(r => r.LetterType == WarningLetterType.ExcessiveSpeed),
            ExcessiveIdlingCount = records.Count(r => r.LetterType == WarningLetterType.ExcessiveIdling),
            UniqueSites = records.Select(r => r.SiteName).Distinct().Count(),
            UniqueVehicles = records.Select(r => r.VehicleHyoungNo).Distinct().Count(),
            UniqueEmployees = records.Select(r => r.EmployeeName).Where(n => n != "Unassigned").Distinct().Count(),
        };

        return FMSResponse<WarningLetterCandidatesReportDataDto>.Success(new WarningLetterCandidatesReportDataDto
        {
            Records = records,
            Summary = summary2,
        });
    }

    private static (decimal expected, decimal actual, decimal excess, string summary) GetMetrics(
        Vehicleconsumption candidate, WarningLetterType letterType, decimal speedThreshold, decimal idlingThreshold)
    {
        var dateText = candidate.Date.ToString("dd MMM yyyy", CultureInfo.InvariantCulture);
        return letterType switch
        {
            WarningLetterType.ExcessiveSpeed => (
                speedThreshold,
                candidate.MaxSpeed ?? 0m,
                Math.Max(0m, (candidate.MaxSpeed ?? 0m) - speedThreshold),
                $"Speed limit exceeded on {dateText}: {candidate.MaxSpeed ?? 0:N2} km/h vs {speedThreshold:N2} km/h limit"),
            WarningLetterType.ExcessiveIdling => (
                idlingThreshold,
                candidate.EngHours ?? 0m,
                Math.Max(0m, (candidate.EngHours ?? 0m) - idlingThreshold),
                $"Idling threshold exceeded on {dateText}: {candidate.EngHours ?? 0:N2} hrs vs {idlingThreshold:N2} hrs limit"),
            _ => (
                candidate.ExpectedConsumption ?? 0m,
                candidate.FuelEfficiency ?? 0m,
                candidate.FuelLost ?? Math.Max(0m, (candidate.ExpectedConsumption ?? 0m) - (candidate.FuelEfficiency ?? 0m)),
                $"Fuel excess on {dateText}: {candidate.FuelLost ?? 0:N2} litres above threshold"),
        };
    }

    private async Task<decimal> GetDecimalConfigAsync(string key, decimal defaultValue, CancellationToken cancellationToken)
    {
        var value = await _systemConfigurationService.GetConfigurationValueAsync(key, cancellationToken);
        return decimal.TryParse(value, NumberStyles.Any, CultureInfo.InvariantCulture, out var parsedValue)
            ? parsedValue
            : defaultValue;
    }

    private static bool IsDuplicateCandidate(WarningLetterEntity existingLetter, int vehicleId, DateTime violationDate, WarningLetterType letterType)
    {
        if (existingLetter.VehicleId != vehicleId || existingLetter.LetterType != letterType)
        {
            return false;
        }

        var storedStart = existingLetter.PeriodStart.Date;
        var storedEnd = existingLetter.PeriodEnd.Date;

        if (storedStart <= violationDate && storedEnd >= violationDate)
        {
            return true;
        }

        return storedStart.AddDays(1) <= violationDate && storedEnd.AddDays(1) >= violationDate;
    }
}
