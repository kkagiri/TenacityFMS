using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FMS.Domain.Entities.Auth
{
    public class RolePermission
    {

        //TODO: Remove this property
        public int Id { get; set; }
        public string RoleId { get; set; } = null!;
        public virtual Role Role { get; set; } = null!;
        public int PermissionId { get; set; }
        public virtual Permission Permission { get; set; } = null!;
    }
}
