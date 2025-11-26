using System;
using FMS.Application.Common;
using FMS.Application.Features.TankManagement.DTOs;
using MediatR;

namespace FMS.Application.Features.TankManagement.Queries;

/// <summary>
/// Query to analyze transfer-based reconciliation for a tank
/// Tracks ST->FT transfers with variance detection per period
/// </summary>
public record GetTransferReconciliationAnalysisQuery(
    int TankId,
    DateTime StartDate,
    DateTime EndDate,
    bool IncludeTransferDetails = false
) : IRequest<FMSResponse<TransferReconciliationResult>>;
