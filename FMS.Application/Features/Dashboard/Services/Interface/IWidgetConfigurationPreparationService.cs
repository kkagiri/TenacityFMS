using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Features.Dashboard;

namespace FMS.Application.Services.Dashboard
{
    /// <summary>
    /// Prepares widget configuration for persistence and runtime validation.
    /// </summary>
    public interface IWidgetConfigurationPreparationService
    {
        Task<WidgetConfigurationPreparationResult> PrepareAsync(WidgetConfigurationDto configuration, CancellationToken cancellationToken);
    }
}
