/**
 * File: ApproveTransferCommand.cs
 * Purpose: Command contract for approving a pending vehicle transfer.
 * Dependencies: FMSResponse, VehicleTransferDTO
 * Last Modified: 2026-02-26
 *
 * Key Components:
 * - ApproveTransferCommand: Carries transfer id, approver info, and creator notification email.
 */
using FMS.Application.Common;
using FMS.Application.Features.VehicleTransfer.DTOs;
using MediatR;

namespace FMS.Application.Features.VehicleTransfer.Commands;

public record ApproveTransferCommand(
    int TransferId,
    string? UserId,
    string? ApproverName,
    string? CreatorEmail
) : IRequest<FMSResponse<VehicleTransferDTO>>;
