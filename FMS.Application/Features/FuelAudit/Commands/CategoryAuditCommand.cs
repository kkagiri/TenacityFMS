using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.FuelAudit.DTOs;
using FMS.Application.Features.FuelAudit.Queries;
using FMS.Application.Features.FuelAudit.Services;
using FMS.Application.Queries.Database.FMSQuery.Consumption;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.FuelAudit.Commands
{
    /// <summary>
    /// Command to perform category-aware fuel audit for multiple vehicles.
    /// Routes each vehicle to the appropriate data source based on category.
    /// </summary>
    public record CategoryAuditCommand(CategoryAuditRequestDTO Request)
        : IRequest<FMSResponse<CategoryAuditResponseDTO>>;

    /// <summary>
    /// Handler for CategoryAuditCommand
    /// </summary>
    public class CategoryAuditCommandHandler
        : IRequestHandler<CategoryAuditCommand, FMSResponse<CategoryAuditResponseDTO>>
    {
        private readonly IFuelAuditGPSService _fuelAuditGPSService;
        private readonly IFullTankEstimationService _fullTankEstimationService;
        private readonly IMediator _mediator;
        private readonly GpsdataContext _context;
        private readonly ILogger<CategoryAuditCommandHandler> _logger;

        public CategoryAuditCommandHandler(
            IFuelAuditGPSService fuelAuditGPSService,
            IFullTankEstimationService fullTankEstimationService,
            IMediator mediator,
            GpsdataContext context,
            ILogger<CategoryAuditCommandHandler> logger)
        {
            _fuelAuditGPSService = fuelAuditGPSService ?? throw new ArgumentNullException(nameof(fuelAuditGPSService));
            _fullTankEstimationService = fullTankEstimationService ?? throw new ArgumentNullException(nameof(fullTankEstimationService));
            _mediator = mediator ?? throw new ArgumentNullException(nameof(mediator));
            _context = context ?? throw new ArgumentNullException(nameof(context));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        public async Task<FMSResponse<CategoryAuditResponseDTO>> Handle(
            CategoryAuditCommand request,
            CancellationToken cancellationToken)
        {
            try
            {
                var auditRequest = request.Request;

                // Validate request
                if (auditRequest?.Vehicles == null || auditRequest.Vehicles.Count == 0)
                {
                    return FMSResponse<CategoryAuditResponseDTO>.Failed("At least one vehicle is required");
                }

                if (auditRequest.StartDate == default || auditRequest.EndDate == default)
                {
                    return FMSResponse<CategoryAuditResponseDTO>.Failed("Start date and end date are required");
                }

                _logger.LogInformation(
                    "Processing category-aware audit for {Count} vehicles from {StartDate} to {EndDate}",
                    auditRequest.Vehicles.Count,
                    auditRequest.StartDate.ToString("yyyy-MM-dd"),
                    auditRequest.EndDate.ToString("yyyy-MM-dd"));

                var response = new CategoryAuditResponseDTO
                {
                    StartDate = auditRequest.StartDate,
                    EndDate = auditRequest.EndDate,
                    TotalVehicles = auditRequest.Vehicles.Count
                };

                // Group vehicles by category
                var vehiclesByCategory = auditRequest.Vehicles.GroupBy(v => v.Category).ToList();

                foreach (var categoryGroup in vehiclesByCategory)
                {
                    var categoryResult = await ProcessCategoryAsync(
                        categoryGroup.Key,
                        categoryGroup.ToList(),
                        auditRequest.StartDate,
                        auditRequest.EndDate,
                        auditRequest.AuditId,
                        auditRequest.RequestedBy,
                        cancellationToken);

                    response.CategoryResults.Add(categoryResult);
                }

                // Calculate summary
                CalculateCategorySummary(response);

                _logger.LogInformation(
                    "Category audit complete: GPS={GPS}, Estimated={Est}, RefillOnly={Refill}, NoData={NoData}",
                    response.Summary.VehiclesWithGPS,
                    response.Summary.VehiclesWithEstimate,
                    response.Summary.VehiclesWithRefillOnly,
                    response.Summary.VehiclesWithNoData);

                return FMSResponse<CategoryAuditResponseDTO>.Success(response, "Category audit completed successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing category audit");
                return FMSResponse<CategoryAuditResponseDTO>.Failed($"Error: {ex.Message}");
            }
        }

        private async Task<CategoryResultDTO> ProcessCategoryAsync(
            int category,
            List<CategoryVehicleDTO> vehicles,
            DateTime startDate,
            DateTime endDate,
            int? auditId,
            int? requestedBy,
            CancellationToken cancellationToken)
        {
            var result = new CategoryResultDTO
            {
                Category = category,
                CategoryName = GetCategoryName(category),
                VehicleCount = vehicles.Count,
                DataSource = GetCategoryDataSource(category)
            };

            try
            {
                switch (category)
                {
                    case 1: // Site GPS Fleet - Use REST API
                        await ProcessGPSCategoryAsync(result, vehicles, startDate, endDate, auditId, requestedBy, cancellationToken);
                        break;

                    case 2: // Site Full Tank - Use Estimation
                        await ProcessFullTankCategoryAsync(result, vehicles, startDate, endDate, cancellationToken);
                        break;

                    case 3: // Site Equipment - Refill data only
                        ProcessEquipmentCategory(result, vehicles, startDate, endDate);
                        break;

                    case 4: // Cross-Site Company - Use SOAP data from gpsgate_report_entries
                        await ProcessCrossSiteCategoryAsync(result, vehicles, startDate, endDate, cancellationToken);
                        break;

                    case 5: // External Non-Company - Refill data only
                        ProcessExternalCategory(result, vehicles, startDate, endDate);
                        break;

                    default:
                        result.ErrorMessage = $"Unknown category: {category}";
                        break;
                }

                result.AllProcessed = result.Vehicles.All(v => v.IsAuditable);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing category {Category}", category);
                result.ErrorMessage = ex.Message;
            }

            return result;
        }

        private async Task ProcessGPSCategoryAsync(
            CategoryResultDTO result,
            List<CategoryVehicleDTO> vehicles,
            DateTime startDate,
            DateTime endDate,
            int? auditId,
            int? requestedBy,
            CancellationToken cancellationToken)
        {
            var vehicleIds = vehicles.Select(v => v.VehicleId).ToList();

            // Get opening positions
            var openingRequest = new FleetFuelPositionRequestDTO
            {
                VehicleIds = vehicleIds,
                Date = startDate,
                ReadingType = "opening",
                AuditId = auditId,
                RequestedBy = requestedBy
            };
            var openingResult = await _fuelAuditGPSService.GetFleetFuelAtDateAsync(openingRequest, cancellationToken);

            // Get closing positions
            var closingRequest = new FleetFuelPositionRequestDTO
            {
                VehicleIds = vehicleIds,
                Date = endDate,
                ReadingType = "closing",
                AuditId = auditId,
                RequestedBy = requestedBy
            };
            var closingResult = await _fuelAuditGPSService.GetFleetFuelAtDateAsync(closingRequest, cancellationToken);

            // Fetch GPS refill events
            var gpsRefillEventsByVehicle = new Dictionary<int, List<GpsRefillEventResultDTO>>();
            try
            {
                var gpsRefillEntries = await _context.GpsGateReportEntries
                    .AsNoTracking()
                    .Where(e => vehicleIds.Contains(e.VehicleId))
                    .Where(e => e.DispenseDate >= startDate && e.DispenseDate <= endDate)
                    .Where(e => !e.IsDeleted)
                    .OrderBy(e => e.DispenseDate)
                    .ToListAsync(cancellationToken);

                foreach (var entry in gpsRefillEntries)
                {
                    if (!gpsRefillEventsByVehicle.ContainsKey(entry.VehicleId))
                    {
                        gpsRefillEventsByVehicle[entry.VehicleId] = new List<GpsRefillEventResultDTO>();
                    }
                    gpsRefillEventsByVehicle[entry.VehicleId].Add(new GpsRefillEventResultDTO
                    {
                        EntryId = entry.Id,
                        RefillDate = entry.DispenseDate,
                        StartTime = entry.StartTime,
                        Duration = entry.Duration,
                        FuelBefore = entry.FuelBefore,
                        FuelAfter = entry.FuelAfter,
                        GpsRefillVolume = entry.RefillVolume,
                        IsAuditSiteRefill = true
                    });
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to fetch GPS refill entries for Category 1 vehicles");
            }

            // Fetch GPS-measured consumption
            var gpsConsumptionByVehicle = new Dictionary<int, decimal>();
            foreach (var vehicleId in vehicleIds)
            {
                try
                {
                    var consumptionQuery = new GetHistoryConsumptionByVehicleQuery
                    {
                        VehicleId = vehicleId,
                        StartDate = startDate,
                        EndDate = endDate
                    };
                    var consumptionData = await _mediator.Send(consumptionQuery);
                    var totalGpsConsumption = consumptionData?.Sum(c => c.TotalFuel ?? 0) ?? 0;
                    gpsConsumptionByVehicle[vehicleId] = totalGpsConsumption;
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to fetch GPS consumption for vehicle {VehicleId}", vehicleId);
                    gpsConsumptionByVehicle[vehicleId] = 0;
                }
            }

            const decimal VEHICLE_VARIANCE_THRESHOLD = 5.0m;
            const decimal CONSUMPTION_VARIANCE_THRESHOLD = 10.0m;

            foreach (var vehicle in vehicles)
            {
                var opening = openingResult.Data?.VehiclePositions
                    .FirstOrDefault(p => p.VehicleId == vehicle.VehicleId);
                var closing = closingResult.Data?.VehiclePositions
                    .FirstOrDefault(p => p.VehicleId == vehicle.VehicleId);

                var vehicleResult = new VehicleFuelAuditResultDTO
                {
                    VehicleId = vehicle.VehicleId,
                    Category = vehicle.Category,
                    TotalFuelRefilled = vehicle.TotalFuelRefilled,
                    DataSource = "GPS_REST",
                    Confidence = "HIGH"
                };

                if (opening != null)
                {
                    vehicleResult.OpeningFuelLevel = opening.FuelLevel;
                    vehicleResult.OpeningTimestamp = opening.ReadingTimestamp;
                    vehicleResult.OpeningDataQuality = opening.DataQuality;
                    vehicleResult.OpeningDataQualityReason = opening.DataQualityReason;
                    vehicleResult.OpeningDaysFromRequested = opening.DaysFromRequestedDate;
                    vehicleResult.OpeningActualDataDate = opening.ActualDataDate;
                    vehicleResult.OpeningWasOnline = opening.WasOnline;
                    vehicleResult.VehicleName = opening.VehicleName;
                }

                if (closing != null)
                {
                    vehicleResult.ClosingFuelLevel = closing.FuelLevel;
                    vehicleResult.ClosingTimestamp = closing.ReadingTimestamp;
                    vehicleResult.ClosingDataQuality = closing.DataQuality;
                    vehicleResult.ClosingDataQualityReason = closing.DataQualityReason;
                    vehicleResult.ClosingDaysFromRequested = closing.DaysFromRequestedDate;
                    vehicleResult.ClosingActualDataDate = closing.ActualDataDate;
                    vehicleResult.ClosingWasOnline = closing.WasOnline;

                    if (string.IsNullOrEmpty(vehicleResult.VehicleName))
                        vehicleResult.VehicleName = closing.VehicleName;
                }

                var openingSource = opening?.DataQuality.ToString() ?? "Unavailable";
                var closingSource = closing?.DataQuality.ToString() ?? "Unavailable";
                vehicleResult.DataSourceSummary = $"Opening: {openingSource}, Closing: {closingSource}";

                gpsConsumptionByVehicle.TryGetValue(vehicle.VehicleId, out var gpsConsumption);
                vehicleResult.GpsMeasuredConsumption = gpsConsumption;

                if (vehicleResult.OpeningFuelLevel.HasValue && vehicleResult.ClosingFuelLevel.HasValue)
                {
                    vehicleResult.CalculatedConsumption =
                        vehicleResult.OpeningFuelLevel.Value
                        + vehicleResult.TotalFuelRefilled
                        - vehicleResult.ClosingFuelLevel.Value;

                    if (gpsConsumption > 0)
                    {
                        vehicleResult.ConsumptionVariance = vehicleResult.CalculatedConsumption.Value - gpsConsumption;
                    }

                    if (gpsConsumption > 0)
                    {
                        var expectedClosing = vehicleResult.OpeningFuelLevel.Value
                            + vehicleResult.TotalFuelRefilled
                            - gpsConsumption;
                        vehicleResult.VehicleVariance = vehicleResult.ClosingFuelLevel.Value - expectedClosing;
                    }
                }

                if (vehicleResult.VehicleVariance.HasValue &&
                    Math.Abs(vehicleResult.VehicleVariance.Value) > VEHICLE_VARIANCE_THRESHOLD)
                {
                    vehicleResult.HasVarianceFlag = true;
                    vehicleResult.VarianceFlagMessage = $"Vehicle variance ({vehicleResult.VehicleVariance:F1}L) exceeds {VEHICLE_VARIANCE_THRESHOLD}L threshold";
                }
                else if (vehicleResult.ConsumptionVariance.HasValue &&
                         Math.Abs(vehicleResult.ConsumptionVariance.Value) > CONSUMPTION_VARIANCE_THRESHOLD)
                {
                    vehicleResult.HasVarianceFlag = true;
                    vehicleResult.VarianceFlagMessage = $"Consumption variance ({vehicleResult.ConsumptionVariance:F1}L) exceeds {CONSUMPTION_VARIANCE_THRESHOLD}L threshold";
                }

                vehicleResult.IsAuditable = vehicleResult.OpeningFuelLevel.HasValue && vehicleResult.ClosingFuelLevel.HasValue;

                if (gpsRefillEventsByVehicle.TryGetValue(vehicle.VehicleId, out var gpsEvents))
                {
                    vehicleResult.GpsRefillEvents = gpsEvents;
                }

                result.Vehicles.Add(vehicleResult);
            }
        }

        private async Task ProcessFullTankCategoryAsync(
            CategoryResultDTO result,
            List<CategoryVehicleDTO> vehicles,
            DateTime startDate,
            DateTime endDate,
            CancellationToken cancellationToken)
        {
            var estimationRequests = vehicles.Select(v => new FullTankEstimationRequestDTO
            {
                VehicleId = v.VehicleId,
                VehicleName = "",
                StartDate = startDate,
                EndDate = endDate,
                FuelTankCapacity = v.FuelTankCapacity,
                AverageEfficiency = v.AverageEfficiency,
                IsKmL = v.IsKmL,
                IsFullTankPolicy = v.IsFullTankPolicy
            }).ToList();

            var estimationResult = await _fullTankEstimationService.EstimateBatchAsync(estimationRequests, cancellationToken);

            if (estimationResult.IsSuccess && estimationResult.Data != null)
            {
                foreach (var estimate in estimationResult.Data)
                {
                    var vehicle = vehicles.FirstOrDefault(v => v.VehicleId == estimate.VehicleId);

                    var vehicleResult = new VehicleFuelAuditResultDTO
                    {
                        VehicleId = estimate.VehicleId,
                        VehicleName = estimate.VehicleName,
                        Category = 2,
                        OpeningFuelLevel = estimate.EstimatedOpeningLevel,
                        OpeningTimestamp = estimate.OpeningReferenceDate,
                        OpeningDataQuality = estimate.OpeningDataQuality,
                        OpeningDataQualityReason = estimate.OpeningDetails,
                        ClosingFuelLevel = estimate.EstimatedClosingLevel,
                        ClosingTimestamp = estimate.ClosingReferenceDate,
                        ClosingDataQuality = estimate.ClosingDataQuality,
                        ClosingDataQualityReason = estimate.ClosingDetails,
                        TotalFuelRefilled = estimate.TotalFuelRefilled,
                        CalculatedConsumption = estimate.CalculatedConsumption,
                        DataSource = "Estimated",
                        Confidence = estimate.Confidence,
                        IsAuditable = estimate.IsReliable
                    };

                    result.Vehicles.Add(vehicleResult);
                }
            }
        }

        private async Task ProcessCrossSiteCategoryAsync(
            CategoryResultDTO result,
            List<CategoryVehicleDTO> vehicles,
            DateTime startDate,
            DateTime endDate,
            CancellationToken cancellationToken)
        {
            var vehicleIds = vehicles.Select(v => v.VehicleId).ToList();

            var query = new GetCrossSiteGpsDataQuery(vehicleIds, startDate, endDate);
            var queryResult = await _mediator.Send(query, cancellationToken);

            if (queryResult.IsSuccess && queryResult.Data != null)
            {
                foreach (var gpsData in queryResult.Data)
                {
                    var vehicle = vehicles.FirstOrDefault(v => v.VehicleId == gpsData.VehicleId);

                    var vehicleResult = new VehicleFuelAuditResultDTO
                    {
                        VehicleId = gpsData.VehicleId,
                        VehicleName = gpsData.VehicleName ?? vehicle?.VehicleName ?? $"Vehicle {gpsData.VehicleId}",
                        Category = 4,
                        OpeningFuelLevel = gpsData.OpeningFuelLevel,
                        OpeningTimestamp = gpsData.FirstReadingTime,
                        OpeningDataQuality = gpsData.DataQuality,
                        OpeningDataQualityReason = gpsData.HasCompleteData
                            ? "FuelBefore from audit site refill (SOAP Report 212)"
                            : "Incomplete data",
                        ClosingFuelLevel = gpsData.ClosingFuelLevel,
                        ClosingTimestamp = gpsData.LastReadingTime,
                        ClosingDataQuality = gpsData.DataQuality,
                        ClosingDataQualityReason = gpsData.HasCompleteData
                            ? "FuelBefore from next refill (SOAP Report 212)"
                            : "Incomplete data",
                        TotalFuelRefilled = vehicle?.TotalFuelRefilled ?? gpsData.TotalFuelRefilled,
                        CalculatedConsumption = gpsData.CalculatedConsumption,
                        GpsMeasuredConsumption = gpsData.CalculatedConsumption,
                        DataSource = "GPS_SOAP",
                        Confidence = gpsData.Confidence,
                        IsAuditable = gpsData.HasCompleteData,
                        GpsRefillEvents = gpsData.RefillEvents?.Select(e => new GpsRefillEventResultDTO
                        {
                            EntryId = e.EntryId,
                            RefillDate = e.RefillDate,
                            StartTime = e.StartTime,
                            Duration = e.Duration,
                            FuelBefore = e.FuelBefore,
                            FuelAfter = e.FuelAfter,
                            GpsRefillVolume = e.RefillVolume,
                            IsAuditSiteRefill = e.IsAuditSiteRefill
                        }).ToList()
                    };

                    vehicleResult.DataSourceSummary = $"Opening: FuelBefore@RefillSite, Closing: FuelBefore@NextRefill";

                    if (gpsData.Warnings?.Any() == true)
                    {
                        vehicleResult.OpeningDataQualityReason += $" ({string.Join(", ", gpsData.Warnings)})";
                    }

                    result.Vehicles.Add(vehicleResult);
                }
            }
            else
            {
                foreach (var vehicle in vehicles)
                {
                    var vehicleResult = new VehicleFuelAuditResultDTO
                    {
                        VehicleId = vehicle.VehicleId,
                        VehicleName = vehicle.VehicleName ?? $"Vehicle {vehicle.VehicleId}",
                        Category = 4,
                        TotalFuelRefilled = vehicle.TotalFuelRefilled,
                        OpeningDataQuality = FuelDataQuality.Unavailable,
                        OpeningDataQualityReason = queryResult.Message ?? "Cross-site GPS data not available. Run GPS fetch first.",
                        ClosingDataQuality = FuelDataQuality.Unavailable,
                        ClosingDataQualityReason = queryResult.Message ?? "Cross-site GPS data not available. Run GPS fetch first.",
                        DataSource = "GPS_SOAP",
                        Confidence = "LOW",
                        IsAuditable = false
                    };

                    result.Vehicles.Add(vehicleResult);
                }
            }
        }

        private void ProcessEquipmentCategory(
            CategoryResultDTO result,
            List<CategoryVehicleDTO> vehicles,
            DateTime startDate,
            DateTime endDate)
        {
            foreach (var vehicle in vehicles)
            {
                var vehicleResult = new VehicleFuelAuditResultDTO
                {
                    VehicleId = vehicle.VehicleId,
                    Category = 3,
                    TotalFuelRefilled = vehicle.TotalFuelRefilled,
                    OpeningDataQuality = FuelDataQuality.Unavailable,
                    OpeningDataQualityReason = "Equipment without GPS - cannot track opening fuel level",
                    ClosingDataQuality = FuelDataQuality.Unavailable,
                    ClosingDataQualityReason = "Equipment without GPS - cannot track closing fuel level",
                    DataSource = "FuelRefill",
                    Confidence = "LOW",
                    IsAuditable = false
                };

                result.Vehicles.Add(vehicleResult);
            }
        }

        private void ProcessExternalCategory(
            CategoryResultDTO result,
            List<CategoryVehicleDTO> vehicles,
            DateTime startDate,
            DateTime endDate)
        {
            foreach (var vehicle in vehicles)
            {
                var vehicleResult = new VehicleFuelAuditResultDTO
                {
                    VehicleId = vehicle.VehicleId,
                    Category = 5,
                    TotalFuelRefilled = vehicle.TotalFuelRefilled,
                    ExternalFuel = vehicle.TotalFuelRefilled,
                    OpeningDataQuality = FuelDataQuality.NoSensor,
                    OpeningDataQualityReason = "External vehicle - opening stock not tracked",
                    ClosingDataQuality = FuelDataQuality.NoSensor,
                    ClosingDataQualityReason = "External vehicle - closing stock not tracked",
                    DataSource = "FuelRefill",
                    Confidence = "ACCOUNTED",
                    IsAuditable = true
                };

                result.Vehicles.Add(vehicleResult);
            }
        }

        private string GetCategoryName(int category) => category switch
        {
            1 => "Site GPS Fleet",
            2 => "Site Full Tank",
            3 => "Site Equipment",
            4 => "Cross-Site Company",
            5 => "External Non-Company",
            _ => "Unknown"
        };

        private string GetCategoryDataSource(int category) => category switch
        {
            1 => "GPS_REST",
            2 => "Estimated",
            3 => "FuelRefill",
            4 => "GPS_SOAP",
            5 => "FuelRefill",
            _ => "Unknown"
        };

        private void CalculateCategorySummary(CategoryAuditResponseDTO response)
        {
            var allVehicles = response.CategoryResults.SelectMany(c => c.Vehicles).ToList();

            response.Summary = new CategorySummaryDTO
            {
                VehiclesWithGPS = allVehicles.Count(v => v.DataSource == "GPS_REST" && v.OpeningFuelLevel.HasValue),
                VehiclesWithEstimate = allVehicles.Count(v => v.DataSource == "Estimated" && v.OpeningFuelLevel.HasValue),
                VehiclesWithRefillOnly = allVehicles.Count(v => v.DataSource == "FuelRefill"),
                VehiclesWithNoData = allVehicles.Count(v =>
                    v.OpeningDataQuality == FuelDataQuality.Unavailable &&
                    v.ClosingDataQuality == FuelDataQuality.Unavailable),
                TotalOpeningFuel = allVehicles.Where(v => v.OpeningFuelLevel.HasValue).Sum(v => v.OpeningFuelLevel),
                TotalClosingFuel = allVehicles.Where(v => v.ClosingFuelLevel.HasValue).Sum(v => v.ClosingFuelLevel),
                TotalFuelRefilled = allVehicles.Sum(v => v.TotalFuelRefilled),
                TotalCalculatedConsumption = allVehicles.Where(v => v.CalculatedConsumption.HasValue).Sum(v => v.CalculatedConsumption),
                TotalGpsMeasuredConsumption = allVehicles.Where(v => v.GpsMeasuredConsumption.HasValue).Sum(v => v.GpsMeasuredConsumption),
                TotalConsumptionVariance = allVehicles.Where(v => v.ConsumptionVariance.HasValue).Sum(v => v.ConsumptionVariance),
                TotalVehicleVariance = allVehicles.Where(v => v.VehicleVariance.HasValue).Sum(v => v.VehicleVariance),
                VehiclesWithVarianceFlag = allVehicles.Count(v => v.HasVarianceFlag)
            };

            foreach (var category in response.CategoryResults)
            {
                var auditable = category.Vehicles.Count(v => v.IsAuditable);
                var total = category.VehicleCount;
                response.Summary.DataQualityByCategory[category.Category] = $"{auditable}/{total} auditable";

                var categoryVariance = category.Vehicles
                    .Where(v => v.VehicleVariance.HasValue)
                    .Sum(v => v.VehicleVariance);
                response.Summary.VarianceByCategory[category.Category] = categoryVariance;
            }
        }
    }
}
