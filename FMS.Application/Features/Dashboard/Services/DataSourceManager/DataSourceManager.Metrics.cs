using System.Threading.Tasks;
using FMS.Application.Features.Dashboard;

namespace FMS.Application.Services.Dashboard {
    // Partial: Metric computation helpers (delegate to IMetricCalculationService)
    public partial class DataSourceManager {
        // Calculate change relative to previous comparable period using the metric service
        private Task<object> CalculateChangeAsync (DashboardMetricResponseDto response) {
            return _metricService.CalculateChangeAsync (response);
        }
    }
}