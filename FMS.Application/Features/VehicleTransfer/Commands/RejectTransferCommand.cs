/**
 * File: RejectTransferCommand.cs
 * Purpose: Command contract for rejecting a pending vehicle transfer.
 * Dependencies: FMSResponse, VehicleTransferDTO
 * Last Modified: 2026-02-26
 *
 * Key Components:
 * - RejectTransferCommand: Carries transfer id, reason, and creator notification email.
 */
using FMS.Application.Common;
using FMS.Application.Features.VehicleTransfer.DTOs;
using MediatR;

namespace FMS.Application.Features.VehicleTransfer.Commands;

public record RejectTransferCommand(
    int TransferId,
    string? UserId,
    string RejectionReason,
    string? CreatorEmail
) : IRequest<FMSResponse<VehicleTransferDTO>>;
