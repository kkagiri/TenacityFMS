/**
 * File: ClearFileTrackerLogsCommand.cs
 * Purpose: MediatR command + handler to delete file tracker log records with optional filters.
 * Dependencies: MediatR, GpsdataContext, FMSResponse
 * Last Modified: 2026-03-06
 *
 * Key Functions:
 * - Handle: Deletes matching FuelImportFileTracker records, returns count of deleted records
 */
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.FuelImport.Commands;

/// <summary>
/// Command to clear/delete file tracker log records.
/// Always excludes records with status "Processing" to avoid disrupting active imports.
/// </summary>
public class ClearFileTrackerLogsCommand : IRequest<FMSResponse<ClearFileTrackerLogsResult>>
{
    /// <summary>Optional: only delete records with this status (Completed, Failed, Pending, Skipped)</summary>
    public string? Status { get; set; }

    /// <summary>Optional: only delete records updated on or after this date</summary>
    public DateTime? DateFrom { get; set; }

    /// <summary>Optional: only delete records updated on or before this date</summary>
    public DateTime? DateTo { get; set; }
}

public class ClearFileTrackerLogsResult
{
    public int DeletedCount { get; set; }
}

public class ClearFileTrackerLogsCommandHandler
    : IRequestHandler<ClearFileTrackerLogsCommand, FMSResponse<ClearFileTrackerLogsResult>>
{
    private readonly GpsdataContext _context;
    private readonly ILogger<ClearFileTrackerLogsCommandHandler> _logger;

    public ClearFileTrackerLogsCommandHandler(GpsdataContext context, ILogger<ClearFileTrackerLogsCommandHandler> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<FMSResponse<ClearFileTrackerLogsResult>> Handle(
        ClearFileTrackerLogsCommand request, CancellationToken cancellationToken)
    {
        var query = _context.FuelImportFileTrackers.AsQueryable();

        // Always exclude "Processing" records to avoid disrupting active imports
        query = query.Where(t => t.Status != "Processing");

        if (!string.IsNullOrWhiteSpace(request.Status))
            query = query.Where(t => t.Status == request.Status);

        if (request.DateFrom.HasValue)
            query = query.Where(t => t.UpdatedAt >= request.DateFrom.Value);

        if (request.DateTo.HasValue)
        {
            var dateTo = request.DateTo.Value.Date.AddDays(1);
            query = query.Where(t => t.UpdatedAt < dateTo);
        }

        var records = await query.ToListAsync(cancellationToken);
        var count = records.Count;

        if (count > 0)
        {
            _context.FuelImportFileTrackers.RemoveRange(records);
            await _context.SaveChangesAsync(cancellationToken);
        }

        _logger.LogInformation("Cleared {Count} file tracker logs. Filters — Status: {Status}, DateFrom: {DateFrom}, DateTo: {DateTo}",
            count, request.Status ?? "all", request.DateFrom?.ToString("yyyy-MM-dd") ?? "none", request.DateTo?.ToString("yyyy-MM-dd") ?? "none");

        return FMSResponse<ClearFileTrackerLogsResult>.Success(new ClearFileTrackerLogsResult { DeletedCount = count });
    }
}
