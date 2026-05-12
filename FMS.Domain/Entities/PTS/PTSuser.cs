using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FMS.Domain.Entities.PTS
{
    public class PTSUser
    {

        public int Id { get; set; }


        public string? Login { get; set; }


        public string? Password { get; set; }


        public PTSPermissions? Permissions { get; set; }
    }
}
