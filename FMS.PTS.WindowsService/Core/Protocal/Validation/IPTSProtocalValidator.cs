using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FMS.PTS.WindowsService.Core.Protocal.Validation
{
    public interface IPTSProtocalValidator
    {

        Task<bool> ValidateMessageAsync(string message);
        Task<(bool isValid, string error)> ValidatePacketStructureAsync(JObject packet);
        bool IsValidProtocolHeader(string protocol);
    }
}
