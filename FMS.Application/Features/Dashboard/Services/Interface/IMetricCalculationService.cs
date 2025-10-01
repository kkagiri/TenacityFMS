using System.Threading.Tasks;
using FMS.Application.Features.Dashboard;

namespace FMS.Application.Services.Dashboard {
    public interface IMetricCalculationService {
        Task<DashboardMetricResponseDto> ComputeMetricAsync (DashboardMetricRequestDto request);
        Task<object> CalculateChangeAsync (DashboardMetricResponseDto currentResponse);
    }
}