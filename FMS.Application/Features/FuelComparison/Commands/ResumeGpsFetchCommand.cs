using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using System.Linq;
using Microsoft.Extensions.Logging;
using Microsoft.EntityFrameworkCore;
using FMS.Application.Common;
using FMS.Application.Features.GPSGate.Commands;
using FMS.Application.Features.GPSGate.Queries;
using FMS.Application.Features.GPSGate.DTOs;
using FMS.Application.Features.GPSGate.Services;
using FMS.Application.Communication.SignalR;
using FMS.Persistence.DataAccess;
using FMS.Domain.Entities;

namespace FMS.Application.Features.FuelComparison.Commands;

/// <summary>
/// Command to resume a stuck GPS fetch job that has a valid handle_id
/// but failed before completing post-processing
/// </summary>
public record ResumeGpsFetchCommand(int ReportId) : IRequest<FMSResponse<GpsFetchResultDto>>;

/// <summary>
/// Handler for resuming stuck GPS fetch jobs.
/// Logs into GPSGate with a new session and uses the existing handle_id
/// to fetch and process the report data.
/// </summary>
public class ResumeGpsFetchCommandHandler
    : IRequestHandler<ResumeGpsFetchCommand, FMSResponse<GpsFetchResultDto>>
{
    private readonly IMediator _mediator;
    private readonly IGpsFetchProgressService _progressService;
    private readonly IGPSGateDirectoryService _directoryService;
    private readonly GpsdataContext _context;
    private readonly ILogger<ResumeGpsFetchCommandHandler> _logger;

    public ResumeGpsFetchCommandHandler(
        IMediator mediator,
        IGpsFetchProgressService progressService,
        IGPSGateDirectoryService directoryService,
        GpsdataContext context,
        ILogger<ResumeGpsFetchCommandHandler> logger)
    {
        _mediator = mediator;
        _progressService = progressService;
        _directoryService = directoryService;
        _context = context;
        _logger = logger;
    }

    public async Task<FMSResponse<GpsFetchResultDto>> Handle(
        ResumeGpsFetchCommand request,
        CancellationToken cancellationToken)
    {
        var fetchStartTime = DateTime.UtcNow;
        var result = new GpsFetchResultDto { FetchStartTime = fetchStartTime };
        var jobId = Guid.NewGuid().ToString(); // Generate new job ID for progress tracking

        try
        {
            // Step 1: Get the stuck report from database
            var gpsGateReport = await _context.GPSGateReports
                .FirstOrDefaultAsync(r => r.Id == request.ReportId, cancellationToken);

            if (gpsGateReport == null)
            {
                return FMSResponse<GpsFetchResultDto>.Failed($"Report with ID {request.ReportId} not found");
            }

            if (gpsGateReport.HandleId == 0)
            {
                return FMSResponse<GpsFetchResultDto>.Failed($"Report {request.ReportId} has no handle_id. Cannot resume.");
            }

            if (gpsGateReport.Status == "Completed")
            {
                return FMSResponse<GpsFetchResultDto>.Failed($"Report {request.ReportId} is already completed.");
            }

            var handleId = gpsGateReport.HandleId;
            var reportTypeId = gpsGateReport.ReportId; // This is the GPSGate report type (212)

            _logger.LogInformation(
                "Resuming GPS fetch for report {ReportId} with handle_id {HandleId}, job {JobId}",
                request.ReportId, handleId, jobId);

            // Update the job ID in the database
            gpsGateReport.JobId = jobId;
            gpsGateReport.Status = "Resuming";
            await _context.SaveChangesAsync(cancellationToken);

            // Step 2: Login to GPSGate with new session
            await _progressService.SendProgress(
                jobId, "Logging in", 10, "Authenticating with GPSGate...");

            var loginResult = await _directoryService.AuthenticateAsync();

            if (!loginResult.Success || string.IsNullOrEmpty(loginResult.SessionId))
            {
                gpsGateReport.Status = "Failed";
                gpsGateReport.ErrorMessage = $"Login failed: {loginResult.Message}";
                await _context.SaveChangesAsync(cancellationToken);

                await _progressService.SendError(jobId, $"GPSGate login failed: {loginResult.Message}");
                return FMSResponse<GpsFetchResultDto>.Failed(loginResult.Message);
            }

            var sessionId = loginResult.SessionId;
            gpsGateReport.SessionId = sessionId; // Update session ID
            await _context.SaveChangesAsync(cancellationToken);

            _logger.LogInformation(
                "Resume job {JobId}: Logged in with new session {SessionId}",
                jobId, sessionId);

            // Step 3: Check if report is ready (it should be since it was previously generated)
            await _progressService.SendProgress(
                jobId, "Checking Report Status", 30, "Verifying report is ready...");

            var statusResult = await _mediator.Send(
                new GetReportStatusQuery(sessionId, handleId),
                cancellationToken);

            _logger.LogInformation(
                "Resume job {JobId}: Status check - Success: {Success}, Status: '{Status}'",
                jobId, statusResult.IsSuccess, statusResult.Data?.Status ?? "NULL");

            // If not ready, poll for it
            if (!statusResult.IsSuccess ||
                (!statusResult.Data?.Status?.Equals("Completed", StringComparison.OrdinalIgnoreCase) == true &&
                 !statusResult.Data?.Status?.Equals("Done", StringComparison.OrdinalIgnoreCase) == true))
            {
                _logger.LogInformation("Resume job {JobId}: Report not ready yet, polling...", jobId);

                var isReportReady = false;
                var maxPollingAttempts = 60; // 60 attempts * 2 seconds = 2 minutes max
                var pollingAttempt = 0;

                while (!isReportReady && pollingAttempt < maxPollingAttempts)
                {
                    pollingAttempt++;
                    var progressPercent = 30 + (int)((pollingAttempt / (double)maxPollingAttempts) * 30);

                    await _progressService.SendProgress(
                        jobId,
                        "Processing Report",
                        progressPercent,
                        $"Waiting for GPSGate to process report... (Attempt {pollingAttempt}/{maxPollingAttempts})");

                    statusResult = await _mediator.Send(
                        new GetReportStatusQuery(sessionId, handleId),
                        cancellationToken);

                    if (statusResult.IsSuccess &&
                        (statusResult.Data?.Status?.Equals("Completed", StringComparison.OrdinalIgnoreCase) == true ||
                         statusResult.Data?.Status?.Equals("Done", StringComparison.OrdinalIgnoreCase) == true))
                    {
                        isReportReady = true;
                    }
                    else
                    {
                        await Task.Delay(2000, cancellationToken);
                    }
                }

                if (!isReportReady)
                {
                    gpsGateReport.Status = "Failed";
                    gpsGateReport.ErrorMessage = "Report not ready after polling";
                    await _context.SaveChangesAsync(cancellationToken);

                    await _progressService.SendError(jobId, "Report not ready. GPSGate may have expired the report.");
                    return FMSResponse<GpsFetchResultDto>.Failed("Report not ready or expired");
                }
            }

            result.ReportHandleId = handleId.ToString();

            // Step 4: Process Report
            await _progressService.SendProgress(
                jobId, "Fetching Data", 70, "Retrieving and parsing refueling data...");

            var processResult = await _mediator.Send(
                new ProcessReportQuery<RefuelingReportDto>(sessionId, handleId, reportTypeId),
                cancellationToken);

            if (!processResult.IsSuccess || processResult.Data?.Data == null)
            {
                gpsGateReport.Status = "Failed";
                gpsGateReport.ErrorMessage = $"Report processing failed: {processResult.Message}";
                await _context.SaveChangesAsync(cancellationToken);

                await _progressService.SendError(jobId, $"Report processing failed: {processResult.Message}");
                return FMSResponse<GpsFetchResultDto>.Failed(processResult.Message);
            }

            var refuelingData = processResult.Data.Data;
            result.TotalRecordsFetched = refuelingData.Count;

            _logger.LogInformation(
                "Resume job {JobId}: Fetched {Count} refueling records",
                jobId, refuelingData.Count);

            // Step 5: Transform & Save
            await _progressService.SendProgress(
                jobId, "Saving Data", 80, $"Saving {refuelingData.Count} records to database...");

            // Load vehicle mappings
            var providerMappings = await _context.VehicleProviderMappings
                .Where(m => m.IsActive && !string.IsNullOrEmpty(m.ExternalDeviceId))
                .Join(
                    _context.Vehicles,
                    mapping => mapping.VehicleId,
                    vehicle => vehicle.VehicleId,
                    (mapping, vehicle) => new { mapping.ExternalDeviceId, mapping.VehicleId, mapping.DeviceName }
                )
                .ToListAsync(cancellationToken);

            var vehicleLookupByExternalId = providerMappings
                .Where(m => !string.IsNullOrEmpty(m.ExternalDeviceId))
                .GroupBy(m => m.ExternalDeviceId!.Trim())
                .ToDictionary(g => g.Key, g => g.First().VehicleId);

            var vehicleLookupByName = providerMappings
                .Where(m => !string.IsNullOrEmpty(m.DeviceName))
                .GroupBy(m => m.DeviceName!.Trim().ToUpperInvariant())
                .ToDictionary(g => g.Key, g => g.First().VehicleId);

            var unmappedVehicles = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

            static DateTime NormalizeDispenseDate(DateTime refuelDate, TimeSpan? startTime)
            {
                if (startTime.HasValue && refuelDate.TimeOfDay == TimeSpan.Zero)
                {
                    return refuelDate.Date.Add(startTime.Value);
                }

                return refuelDate;
            }

            static string BuildEventKey(int vehicleId, DateTime dispenseDate, TimeSpan? startTime)
            {
                return $"{vehicleId}|{dispenseDate:O}|{(startTime?.Ticks ?? 0)}";
            }

            var mappedVehicleIds = providerMappings
                .Select(m => m.VehicleId)
                .Distinct()
                .ToList();

            var rangeStart = gpsGateReport.StartDate.Date;
            var rangeEndExclusive = gpsGateReport.EndDate.Date.AddDays(1);

            var existingEntriesInRange = await _context.GpsGateReportEntries
                .Where(e => !e.IsDeleted &&
                            mappedVehicleIds.Contains(e.VehicleId) &&
                            e.DispenseDate >= rangeStart &&
                            e.DispenseDate < rangeEndExclusive)
                .ToListAsync(cancellationToken);

            var existingEntriesByKey = existingEntriesInRange
                .GroupBy(e => BuildEventKey(e.VehicleId, e.DispenseDate, e.StartTime))
                .ToDictionary(g => g.Key, g => g.OrderByDescending(x => x.Id).First());

            var processedKeysThisRun = new HashSet<string>(StringComparer.Ordinal);

            var processedCount = 0;
            foreach (var dto in refuelingData)
            {
                processedCount++;

                if (processedCount % 10 == 0)
                {
                    var saveProgress = 80 + (int)((processedCount / (double)refuelingData.Count) * 10);
                    await _progressService.SendProgress(
                        jobId,
                        "Saving Data",
                        saveProgress,
                        $"Saved {processedCount}/{refuelingData.Count} records...");
                }

                int? vehicleId = null;
                if (!string.IsNullOrWhiteSpace(dto.Vehicle))
                {
                    var gpsGateVehicleId = dto.Vehicle.Trim();

                    if (vehicleLookupByExternalId.TryGetValue(gpsGateVehicleId, out var lookupId))
                    {
                        vehicleId = lookupId;
                    }
                    else if (vehicleLookupByName.TryGetValue(gpsGateVehicleId.ToUpperInvariant(), out lookupId))
                    {
                        vehicleId = lookupId;
                    }
                    else
                    {
                        unmappedVehicles.Add(gpsGateVehicleId);
                    }
                }

                if (!vehicleId.HasValue)
                {
                    result.UnmappedVehiclesCount++;
                    continue;
                }

                var refuelDate = dto.RefuelingDateTime ?? dto.Date ?? DateTime.MinValue;
                if (refuelDate == DateTime.MinValue)
                {
                    result.DuplicatesSkipped++;
                    continue;
                }

                var dispenseDate = NormalizeDispenseDate(refuelDate, dto.StartTime);
                var eventKey = BuildEventKey(vehicleId.Value, dispenseDate, dto.StartTime);

                if (!processedKeysThisRun.Add(eventKey))
                {
                    result.DuplicatesSkipped++;
                    continue;
                }

                existingEntriesByKey.TryGetValue(eventKey, out var existingEntry);

                if (existingEntry != null)
                {
                    existingEntry.RefillVolume = dto.RefillVolume ?? 0;
                    existingEntry.FuelBefore = dto.FuelBefore;
                    existingEntry.FuelAfter = dto.FuelAfter;
                    existingEntry.StartTime = dto.StartTime;
                    existingEntry.Duration = dto.Duration;
                    existingEntry.ModifiedAt = DateTime.UtcNow;
                    if (existingEntry.ReportId != gpsGateReport.Id)
                    {
                        existingEntry.ReportId = gpsGateReport.Id;
                    }
                    result.RecordsUpdated++;
                }
                else
                {
                    var newEntry = new GpsGateReportEntry
                    {
                        ReportId = gpsGateReport.Id,
                        VehicleId = vehicleId.Value,
                        DispenseDate = dispenseDate,
                        StartTime = dto.StartTime,
                        Duration = dto.Duration,
                        FuelBefore = dto.FuelBefore,
                        FuelAfter = dto.FuelAfter,
                        RefillVolume = dto.RefillVolume ?? 0,
                        OriginalVolume = dto.RefillVolume,
                        ModifiedVolume = null,
                        IsDeleted = false,
                        CreatedAt = DateTime.UtcNow
                    };

                    _context.GpsGateReportEntries.Add(newEntry);
                    existingEntriesByKey[eventKey] = newEntry;
                    result.NewRecordsSaved++;
                }
            }

            // Save entries and update report status
            gpsGateReport.Status = "Completed";
            gpsGateReport.CompletedAt = DateTime.UtcNow;
            gpsGateReport.ErrorMessage = null;

            await _context.SaveChangesAsync(cancellationToken);

            result.UnmappedVehicles = unmappedVehicles.OrderBy(v => v).ToList();
            result.FetchEndTime = DateTime.UtcNow;

            _logger.LogInformation(
                "Resume job {JobId} completed: {New} new, {Updated} updated, {Skipped} skipped, {Unmapped} unmapped",
                jobId, result.NewRecordsSaved, result.RecordsUpdated, result.DuplicatesSkipped, result.UnmappedVehiclesCount);

            // Step 6: Complete
            await _progressService.SendCompleted(jobId, result);

            var successMessage = $"Successfully resumed and fetched {result.TotalRecordsFetched} records: " +
                $"{result.NewRecordsSaved} new, {result.RecordsUpdated} updated, " +
                $"{result.DuplicatesSkipped} skipped";

            if (result.UnmappedVehiclesCount > 0)
            {
                successMessage += $". WARNING: {result.UnmappedVehiclesCount} records skipped due to unmapped vehicles.";
            }

            return FMSResponse<GpsFetchResultDto>.Success(result, successMessage);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Resume job {JobId} failed with exception", jobId);
            await _progressService.SendError(jobId, ex.Message);

            // Update report status to failed
            try
            {
                var report = await _context.GPSGateReports.FindAsync(request.ReportId);
                if (report != null)
                {
                    report.Status = "Failed";
                    report.ErrorMessage = ex.Message;
                    await _context.SaveChangesAsync(cancellationToken);
                }
            }
            catch { /* Ignore secondary errors */ }

            return FMSResponse<GpsFetchResultDto>.Failed($"Resume failed: {ex.Message}");
        }
    }
}
