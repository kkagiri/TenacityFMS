using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FMS.Domain.Entities.PTS.PTSStatus
{
    public abstract class BaseStatus
    {
        public List<int?>? Ids { get; set; }
    }
}
