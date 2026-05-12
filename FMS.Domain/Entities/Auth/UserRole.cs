using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FMS.Domain.Entities.Auth
{
    public class UserRole
    {

        public string UserId { get; set; } = null!;
        public virtual User User { get; set; } = null!;
        public string RoleId { get; set; } = null!;
        public virtual Role Role { get; set; } = null!;
    }
}
