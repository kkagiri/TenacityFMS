using FMS.Domain.PTSCommon;
using System.Threading.Tasks;

namespace FMS.Application.Communication.Connection;

public interface IDeviceHttpCommandPusher
{
    Task<(bool Success, int? ErrorCode, PTSMessage? Response)> SendPTSMessageAsync(string ipAddress, int port, PTSMessage ptsMessage, string? bearerToken = null);
}