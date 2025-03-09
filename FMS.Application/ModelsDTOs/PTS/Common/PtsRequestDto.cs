using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace FMS.Application.ModelsDTOs.ATG.Common
{
    public class PtsBaseRequest
    {
        public string Protocol { get; set; } = "jsonPTS";
        public string PtsId { get; set; }
        public List<PtsPacket> Packets { get; set; }

        public string ToJson()
        {
            return JsonSerializer.Serialize(this);
        }
    }

    public class PtsPacket
    {
        public int Id { get; set; }
        public string Type { get; set; }
        public JObject Data { get; set; } // List of JObject
    }

    public class PtsBaseResponse
    {
        public string Protocol { get; set; } = "jsonPTS";
        public List<PtsResponsePacket> Packets { get; set; } = new List<PtsResponsePacket>();

        public static PtsBaseResponse FromJson(string json)
        {
            return JsonSerializer.Deserialize<PtsBaseResponse>(json)!;
        }
    }

    public class PtsResponsePacket
    {
        public int Id { get; set; }
        public string Type { get; set; }
        public string? Message { get; set; }
        public bool? Error { get; set; }
        public int? Code { get; set; }
        public object? Data { get; set; }
    }
}
