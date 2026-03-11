using FMS.Application.Features.Dashboard;
using FMS.Domain.Entities.Dashboard;

namespace FMS.Application.Services.Dashboard
{
    /// <summary>
    /// Hydrates widget instance DTOs with parsed configuration values for read operations.
    /// </summary>
    public interface IWidgetInstanceDtoHydrationService
    {
        DashboardWidgetInstanceDto Hydrate(DashboardWidgetInstance widgetInstance, DashboardWidgetInstanceDto dto);
    }
}
