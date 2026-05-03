using System.Threading.Tasks;
using Newtonsoft.Json.Linq;

namespace FMS.Devices.Fueling.Providers.TechnotradePts.Protocol.Validation
{
    public interface IPTSProtocolValidator
    {
        Task<bool> ValidateMessageAsync(string message);
        Task<(bool isValid, string error)> ValidatePacketStructureAsync(JObject packet);
        bool IsValidProtocolHeader(string protocol);
    }
}