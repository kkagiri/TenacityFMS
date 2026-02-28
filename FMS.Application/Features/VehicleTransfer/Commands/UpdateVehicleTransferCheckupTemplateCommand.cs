/**
 * File: UpdateVehicleTransferCheckupTemplateCommand.cs
 * Purpose: Command contract for updating an existing vehicle transfer checkup template row.
 * Dependencies: MediatR, FMSResponse, DTOs
 * Last Modified: 2026-02-26
 *
 * Key Components:
 * - UpdateVehicleTransferCheckupTemplateCommand: Carries target id, payload, and user context.
 */
using FMS.Application.Common;
using FMS.Application.Features.VehicleTransfer.DTOs;
using MediatR;

namespace FMS.Application.Features.VehicleTransfer.Commands;

public record UpdateVehicleTransferCheckupTemplateCommand(
    int Id,
    UpsertVehicleTransferCheckupTemplateDTO Item,
    string? UserId
) : IRequest<FMSResponse<VehicleTransferCheckupTemplateItemDTO>>;
