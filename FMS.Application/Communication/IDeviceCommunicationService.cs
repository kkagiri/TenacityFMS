using System.Collections.Generic;
using System.Threading.Tasks;
using FMS.Application.Features.PTS.Enum;
using FMS.Domain.PTSCommon;
namespace FMS.Application.Communication {
    public interface IDeviceCommunicationService {
        Task<bool> CanPushCommandsToDevice (string deviceId);
        Task<CommunicationMode> GetPreferredCommunicationMode (string deviceId);
        Task<List<string>> GetNextRequestTypes (string deviceId, PTSMessage currentMessage);
    }
}