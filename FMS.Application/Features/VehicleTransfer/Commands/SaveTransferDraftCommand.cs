/**
 * File: SaveTransferDraftCommand.cs
 * Purpose: Command contract for creating/updating vehicle transfer drafts.
 * Dependencies: FMSResponse, VehicleTransferDTO, SaveTransferDraftDTO
 * Last Modified: 2026-02-26
 *
 * Key Components:
 * - SaveTransferDraftCommand: Carries draft payload from API/controller to handler.
 */
using FMS.Application.Common;
using FMS.Application.Features.VehicleTransfer.DTOs;
using MediatR;

namespace FMS.Application.Features.VehicleTransfer.Commands;

public record SaveTransferDraftCommand(
    SaveTransferDraftDTO DraftDTO
) : IRequest<FMSResponse<VehicleTransferDTO>>;
