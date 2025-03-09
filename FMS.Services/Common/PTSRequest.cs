using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FMS.Services.Common
{
    public abstract class PtsRequest
    {
        public int Id { get; set; }
        public string Type { get; set; }
        public object Data { get; set; }

        protected PtsRequest(int id, string type, object data)
        {
            Id = id;
            Type = type;
            Data = data;
        }
    }
}
