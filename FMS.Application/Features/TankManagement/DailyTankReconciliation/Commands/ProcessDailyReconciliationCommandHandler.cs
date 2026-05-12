using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Domain.Entities;
using FMS.Domain.Entities.enums;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.TankManagement.DailyTankReconciliation.Commands;

public class ProcessDailyReconciliationCommandHandler : IRequestHandler<ProcessDailyReconciliationCommand, FMSResponse<DailyReconciliationResult>>
{
    private readonly GpsdataContext _context;
    private readonly ILogger<ProcessDailyReconciliationCommandHandler> _logger;

    public ProcessDailyReconciliationCommandHandler(
        GpsdataContext context,
        ILogger<ProcessDailyReconciliationCommandHandler> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<FMSResponse<DailyReconciliationResult>> Handle(
        ProcessDailyReconciliationCommand request,
        CancellationToken cancellationToken)
    {
        var startTime = DateTime.UtcNow;
        var result = new DailyReconciliationResult
        {
            ProcessedDate = request.StartDate
        };

        try
        {
            _logger.LogInformation("Starting daily tank reconciliation for date range: {StartDate} to {EndDate}",
                request.StartDate, request.EndDate ?? request.StartDate);

            // Validate request
            var validationErrors = ValidateRequest(request);
            if (validationErrors.Any())
            {
                return FMSResponse<DailyReconciliationResult>.ValidationFailed(validationErrors);
            }

            var endDate = request.EndDate ?? request.StartDate;
            var currentDate = request.StartDate.Date;

            while (currentDate <= endDate.Date)
            {
                var dailyResult = await ProcessSingleDay(currentDate, request, cancellationToken);

                // Aggregate results
                result.TotalTanksProcessed += dailyResult.TotalTanksProcessed;
                result.RecordsCreated += dailyResult.RecordsCreated;
                result.RecordsUpdated += dailyResult.RecordsUpdated;
                result.RecordsWithDiscrepancies += dailyResult.RecordsWithDiscrepancies;
                result.TankSummaries.AddRange(dailyResult.TankSummaries);
                result.Warnings.AddRange(dailyResult.Warnings);
                result.Errors.AddRange(dailyResult.Errors);

                currentDate = currentDate.AddDays(1);
            }

            result.ProcessingDuration = DateTime.UtcNow - startTime;

            _logger.LogInformation("Daily tank reconciliation completed. Processed {TankCount} tanks, Created {Created}, Updated {Updated}",
                result.TotalTanksProcessed, result.RecordsCreated, result.RecordsUpdated);

            return FMSResponse<DailyReconciliationResult>.Success(result,
                $"Successfully processed daily reconciliation for {result.TotalTanksProcessed} tanks");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing daily tank reconciliation");
            result.ProcessingDuration = DateTime.UtcNow - startTime;
            result.Errors.Add($"System error: {ex.Message}");

            return FMSResponse<DailyReconciliationResult>.SystemError("Failed to process daily tank reconciliation");
        }
    }

    //Cursor - Process reconciliation for a single day (equivalent to Python's process_tank_volume_history)
    private async Task<DailyReconciliationResult> ProcessSingleDay(
        DateTime date,
        ProcessDailyReconciliationCommand request,
        CancellationToken cancellationToken)
    {
        var dailyResult = new DailyReconciliationResult { ProcessedDate = date };

        try
        {
            // Get tank volume history aggregated by tank for the specific date
            var query = _context.TankVolumeHistories
                .Where(tvh => tvh.Timestamp.Date == date.Date && tvh.TankId.HasValue && tvh.IsDeleted != true);

            // Apply filters if specified
            if (request.TankId.HasValue)
                query = query.Where(tvh => tvh.TankId == request.TankId.Value);

            if (request.SiteId.HasValue)
                query = query.Where(tvh => tvh.Tank.SiteId == request.SiteId.Value);

            // Aggregate data by tank (equivalent to Python's main aggregation query)
            var dailyRecords = await query
                .GroupBy(tvh => tvh.TankId!.Value)
                .Select(g => new DailyTankRecord
                {
                    TankId = g.Key,
                    TransactionDate = date,
                    FirstTimestamp = g.Min(tvh => tvh.Timestamp),
                    LastTimestamp = g.Max(tvh => tvh.Timestamp),
                    TotalDispense = g.Where(tvh => tvh.ChangeReason == VolumeChangeReasonEnum.Dispensing ||
                                                  tvh.ChangeReason == VolumeChangeReasonEnum.AutomatedDispensing)
                        .Sum(tvh => Math.Abs(tvh.VolumeChange ?? 0)),
                    TotalDeliveries = g.Where(tvh => tvh.ChangeReason == VolumeChangeReasonEnum.Delivery ||
                                                     tvh.ChangeReason == VolumeChangeReasonEnum.InTankDelivery)
                        .Sum(tvh => Math.Abs(tvh.VolumeChange ?? 0)),
                    TotalTransfersIn = g.Where(tvh => tvh.ChangeReason == VolumeChangeReasonEnum.TransferIn)
                        .Sum(tvh => Math.Abs(tvh.VolumeChange ?? 0)),
                    TotalTransfersOut = g.Where(tvh => tvh.ChangeReason == VolumeChangeReasonEnum.TransferOut)
                        .Sum(tvh => Math.Abs(tvh.VolumeChange ?? 0))
                })
                .ToListAsync(cancellationToken);

            if (!dailyRecords.Any())
            {
                _logger.LogInformation("No tank volume history records found for date {Date}", date);
                return dailyResult;
            }

            // Process each tank record
            foreach (var record in dailyRecords)
            {
                try
                {
                    var tankSummary = await ProcessTankRecord(record, cancellationToken);
                    dailyResult.TankSummaries.Add(tankSummary);

                    // Update or create daily reconciliation record
                    var wasUpdated = await UpdateDailyReconciliationRecord(
                        record.TankId,
                        date,
                        tankSummary,
                        request.ForceReprocess,
                        cancellationToken);

                    if (wasUpdated)
                        dailyResult.RecordsUpdated++;
                    else
                        dailyResult.RecordsCreated++;

                    if (tankSummary.HasDiscrepancy)
                        dailyResult.RecordsWithDiscrepancies++;

                    dailyResult.TotalTanksProcessed++;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error processing tank {TankId} for date {Date}", record.TankId, date);
                    dailyResult.Errors.Add($"Tank {record.TankId}: {ex.Message}");
                }
            }

            await _context.SaveChangesAsync(cancellationToken);
            return dailyResult;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing single day {Date}", date);
            dailyResult.Errors.Add($"Date {date:yyyy-MM-dd}: {ex.Message}");
            return dailyResult;
        }
    }

    //Cursor - Process individual tank record and calculate reconciliation data
    private async Task<TankReconciliationSummary> ProcessTankRecord(
        DailyTankRecord record,
        CancellationToken cancellationToken)
    {
        // Get tank information
        var tank = await _context.Tanks
            .Include(t => t.Site)
            .FirstOrDefaultAsync(t => t.Id == record.TankId, cancellationToken);

        // Prefer explicit opening/closing stock rows when they exist for the day.
        var openingVolumeRecord = await _context.TankVolumeHistories
            .Where(tvh => tvh.TankId == record.TankId &&
                          tvh.Timestamp.Date == record.TransactionDate.Date &&
                          tvh.IsDeleted != true &&
                          tvh.ChangeReason == VolumeChangeReasonEnum.OpeningStock)
            .OrderBy(tvh => tvh.Timestamp)
            .ThenBy(tvh => tvh.Id)
            .FirstOrDefaultAsync(cancellationToken)
            ?? await _context.TankVolumeHistories
                .Where(tvh => tvh.TankId == record.TankId &&
                              tvh.Timestamp == record.FirstTimestamp &&
                              tvh.IsDeleted != true)
                .OrderBy(tvh => tvh.Id)
                .FirstOrDefaultAsync(cancellationToken);

        var closingVolumeRecord = await _context.TankVolumeHistories
            .Where(tvh => tvh.TankId == record.TankId &&
                          tvh.Timestamp.Date == record.TransactionDate.Date &&
                          tvh.IsDeleted != true &&
                          tvh.ChangeReason == VolumeChangeReasonEnum.ClosingStock)
            .OrderByDescending(tvh => tvh.Timestamp)
            .ThenByDescending(tvh => tvh.Id)
            .FirstOrDefaultAsync(cancellationToken)
            ?? await _context.TankVolumeHistories
                .Where(tvh => tvh.TankId == record.TankId &&
                              tvh.Timestamp == record.LastTimestamp &&
                              tvh.IsDeleted != true)
                .OrderByDescending(tvh => tvh.Id)
                .FirstOrDefaultAsync(cancellationToken);

        var openingLevel = openingVolumeRecord?.NewVolume ?? 0;
        var closingLevel = closingVolumeRecord?.NewVolume ?? 0;

        // Calculate expected closing level
        var calculatedClosing = openingLevel + record.TotalDeliveries + record.TotalTransfersIn -
            record.TotalDispense - record.TotalTransfersOut;

        var variance = Math.Abs(closingLevel - calculatedClosing);
        var hasDiscrepancy = variance > 1.0m; // 1 liter threshold

        return new TankReconciliationSummary
        {
            TankId = record.TankId,
            TankName = tank?.Name ?? $"Tank {record.TankId}",
            SiteName = tank?.Site?.Name ?? "Unknown Site",
            ReconciliationDate = record.TransactionDate,
            OpeningLevel = openingLevel,
            ClosingLevel = closingLevel,
            TotalRefills = record.TotalDispense,
            TotalDeliveries = record.TotalDeliveries,
            TotalTransfersIn = record.TotalTransfersIn,
            TotalTransfersOut = record.TotalTransfersOut,
            CalculatedClosing = calculatedClosing,
            Variance = variance,
            HasDiscrepancy = hasDiscrepancy,
            Status = hasDiscrepancy ? "Discrepancy Detected" : "Reconciled"
        };
    }

    //Cursor - Update or create daily reconciliation record (equivalent to Python's update_daily_reconciliation)
    private async Task<bool> UpdateDailyReconciliationRecord(
        int tankId,
        DateTime date,
        TankReconciliationSummary summary,
        bool forceReprocess,
        CancellationToken cancellationToken)
    {
        // Check if record exists
        var existingRecord = await _context.Dailytankreconciliations
            .FirstOrDefaultAsync(dtr => dtr.TankId == tankId && dtr.ReconciliationDate.Date == date.Date,
                cancellationToken);

        if (existingRecord != null)
        {
            if (!forceReprocess)
            {
                _logger.LogDebug("Reconciliation record already exists for Tank {TankId} on {Date}, skipping",
                    tankId, date);
                return true; // Considered as updated
            }

            // Update existing record
            existingRecord.OpeningLevel = summary.OpeningLevel;
            existingRecord.ClosingLevel = summary.ClosingLevel;
            existingRecord.TotalRefills = summary.TotalRefills;
            existingRecord.TotalDeliveries = summary.TotalDeliveries;
            existingRecord.TotalTransfersIn = summary.TotalTransfersIn;
            existingRecord.TotalTransfersOut = summary.TotalTransfersOut;

            _context.Dailytankreconciliations.Update(existingRecord);
            return true;
        }
        else
        {
            // Create new record
            var newRecord = new Dailytankreconciliation
            {
                TankId = tankId,
                ReconciliationDate = date,
                OpeningLevel = summary.OpeningLevel,
                ClosingLevel = summary.ClosingLevel,
                TotalRefills = summary.TotalRefills,
                TotalDeliveries = summary.TotalDeliveries,
                TotalTransfersIn = summary.TotalTransfersIn,
                TotalTransfersOut = summary.TotalTransfersOut,
                CreatedOn = DateTime.UtcNow
            };

            _context.Dailytankreconciliations.Add(newRecord);
            return false;
        }
    }

    //Cursor - Validate the command request
    private List<string> ValidateRequest(ProcessDailyReconciliationCommand request)
    {
        var errors = new List<string>();

        if (request.StartDate > DateTime.Now.Date)
        {
            errors.Add("Start date cannot be in the future");
        }

        if (request.EndDate.HasValue && request.EndDate.Value < request.StartDate)
        {
            errors.Add("End date cannot be before start date");
        }

        if (request.EndDate.HasValue && (request.EndDate.Value - request.StartDate).TotalDays > 365)
        {
            errors.Add("Date range cannot exceed 365 days");
        }

        return errors;
    }
}

// Helper class for daily tank record data
internal class DailyTankRecord
{
    public int TankId { get; set; }
    public DateTime TransactionDate { get; set; }
    public DateTime FirstTimestamp { get; set; }
    public DateTime LastTimestamp { get; set; }
    public decimal TotalDispense { get; set; }
    public decimal TotalDeliveries { get; set; }
    public decimal TotalTransfersIn { get; set; }
    public decimal TotalTransfersOut { get; set; }
}

