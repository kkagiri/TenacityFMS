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
/// Orchestrates the complete GPS fetch workflow:
/// 1. Login to GPSGate (uses credentials from provider_configurations table)
/// 2. Generate Report 212 (Refueling Report)
/// 3. Poll for report completion
/// 4. Process report (parse XML to RefuelingReportDto)
/// 5. Transform and save to gpsgate_report_entries
/// 6. Send real-time progress updates via SignalR
/// </summary>
public class FetchAndStoreGpsDataCommandHandler
    : IRequestHandler<FetchAndStoreGpsDataCommand, FMSResponse<GpsFetchResultDto>>
{
    private readonly IMediator _mediator;
    private readonly IGpsFetchProgressService _progressService;
    private readonly IGPSGateDirectoryService _directoryService;
    private readonly GpsdataContext _context;
    private readonly ILogger<FetchAndStoreGpsDataCommandHandler> _logger;

    public FetchAndStoreGpsDataCommandHandler(
        IMediator mediator,
        IGpsFetchProgressService progressService,
        IGPSGateDirectoryService directoryService,
        GpsdataContext context,
        ILogger<FetchAndStoreGpsDataCommandHandler> logger)
    {
        _mediator = mediator;
        _progressService = progressService;
        _directoryService = directoryService;
        _context = context;
        _logger = logger;
    }

    public async Task<FMSResponse<GpsFetchResultDto>> Handle(
        FetchAndStoreGpsDataCommand request,
        CancellationToken cancellationToken)
    {
        var fetchStartTime = DateTime.UtcNow;
        var result = new GpsFetchResultDto { FetchStartTime = fetchStartTime };

        try
        {
            _logger.LogInformation(
                "Starting GPS fetch job {JobId} for dates {StartDate} to {EndDate}",
                request.JobId, request.StartDate, request.EndDate);

            // Validate date range - GPSGate has a 1-month maximum period limit
            var dateRangeSpan = request.EndDate - request.StartDate;
            if (dateRangeSpan.TotalDays > 31)
            {
                var errorMessage = $"Date range exceeds GPSGate's 1-month maximum limit. " +
                    $"Requested: {dateRangeSpan.TotalDays:F0} days. Please split into smaller ranges.";

                _logger.LogWarning("GPS fetch job {JobId}: {Error}", request.JobId, errorMessage);

                await _progressService.SendError(request.JobId, errorMessage);
                return FMSResponse<GpsFetchResultDto>.Failed(errorMessage);
            }

            // Step 1: Login to GPSGate (10%)
            // Uses credentials from provider_configurations table (Name='GPSGateSOAP')
            await _progressService.SendProgress(
                request.JobId, "Logging in", 10, "Authenticating with GPSGate...");

            // Call AuthenticateAsync() which reads credentials from provider_configurations
            var loginResult = await _directoryService.AuthenticateAsync();

            if (!loginResult.Success || string.IsNullOrEmpty(loginResult.SessionId))
            {
                await _progressService.SendError(
                    request.JobId, $"GPSGate login failed: {loginResult.Message}");
                return FMSResponse<GpsFetchResultDto>.Failed(loginResult.Message);
            }

            var sessionId = loginResult.SessionId;
            _logger.LogInformation("GPS fetch job {JobId}: Logged in with session {SessionId}",
                request.JobId, sessionId);

            // Step 2: Generate Report 212 (20%)
            await _progressService.SendProgress(
                request.JobId, "Generating Report", 20, "Requesting refueling report from GPSGate...");

            var reportId = 212; // Refueling Report ID

            var generateResult = await _mediator.Send(new GenerateGPSReportCommand(
                sessionId,
                new GenerateReportRequestDto
                {
                    ReportId = reportId,
                    StartDate = request.StartDate,
                    EndDate = request.EndDate
                },
                request.JobId // Pass JobId for tracking
            ), cancellationToken);

            if (!generateResult.IsSuccess || generateResult.Data == null)
            {
                await _progressService.SendError(
                    request.JobId, $"Report generation failed: {generateResult.Message}");
                return FMSResponse<GpsFetchResultDto>.Failed(generateResult.Message);
            }

            var handleId = generateResult.Data.HandleId;
            result.ReportHandleId = handleId.ToString();

            _logger.LogInformation("GPS fetch job {JobId}: Report handle {HandleId} created",
                request.JobId, handleId);

            // Step 3: Poll Report Status (30-70%)
            var isReportReady = false;
            var maxPollingAttempts = 500; //    500 attempts * 2 seconds = 16 minutes max (for large date ranges)
            var pollingAttempt = 0;

            while (!isReportReady && pollingAttempt < maxPollingAttempts)
            {
                pollingAttempt++;
                var progressPercent = 30 + (int)((pollingAttempt / (double)maxPollingAttempts) * 40);

                await _progressService.SendProgress(
                    request.JobId,
                    "Processing Report",
                    progressPercent,
                    $"Waiting for GPSGate to process report... (Attempt {pollingAttempt}/{maxPollingAttempts})");

                var statusResult = await _mediator.Send(
                    new GetReportStatusQuery(sessionId, handleId),
                    cancellationToken);

                _logger.LogInformation(
                    "GPS fetch job {JobId}: Status check attempt {Attempt} - Success: {Success}, Status: '{Status}'",
                    request.JobId, pollingAttempt, statusResult.IsSuccess, statusResult.Data?.Status ?? "NULL");

                // GPSGate returns "Completed" when report is ready, not "Ready"
                if (statusResult.IsSuccess &&
                    (statusResult.Data?.Status?.Equals("Completed", StringComparison.OrdinalIgnoreCase) == true ||
                     statusResult.Data?.Status?.Equals("Done", StringComparison.OrdinalIgnoreCase) == true))
                {
                    isReportReady = true;
                    _logger.LogInformation(
                        "GPS fetch job {JobId}: Report {HandleId} is ready (status: {Status}) after {Attempts} attempts",
                        request.JobId, handleId, statusResult.Data.Status, pollingAttempt);
                }
                else if (!statusResult.IsSuccess)
                {
                    _logger.LogWarning(
                        "GPS fetch job {JobId}: Status check failed: {Message}",
                        request.JobId, statusResult.Message);
                }

                if (!isReportReady)
                {
                    await Task.Delay(2000, cancellationToken); // Wait 2 seconds before next poll
                }
            }

            if (!isReportReady)
            {
                await _progressService.SendError(
                    request.JobId, "Report generation timeout. GPSGate took too long to process.");
                return FMSResponse<GpsFetchResultDto>.Failed("Report generation timeout");
            }

            // Step 4: Process Report → RefuelingReportDto[] (70%)
            await _progressService.SendProgress(
                request.JobId, "Fetching Data", 70, "Retrieving and parsing refueling data...");

            var processResult = await _mediator.Send(
                new ProcessReportQuery<RefuelingReportDto>(sessionId, handleId, reportId),
                cancellationToken);

            if (!processResult.IsSuccess || processResult.Data?.Data == null)
            {
                await _progressService.SendError(
                    request.JobId, $"Report processing failed: {processResult.Message}");
                return FMSResponse<GpsFetchResultDto>.Failed(processResult.Message);
            }

            var refuelingData = processResult.Data.Data;
            result.TotalRecordsFetched = refuelingData.Count;

            _logger.LogInformation(
                "GPS fetch job {JobId}: Fetched {Count} refueling records",
                request.JobId, refuelingData.Count);

            // Step 5: Transform & Save (80-90%)
            await _progressService.SendProgress(
                request.JobId, "Saving Data", 80, $"Saving {refuelingData.Count} records to database...");

            // Get the ReportId from gpsgate_reports table
            var gpsGateReport = await _context.GPSGateReports
                .FirstOrDefaultAsync(r => r.HandleId == handleId, cancellationToken);

            if (gpsGateReport == null)
            {
                await _progressService.SendError(
                    request.JobId, "GPSGate report not found in database");
                return FMSResponse<GpsFetchResultDto>.Failed("GPSGate report not found");
            }

            // Pre-load vehicle lookup dictionary from vehicle_provider_mappings table
            // GPSGate report returns the GPSGate device ID (e.g., "759") in the Vehicle column
            // This ID should match external_device_id in vehicle_provider_mappings
            // The table maps: external_device_id (GPSGate ID) -> vehicle_id (FMS ID)
            //
            // IMPORTANT: Join with vehicles table to ensure the mapped vehicle_id actually exists
            // This prevents FK constraint violations when inserting into gpsgate_report_entries
            var providerMappings = await _context.VehicleProviderMappings
                .Where(m => m.IsActive && !string.IsNullOrEmpty(m.ExternalDeviceId))
                .Join(
                    _context.Vehicles,
                    mapping => mapping.VehicleId,
                    vehicle => vehicle.VehicleId,
                    (mapping, vehicle) => new { mapping.ExternalDeviceId, mapping.VehicleId, mapping.DeviceName }
                )
                .ToListAsync(cancellationToken);

            // Primary lookup: GPSGate device ID (external_device_id) -> FMS vehicle_id
            var vehicleLookupByExternalId = providerMappings
                .Where(m => !string.IsNullOrEmpty(m.ExternalDeviceId))
                .GroupBy(m => m.ExternalDeviceId!.Trim())
                .ToDictionary(
                    g => g.Key,
                    g => g.First().VehicleId
                );

            // Secondary lookup (fallback): device_name -> FMS vehicle_id
            // In case GPSGate returns device names instead of IDs
            var vehicleLookupByName = providerMappings
                .Where(m => !string.IsNullOrEmpty(m.DeviceName))
                .GroupBy(m => m.DeviceName!.Trim().ToUpperInvariant())
                .ToDictionary(
                    g => g.Key,
                    g => g.First().VehicleId
                );

            _logger.LogInformation(
                "GPS fetch job {JobId}: Loaded {ByIdCount} vehicle provider mappings (verified against vehicles table). " +
                "External IDs: [{ExternalIds}]",
                request.JobId,
                vehicleLookupByExternalId.Count,
                string.Join(", ", vehicleLookupByExternalId.Keys.Take(20)));

            // Track unmapped vehicles (GPSGate vehicles not in vehicle_provider_mappings)
            var unmappedVehicles = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

            static DateTime NormalizeDispenseDate(DateTime refuelDate, TimeSpan? startTime)
            {
                // Some report payloads provide a date-only field plus a separate StartTime.
                // Normalize to a full timestamp so the same event is consistently identified.
                if (startTime.HasValue && refuelDate.TimeOfDay == TimeSpan.Zero)
                {
                    return refuelDate.Date.Add(startTime.Value);
                }

                return refuelDate;
            }

            static string BuildEventKey(int vehicleId, DateTime dispenseDate, TimeSpan? startTime)
            {
                // Use both dispenseDate (full timestamp) and startTime (when present) to avoid
                // collisions when dispenseDate is date-only in some payloads.
                return $"{vehicleId}|{dispenseDate:O}|{(startTime?.Ticks ?? 0)}";
            }

            // Preload existing entries in the requested period for mapped vehicles.
            // This prevents duplicates when the same date range is fetched multiple times.
            var mappedVehicleIds = providerMappings
                .Select(m => m.VehicleId)
                .Distinct()
                .ToList();

            var rangeStart = request.StartDate.Date;
            var rangeEndExclusive = request.EndDate.Date.AddDays(1);

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

                // Update progress every 10 records
                if (processedCount % 10 == 0)
                {
                    var saveProgress = 80 + (int)((processedCount / (double)refuelingData.Count) * 10);
                    await _progressService.SendProgress(
                        request.JobId,
                        "Saving Data",
                        saveProgress,
                        $"Saved {processedCount}/{refuelingData.Count} records...");
                }

                // Resolve VehicleId from GPSGate device ID using vehicle_provider_mappings table
                // GPSGate report returns device ID (e.g., "759") in the Vehicle column
                // We look up this ID in external_device_id to get the FMS vehicle_id
                //
                // IMPORTANT: Do NOT use dto.VehicleId - that's the raw GPSGate device ID parsed as int,
                // not the FMS vehicle ID. We must always look it up via vehicle_provider_mappings.
                int? vehicleId = null;
                if (!string.IsNullOrWhiteSpace(dto.Vehicle))
                {
                    var gpsGateVehicleId = dto.Vehicle.Trim();

                    // Primary lookup: Try external_device_id first (GPSGate device ID)
                    if (vehicleLookupByExternalId.TryGetValue(gpsGateVehicleId, out var lookupId))
                    {
                        vehicleId = lookupId;
                        _logger.LogDebug(
                            "GPS fetch job {JobId}: Resolved GPSGate ID '{GpsGateId}' to FMS vehicle {VehicleId} via external_device_id",
                            request.JobId, gpsGateVehicleId, vehicleId);
                    }
                    // Secondary lookup: Try device_name (fallback for name-based matching)
                    else if (vehicleLookupByName.TryGetValue(gpsGateVehicleId.ToUpperInvariant(), out lookupId))
                    {
                        vehicleId = lookupId;
                        _logger.LogDebug(
                            "GPS fetch job {JobId}: Resolved GPSGate device '{GpsGateId}' to FMS vehicle {VehicleId} via device_name",
                            request.JobId, gpsGateVehicleId, vehicleId);
                    }
                    else
                    {
                        // Track this GPSGate vehicle as unmapped
                        unmappedVehicles.Add(gpsGateVehicleId);
                        _logger.LogWarning(
                            "GPS fetch job {JobId}: GPSGate device ID '{GpsGateId}' has no mapping in vehicle_provider_mappings. " +
                            "Please go to Admin/Provider Configuration to create a mapping.",
                            request.JobId, gpsGateVehicleId);
                    }
                }

                // Skip records without vehicle ID (unmapped vehicles)
                if (!vehicleId.HasValue)
                {
                    _logger.LogWarning(
                        "GPS fetch job {JobId}: Skipping record - GPSGate device ID '{GpsGateId}' is not mapped in vehicle_provider_mappings. " +
                        "Go to Admin/Provider Configuration to associate this GPSGate device with an FMS vehicle.",
                        request.JobId, dto.Vehicle ?? "NULL");
                    result.UnmappedVehiclesCount++;
                    continue;
                }

                var refuelDate = dto.RefuelingDateTime ?? dto.Date ?? DateTime.MinValue;
                if (refuelDate == DateTime.MinValue)
                {
                    _logger.LogWarning("GPS fetch job {JobId}: Skipping record without valid date", request.JobId);
                    result.DuplicatesSkipped++;
                    continue;
                }

                var dispenseDate = NormalizeDispenseDate(refuelDate, dto.StartTime);
                var eventKey = BuildEventKey(vehicleId.Value, dispenseDate, dto.StartTime);

                // If the same event appears multiple times within the same fetched payload, skip duplicates.
                if (!processedKeysThisRun.Add(eventKey))
                {
                    result.DuplicatesSkipped++;
                    continue;
                }

                // Check if record already exists for this vehicle and timestamp (across all reports)
                // to avoid inserting duplicates when fetching overlapping ranges multiple times.
                existingEntriesByKey.TryGetValue(eventKey, out var existingEntry);

                if (existingEntry != null)
                {
                    // Update existing record
                    existingEntry.RefillVolume = dto.RefillVolume ?? 0;
                    existingEntry.FuelBefore = dto.FuelBefore;
                    existingEntry.FuelAfter = dto.FuelAfter;
                    existingEntry.StartTime = dto.StartTime;
                    existingEntry.Duration = dto.Duration;
                    existingEntry.ModifiedAt = DateTime.UtcNow;

                    // Keep linkage to the latest report run
                    if (existingEntry.ReportId != gpsGateReport.Id)
                    {
                        existingEntry.ReportId = gpsGateReport.Id;
                    }

                    result.RecordsUpdated++;
                }
                else
                {
                    // Create new record
                    // Note: ReportId refers to gpsgate_reports.Id (FK), not the GPSGate report type ID (212)
                    _logger.LogInformation(
                        "GPS fetch job {JobId}: Creating entry for GPSGate device '{GpsGateId}' -> FMS VehicleId {VehicleId}, Date {Date}",
                        request.JobId, dto.Vehicle, vehicleId.Value, refuelDate);

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

            // Final validation before save - log all pending entries
            var pendingEntries = _context.ChangeTracker.Entries<GpsGateReportEntry>()
                .Where(e => e.State == EntityState.Added)
                .Select(e => new { e.Entity.VehicleId, e.Entity.DispenseDate, GpsGateId = e.Entity.ReportId })
                .ToList();

            _logger.LogInformation(
                "GPS fetch job {JobId}: About to save {Count} new entries. VehicleIds: [{VehicleIds}]",
                request.JobId,
                pendingEntries.Count,
                string.Join(", ", pendingEntries.Select(e => e.VehicleId).Distinct().OrderBy(id => id)));

            await _context.SaveChangesAsync(cancellationToken);

            // Populate unmapped vehicles list for the response
            result.UnmappedVehicles = unmappedVehicles.OrderBy(v => v).ToList();
            result.FetchEndTime = DateTime.UtcNow;

            _logger.LogInformation(
                "GPS fetch job {JobId} completed: {New} new, {Updated} updated, {Skipped} skipped, {Unmapped} unmapped vehicles",
                request.JobId, result.NewRecordsSaved, result.RecordsUpdated, result.DuplicatesSkipped, result.UnmappedVehiclesCount);

            if (unmappedVehicles.Count > 0)
            {
                _logger.LogWarning(
                    "GPS fetch job {JobId}: {Count} GPSGate vehicles have no mapping: [{Vehicles}]. " +
                    "Please go to Admin/Provider Configuration to create mappings.",
                    request.JobId, unmappedVehicles.Count, string.Join(", ", unmappedVehicles.Take(10)));
            }

            // Step 6: Complete (100%)
            await _progressService.SendCompleted(request.JobId, result);

            // Build message with unmapped vehicle warning if applicable
            var successMessage = $"Successfully fetched {result.TotalRecordsFetched} records: " +
                $"{result.NewRecordsSaved} new, {result.RecordsUpdated} updated, " +
                $"{result.DuplicatesSkipped} skipped";

            if (result.UnmappedVehiclesCount > 0)
            {
                successMessage += $". WARNING: {result.UnmappedVehiclesCount} records skipped due to {unmappedVehicles.Count} unmapped GPSGate vehicles. " +
                    $"Go to Admin/Provider Configuration to create mappings for: {string.Join(", ", unmappedVehicles.Take(5))}" +
                    (unmappedVehicles.Count > 5 ? $" and {unmappedVehicles.Count - 5} more" : "");
            }

            return FMSResponse<GpsFetchResultDto>.Success(result, successMessage);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "GPS fetch job {JobId} failed with exception", request.JobId);
            await _progressService.SendError(request.JobId, ex.Message);
            return FMSResponse<GpsFetchResultDto>.Failed($"GPS fetch failed: {ex.Message}");
        }
    }
}
