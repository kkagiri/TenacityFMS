/**
 * File: ConfirmReceiptCommand.cs
 * Purpose: Command contract for confirming vehicle receipt at destination (InTransit → Completed).
 * Dependencies: FMSResponse, VehicleTransferDTO
 * Last Modified: 2026-02-27
 *
 * Key Components:
 * - ConfirmReceiptCommand: Carries transfer id, receiver user id, and optional remarks.
 */
using FMS.Application.Common;
using FMS.Application.Features.VehicleTransfer.DTOs;
using MediatR;

namespace FMS.Application.Features.VehicleTransfer.Commands;

public record ConfirmReceiptCommand(
    int TransferId,
    string? UserId,
    string? Remarks
) : IRequest<FMSResponse<VehicleTransferDTO>>;
