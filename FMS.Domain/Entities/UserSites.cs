using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FMS.Domain.Entities
{
    public class UserSites
    {
        public string UserId { get; set; } = null!;
        public virtual User? User { get; set; }

        public int SiteId { get; set; }
        public virtual Site? Site { get; set; }


    }
}
