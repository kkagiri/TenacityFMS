/**
 * File: GetTankCalibrationSnapshotByIdQuery.cs
 * Purpose: Retrieves a specific local tank calibration snapshot by identifier.
 * Dependencies: MediatR, FMSResponse, ITankCalibrationStorageService
 * Last Modified: 2026-03-23
 *
 * Key Behaviors:
 * - Loads a full snapshot including stored records.
 * - Returns a failed response when the requested snapshot does not exist.
 */
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.TankManagement.TankCalibration.DTOs;
using FMS.Application.Features.TankManagement.TankCalibration.Services;
using MediatR;

namespace FMS.Application.Features.TankManagement.TankCalibration.Queries
{
    public record GetTankCalibrationSnapshotByIdQuery(long SnapshotId) : IRequest<FMSResponse<TankCalibrationSnapshotDto>>;

    public class GetTankCalibrationSnapshotByIdQueryHandler : IRequestHandler<GetTankCalibrationSnapshotByIdQuery, FMSResponse<TankCalibrationSnapshotDto>>
    {
        private readonly ITankCalibrationStorageService _storageService;

        public GetTankCalibrationSnapshotByIdQueryHandler(ITankCalibrationStorageService storageService)
        {
            _storageService = storageService;
        }

        public async Task<FMSResponse<TankCalibrationSnapshotDto>> Handle(GetTankCalibrationSnapshotByIdQuery request, CancellationToken cancellationToken)
        {
            var snapshot = await _storageService.GetSnapshotByIdAsync(request.SnapshotId, cancellationToken);
            if (snapshot == null)
            {
                return FMSResponse<TankCalibrationSnapshotDto>.Failed("Tank calibration snapshot was not found.");
            }

            return FMSResponse<TankCalibrationSnapshotDto>.Success(snapshot);
        }
    }
}