/**
 * File: DeleteVehicleTransferCheckupTemplateCommand.cs
 * Purpose: Command contract for soft-removing a checkup template row from active use.
 * Dependencies: MediatR, FMSResponse
 * Last Modified: 2026-02-26
 *
 * Key Components:
 * - DeleteVehicleTransferCheckupTemplateCommand: Carries target id and user context.
 */
using FMS.Application.Common;
using MediatR;

namespace FMS.Application.Features.VehicleTransfer.Commands;

public record DeleteVehicleTransferCheckupTemplateCommand(
    int Id,
    string? UserId
) : IRequest<FMSResponse<bool>>;
