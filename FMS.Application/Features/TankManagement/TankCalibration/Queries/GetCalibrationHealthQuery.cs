/**
 * File: GetCalibrationHealthQuery.cs
 * Purpose: CQRS query that returns a comprehensive calibration health summary for a tank,
 *          combining sync status and dispensed-vs-measured variance analysis.
 * Dependencies: MediatR, ICalibrationAnalysisService, FMSResponse
 * Last Modified: 2026-03-23
 *
 * Key Behaviors:
 * - Delegates to ICalibrationAnalysisService for all heavy computation.
 * - Returns FMSResponse<CalibrationHealthSummaryDto>.
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
    public record GetCalibrationHealthQuery(int TankId) : IRequest<FMSResponse<CalibrationHealthSummaryDto>>;

    public class GetCalibrationHealthQueryHandler : IRequestHandler<GetCalibrationHealthQuery, FMSResponse<CalibrationHealthSummaryDto>>
    {
        private readonly ICalibrationAnalysisService _analysisService;

        public GetCalibrationHealthQueryHandler(ICalibrationAnalysisService analysisService)
        {
            _analysisService = analysisService;
        }

        public async Task<FMSResponse<CalibrationHealthSummaryDto>> Handle(GetCalibrationHealthQuery request, CancellationToken cancellationToken)
        {
            if (request.TankId <= 0)
            {
                return FMSResponse<CalibrationHealthSummaryDto>.ValidationFailed(new List<string> { "TankId must be a positive integer." });
            }

            var summary = await _analysisService.GetHealthSummaryAsync(request.TankId, cancellationToken);
            return FMSResponse<CalibrationHealthSummaryDto>.Success(summary);
        }
    }
}
