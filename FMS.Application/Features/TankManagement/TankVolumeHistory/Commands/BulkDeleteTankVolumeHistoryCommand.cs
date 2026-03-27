/**
 * File: BulkDeleteTankVolumeHistoryCommand.cs
 * Purpose: Commands for bulk validation and deletion of tank volume history rows.
 * Dependencies: MediatR, FMSResponse, bulk delete DTOs, delete coordinator service.
 * Last Modified: 2026-03-27
 *
 * Key Functions:
 * - ValidateBulkDeleteTankVolumeHistoryCommand: Requests bulk-delete validation for selected transaction IDs.
 * - BulkDeleteTankVolumeHistoryCommand: Executes atomic bulk deletion for validated transaction IDs.
 */
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.TankManagement.Services;
using FMS.Application.Features.TankManagement.TankVolumeHistory.DTOs;
using MediatR;

namespace FMS.Application.Command.DatabaseCommand.TankVolumeHistoryCommand
{
    public record ValidateBulkDeleteTankVolumeHistoryCommand(
        IReadOnlyCollection<int> TransactionIds,
        bool UserConfirmed = false) : IRequest<FMSResponse<BulkTankVolumeHistoryDeleteResultDto>>;

    public record BulkDeleteTankVolumeHistoryCommand(
        IReadOnlyCollection<int> TransactionIds,
        string DeletedBy,
        bool UserConfirmed = false) : IRequest<FMSResponse<BulkTankVolumeHistoryDeleteResultDto>>;

    public class ValidateBulkDeleteTankVolumeHistoryCommandHandler : IRequestHandler<ValidateBulkDeleteTankVolumeHistoryCommand, FMSResponse<BulkTankVolumeHistoryDeleteResultDto>>
    {
        private readonly ITankVolumeHistoryDeleteCoordinatorService _deleteCoordinatorService;

        public ValidateBulkDeleteTankVolumeHistoryCommandHandler(ITankVolumeHistoryDeleteCoordinatorService deleteCoordinatorService)
        {
            _deleteCoordinatorService = deleteCoordinatorService;
        }

        public async Task<FMSResponse<BulkTankVolumeHistoryDeleteResultDto>> Handle(ValidateBulkDeleteTankVolumeHistoryCommand request, CancellationToken cancellationToken)
        {
            return await _deleteCoordinatorService.ValidateBulkDeleteAsync(request.TransactionIds, request.UserConfirmed, cancellationToken);
        }
    }

    public class BulkDeleteTankVolumeHistoryCommandHandler : IRequestHandler<BulkDeleteTankVolumeHistoryCommand, FMSResponse<BulkTankVolumeHistoryDeleteResultDto>>
    {
        private readonly ITankVolumeHistoryDeleteCoordinatorService _deleteCoordinatorService;

        public BulkDeleteTankVolumeHistoryCommandHandler(ITankVolumeHistoryDeleteCoordinatorService deleteCoordinatorService)
        {
            _deleteCoordinatorService = deleteCoordinatorService;
        }

        public async Task<FMSResponse<BulkTankVolumeHistoryDeleteResultDto>> Handle(BulkDeleteTankVolumeHistoryCommand request, CancellationToken cancellationToken)
        {
            return await _deleteCoordinatorService.DeleteBulkAsync(request.TransactionIds, request.DeletedBy, request.UserConfirmed, cancellationToken);
        }
    }
}