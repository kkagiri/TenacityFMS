/**
 * File: GetWarningLetterConsumptionCandidatesQuery.cs
 * Purpose: Returns filtered vehicle-consumption records that qualify as warning letter candidates.
 * Dependencies: MediatR, GpsdataContext, ISystemConfigurationService, FMSResponse, WarningLetter DTOs/entities
 * Last Modified: 2026-04-06
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

namespace FMS.Application.Features.WarningLetter.Queries;

public class GetWarningLetterConsumptionCandidatesQuery : IRequest<FMSResponse<List<WarningLetterConsumptionCandidateDto>>>
{
    public WarningLetterType LetterType { get; set; }
    public int? SiteId { get; set; }
    public int? VehicleId { get; set; }
    public int? EmployeeId { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
}

public class GetWarningLetterConsumptionCandidatesQueryHandler : IRequestHandler<GetWarningLetterConsumptionCandidatesQuery, FMSResponse<List<WarningLetterConsumptionCandidateDto>>>
{
    private const string SpeedThresholdConfigKey = "WarningLetter:SpeedThresholdKmh";
    private const string IdlingThresholdConfigKey = "WarningLetter:IdlingThresholdHours";
    private const string ExcessFuelThresholdPercentConfigKey = "WarningLetter:ExcessFuelThresholdPercent";

    private readonly GpsdataContext _context;
    private readonly ISystemConfigurationService _systemConfigurationService;

    public GetWarningLetterConsumptionCandidatesQueryHandler(GpsdataContext context, ISystemConfigurationService systemConfigurationService)
    {
        _context = context;
        _systemConfigurationService = systemConfigurationService;
    }

    public async Task<FMSResponse<List<WarningLetterConsumptionCandidateDto>>> Handle(GetWarningLetterConsumptionCandidatesQuery request, CancellationToken cancellationToken)
    {
        if (request.StartDate.HasValue && request.EndDate.HasValue && request.EndDate.Value < request.StartDate.Value)
        {
            return FMSResponse<List<WarningLetterConsumptionCandidateDto>>.ValidationFailed(new List<string>
            {
                "EndDate cannot be earlier than StartDate."
            });
        }

        var speedThreshold = await GetDecimalConfigAsync(SpeedThresholdConfigKey, 80m, cancellationToken);
        var idlingThreshold = await GetDecimalConfigAsync(IdlingThresholdConfigKey, 2m, cancellationToken);
        var excessFuelThresholdPercent = await GetDecimalConfigAsync(ExcessFuelThresholdPercentConfigKey, 15m, cancellationToken);

        var query = _context.Vehicleconsumptions
            .AsNoTracking()
            .Include(vc => vc.Site)
            .Include(vc => vc.Vehicle)
                .ThenInclude(v => v.DefaultEmployee)
            .AsQueryable();

        if (request.SiteId.HasValue)
        {
            query = query.Where(vc => vc.SiteId == request.SiteId.Value);
        }

        if (request.VehicleId.HasValue)
        {
            query = query.Where(vc => vc.VehicleId == request.VehicleId.Value);
        }

        if (request.EmployeeId.HasValue)
        {
            query = query.Where(vc => vc.Vehicle.DefaultEmployeeId == request.EmployeeId.Value);
        }

        if (request.StartDate.HasValue)
        {
            var startDate = request.StartDate.Value.Date;
            query = query.Where(vc => vc.Date >= startDate);
        }

        if (request.EndDate.HasValue)
        {
            var endDate = request.EndDate.Value.Date.AddDays(1).AddTicks(-1);
            query = query.Where(vc => vc.Date <= endDate);
        }

        query = query.Where(vc => !_context.WarningLetters.Any(w =>
            w.VehicleId == vc.VehicleId &&
            w.SiteId == vc.SiteId &&
            w.LetterType == request.LetterType &&
            w.PeriodStart <= vc.Date &&
            w.PeriodEnd >= vc.Date &&
            (!request.EmployeeId.HasValue || w.EmployeeId == request.EmployeeId.Value)));

        query = request.LetterType switch
        {
            WarningLetterType.ExcessiveSpeed => query.Where(vc => (vc.MaxSpeed ?? 0m) > speedThreshold),
            WarningLetterType.ExcessiveIdling => query.Where(vc => (vc.EngHours ?? 0m) > idlingThreshold),
            _ => query.Where(vc =>
                (vc.FuelLost ?? 0m) > 0m ||
                ((vc.ExpectedConsumption ?? 0m) > 0m &&
                 (vc.FuelEfficiency ?? decimal.MaxValue) < ((vc.ExpectedConsumption ?? 0m) * (1m - (excessFuelThresholdPercent / 100m)))))
        };

        var candidates = await query
            .OrderByDescending(vc => vc.Date)
            .ThenByDescending(vc => vc.Id)
            .Take(100)
            .ToListAsync(cancellationToken);

        var response = candidates
            .Select(candidate => MapCandidate(candidate, request.LetterType, speedThreshold, idlingThreshold))
            .ToList();

        return FMSResponse<List<WarningLetterConsumptionCandidateDto>>.Success(response);
    }

    private async Task<decimal> GetDecimalConfigAsync(string key, decimal defaultValue, CancellationToken cancellationToken)
    {
        var value = await _systemConfigurationService.GetConfigurationValueAsync(key, cancellationToken);
        return decimal.TryParse(value, NumberStyles.Any, CultureInfo.InvariantCulture, out var parsedValue)
            ? parsedValue
            : defaultValue;
    }

    private static WarningLetterConsumptionCandidateDto MapCandidate(Vehicleconsumption candidate, WarningLetterType letterType, decimal speedThreshold, decimal idlingThreshold)
    {
        var employeeId = candidate.Vehicle.DefaultEmployeeId;
        var employeeName = !string.IsNullOrWhiteSpace(candidate.EmployeeName)
            ? candidate.EmployeeName.Trim()
            : candidate.Vehicle.DefaultEmployee?.FullName ?? "Unassigned";

        var expectedValue = GetExpectedValue(candidate, letterType, speedThreshold, idlingThreshold);
        var actualValue = GetActualValue(candidate, letterType);
        var excessValue = GetExcessValue(candidate, letterType, expectedValue, actualValue);

        return new WarningLetterConsumptionCandidateDto
        {
            ConsumptionId = candidate.Id,
            LetterType = letterType,
            MetricDate = candidate.Date,
            PeriodStart = candidate.Date.Date,
            PeriodEnd = candidate.Date.Date,
            SiteId = candidate.SiteId,
            SiteName = candidate.Site.Name,
            VehicleId = candidate.VehicleId,
            VehicleHyoungNo = candidate.Vehicle.HyoungNo,
            NumberPlate = candidate.Vehicle.NumberPlate,
            EmployeeId = employeeId,
            EmployeeName = employeeName,
            ExpectedValue = expectedValue,
            ActualValue = actualValue,
            ExcessValue = excessValue,
            ViolationSummary = BuildViolationSummary(letterType, candidate.Date, expectedValue, actualValue, excessValue)
        };
    }

    private static decimal? GetExpectedValue(Vehicleconsumption candidate, WarningLetterType letterType, decimal speedThreshold, decimal idlingThreshold)
    {
        return letterType switch
        {
            WarningLetterType.ExcessiveSpeed => speedThreshold,
            WarningLetterType.ExcessiveIdling => idlingThreshold,
            _ => candidate.ExpectedConsumption
        };
    }

    private static decimal? GetActualValue(Vehicleconsumption candidate, WarningLetterType letterType)
    {
        return letterType switch
        {
            WarningLetterType.ExcessiveSpeed => candidate.MaxSpeed,
            WarningLetterType.ExcessiveIdling => candidate.EngHours,
            _ => candidate.FuelEfficiency
        };
    }

    private static decimal? GetExcessValue(Vehicleconsumption candidate, WarningLetterType letterType, decimal? expectedValue, decimal? actualValue)
    {
        return letterType switch
        {
            WarningLetterType.ExcessiveSpeed => actualValue.HasValue ? Math.Max(0m, actualValue.Value - (expectedValue ?? 0m)) : null,
            WarningLetterType.ExcessiveIdling => actualValue.HasValue ? Math.Max(0m, actualValue.Value - (expectedValue ?? 0m)) : null,
            _ => candidate.FuelLost ?? (expectedValue.HasValue && actualValue.HasValue ? Math.Max(0m, expectedValue.Value - actualValue.Value) : null)
        };
    }

    private static string BuildViolationSummary(WarningLetterType letterType, DateTime metricDate, decimal? expectedValue, decimal? actualValue, decimal? excessValue)
    {
        var metricDateText = metricDate.ToString("dd MMM yyyy", CultureInfo.InvariantCulture);
        return letterType switch
        {
            WarningLetterType.ExcessiveSpeed =>
                $"Vehicle exceeded the configured speed limit on {metricDateText}. Recorded speed was {FormatDecimal(actualValue)} km/h against a limit of {FormatDecimal(expectedValue)} km/h, resulting in an excess of {FormatDecimal(excessValue)} km/h.",
            WarningLetterType.ExcessiveIdling =>
                $"Vehicle idling hours exceeded the configured threshold on {metricDateText}. Recorded idling was {FormatDecimal(actualValue)} hours against an allowance of {FormatDecimal(expectedValue)} hours, resulting in an excess of {FormatDecimal(excessValue)} hours.",
            _ =>
                $"Vehicle fuel efficiency dropped below the expected average on {metricDateText}. Recorded efficiency was {FormatDecimal(actualValue)} km/l against an expected {FormatDecimal(expectedValue)} km/l, resulting in an estimated loss of {FormatDecimal(excessValue)} litres."
        };
    }

    private static string FormatDecimal(decimal? value)
    {
        return value.HasValue ? value.Value.ToString("N2", CultureInfo.InvariantCulture) : "0.00";
    }
}