using System.Collections.Generic;
using System.Threading.Tasks;
using FMS.Domain.Entities;

namespace FMS.Application.Communication.HttpPolling;

public interface IPendingCommandRepository
{
    Task<int> QueueCommandAsync(string deviceId, string commandType, object commandData, int priority = 0, string? source = null);
    Task<(int commandId, string commandType, object commandData)?> GetNextPendingCommandAsync(string pTsdeviceId);
    Task<IEnumerable<(int commandId, string commandType, object commandData, string status)>> GetPendingCommandsForDeviceAsync(string pTSDeviceId);
    Task MarkCommandDeliveredAsync(int commandId);

    Task MarkCommandCompletedAsync(int commandId, object? responseData = null, int? responseCode = null);

    Task MarkCommandFailedAsync(int commandId, string reason, int? errorCode = null);
    Task CancelPendingCommandsAsync(string deviceId, string? commandType = null);

    Task<IEnumerable<PtsDevicePendingCommand>> GetCommandHistoryAsync(string deviceId, int limit = 100);


}
