using System.Threading.Tasks;
using FMS.Application.Features.Dashboard;

namespace FMS.Application.Services.Dashboard {
    public interface ITimeSeriesDataService {
        Task<object> GetTimeSeriesAsync (string dataSource, DashboardMetricRequestDto request);
    }
}