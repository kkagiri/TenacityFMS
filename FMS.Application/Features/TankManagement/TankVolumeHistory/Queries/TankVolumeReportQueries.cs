using System;
using System.Collections.Generic;
using FMS.Application.Features.TankManagement.TankVolumeHistory.DTOs;
using FMS.Domain.Entities.enums;
using MediatR;

namespace FMS.Application.Features.TankManagement.TankVolumeHistory.Queries
{
    public class GetTankVolumeHistoryByMonthQuery : IRequest<VolumeHistorySummaryDTO>
    {
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public List<int>? SiteIds { get; set; }
        public List<int>? TankIds { get; set; }
        public bool IncludeCumulative { get; set; } = false;

        public GetTankVolumeHistoryByMonthQuery(DateTime startDate, DateTime endDate)
        {
            StartDate = startDate;
            EndDate = endDate;
        }
    }

    public class GetTankVolumeHistoryByQuarterQuery : IRequest<VolumeHistorySummaryDTO>
    {
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public List<int>? SiteIds { get; set; }
        public List<int>? TankIds { get; set; }
        public bool IncludeCumulative { get; set; } = false;

        public GetTankVolumeHistoryByQuarterQuery(DateTime startDate, DateTime endDate)
        {
            StartDate = startDate;
            EndDate = endDate;
        }
    }

    public class GetTankVolumeHistoryByWeekQuery : IRequest<VolumeHistorySummaryDTO>
    {
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public List<int>? SiteIds { get; set; }
        public List<int>? TankIds { get; set; }
        public bool IncludeCumulative { get; set; } = false;

        public GetTankVolumeHistoryByWeekQuery(DateTime startDate, DateTime endDate)
        {
            StartDate = startDate;
            EndDate = endDate;
        }
    }

    public class GetTankVolumeHistoryCustomDateQuery : IRequest<VolumeHistorySummaryDTO>
    {
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public string GroupByPeriod { get; set; } = "Day"; // Day, Week, Month
        public List<int>? SiteIds { get; set; }
        public List<int>? TankIds { get; set; }
        public bool IncludeCumulative { get; set; } = false;

        public GetTankVolumeHistoryCustomDateQuery(DateTime startDate, DateTime endDate, string groupByPeriod = "Day")
        {
            StartDate = startDate;
            EndDate = endDate;
            GroupByPeriod = groupByPeriod;
        }
    }

    public class GetPivotDataQuery : IRequest<PivotDataDTO>
    {
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public string GroupBy { get; set; } = "Month"; // Month, Quarter, Week, Day
        public List<int>? SiteIds { get; set; }
        public List<int>? TankIds { get; set; }
        public bool IncludeCumulative { get; set; } = false;
        public bool UseManualDispensing { get; set; } = false; // Use manual aggregate dispensing from TankStock instead of sensor dispensing
        public bool UseCombinedDispensing { get; set; } = false; // Combine both: use TankVolumeHistory where available, fill gaps with TankStock manual dispensing

        public GetPivotDataQuery(DateTime startDate, DateTime endDate, string groupBy = "Month")
        {
            StartDate = startDate;
            EndDate = endDate;
            GroupBy = groupBy;
        }
    }
}