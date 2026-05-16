using System;
using System.Threading.Tasks;
using FMS.Application.Features.MultiTenancy.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace FMS.WebClient.Attributes
{
    /// <summary>
    /// Marks an endpoint as cross-tenant. Only a platform operator
    /// (is_platform_operator claim = true) may invoke it. Non-operator
    /// callers receive 404 (not 403) to avoid leaking endpoint existence.
    /// </summary>
    [AttributeUsage(AttributeTargets.Class | AttributeTargets.Method, AllowMultiple = false, Inherited = true)]
    public sealed class AllowCrossTenantAttribute : Attribute, IAsyncAuthorizationFilter
    {
        public async Task OnAuthorizationAsync(AuthorizationFilterContext context)
        {
            var tenantContext = context.HttpContext.RequestServices.GetService(typeof(ITenantContext)) as ITenantContext;

            if (tenantContext == null || !tenantContext.IsPlatformOperator)
            {
                context.Result = new NotFoundResult();
                return;
            }

            try
            {
                tenantContext.EnterCrossTenantScope();
            }
            catch (InvalidOperationException)
            {
                context.Result = new NotFoundResult();
                return;
            }

            await Task.CompletedTask;
        }
    }
}
