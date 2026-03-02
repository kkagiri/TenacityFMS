/**
 * File: DispatchTransferCommand.cs
 * Purpose: Command contract for dispatching an approved vehicle transfer (Approved → InTransit).
 * Dependencies: FMSResponse, VehicleTransferDTO
 * Last Modified: 2026-03-02
 *
 * Key Components:
 * - DispatchTransferCommand: Carries transfer id and sender user id.
 */
using FMS.Application.Common;
using FMS.Application.Features.VehicleTransfer.DTOs;
using MediatR;

namespace FMS.Application.Features.VehicleTransfer.Commands;

public record DispatchTransferCommand(
    int TransferId,
    string? UserId
) : IRequest<FMSResponse<VehicleTransferDTO>>;
