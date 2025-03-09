// using System;
// using System.Collections.Generic;

// namespace FMS.Domain.Entities;

// public partial class Permission
// {
//     public int Id { get; set; }

//     public string Name { get; set; } = null!;

//     public int? ParentId { get; set; }

//     public virtual ICollection<Permission> InverseParent { get; set; } = new List<Permission>();

//     public virtual Permission? Parent { get; set; }

//     public virtual ICollection<Role> Roles { get; set; } = new List<Role>();
// }
