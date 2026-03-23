/**
 * File: GetTankCalibrationHistoryQuery.cs
 * Purpose: Retrieves paged local history rows for tank calibration snapshots.
 * Dependencies: MediatR, FMSPagedResponse, ITankCalibrationStorageService
 * Last Modified: 2026-03-23
 *
 * Key Behaviors:
 * - Supports optional chart-type filtering.
 * - Returns pagination metadata for the calibration history panel.
 */
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.TankManagement.TankCalibration.DTOs;
using FMS.Application.Features.TankManagement.TankCalibration.Services;
using MediatR;

namespace FMS.Application.Features.TankManagement.TankCalibration.Queries
{
    public record GetTankCalibrationHistoryQuery(
        int TankId,
        string? ChartType,
        int PageNumber = 1,
        int PageSize = 20) : IRequest<FMSPagedResponse<List<TankCalibrationSnapshotHistoryItemDto>>>;

    public class GetTankCalibrationHistoryQueryHandler : IRequestHandler<GetTankCalibrationHistoryQuery, FMSPagedResponse<List<TankCalibrationSnapshotHistoryItemDto>>>
    {
        private readonly ITankCalibrationStorageService _storageService;

        public GetTankCalibrationHistoryQueryHandler(ITankCalibrationStorageService storageService)
        {
            _storageService = storageService;
        }

        public async Task<FMSPagedResponse<List<TankCalibrationSnapshotHistoryItemDto>>> Handle(GetTankCalibrationHistoryQuery request, CancellationToken cancellationToken)
        {
            if (!string.IsNullOrWhiteSpace(request.ChartType) && !TankCalibrationChartTypes.IsSupported(request.ChartType))
            {
                return new FMSPagedResponse<List<TankCalibrationSnapshotHistoryItemDto>>
                {
                    IsSuccess = false,
                    Message = "Unsupported calibration chart type.",
                    StatusCode = 400,
                    ErrorType = ErrorType.Validation,
                    Data = new List<TankCalibrationSnapshotHistoryItemDto>(),
                    Pagination = new PaginationMetadata
                    {
                        PageNumber = request.PageNumber,
                        PageSize = request.PageSize,
                        TotalCount = 0
                    }
                };
            }

            var normalizedChartType = string.IsNullOrWhiteSpace(request.ChartType)
                ? null
                : TankCalibrationChartTypes.Normalize(request.ChartType);

            var (items, totalCount) = await _storageService.GetHistoryAsync(
                request.TankId,
                normalizedChartType,
                request.PageNumber,
                request.PageSize,
                cancellationToken);

            return FMSPagedResponse<List<TankCalibrationSnapshotHistoryItemDto>>.Success(
                new List<TankCalibrationSnapshotHistoryItemDto>(items),
                request.PageNumber,
                request.PageSize,
                totalCount,
                "Tank calibration history retrieved successfully.");
        }
    }
}