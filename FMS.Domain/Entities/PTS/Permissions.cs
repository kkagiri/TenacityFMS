using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FMS.Domain.Entities.PTS
{
    /// <summary>
    /// User permissions
    /// </summary>
    public class PTSPermissions
    {

        public bool Configuration { get; set; }

        public bool Control { get; set; }

        public bool Monitoring { get; set; }

        public bool Reports { get; set; }
    }
}
