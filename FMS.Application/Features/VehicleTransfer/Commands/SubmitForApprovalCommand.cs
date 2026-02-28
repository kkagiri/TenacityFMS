/**
 * File: SubmitForApprovalCommand.cs
 * Purpose: Command contract for moving a draft transfer to pending approval stage.
 * Dependencies: FMSResponse, VehicleTransferDTO
 * Last Modified: 2026-02-26
 *
 * Key Components:
 * - SubmitForApprovalCommand: Carries transfer id, caller metadata, and approval recipient details.
 */
using FMS.Application.Common;
using FMS.Application.Features.VehicleTransfer.DTOs;
using MediatR;

namespace FMS.Application.Features.VehicleTransfer.Commands;

public record SubmitForApprovalCommand(
    int TransferId,
    string? UserId,
    string WorkshopManagerEmail,
    string? WorkshopManagerName,
    string? ApprovalBaseUrl
) : IRequest<FMSResponse<VehicleTransferDTO>>;
