using FMS.Domain.Entities.Auth;
using Microsoft.AspNetCore.Identity;
using System;
using System.Collections.Generic;

namespace FMS.Domain.Entities;

public partial class Role : IdentityRole
{

    public string? Description { get; set; }
    public virtual ICollection<Permission> Permissions { get; set; } = new List<Permission>();
    public virtual ICollection<RolePermission> RolePermissions { get; set; } = new List<RolePermission>();
    public virtual ICollection<Rolenavigation> Rolenavigations { get; set; } = new List<Rolenavigation>();
    public virtual ICollection<UserRole> UserRoles { get; set; } = new List<UserRole>();
    public virtual ICollection<User> Users { get; set; } = new List<User>();
}
