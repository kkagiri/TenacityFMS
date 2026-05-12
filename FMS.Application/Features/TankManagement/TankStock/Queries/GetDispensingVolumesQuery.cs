using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Domain.Entities;
using FMS.Domain.Entities.enums;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FMS.Application.Queries.Database.FMSQuery.TankStock;

/// <summary>
/// Query to get dispensing volume records with optional filtering
/// </summary>
public record GetDispensingVolumesQuery(int? SiteId = null, int? TankId = null, string? RecordedBy = null, DateTime? StartDate = null, DateTime? EndDate = null) : IRequest<List<DispensingVolumeRecord>>;

public class GetDispensingVolumesQueryHandler : IRequestHandler<GetDispensingVolumesQuery, List<DispensingVolumeRecord>>
{
    private readonly GpsdataContext _context;

    public GetDispensingVolumesQueryHandler(GpsdataContext context)
    {
        _context = context;
    }

    public async Task<List<DispensingVolumeRecord>> Handle(GetDispensingVolumesQuery request, CancellationToken cancellationToken)
    {
        var query = _context.Tankstocks
            .Include(ts => ts.Tank)
            .Include(ts => ts.Site)
            .Include(ts => ts.RecordedByNavigation)
            .Where(ts => ts.EntryType == VolumeChangeReasonEnum.Dispensing);

        // Apply filters
        if (request.SiteId.HasValue)
        {
            query = query.Where(ts => ts.SiteId == request.SiteId.Value);
        }

        if (request.TankId.HasValue)
        {
            query = query.Where(ts => ts.TankId == request.TankId.Value);
        }

        if (!string.IsNullOrWhiteSpace(request.RecordedBy))
        {
            query = query.Where(ts => ts.RecordedBy == request.RecordedBy);
        }

        if (request.StartDate.HasValue)
        {
            query = query.Where(ts => ts.EntryDate >= request.StartDate.Value);
        }

        if (request.EndDate.HasValue)
        {
            query = query.Where(ts => ts.EntryDate <= request.EndDate.Value);
        }

        var results = await query
            .OrderByDescending(ts => ts.EntryDate)
            .ThenByDescending(ts => ts.EntryId)
            .Select(ts => new DispensingVolumeRecord
            {
                EntryId = ts.EntryId,
                TankId = ts.TankId,
                TankName = ts.Tank.Name,
                SiteId = ts.SiteId,
                SiteName = ts.Site.Name,
                DispensedVolume = ts.ManualAmount ?? 0,
                EntryDate = ts.EntryDate,
                RecordedBy = ts.RecordedBy,
                RecordedByName = ts.RecordedByNavigation.UserName,
                Notes = ts.Comment,
                CreatedOn = ts.CreatedOn
            })
            .ToListAsync(cancellationToken);

        return results;
    }
}

/// <summary>
/// DTO for dispensing volume record
/// </summary>
public class DispensingVolumeRecord
{
    public int EntryId { get; set; }
    public int TankId { get; set; }
    public string TankName { get; set; } = string.Empty;
    public int SiteId { get; set; }
    public string SiteName { get; set; } = string.Empty;
    public decimal DispensedVolume { get; set; }
    public DateTime EntryDate { get; set; }
    public string RecordedBy { get; set; } = string.Empty;
    public string RecordedByName { get; set; } = string.Empty;
    public string? Notes { get; set; }
    public DateTime CreatedOn { get; set; }
}
