/**
 * File: DeleteTankVolumeHistoryCommand.cs
 * Purpose: Deletes tank volume history rows by ID or legacy filter parameters.
 * Dependencies: MediatR, FMSResponseMessage, delete coordinator service.
 * Last Modified: 2026-03-27
 *
 * Key Functions:
 * - DeleteTankVolumeHistoryCommand: Carries legacy single-delete and filter-delete parameters.
 * - DeleteTankVolumeHistoryCommandHandler: Delegates delete execution to the shared coordinator service.
 */
using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.TankManagement.Services;
using MediatR;

namespace FMS.Application.Command.DatabaseCommand.TankVolumeHistoryCommand
{
    public record DeleteTankVolumeHistoryCommand(
        string DeletedBy,
        int? Id = null,
        int? TankId = null,
        string? ReferenceType = null,
        int? ReferenceId = null,
        DateTime? FromDate = null,
        DateTime? ToDate = null,
        bool ValidateFutureRecords = true) : IRequest<FMSResponseMessage>;

    public class DeleteTankVolumeHistoryCommandHandler : IRequestHandler<DeleteTankVolumeHistoryCommand, FMSResponseMessage>
    {
        private readonly ITankVolumeHistoryDeleteCoordinatorService _deleteCoordinatorService;

        public DeleteTankVolumeHistoryCommandHandler(ITankVolumeHistoryDeleteCoordinatorService deleteCoordinatorService)
        {
            _deleteCoordinatorService = deleteCoordinatorService;
        }

        public async Task<FMSResponseMessage> Handle(DeleteTankVolumeHistoryCommand request, CancellationToken cancellationToken)
        {
            return await _deleteCoordinatorService.DeleteByFilterAsync(request, cancellationToken);
        }
    }
}