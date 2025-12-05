using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.FuelAudit.DTOs;
using FMS.Application.Features.FuelAudit.Services;
using MediatR;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.FuelAudit.Queries
{
    /// <summary>
    /// Query to get fuel positions for multiple vehicles with date range (opening and closing).
    /// Convenience endpoint for audit workflows.
    /// </summary>
    public record GetFleetAuditPeriodQuery(
        List<int> VehicleIds,
        DateTime StartDate,
        DateTime EndDate,
        int? AuditId = null,
        int? RequestedBy = null)
        : IRequest<FMSResponse<FleetAuditPeriodResponseDTO>>;

    /// <summary>
    /// Handler for GetFleetAuditPeriodQuery
    /// </summary>
    public class GetFleetAuditPeriodQueryHandler
        : IRequestHandler<GetFleetAuditPeriodQuery, FMSResponse<FleetAuditPeriodResponseDTO>>
    {
        private readonly IFuelAuditGPSService _fuelAuditGPSService;
        private readonly ILogger<GetFleetAuditPeriodQueryHandler> _logger;

        public GetFleetAuditPeriodQueryHandler(
            IFuelAuditGPSService fuelAuditGPSService,
            ILogger<GetFleetAuditPeriodQueryHandler> logger)
        {
            _fuelAuditGPSService = fuelAuditGPSService ?? throw new ArgumentNullException(nameof(fuelAuditGPSService));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        public async Task<FMSResponse<FleetAuditPeriodResponseDTO>> Handle(
            GetFleetAuditPeriodQuery request,
            CancellationToken cancellationToken)
        {
            try
            {
                if (request.VehicleIds == null || request.VehicleIds.Count == 0)
                {
                    return FMSResponse<FleetAuditPeriodResponseDTO>.Failed("At least one vehicle ID is required");
                }

                if (request.StartDate == default || request.EndDate == default)
                {
                    return FMSResponse<FleetAuditPeriodResponseDTO>.Failed("Start date and end date are required");
                }

                _logger.LogInformation("Getting fleet audit period fuel for {Count} vehicles from {StartDate} to {EndDate}",
                    request.VehicleIds.Count, request.StartDate.ToString("yyyy-MM-dd"), request.EndDate.ToString("yyyy-MM-dd"));

                // Get opening positions
                var openingRequest = new FleetFuelPositionRequestDTO
                {
                    VehicleIds = request.VehicleIds,
                    Date = request.StartDate,
                    ReadingType = "opening",
                    AuditId = request.AuditId,
                    RequestedBy = request.RequestedBy
                };

                var openingResult = await _fuelAuditGPSService.GetFleetFuelAtDateAsync(openingRequest, cancellationToken);

                // Get closing positions
                var closingRequest = new FleetFuelPositionRequestDTO
                {
                    VehicleIds = request.VehicleIds,
                    Date = request.EndDate,
                    ReadingType = "closing",
                    AuditId = request.AuditId,
                    RequestedBy = request.RequestedBy
                };

                var closingResult = await _fuelAuditGPSService.GetFleetFuelAtDateAsync(closingRequest, cancellationToken);

                if (!openingResult.IsSuccess || !closingResult.IsSuccess)
                {
                    var errorMessage = "Error fetching audit period data";
                    var details = new
                    {
                        OpeningError = openingResult.IsSuccess ? (string?)null : openingResult.Message,
                        ClosingError = closingResult.IsSuccess ? (string?)null : closingResult.Message
                    };

                    _logger.LogWarning("Failed to fetch audit period data: {@Details}", details);
                    return FMSResponse<FleetAuditPeriodResponseDTO>.Failed(errorMessage);
                }

                var response = new FleetAuditPeriodResponseDTO
                {
                    StartDate = request.StartDate,
                    EndDate = request.EndDate,
                    TotalVehicles = request.VehicleIds.Count,
                    Opening = openingResult.Data!,
                    Closing = closingResult.Data!
                };

                _logger.LogInformation("Successfully retrieved fleet audit period fuel for {Count} vehicles", request.VehicleIds.Count);

                return FMSResponse<FleetAuditPeriodResponseDTO>.Success(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting fleet audit period fuel");
                return FMSResponse<FleetAuditPeriodResponseDTO>.Failed($"Error: {ex.Message}");
            }
        }
    }

    /// <summary>
    /// Response DTO for fleet audit period fuel positions
    /// </summary>
    public class FleetAuditPeriodResponseDTO
    {
        /// <summary>Audit period start date</summary>
        public DateTime StartDate { get; set; }

        /// <summary>Audit period end date</summary>
        public DateTime EndDate { get; set; }

        /// <summary>Total vehicles processed</summary>
        public int TotalVehicles { get; set; }

        /// <summary>Opening fuel positions</summary>
        public FleetFuelPositionResponseDTO Opening { get; set; } = new();

        /// <summary>Closing fuel positions</summary>
        public FleetFuelPositionResponseDTO Closing { get; set; } = new();
    }
}
