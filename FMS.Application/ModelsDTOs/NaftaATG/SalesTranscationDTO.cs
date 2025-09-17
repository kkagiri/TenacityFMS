using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FMS.Application.Features.NaftaATG {
    public class SalesTranscationDTO {

        public int ID { get; set; }

        public DateTime CreateTime { get; set; }

        public decimal Amount { get; set; }

        public string CardHolder { get; set; }
    }
}