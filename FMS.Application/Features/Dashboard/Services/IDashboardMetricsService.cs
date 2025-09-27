using System;
using System.Threading.Tasks;
using FMS.Application.Features.Dashboard;

namespace FMS.Application.Services.Dashboard {
    [Obsolete ("Use IDataSourceManager instead")]
    public interface IDashboardMetricsService {

        Task<DashboardMetricResponseDto> GetFuelDispensedMetricAsync (DashboardMetricRequestDto request);
        Task<DashboardMetricResponseDto> GetFuelUsedGpsMetricAsync (DashboardMetricRequestDto request);
        Task<DashboardMetricResponseDto> GetEngineHoursMetricAsync (DashboardMetricRequestDto request);
        Task<DashboardMetricResponseDto> GetDistanceTravelledMetricAsync (DashboardMetricRequestDto request);
        Task<DashboardMetricResponseDto> GetMetricAsync (DashboardMetricRequestDto request);
    }
}