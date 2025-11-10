using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using FMS.Application.Features.TankManagement.TankVolumeHistory.DTOs;
using FMS.Application.Features.TankManagement.TankVolumeHistory.Queries;
using FMS.Domain.Entities;
using FMS.Domain.Entities.enums;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TankVolumeHistories = FMS.Domain.Entities.Features.TankStockManagement;


namespace FMS.Application.Features.TankManagement.TankVolumeHistory.Handlers
{
    public class GetTankVolumeHistoryByMonthQueryHandler : IRequestHandler<GetTankVolumeHistoryByMonthQuery, VolumeHistorySummaryDTO>
    {
        private readonly GpsdataContext _context;
        private readonly IMapper _mapper;
        private readonly ILogger<GetTankVolumeHistoryByMonthQueryHandler> _logger;

        public GetTankVolumeHistoryByMonthQueryHandler(
            GpsdataContext context,
            IMapper mapper,
            ILogger<GetTankVolumeHistoryByMonthQueryHandler> logger)
        {
            _context = context;
            _mapper = mapper;
            _logger = logger;
        }

        public async Task<VolumeHistorySummaryDTO> Handle(GetTankVolumeHistoryByMonthQuery request, CancellationToken cancellationToken)
        {
            try
            {
                var query = _context.TankVolumeHistories
                    .Include(tvh => tvh.Tank)
                    .ThenInclude(t => t.Site)
                    .Where(tvh => tvh.Timestamp >= request.StartDate && tvh.Timestamp <= request.EndDate);

                // Apply filters
                if (request.SiteIds?.Any() == true)
                    query = query.Where(tvh => request.SiteIds.Contains(tvh.Tank.SiteId));

                if (request.TankIds?.Any() == true)
                    query = query.Where(tvh => request.TankIds.Contains(tvh.TankId ?? 0));

                var data = await query.ToListAsync(cancellationToken);

                // Group by month
                var groupedData = data
                    .GroupBy(tvh => new
                    {
                        Year = tvh.Timestamp.Year,
                        Month = tvh.Timestamp.Month,
                        SiteId = tvh.Tank.SiteId,
                        SiteName = tvh.Tank.Site.Name ?? "Unknown",
                        TankId = tvh.TankId,
                        TankName = tvh.Tank.Name ?? "Unknown",
                        ChangeReason = tvh.ChangeReason
                    })
                    .Select(g => new TankVolumeReportDTO
                    {
                        SiteId = g.Key.SiteId,
                        SiteName = g.Key.SiteName,
                        TankId = g.Key.TankId ?? 0,
                        TankName = g.Key.TankName,
                        TimePeriod = $"{g.Key.Year}-{g.Key.Month:D2}",
                        PeriodStart = new DateTime(g.Key.Year, g.Key.Month, 1),
                        PeriodEnd = new DateTime(g.Key.Year, g.Key.Month, DateTime.DaysInMonth(g.Key.Year, g.Key.Month)),
                        ChangeReason = g.Key.ChangeReason,
                        ChangeReasonDisplay = g.Key.ChangeReason.ToString(),
                        TotalVolume = Math.Abs(g.Sum(x => x.VolumeChange ?? 0)),
                        TransactionCount = g.Count(),
                        AverageVolume = Math.Abs(g.Average(x => x.VolumeChange ?? 0)),
                        ReferenceType = g.FirstOrDefault()?.ReferenceType ?? ""
                    })
                    .OrderBy(x => x.PeriodStart)
                    .ThenBy(x => x.SiteName)
                    .ThenBy(x => x.TankName)
                    .ToList();

                // Calculate cumulative volumes if requested
                if (request.IncludeCumulative)
                {
                    var runningTotal = 0m;
                    foreach (var item in groupedData)
                    {
                        runningTotal += item.TotalVolume;
                        item.CumulativeVolume = runningTotal;
                    }
                }

                var summary = new PivotSummaryDTO
                {
                    TotalRecords = groupedData.Count,
                    GrandTotalVolume = groupedData.Sum(x => x.TotalVolume),
                    ReportGeneratedAt = DateTime.UtcNow,
                    ReportPeriod = $"{request.StartDate:yyyy-MM-dd} to {request.EndDate:yyyy-MM-dd}",
                    SitesIncluded = groupedData.Select(x => x.SiteName).Distinct().ToList(),
                    TanksIncluded = groupedData.Select(x => x.TankName).Distinct().ToList()
                };

                return new VolumeHistorySummaryDTO
                {
                    GroupBy = "Month",
                    StartDate = request.StartDate,
                    EndDate = request.EndDate,
                    Data = groupedData,
                    Summary = summary
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting tank volume history by month");
                throw;
            }
        }
    }

    public class GetTankVolumeHistoryByQuarterQueryHandler : IRequestHandler<GetTankVolumeHistoryByQuarterQuery, VolumeHistorySummaryDTO>
    {
        private readonly GpsdataContext _context;
        private readonly IMapper _mapper;
        private readonly ILogger<GetTankVolumeHistoryByQuarterQueryHandler> _logger;

        public GetTankVolumeHistoryByQuarterQueryHandler(
            GpsdataContext context,
            IMapper mapper,
            ILogger<GetTankVolumeHistoryByQuarterQueryHandler> logger)
        {
            _context = context;
            _mapper = mapper;
            _logger = logger;
        }

        public async Task<VolumeHistorySummaryDTO> Handle(GetTankVolumeHistoryByQuarterQuery request, CancellationToken cancellationToken)
        {
            try
            {
                var query = _context.TankVolumeHistories
                    .Include(tvh => tvh.Tank)
                    .ThenInclude(t => t.Site)
                    .Where(tvh => tvh.Timestamp >= request.StartDate && tvh.Timestamp <= request.EndDate);

                // Apply filters (same as month handler)
                if (request.SiteIds?.Any() == true)
                    query = query.Where(tvh => request.SiteIds.Contains(tvh.Tank.SiteId));

                if (request.TankIds?.Any() == true)
                    query = query.Where(tvh => request.TankIds.Contains(tvh.TankId ?? 0));

                var data = await query.ToListAsync(cancellationToken);

                // Group by quarter
                var groupedData = data
                    .GroupBy(tvh => new
                    {
                        Year = tvh.Timestamp.Year,
                        Quarter = (tvh.Timestamp.Month - 1) / 3 + 1,
                        SiteId = tvh.Tank.SiteId,
                        SiteName = tvh.Tank.Site.Name ?? "Unknown",
                        TankId = tvh.TankId,
                        TankName = tvh.Tank.Name ?? "Unknown",
                        ChangeReason = tvh.ChangeReason
                    })
                    .Select(g => new TankVolumeReportDTO
                    {
                        SiteId = g.Key.SiteId,
                        SiteName = g.Key.SiteName,
                        TankId = g.Key.TankId ?? 0,
                        TankName = g.Key.TankName,
                        TimePeriod = $"{g.Key.Year}-Q{g.Key.Quarter}",
                        PeriodStart = new DateTime(g.Key.Year, (g.Key.Quarter - 1) * 3 + 1, 1),
                        PeriodEnd = new DateTime(g.Key.Year, g.Key.Quarter * 3, DateTime.DaysInMonth(g.Key.Year, g.Key.Quarter * 3)),
                        ChangeReason = g.Key.ChangeReason,
                        ChangeReasonDisplay = g.Key.ChangeReason.ToString(),
                        TotalVolume = Math.Abs(g.Sum(x => x.VolumeChange ?? 0)),
                        TransactionCount = g.Count(),
                        AverageVolume = Math.Abs(g.Average(x => x.VolumeChange ?? 0)),
                        ReferenceType = g.FirstOrDefault()?.ReferenceType ?? ""
                    })
                    .OrderBy(x => x.PeriodStart)
                    .ThenBy(x => x.SiteName)
                    .ThenBy(x => x.TankName)
                    .ToList();

                // Calculate cumulative volumes if requested
                if (request.IncludeCumulative)
                {
                    var runningTotal = 0m;
                    foreach (var item in groupedData)
                    {
                        runningTotal += item.TotalVolume;
                        item.CumulativeVolume = runningTotal;
                    }
                }

                var summary = new PivotSummaryDTO
                {
                    TotalRecords = groupedData.Count,
                    GrandTotalVolume = groupedData.Sum(x => x.TotalVolume),
                    ReportGeneratedAt = DateTime.UtcNow,
                    ReportPeriod = $"{request.StartDate:yyyy-MM-dd} to {request.EndDate:yyyy-MM-dd}",
                    SitesIncluded = groupedData.Select(x => x.SiteName).Distinct().ToList(),
                    TanksIncluded = groupedData.Select(x => x.TankName).Distinct().ToList()
                };

                return new VolumeHistorySummaryDTO
                {
                    GroupBy = "Quarter",
                    StartDate = request.StartDate,
                    EndDate = request.EndDate,
                    Data = groupedData,
                    Summary = summary
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting tank volume history by quarter");
                throw;
            }
        }
    }

    public class GetTankVolumeHistoryByWeekQueryHandler : IRequestHandler<GetTankVolumeHistoryByWeekQuery, VolumeHistorySummaryDTO>
    {
        private readonly GpsdataContext _context;
        private readonly IMapper _mapper;
        private readonly ILogger<GetTankVolumeHistoryByWeekQueryHandler> _logger;

        public GetTankVolumeHistoryByWeekQueryHandler(
            GpsdataContext context,
            IMapper mapper,
            ILogger<GetTankVolumeHistoryByWeekQueryHandler> logger)
        {
            _context = context;
            _mapper = mapper;
            _logger = logger;
        }

        public async Task<VolumeHistorySummaryDTO> Handle(GetTankVolumeHistoryByWeekQuery request, CancellationToken cancellationToken)
        {
            try
            {
                var query = _context.TankVolumeHistories
                    .Include(tvh => tvh.Tank)
                    .ThenInclude(t => t.Site)
                    .Where(tvh => tvh.Timestamp >= request.StartDate && tvh.Timestamp <= request.EndDate);

                // Apply filters
                if (request.SiteIds?.Any() == true)
                    query = query.Where(tvh => request.SiteIds.Contains(tvh.Tank.SiteId));

                if (request.TankIds?.Any() == true)
                    query = query.Where(tvh => request.TankIds.Contains(tvh.TankId ?? 0));

                var data = await query.ToListAsync(cancellationToken);

                // Group by week
                var calendar = new GregorianCalendar();
                var groupedData = data
                    .GroupBy(tvh => new
                    {
                        Year = tvh.Timestamp.Year,
                        Week = calendar.GetWeekOfYear(tvh.Timestamp, CalendarWeekRule.FirstDay, DayOfWeek.Monday),
                        SiteId = tvh.Tank.SiteId,
                        SiteName = tvh.Tank.Site.Name ?? "Unknown",
                        TankId = tvh.TankId,
                        TankName = tvh.Tank.Name ?? "Unknown",
                        ChangeReason = tvh.ChangeReason
                    })
                    .Select(g => new TankVolumeReportDTO
                    {
                        SiteId = g.Key.SiteId,
                        SiteName = g.Key.SiteName,
                        TankId = g.Key.TankId ?? 0,
                        TankName = g.Key.TankName,
                        TimePeriod = $"{g.Key.Year}-W{g.Key.Week:D2}",
                        PeriodStart = GetFirstDateOfWeek(g.Key.Year, g.Key.Week),
                        PeriodEnd = GetFirstDateOfWeek(g.Key.Year, g.Key.Week).AddDays(6),
                        ChangeReason = g.Key.ChangeReason,
                        ChangeReasonDisplay = g.Key.ChangeReason.ToString(),
                        TotalVolume = Math.Abs(g.Sum(x => x.VolumeChange ?? 0)),
                        TransactionCount = g.Count(),
                        AverageVolume = Math.Abs(g.Average(x => x.VolumeChange ?? 0)),
                        ReferenceType = g.FirstOrDefault()?.ReferenceType ?? ""
                    })
                    .OrderBy(x => x.PeriodStart)
                    .ThenBy(x => x.SiteName)
                    .ThenBy(x => x.TankName)
                    .ToList();

                // Calculate cumulative volumes if requested
                if (request.IncludeCumulative)
                {
                    var runningTotal = 0m;
                    foreach (var item in groupedData)
                    {
                        runningTotal += item.TotalVolume;
                        item.CumulativeVolume = runningTotal;
                    }
                }

                var summary = new PivotSummaryDTO
                {
                    TotalRecords = groupedData.Count,
                    GrandTotalVolume = groupedData.Sum(x => x.TotalVolume),
                    ReportGeneratedAt = DateTime.UtcNow,
                    ReportPeriod = $"{request.StartDate:yyyy-MM-dd} to {request.EndDate:yyyy-MM-dd}",
                    SitesIncluded = groupedData.Select(x => x.SiteName).Distinct().ToList(),
                    TanksIncluded = groupedData.Select(x => x.TankName).Distinct().ToList()
                };

                return new VolumeHistorySummaryDTO
                {
                    GroupBy = "Week",
                    StartDate = request.StartDate,
                    EndDate = request.EndDate,
                    Data = groupedData,
                    Summary = summary
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting tank volume history by week");
                throw;
            }
        }

        private static DateTime GetFirstDateOfWeek(int year, int weekOfYear)
        {
            var jan1 = new DateTime(year, 1, 1);
            var daysOffset = DayOfWeek.Monday - jan1.DayOfWeek;
            var firstMonday = jan1.AddDays(daysOffset);
            var cal = new GregorianCalendar();
            var firstWeek = cal.GetWeekOfYear(jan1, CalendarWeekRule.FirstDay, DayOfWeek.Monday);
            var weekNum = weekOfYear;
            if (firstWeek <= 1)
            {
                weekNum -= 1;
            }
            return firstMonday.AddDays(weekNum * 7);
        }
    }

    public class GetTankVolumeHistoryCustomDateQueryHandler(
        GpsdataContext context,
        IMapper mapper,
        ILogger<GetTankVolumeHistoryCustomDateQueryHandler> logger) : IRequestHandler<GetTankVolumeHistoryCustomDateQuery, VolumeHistorySummaryDTO>
    {
        private readonly GpsdataContext _context = context;
        private readonly IMapper _mapper = mapper;
        private readonly ILogger<GetTankVolumeHistoryCustomDateQueryHandler> _logger = logger;

        public async Task<VolumeHistorySummaryDTO> Handle(GetTankVolumeHistoryCustomDateQuery request, CancellationToken cancellationToken)
        {
            try
            {
                var query = _context.TankVolumeHistories
                    .Include(tvh => tvh.Tank)
                    .ThenInclude(t => t.Site)
                    .Where(tvh => tvh.Timestamp >= request.StartDate && tvh.Timestamp <= request.EndDate);

                // Apply filters
                if (request.SiteIds?.Any() == true)
                    query = query.Where(tvh => request.SiteIds.Contains(tvh.Tank.SiteId));

                if (request.TankIds?.Any() == true)
                    query = query.Where(tvh => request.TankIds.Contains(tvh.TankId ?? 0));

                var data = await query.ToListAsync(cancellationToken);

                List<TankVolumeReportDTO> groupedData;
                switch (request.GroupByPeriod.ToLower())
                {
                    case "week":
                        groupedData = GroupByWeek(data);
                        break;
                    case "month":
                        groupedData = GroupByMonth(data);
                        break;
                    case "day":
                    default:
                        groupedData = GroupByDay(data);
                        break;
                }

                if (request.IncludeCumulative)
                {
                    CalculateCumulativeVolumes(groupedData);
                }

                var summary = new PivotSummaryDTO
                {
                    TotalRecords = groupedData.Count,
                    GrandTotalVolume = groupedData.Sum(x => x.TotalVolume),
                    ReportGeneratedAt = DateTime.UtcNow,
                    ReportPeriod = $"{request.StartDate:yyyy-MM-dd} to {request.EndDate:yyyy-MM-dd}",
                    SitesIncluded = groupedData.Select(x => x.SiteName).Distinct().ToList(),
                    TanksIncluded = groupedData.Select(x => x.TankName).Distinct().ToList()
                };

                return new VolumeHistorySummaryDTO
                {
                    GroupBy = request.GroupByPeriod,
                    StartDate = request.StartDate,
                    EndDate = request.EndDate,
                    Data = groupedData,
                    Summary = summary
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting tank volume history for custom date range");
                throw;
            }
        }

        private List<TankVolumeReportDTO> GroupByDay(List<TankVolumeHistories.TankVolumeHistory> data)
        {
            return data
                .GroupBy(tvh => new
                {
                    Date = tvh.Timestamp.Date,
                    SiteId = tvh.Tank.SiteId,
                    SiteName = tvh.Tank.Site.Name ?? "Unknown",
                    TankId = tvh.TankId,
                    TankName = tvh.Tank.Name ?? "Unknown",
                    ChangeReason = tvh.ChangeReason
                })
                .Select(g => new TankVolumeReportDTO
                {
                    SiteId = g.Key.SiteId,
                    SiteName = g.Key.SiteName,
                    TankId = g.Key.TankId ?? 0,
                    TankName = g.Key.TankName,
                    TimePeriod = g.Key.Date.ToString("yyyy-MM-dd"),
                    PeriodStart = g.Key.Date,
                    PeriodEnd = g.Key.Date.AddDays(1).AddTicks(-1),
                    ChangeReason = g.Key.ChangeReason,
                    ChangeReasonDisplay = g.Key.ChangeReason.ToString(),
                    TotalVolume = Math.Abs(g.Sum(x => x.VolumeChange ?? 0)),
                    TransactionCount = g.Count(),
                    AverageVolume = Math.Abs(g.Average(x => x.VolumeChange ?? 0)),
                    ReferenceType = g.FirstOrDefault()?.ReferenceType ?? ""
                })
                .OrderBy(x => x.PeriodStart)
                .ThenBy(x => x.SiteName)
                .ThenBy(x => x.TankName)
                .ToList();
        }

        private List<TankVolumeReportDTO> GroupByWeek(List<TankVolumeHistories.TankVolumeHistory> data)
        {
            var calendar = new GregorianCalendar();
            return data
                .GroupBy(tvh => new
                {
                    Year = tvh.Timestamp.Year,
                    Week = calendar.GetWeekOfYear(tvh.Timestamp, CalendarWeekRule.FirstDay, DayOfWeek.Monday),
                    SiteId = tvh.Tank.SiteId,
                    SiteName = tvh.Tank.Site.Name ?? "Unknown",
                    TankId = tvh.TankId,
                    TankName = tvh.Tank.Name ?? "Unknown",
                    ChangeReason = tvh.ChangeReason
                })
                .Select(g => new TankVolumeReportDTO
                {
                    SiteId = g.Key.SiteId,
                    SiteName = g.Key.SiteName,
                    TankId = g.Key.TankId ?? 0,
                    TankName = g.Key.TankName,
                    TimePeriod = $"{g.Key.Year}-W{g.Key.Week:D2}",
                    PeriodStart = GetFirstDateOfWeek(g.Key.Year, g.Key.Week),
                    PeriodEnd = GetFirstDateOfWeek(g.Key.Year, g.Key.Week).AddDays(6),
                    ChangeReason = g.Key.ChangeReason,
                    ChangeReasonDisplay = g.Key.ChangeReason.ToString(),
                    TotalVolume = Math.Abs(g.Sum(x => x.VolumeChange ?? 0)),
                    TransactionCount = g.Count(),
                    AverageVolume = Math.Abs(g.Average(x => x.VolumeChange ?? 0)),
                    ReferenceType = g.FirstOrDefault()?.ReferenceType ?? ""
                })
                .OrderBy(x => x.PeriodStart)
                .ThenBy(x => x.SiteName)
                .ThenBy(x => x.TankName)
                .ToList();
        }

        private List<TankVolumeReportDTO> GroupByMonth(List<TankVolumeHistories.TankVolumeHistory> data)
        {
            return data
                .GroupBy(tvh => new
                {
                    Year = tvh.Timestamp.Year,
                    Month = tvh.Timestamp.Month,
                    SiteId = tvh.Tank.SiteId,
                    SiteName = tvh.Tank.Site.Name ?? "Unknown",
                    TankId = tvh.TankId,
                    TankName = tvh.Tank.Name ?? "Unknown",
                    ChangeReason = tvh.ChangeReason
                })
                .Select(g => new TankVolumeReportDTO
                {
                    SiteId = g.Key.SiteId,
                    SiteName = g.Key.SiteName,
                    TankId = g.Key.TankId ?? 0,
                    TankName = g.Key.TankName,
                    TimePeriod = $"{g.Key.Year}-{g.Key.Month:D2}",
                    PeriodStart = new DateTime(g.Key.Year, g.Key.Month, 1),
                    PeriodEnd = new DateTime(g.Key.Year, g.Key.Month, DateTime.DaysInMonth(g.Key.Year, g.Key.Month)),
                    ChangeReason = g.Key.ChangeReason,
                    ChangeReasonDisplay = g.Key.ChangeReason.ToString(),
                    TotalVolume = Math.Abs(g.Sum(x => x.VolumeChange ?? 0)),
                    TransactionCount = g.Count(),
                    AverageVolume = Math.Abs(g.Average(x => x.VolumeChange ?? 0)),
                    ReferenceType = g.FirstOrDefault()?.ReferenceType ?? ""
                })
                .OrderBy(x => x.PeriodStart)
                .ThenBy(x => x.SiteName)
                .ThenBy(x => x.TankName)
                .ToList();
        }

        private void CalculateCumulativeVolumes(List<TankVolumeReportDTO> data)
        {
            decimal cumulativeVolume = 0;
            foreach (var item in data.OrderBy(x => x.PeriodStart))
            {
                cumulativeVolume += item.TotalVolume;
                item.CumulativeVolume = cumulativeVolume;
            }
        }

        private static DateTime GetFirstDateOfWeek(int year, int weekOfYear)
        {
            var jan1 = new DateTime(year, 1, 1);
            var daysOffset = DayOfWeek.Monday - jan1.DayOfWeek;
            var firstMonday = jan1.AddDays(daysOffset);
            var cal = new GregorianCalendar();
            var firstWeek = cal.GetWeekOfYear(jan1, CalendarWeekRule.FirstDay, DayOfWeek.Monday);
            var weekNum = weekOfYear;
            if (firstWeek <= 1)
            {
                weekNum -= 1;
            }
            return firstMonday.AddDays(weekNum * 7);
        }

    }

    public class GetPivotDataQueryHandler : IRequestHandler<GetPivotDataQuery, PivotDataDTO>
    {
        private readonly GpsdataContext _context;
        private readonly IMapper _mapper;
        private readonly ILogger<GetPivotDataQueryHandler> _logger;

        public GetPivotDataQueryHandler(
            GpsdataContext context,
            IMapper mapper,
            ILogger<GetPivotDataQueryHandler> logger)
        {
            _context = context;
            _mapper = mapper;
            _logger = logger;
        }

        public async Task<PivotDataDTO> Handle(GetPivotDataQuery request, CancellationToken cancellationToken)
        {
            try
            {
                List<TankVolumeReportDTO> groupedData;

                if (request.UseManualDispensing)
                {
                    // Use manual aggregate dispensing from TankStock
                    // Get all non-dispensing data from TankVolumeHistory
                    var volumeHistoryQuery = _context.TankVolumeHistories
                        .Include(tvh => tvh.Tank)
                        .ThenInclude(t => t.Site)
                        .Where(tvh => tvh.Timestamp >= request.StartDate && tvh.Timestamp <= request.EndDate)
                        .Where(tvh => tvh.ChangeReason != VolumeChangeReasonEnum.Dispensing
                                   && tvh.ChangeReason != VolumeChangeReasonEnum.AutomatedDispensing);

                    // Apply filters to volume history
                    if (request.SiteIds?.Any() == true)
                        volumeHistoryQuery = volumeHistoryQuery.Where(tvh => request.SiteIds.Contains(tvh.Tank.SiteId));

                    if (request.TankIds?.Any() == true)
                        volumeHistoryQuery = volumeHistoryQuery.Where(tvh => request.TankIds.Contains(tvh.TankId ?? 0));

                    var volumeHistoryData = await volumeHistoryQuery.ToListAsync(cancellationToken);

                    // Get manual dispensing data from TankStock
                    var tankStockQuery = _context.Tankstocks
                        .Include(ts => ts.Tank)
                        .ThenInclude(t => t.Site)
                        .Where(ts => ts.EntryDate >= request.StartDate && ts.EntryDate <= request.EndDate)
                        .Where(ts => ts.EntryType == VolumeChangeReasonEnum.Dispensing);

                    // Apply filters to tank stock
                    if (request.SiteIds?.Any() == true)
                        tankStockQuery = tankStockQuery.Where(ts => request.SiteIds.Contains(ts.Tank.SiteId));

                    if (request.TankIds?.Any() == true)
                        tankStockQuery = tankStockQuery.Where(ts => request.TankIds.Contains(ts.TankId));

                    var tankStockData = await tankStockQuery.ToListAsync(cancellationToken);

                    // Group both datasets and combine
                    groupedData = request.GroupBy.ToLower() switch
                    {
                        "month" => CombineMonthlyData(volumeHistoryData, tankStockData),
                        "quarter" => CombineQuarterlyData(volumeHistoryData, tankStockData),
                        "week" => CombineWeeklyData(volumeHistoryData, tankStockData),
                        "day" => CombineDailyData(volumeHistoryData, tankStockData),
                        _ => CombineMonthlyData(volumeHistoryData, tankStockData)
                    };
                }
                else
                {
                    // Use sensor dispensing from TankVolumeHistory (current behavior)
                    var query = _context.TankVolumeHistories
                        .Include(tvh => tvh.Tank)
                        .ThenInclude(t => t.Site)
                        .Where(tvh => tvh.Timestamp >= request.StartDate && tvh.Timestamp <= request.EndDate);

                    // Apply filters
                    if (request.SiteIds?.Any() == true)
                        query = query.Where(tvh => request.SiteIds.Contains(tvh.Tank.SiteId));

                    if (request.TankIds?.Any() == true)
                        query = query.Where(tvh => request.TankIds.Contains(tvh.TankId ?? 0));

                    var data = await query.ToListAsync(cancellationToken);

                    // Group data based on the GroupBy parameter
                    groupedData = request.GroupBy.ToLower() switch
                    {
                        "month" => GroupByMonth(data),
                        "quarter" => GroupByQuarter(data),
                        "week" => GroupByWeek(data),
                        "day" => GroupByDay(data),
                        _ => GroupByMonth(data)
                    };
                }

                // Calculate totals for pivot
                var totals = groupedData
                    .GroupBy(x => x.ChangeReasonDisplay)
                    .ToDictionary(g => g.Key, g => g.Sum(x => x.TotalVolume));

                var summary = new PivotSummaryDTO
                {
                    TotalRecords = groupedData.Count,
                    GrandTotalVolume = groupedData.Sum(x => x.TotalVolume),
                    ReportGeneratedAt = DateTime.UtcNow,
                    ReportPeriod = $"{request.StartDate:yyyy-MM-dd} to {request.EndDate:yyyy-MM-dd}",
                    SitesIncluded = groupedData.Select(x => x.SiteName).Distinct().ToList(),
                    TanksIncluded = groupedData.Select(x => x.TankName).Distinct().ToList()
                };

                return new PivotDataDTO
                {
                    Data = groupedData,
                    Summary = summary,
                    Totals = totals
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting pivot data");
                throw;
            }
        }

        private List<TankVolumeReportDTO> GroupByMonth(List<TankVolumeHistories.TankVolumeHistory> data)
        {
            return data
                .GroupBy(tvh => new
                {
                    Year = tvh.Timestamp.Year,
                    Month = tvh.Timestamp.Month,
                    SiteId = tvh.Tank.SiteId,
                    SiteName = tvh.Tank.Site.Name ?? "Unknown",
                    TankId = tvh.TankId,
                    TankName = tvh.Tank.Name ?? "Unknown",
                    ChangeReason = tvh.ChangeReason
                })
                .Select(g => new TankVolumeReportDTO
                {
                    SiteId = g.Key.SiteId,
                    SiteName = g.Key.SiteName,
                    TankId = g.Key.TankId ?? 0,
                    TankName = g.Key.TankName,
                    TimePeriod = $"{g.Key.Year}-{g.Key.Month:D2}",
                    PeriodStart = new DateTime(g.Key.Year, g.Key.Month, 1),
                    PeriodEnd = new DateTime(g.Key.Year, g.Key.Month, DateTime.DaysInMonth(g.Key.Year, g.Key.Month)),
                    ChangeReason = g.Key.ChangeReason,
                    ChangeReasonDisplay = g.Key.ChangeReason.ToString(),
                    TotalVolume = Math.Abs(g.Sum(x => x.VolumeChange ?? 0)),
                    TransactionCount = g.Count(),
                    AverageVolume = Math.Abs(g.Average(x => x.VolumeChange ?? 0)),
                    ReferenceType = g.FirstOrDefault()?.ReferenceType ?? ""
                })
                .OrderBy(x => x.PeriodStart)
                .ThenBy(x => x.SiteName)
                .ThenBy(x => x.TankName)
                .ToList();
        }

        private List<TankVolumeReportDTO> GroupByQuarter(List<TankVolumeHistories.TankVolumeHistory> data)
        {
            return data
                .GroupBy(tvh => new
                {
                    Year = tvh.Timestamp.Year,
                    Quarter = (tvh.Timestamp.Month - 1) / 3 + 1,
                    SiteId = tvh.Tank.SiteId,
                    SiteName = tvh.Tank.Site.Name ?? "Unknown",
                    TankId = tvh.TankId,
                    TankName = tvh.Tank.Name ?? "Unknown",
                    ChangeReason = tvh.ChangeReason
                })
                .Select(g => new TankVolumeReportDTO
                {
                    SiteId = g.Key.SiteId,
                    SiteName = g.Key.SiteName,
                    TankId = g.Key.TankId ?? 0,
                    TankName = g.Key.TankName,
                    TimePeriod = $"{g.Key.Year}-Q{g.Key.Quarter}",
                    PeriodStart = new DateTime(g.Key.Year, (g.Key.Quarter - 1) * 3 + 1, 1),
                    PeriodEnd = new DateTime(g.Key.Year, g.Key.Quarter * 3, DateTime.DaysInMonth(g.Key.Year, g.Key.Quarter * 3)),
                    ChangeReason = g.Key.ChangeReason,
                    ChangeReasonDisplay = g.Key.ChangeReason.ToString(),
                    TotalVolume = Math.Abs(g.Sum(x => x.VolumeChange ?? 0)),
                    TransactionCount = g.Count(),
                    AverageVolume = Math.Abs(g.Average(x => x.VolumeChange ?? 0)),
                    ReferenceType = g.FirstOrDefault()?.ReferenceType ?? ""
                })
                .OrderBy(x => x.PeriodStart)
                .ThenBy(x => x.SiteName)
                .ThenBy(x => x.TankName)
                .ToList();
        }

        private List<TankVolumeReportDTO> GroupByWeek(List<TankVolumeHistories.TankVolumeHistory> data)
        {
            var calendar = new GregorianCalendar();
            return data
                .GroupBy(tvh => new
                {
                    Year = tvh.Timestamp.Year,
                    Week = calendar.GetWeekOfYear(tvh.Timestamp, CalendarWeekRule.FirstDay, DayOfWeek.Monday),
                    SiteId = tvh.Tank.SiteId,
                    SiteName = tvh.Tank.Site.Name ?? "Unknown",
                    TankId = tvh.TankId,
                    TankName = tvh.Tank.Name ?? "Unknown",
                    ChangeReason = tvh.ChangeReason
                })
                .Select(g => new TankVolumeReportDTO
                {
                    SiteId = g.Key.SiteId,
                    SiteName = g.Key.SiteName,
                    TankId = g.Key.TankId ?? 0,
                    TankName = g.Key.TankName,
                    TimePeriod = $"{g.Key.Year}-W{g.Key.Week:D2}",
                    PeriodStart = GetFirstDateOfWeek(g.Key.Year, g.Key.Week),
                    PeriodEnd = GetFirstDateOfWeek(g.Key.Year, g.Key.Week).AddDays(6),
                    ChangeReason = g.Key.ChangeReason,
                    ChangeReasonDisplay = g.Key.ChangeReason.ToString(),
                    TotalVolume = Math.Abs(g.Sum(x => x.VolumeChange ?? 0)),
                    TransactionCount = g.Count(),
                    AverageVolume = Math.Abs(g.Average(x => x.VolumeChange ?? 0)),
                    ReferenceType = g.FirstOrDefault()?.ReferenceType ?? ""
                })
                .OrderBy(x => x.PeriodStart)
                .ThenBy(x => x.SiteName)
                .ThenBy(x => x.TankName)
                .ToList();
        }

        private List<TankVolumeReportDTO> GroupByDay(List<TankVolumeHistories.TankVolumeHistory> data)
        {
            return data
                .GroupBy(tvh => new
                {
                    Date = tvh.Timestamp.Date,
                    SiteId = tvh.Tank.SiteId,
                    SiteName = tvh.Tank.Site.Name ?? "Unknown",
                    TankId = tvh.TankId,
                    TankName = tvh.Tank.Name ?? "Unknown",
                    ChangeReason = tvh.ChangeReason
                })
                .Select(g => new TankVolumeReportDTO
                {
                    SiteId = g.Key.SiteId,
                    SiteName = g.Key.SiteName,
                    TankId = g.Key.TankId ?? 0,
                    TankName = g.Key.TankName,
                    TimePeriod = g.Key.Date.ToString("yyyy-MM-dd"),
                    PeriodStart = g.Key.Date,
                    PeriodEnd = g.Key.Date.AddDays(1).AddTicks(-1),
                    ChangeReason = g.Key.ChangeReason,
                    ChangeReasonDisplay = g.Key.ChangeReason.ToString(),
                    TotalVolume = Math.Abs(g.Sum(x => x.VolumeChange ?? 0)),
                    TransactionCount = g.Count(),
                    AverageVolume = Math.Abs(g.Average(x => x.VolumeChange ?? 0)),
                    ReferenceType = g.FirstOrDefault()?.ReferenceType ?? ""
                })
                .OrderBy(x => x.PeriodStart)
                .ThenBy(x => x.SiteName)
                .ThenBy(x => x.TankName)
                .ToList();
        }

        // Methods for combining TankVolumeHistory (non-dispensing) with TankStock (manual dispensing)
        private List<TankVolumeReportDTO> CombineMonthlyData(
            List<TankVolumeHistories.TankVolumeHistory> volumeHistory,
            List<Tankstock> tankStock)
        {
            var volumeHistoryGrouped = GroupByMonth(volumeHistory);
            var tankStockGrouped = GroupTankStockByMonth(tankStock);
            return volumeHistoryGrouped.Concat(tankStockGrouped).ToList();
        }

        private List<TankVolumeReportDTO> CombineQuarterlyData(
            List<TankVolumeHistories.TankVolumeHistory> volumeHistory,
            List<Tankstock> tankStock)
        {
            var volumeHistoryGrouped = GroupByQuarter(volumeHistory);
            var tankStockGrouped = GroupTankStockByQuarter(tankStock);
            return volumeHistoryGrouped.Concat(tankStockGrouped).ToList();
        }

        private List<TankVolumeReportDTO> CombineWeeklyData(
            List<TankVolumeHistories.TankVolumeHistory> volumeHistory,
            List<Tankstock> tankStock)
        {
            var volumeHistoryGrouped = GroupByWeek(volumeHistory);
            var tankStockGrouped = GroupTankStockByWeek(tankStock);
            return volumeHistoryGrouped.Concat(tankStockGrouped).ToList();
        }

        private List<TankVolumeReportDTO> CombineDailyData(
            List<TankVolumeHistories.TankVolumeHistory> volumeHistory,
            List<Tankstock> tankStock)
        {
            var volumeHistoryGrouped = GroupByDay(volumeHistory);
            var tankStockGrouped = GroupTankStockByDay(tankStock);
            return volumeHistoryGrouped.Concat(tankStockGrouped).ToList();
        }

        // Methods for grouping TankStock manual dispensing data
        private List<TankVolumeReportDTO> GroupTankStockByMonth(List<Tankstock> data)
        {
            return data
                .GroupBy(ts => new
                {
                    Year = ts.EntryDate.Year,
                    Month = ts.EntryDate.Month,
                    SiteId = ts.Tank.SiteId,
                    SiteName = ts.Tank.Site.Name ?? "Unknown",
                    TankId = ts.TankId,
                    TankName = ts.Tank.Name ?? "Unknown",
                    ChangeReason = ts.EntryType
                })
                .Select(g => new TankVolumeReportDTO
                {
                    SiteId = g.Key.SiteId,
                    SiteName = g.Key.SiteName,
                    TankId = g.Key.TankId,
                    TankName = g.Key.TankName,
                    TimePeriod = $"{g.Key.Year}-{g.Key.Month:D2}",
                    PeriodStart = new DateTime(g.Key.Year, g.Key.Month, 1),
                    PeriodEnd = new DateTime(g.Key.Year, g.Key.Month, DateTime.DaysInMonth(g.Key.Year, g.Key.Month)),
                    ChangeReason = g.Key.ChangeReason,
                    ChangeReasonDisplay = g.Key.ChangeReason.ToString(),
                    TotalVolume = g.Sum(x => x.ManualAmount ?? 0),
                    TransactionCount = g.Count(),
                    AverageVolume = g.Average(x => x.ManualAmount ?? 0),
                    ReferenceType = "TankStock"
                })
                .OrderBy(x => x.PeriodStart)
                .ThenBy(x => x.SiteName)
                .ThenBy(x => x.TankName)
                .ToList();
        }

        private List<TankVolumeReportDTO> GroupTankStockByQuarter(List<Tankstock> data)
        {
            return data
                .GroupBy(ts => new
                {
                    Year = ts.EntryDate.Year,
                    Quarter = (ts.EntryDate.Month - 1) / 3 + 1,
                    SiteId = ts.Tank.SiteId,
                    SiteName = ts.Tank.Site.Name ?? "Unknown",
                    TankId = ts.TankId,
                    TankName = ts.Tank.Name ?? "Unknown",
                    ChangeReason = ts.EntryType
                })
                .Select(g => new TankVolumeReportDTO
                {
                    SiteId = g.Key.SiteId,
                    SiteName = g.Key.SiteName,
                    TankId = g.Key.TankId,
                    TankName = g.Key.TankName,
                    TimePeriod = $"{g.Key.Year}-Q{g.Key.Quarter}",
                    PeriodStart = new DateTime(g.Key.Year, (g.Key.Quarter - 1) * 3 + 1, 1),
                    PeriodEnd = new DateTime(g.Key.Year, g.Key.Quarter * 3, DateTime.DaysInMonth(g.Key.Year, g.Key.Quarter * 3)),
                    ChangeReason = g.Key.ChangeReason,
                    ChangeReasonDisplay = g.Key.ChangeReason.ToString(),
                    TotalVolume = g.Sum(x => x.ManualAmount ?? 0),
                    TransactionCount = g.Count(),
                    AverageVolume = g.Average(x => x.ManualAmount ?? 0),
                    ReferenceType = "TankStock"
                })
                .OrderBy(x => x.PeriodStart)
                .ThenBy(x => x.SiteName)
                .ThenBy(x => x.TankName)
                .ToList();
        }

        private List<TankVolumeReportDTO> GroupTankStockByWeek(List<Tankstock> data)
        {
            var calendar = new GregorianCalendar();
            return data
                .GroupBy(ts => new
                {
                    Year = ts.EntryDate.Year,
                    Week = calendar.GetWeekOfYear(ts.EntryDate, CalendarWeekRule.FirstDay, DayOfWeek.Monday),
                    SiteId = ts.Tank.SiteId,
                    SiteName = ts.Tank.Site.Name ?? "Unknown",
                    TankId = ts.TankId,
                    TankName = ts.Tank.Name ?? "Unknown",
                    ChangeReason = ts.EntryType
                })
                .Select(g => new TankVolumeReportDTO
                {
                    SiteId = g.Key.SiteId,
                    SiteName = g.Key.SiteName,
                    TankId = g.Key.TankId,
                    TankName = g.Key.TankName,
                    TimePeriod = $"{g.Key.Year}-W{g.Key.Week:D2}",
                    PeriodStart = GetFirstDateOfWeek(g.Key.Year, g.Key.Week),
                    PeriodEnd = GetFirstDateOfWeek(g.Key.Year, g.Key.Week).AddDays(6),
                    ChangeReason = g.Key.ChangeReason,
                    ChangeReasonDisplay = g.Key.ChangeReason.ToString(),
                    TotalVolume = g.Sum(x => x.ManualAmount ?? 0),
                    TransactionCount = g.Count(),
                    AverageVolume = g.Average(x => x.ManualAmount ?? 0),
                    ReferenceType = "TankStock"
                })
                .OrderBy(x => x.PeriodStart)
                .ThenBy(x => x.SiteName)
                .ThenBy(x => x.TankName)
                .ToList();
        }

        private List<TankVolumeReportDTO> GroupTankStockByDay(List<Tankstock> data)
        {
            return data
                .GroupBy(ts => new
                {
                    Date = ts.EntryDate.Date,
                    SiteId = ts.Tank.SiteId,
                    SiteName = ts.Tank.Site.Name ?? "Unknown",
                    TankId = ts.TankId,
                    TankName = ts.Tank.Name ?? "Unknown",
                    ChangeReason = ts.EntryType
                })
                .Select(g => new TankVolumeReportDTO
                {
                    SiteId = g.Key.SiteId,
                    SiteName = g.Key.SiteName,
                    TankId = g.Key.TankId,
                    TankName = g.Key.TankName,
                    TimePeriod = g.Key.Date.ToString("yyyy-MM-dd"),
                    PeriodStart = g.Key.Date,
                    PeriodEnd = g.Key.Date.AddDays(1).AddTicks(-1),
                    ChangeReason = g.Key.ChangeReason,
                    ChangeReasonDisplay = g.Key.ChangeReason.ToString(),
                    TotalVolume = g.Sum(x => x.ManualAmount ?? 0),
                    TransactionCount = g.Count(),
                    AverageVolume = g.Average(x => x.ManualAmount ?? 0),
                    ReferenceType = "TankStock"
                })
                .OrderBy(x => x.PeriodStart)
                .ThenBy(x => x.SiteName)
                .ThenBy(x => x.TankName)
                .ToList();
        }

        private static DateTime GetFirstDateOfWeek(int year, int weekOfYear)
        {
            var jan1 = new DateTime(year, 1, 1);
            var daysOffset = DayOfWeek.Monday - jan1.DayOfWeek;
            var firstMonday = jan1.AddDays(daysOffset);
            var cal = new GregorianCalendar();
            var firstWeek = cal.GetWeekOfYear(jan1, CalendarWeekRule.FirstDay, DayOfWeek.Monday);
            var weekNum = weekOfYear;
            if (firstWeek <= 1)
            {
                weekNum -= 1;
            }
            return firstMonday.AddDays(weekNum * 7);
        }
    }
}