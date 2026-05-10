/**
 * File: ExpectedAverageDriftMonitorService.cs
 * Purpose: Monitors rolling vehicle fuel-efficiency samples and opens adjustment reviews when drift exceeds configured thresholds.
 * Dependencies: GpsdataContext, assignment resolver
 * Last Modified: 2026-05-10
 */

using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Features.ExpectedFuelAverage.Services;
using FMS.Domain.Entities;
using FMS.Persistence.DataAccess;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace FMS.BackgroundServices.FuelBusinessOperation;

public class ExpectedAverageDriftMonitorService : BackgroundService
{
    private static readonly TimeSpan MonitorInterval = TimeSpan.FromHours(6);

    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<ExpectedAverageDriftMonitorService> _logger;

    public ExpectedAverageDriftMonitorService(IServiceProvider serviceProvider, ILogger<ExpectedAverageDriftMonitorService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(MonitorInterval);

        await RunScanAsync(stoppingToken);

        while (await timer.WaitForNextTickAsync(stoppingToken))
        {
            await RunScanAsync(stoppingToken);
        }
    }

    private async Task RunScanAsync(CancellationToken cancellationToken)
    {
        try
        {
            using var scope = _serviceProvider.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<GpsdataContext>();
            var resolver = scope.ServiceProvider.GetRequiredService<IExpectedFuelAverageAssignmentResolver>();
            var activeAssignments = await resolver.GetActiveAssignmentsAsync(cancellationToken);

            foreach (var assignment in activeAssignments)
            {
                await EvaluateAssignmentAsync(context, assignment, cancellationToken);
            }
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Expected-average drift monitoring scan failed");
        }
    }

    private async Task EvaluateAssignmentAsync(GpsdataContext context, VehicleExpectedAverageAssignment assignment, CancellationToken cancellationToken)
    {
        var template = assignment.ExpectedFuelAverageTemplate;
        if (template == null)
        {
            return;
        }

        var expectedValue = assignment.OverrideExpectedValue ?? template.ExpectedValue;
        if (expectedValue <= 0)
        {
            return;
        }

        var reviewWindowDays = assignment.OverrideReviewWindowDays ?? template.ReviewWindowDays;
        var driftThreshold = assignment.OverrideDriftPercentThreshold ?? template.DriftPercentThreshold;
        var minSampleCount = assignment.OverrideMinSampleCount ?? template.MinSampleCount;
        var windowStart = DateTime.UtcNow.AddDays(-reviewWindowDays);
        var isKmPerLiterValue = template.IsKmPerLiter ? 1UL : 0UL;

        var samples = await context.Vehicleconsumptions
            .AsNoTracking()
            .Where(v => v.VehicleId == assignment.VehicleId)
            .Where(v => v.Date >= windowStart)
            .Where(v => v.IsKmperLiter == isKmPerLiterValue)
            .Where(v => v.FuelEfficiency.HasValue && v.FuelEfficiency.Value > 0)
            .OrderByDescending(v => v.Date)
            .Select(v => new { v.Date, Value = v.FuelEfficiency!.Value })
            .ToListAsync(cancellationToken);

        var state = await context.ExpectedAverageDriftReviewStates
            .FirstOrDefaultAsync(s => s.AssignmentId == assignment.Id && s.VehicleId == assignment.VehicleId, cancellationToken);

        if (state == null)
        {
            state = new ExpectedAverageDriftReviewState
            {
                AssignmentId = assignment.Id,
                VehicleId = assignment.VehicleId
            };
            context.ExpectedAverageDriftReviewStates.Add(state);
        }

        state.LastEvaluatedAt = DateTime.UtcNow;
        state.LastSampleCount = samples.Count;

        if (samples.Count < minSampleCount)
        {
            state.LastOutsideBandPercent = null;
            await context.SaveChangesAsync(cancellationToken);
            return;
        }

        var meanActual = Math.Round(samples.Average(s => s.Value), 4);
        var meanDelta = Math.Round(meanActual - expectedValue, 4);
        var outsideBandPercent = expectedValue == 0m
            ? 0m
            : Math.Round(Math.Abs(meanDelta) / expectedValue * 100m, 2);

        state.LastOutsideBandPercent = outsideBandPercent;

        if (outsideBandPercent < driftThreshold)
        {
            await context.SaveChangesAsync(cancellationToken);
            return;
        }

        var existingOpenReview = state.OpenReviewId.HasValue
            ? await context.ExpectedAverageReviews
                .AsNoTracking()
                .FirstOrDefaultAsync(r => r.Id == state.OpenReviewId.Value && r.Status == "Open", cancellationToken)
            : null;

        if (existingOpenReview != null)
        {
            await context.SaveChangesAsync(cancellationToken);
            return;
        }

        var direction = meanActual >= expectedValue ? "Above" : "Below";
        var review = new ExpectedAverageReview
        {
            VehicleId = assignment.VehicleId,
            AssignmentId = assignment.Id,
            TemplateIdAtOpen = assignment.ExpectedFuelAverageTemplateId,
            OpenedAt = DateTime.UtcNow,
            OpenedBySystem = true,
            Status = "Open",
            Direction = direction,
            SampleCount = samples.Count,
            OutsideBandPercent = outsideBandPercent,
            MeanActual = meanActual,
            MeanDelta = meanDelta,
            SuggestedValue = meanActual,
            Summary = BuildSummary(template.IsKmPerLiter, expectedValue, meanActual, outsideBandPercent, reviewWindowDays, samples.Count)
        };

        context.ExpectedAverageReviews.Add(review);
        await context.SaveChangesAsync(cancellationToken);

        context.ExpectedAverageReviewEvents.Add(new ExpectedAverageReviewEvent
        {
            ReviewId = review.Id,
            At = DateTime.UtcNow,
            By = "system",
            FromStatus = null,
            ToStatus = "Open",
            Note = review.Summary
        });

        state.OpenReviewId = review.Id;
        await context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "Opened expected-average drift review {ReviewId} for vehicle {VehicleId} assignment {AssignmentId}; drift {DriftPercent}% over {SampleCount} samples",
            review.Id,
            review.VehicleId,
            review.AssignmentId,
            outsideBandPercent,
            review.SampleCount);
    }

    private static string BuildSummary(bool isKmPerLiter, decimal expectedValue, decimal meanActual, decimal outsideBandPercent, int reviewWindowDays, int sampleCount)
    {
        var unit = isKmPerLiter ? "km/L" : "L/hr";
        return $"Rolling mean actual efficiency drifted to {meanActual:0.####} {unit} against expected {expectedValue:0.####} {unit} over the last {reviewWindowDays} day(s) across {sampleCount} sample(s), a {outsideBandPercent:0.##}% variance.";
    }
}