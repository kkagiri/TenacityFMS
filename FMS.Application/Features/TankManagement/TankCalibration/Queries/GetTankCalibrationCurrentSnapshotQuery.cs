/**
 * File: GetTankCalibrationCurrentSnapshotQuery.cs
 * Purpose: Retrieves the latest locally stored tank calibration snapshot for a chart type.
 * Dependencies: MediatR, FMSResponse, ITankCalibrationStorageService
 * Last Modified: 2026-03-23
 *
 * Key Behaviors:
 * - Validates chart type names.
 * - Returns the newest snapshot or a failed response when history is empty.
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
    public record GetTankCalibrationCurrentSnapshotQuery(int TankId, string ChartType) : IRequest<FMSResponse<TankCalibrationSnapshotDto>>;

    public class GetTankCalibrationCurrentSnapshotQueryHandler : IRequestHandler<GetTankCalibrationCurrentSnapshotQuery, FMSResponse<TankCalibrationSnapshotDto>>
    {
        private readonly ITankCalibrationStorageService _storageService;

        public GetTankCalibrationCurrentSnapshotQueryHandler(ITankCalibrationStorageService storageService)
        {
            _storageService = storageService;
        }

        public async Task<FMSResponse<TankCalibrationSnapshotDto>> Handle(GetTankCalibrationCurrentSnapshotQuery request, CancellationToken cancellationToken)
        {
            if (!TankCalibrationChartTypes.IsSupported(request.ChartType))
            {
                return FMSResponse<TankCalibrationSnapshotDto>.ValidationFailed(new List<string> { "Unsupported calibration chart type." });
            }

            var snapshot = await _storageService.GetLatestSnapshotAsync(request.TankId, TankCalibrationChartTypes.Normalize(request.ChartType), cancellationToken);
            if (snapshot == null)
            {
                return FMSResponse<TankCalibrationSnapshotDto>.Failed("No local calibration snapshot found for the selected chart type.");
            }

            return FMSResponse<TankCalibrationSnapshotDto>.Success(snapshot);
        }
    }
}