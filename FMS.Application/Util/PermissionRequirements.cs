using System.Collections;
using System.Collections.Generic;
using Microsoft.AspNetCore.Authorization;

namespace FMS.Application.Util;

public class PermissionRequirements : IAuthorizationRequirement
{
    public string Permission { get; private set; }
    public PermissionRequirements(string permission)
    {
        Permission = permission;
    }

}