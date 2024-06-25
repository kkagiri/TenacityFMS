using System;
using System.Collections.Generic;
using FMS.Domain.Entities.Auth;

namespace FMS.Domain.Entities;

public partial class Permission
{
   public int Id { get; set; }
    public string Name { get; set; } = null!;
    public int? ParentId { get; set; }  // Allow null for top-level permissions
    public virtual ICollection<Permission> InverseParent { get; set; } = new List<Permission>();
    public virtual Permission? Parent { get; set; } = null!;
    public virtual ICollection<Role> Roles { get; set; } = new List<Role>();
    public virtual ICollection<RolePermission> RolePermissions { get; set; } = new List<RolePermission>();
}
