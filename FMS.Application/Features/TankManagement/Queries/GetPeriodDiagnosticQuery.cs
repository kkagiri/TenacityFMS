using System;
using FMS.Application.Common;
using FMS.Application.Features.TankManagement.DTOs;
using MediatR;

namespace FMS.Application.Features.TankManagement.Queries;

/// <summary>
/// Query to get complete diagnostic data for a specific tank period
/// Returns all data sources (TankStock, TankVolumeHistory, TankTransfers) for analysis
/// </summary>
public class GetPeriodDiagnosticQuery : IRequest<FMSResponse<PeriodDiagnosticResult>>
{
    public int TankId { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }

    /// <summary>
    /// Include all transaction types in analysis (Adjustments, Reconciliations, etc.)
    /// </summary>
    public bool IncludeAllTransactionTypes { get; set; } = true;

    /// <summary>
    /// Include deleted/soft-deleted records for troubleshooting
    /// </summary>
    public bool IncludeDeletedRecords { get; set; } = false;
}