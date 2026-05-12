/**
 * File: DeleteFuelRefillCommand.cs
 * Purpose: Defines the request to delete a fuel refill through the tank volume history workflow.
 * Dependencies: MediatR, FMSResponseMessage.
 * Last Modified: 2026-03-11
 *
 * Key Types:
 * - DeleteFuelRefillCommand: Contains the fuel refill id, acting user, and optional reason.
 */
using FMS.Application.Common;
using MediatR;

namespace FMS.Application.Features.TankManagement.FuelRefill.Commands;

public record DeleteFuelRefillCommand(
    int FuelRefillId,
    string DeletedBy,
    string? DeletionReason = null
) : IRequest<FMSResponseMessage>;