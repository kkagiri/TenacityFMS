using System.Threading.Tasks;
using FMS.Application.ModelsDTOs.Dashboard;

namespace FMS.Application.Services.Dashboard {
    public interface IDashboardMetricsService {

        Task<DashboardMetricResponseDto> GetFuelDispensedMetricAsync (DashboardMetricRequestDto request);
        Task<DashboardMetricResponseDto> GetFuelUsedGpsMetricAsync (DashboardMetricRequestDto request);
        Task<DashboardMetricResponseDto> GetEngineHoursMetricAsync (DashboardMetricRequestDto request);
        Task<DashboardMetricResponseDto> GetDistanceTravelledMetricAsync (DashboardMetricRequestDto request);
        Task<DashboardMetricResponseDto> GetMetricAsync (DashboardMetricRequestDto request);
    }
}