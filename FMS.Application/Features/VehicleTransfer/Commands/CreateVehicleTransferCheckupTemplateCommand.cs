/**
 * File: CreateVehicleTransferCheckupTemplateCommand.cs
 * Purpose: Command contract for creating a new vehicle transfer checkup template row.
 * Dependencies: MediatR, FMSResponse, DTOs
 * Last Modified: 2026-02-26
 *
 * Key Components:
 * - CreateVehicleTransferCheckupTemplateCommand: Carries row payload and user context.
 */
using FMS.Application.Common;
using FMS.Application.Features.VehicleTransfer.DTOs;
using MediatR;

namespace FMS.Application.Features.VehicleTransfer.Commands;

public record CreateVehicleTransferCheckupTemplateCommand(
    UpsertVehicleTransferCheckupTemplateDTO Item,
    string? UserId
) : IRequest<FMSResponse<VehicleTransferCheckupTemplateItemDTO>>;
