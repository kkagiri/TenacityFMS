using System.Threading.Tasks;
using FMS.Application.Features.Dashboard;

namespace FMS.Application.Services.Dashboard {
    // Partial: Time-series generators (stub implementation)
    public partial class DataSourceManager {
        private Task<object> GetTimeSeriesDataAsync (string dataSource, DashboardMetricRequestDto request) {
            return _timeSeriesService.GetTimeSeriesAsync (dataSource, request);
        }
    }
}