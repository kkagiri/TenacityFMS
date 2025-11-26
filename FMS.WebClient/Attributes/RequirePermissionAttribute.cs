using System;
using Microsoft.AspNetCore.Mvc;

namespace FMS.WebClient.Attributes
{
    /// <summary>
    /// Custom authorization attribute for database-driven permission checks
    /// Usage: [RequirePermission("_Read_Vehicle")]
    /// </summary>
    [AttributeUsage(AttributeTargets.Class | AttributeTargets.Method, AllowMultiple = true)]
    public class RequirePermissionAttribute : TypeFilterAttribute
    {
        public RequirePermissionAttribute(string permissionName)
            : base(typeof(PermissionAuthorizationFilter))
        {
            Arguments = new object[] { permissionName };
        }

        /// <summary>
        /// Requires any one of the specified permissions (OR logic)
        /// </summary>
        public RequirePermissionAttribute(params string[] permissionNames)
            : base(typeof(PermissionAuthorizationFilter))
        {
            Arguments = new object[] { permissionNames };
        }
    }
}
