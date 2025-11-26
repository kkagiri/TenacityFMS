using System;
using FMS.Application.Common;
using FMS.Application.Features.TankManagement.DTOs;
using MediatR;

namespace FMS.Application.Features.TankManagement.Queries;

/// <summary>
/// Query to calculate expected stock for validation before saving
/// </summary>
public record GetExpectedStockQuery(
    int TankId,
    DateTime Timestamp,
    string StockType
) : IRequest<FMSResponse<ExpectedStockResult>>;
