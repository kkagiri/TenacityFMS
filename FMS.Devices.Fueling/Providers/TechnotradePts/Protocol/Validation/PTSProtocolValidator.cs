using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace FMS.Devices.Fueling.Providers.TechnotradePts.Protocol.Validation
{
    public class PTSProtocolValidator : IPTSProtocolValidator
    {
        private readonly ILogger<PTSProtocolValidator> _logger;

        public PTSProtocolValidator(ILogger<PTSProtocolValidator> logger)
        {
            _logger = logger;
        }

        public bool IsValidProtocolHeader(string protocol)
        {
            return protocol == "jsonPTS";
        }

        public async Task<bool> ValidateMessageAsync(string message)
        {
            try
            {
                var jObject = JObject.Parse(message);

                if (!IsValidProtocolHeader(jObject["Protocol"]?.ToString()))
                {
                    return false;
                }

                var (isValid, error) = await ValidatePacketStructureAsync(jObject);
                if (!isValid)
                {
                    _logger.LogWarning("Invalid packet structure: {Error}", error);
                    return false;
                }

                return true;
            }
            catch (JsonException ex)
            {
                _logger.LogError(ex, "Error validating message");
                return false;
            }
        }

        public async Task<(bool isValid, string error)> ValidatePacketStructureAsync(JObject packet)
        {
            if (!packet.ContainsKey("Header"))
            {
                return (false, "Header is missing");
            }

            if (!packet.ContainsKey("Packets"))
            {
                return (false, "Missing Packets Array");
            }

            var packets = packet["Packets"] as JArray;
            if (packets == null || packets.Count == 0)
            {
                return (false, "No packets found or Invalid Packet Format");
            }

            foreach (JObject packetObj in packets)
            {
                if (!packetObj.ContainsKey("Id") || !packetObj.ContainsKey("Type"))
                {
                    return (false, "Missing required packet fields");
                }
            }

            return (true, string.Empty);
        }
    }
}