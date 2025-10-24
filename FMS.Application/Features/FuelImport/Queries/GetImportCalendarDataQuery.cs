using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.FuelImport.DTOs;
using FMS.Domain.Entities.Features.FuelImport;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.FuelImport.Queries
{
    /// <summary>
    /// Query to get import calendar data for visualization
    /// </summary>
    public class GetImportCalendarDataQuery : IRequest<FMSResponse<List<ImportCalendarDataDTO>>>
    {
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public int? SiteId { get; set; } // Optional filter by site
    }

    public class GetImportCalendarDataQueryHandler : IRequestHandler<GetImportCalendarDataQuery, FMSResponse<List<ImportCalendarDataDTO>>>
    {
        private readonly GpsdataContext _context;
        private readonly ILogger<GetImportCalendarDataQueryHandler> _logger;

        public GetImportCalendarDataQueryHandler(GpsdataContext context, ILogger<GetImportCalendarDataQueryHandler> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<FMSResponse<List<ImportCalendarDataDTO>>> Handle(GetImportCalendarDataQuery request, CancellationToken cancellationToken)
        {
            try
            {
                _logger.LogInformation("Fetching import calendar data from {StartDate} to {EndDate}", request.StartDate, request.EndDate);

                // Get active sites
                var activeSitesQuery = _context.Sites.Where(s => s.IsActive);

                if (request.SiteId.HasValue)
                {
                    activeSitesQuery = activeSitesQuery.Where(s => s.Id == request.SiteId.Value);
                }

                var activeSites = await activeSitesQuery.ToListAsync(cancellationToken);

                // Query vehicleconsumption to get actual imported data with report information
                var consumptionQuery = _context.Vehicleconsumptions
                    .Where(v => v.Date.Date >= request.StartDate.Date &&
                                v.Date.Date <= request.EndDate.Date &&
                                !string.IsNullOrEmpty(v.ReportId));

                if (request.SiteId.HasValue)
                {
                    consumptionQuery = consumptionQuery.Where(v => v.SiteId == request.SiteId.Value);
                }

                var consumptionData = await consumptionQuery
                    .Include(v => v.Site)
                    .Select(v => new
                    {
                        Date = v.Date.Date,
                        v.SiteId,
                        SiteName = v.Site.Name,
                        v.ReportId,
                        IsNightShift = v.IsNightShift == 1,
                        v.ModifiedDate
                    })
                    .ToListAsync(cancellationToken);

                // Get import log data for additional metadata
                var reportIds = consumptionData.Select(c => c.ReportId).Distinct().ToList();
                var importLogs = await _context.Set<FuelReportImportHistory>()
                    .Where(l => reportIds.Contains(l.ReportId))
                    .Include(l => l.User)
                    .ToDictionaryAsync(l => l.ReportId, cancellationToken);

                // Group by date and site
                var calendarData = consumptionData
                    .GroupBy(c => new { c.Date, c.SiteId })
                    .Select(g =>
                    {
                        var firstReport = g.First();
                        var reportId = firstReport.ReportId;
                        var importLog = importLogs.ContainsKey(reportId) ? importLogs[reportId] : null;

                        return new ImportCalendarDataDTO
                        {
                            Date = g.Key.Date,
                            SiteId = g.Key.SiteId,
                            SiteName = firstReport.SiteName,
                            HasDayShift = g.Any(c => !c.IsNightShift),
                            HasNightShift = g.Any(c => c.IsNightShift),
                            DayShiftRecordCount = g.Count(c => !c.IsNightShift),
                            NightShiftRecordCount = g.Count(c => c.IsNightShift),
                            TotalRecordCount = g.Count(),
                            Status = importLog?.Status ?? "Success",
                            LastImportTimestamp = importLog?.ImportDate ?? g.Max(c => c.ModifiedDate),
                            LastImportedBy = importLog?.User?.UserName ?? "Unknown",
                            ReportIds = g.Select(c => c.ReportId).Distinct().ToList()
                        };
                    })
                    .ToList();

                // Find missing dates/sites (active sites with no import data)
                var importedDateSiteCombos = calendarData.Select(c => new { c.Date, c.SiteId }).ToHashSet();

                // Generate all date-site combinations for active sites
                var dateRange = Enumerable.Range(0, (request.EndDate.Date - request.StartDate.Date).Days + 1)
                    .Select(d => request.StartDate.Date.AddDays(d))
                    .ToList();

                var missingSiteData = new List<ImportCalendarDataDTO>();

                foreach (var date in dateRange)
                {
                    foreach (var site in activeSites)
                    {
                        if (!importedDateSiteCombos.Contains(new { Date = date, SiteId = site.Id }))
                        {
                            missingSiteData.Add(new ImportCalendarDataDTO
                            {
                                Date = date,
                                SiteId = site.Id,
                                SiteName = site.Name,
                                HasDayShift = false,
                                HasNightShift = false,
                                DayShiftRecordCount = 0,
                                NightShiftRecordCount = 0,
                                TotalRecordCount = 0,
                                Status = "Missing",
                                LastImportTimestamp = null,
                                LastImportedBy = null,
                                ReportIds = new List<string>()
                            });
                        }
                    }
                }

                // Combine imported and missing data
                var allData = calendarData.Concat(missingSiteData).OrderBy(c => c.Date).ThenBy(c => c.SiteName).ToList();

                _logger.LogInformation("Fetched {Count} calendar entries ({Imported} imported, {Missing} missing)",
                    allData.Count, calendarData.Count, missingSiteData.Count);

                return FMSResponse<List<ImportCalendarDataDTO>>.Success(allData);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching import calendar data");
                return FMSResponse<List<ImportCalendarDataDTO>>.Failed("Failed to fetch import calendar data: " + ex.Message);
            }
        }
    }
}
