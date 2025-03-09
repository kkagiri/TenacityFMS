using System.Text.Json;
using Newtonsoft.Json.Linq;

namespace FMS.Application.Common.Commands
{
    public class RedisPTSCommand
    {
        public string DeviceId { get; set; }
        public string CommandType { get; set; }
        public JObject CommandData { get; set; }

        public string CorrelationId { get; set; }
    }

    public class RedisPTSCommandResponse
    {
        public string DeviceId { get; set; }

        public string Status { get; set; }  // e.g. "Success" or "Error"
        public string Message { get; set; }
        public JsonElement? ResponsePayload { get; set; }
        public string CorrelationId { get; set; }
    }
}
