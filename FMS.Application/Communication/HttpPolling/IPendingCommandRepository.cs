using System.Collections.Generic;
using System.Threading.Tasks;

namespace FMS.Application.Communication.HttpPolling;

public interface IPendingCommandRepository
{
    Task SavePendingConfigurationAsync(string deviceId, string commandType, object commandData);
    Task<IEnumerable<(string commandType, object commandData)>> GetPendingConfigurationsAsync(string deviceId);

    Task ClearPendingConfigurationAsync(string deviceId);
}