using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FMS.PTS.WindowsService.Core.Protocal.Validation
{
    public class PTSProtocalValidator : IPTSProtocalValidator
    {

        private readonly ILogger<PTSProtocalValidator> _logger;

        public PTSProtocalValidator(ILogger<PTSProtocalValidator> logger)
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

                if (!IsValidProtocolHeader(jObject["Protocol"]?.ToString())) //possible null 
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
