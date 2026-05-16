using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace FMS.Sales.Api.Attributes
{
    /// <summary>
    /// Requires the calling JWT to carry <c>is_platform_operator = true</c>
    /// AND <c>tenant_kind = system</c>. Non-operator callers receive 404
    /// (not 403) to avoid leaking endpoint existence.
    /// </summary>
    [AttributeUsage(AttributeTargets.Class | AttributeTargets.Method, AllowMultiple = false, Inherited = true)]
    public sealed class OperatorOnlyAttribute : Attribute, IAsyncAuthorizationFilter
    {
        public Task OnAuthorizationAsync(AuthorizationFilterContext context)
        {
            var user = context.HttpContext.User;

            if (user?.Identity?.IsAuthenticated != true)
            {
                context.Result = new NotFoundResult();
                return Task.CompletedTask;
            }

            var isOperator = string.Equals(
                user.FindFirst("is_platform_operator")?.Value,
                "true",
                StringComparison.OrdinalIgnoreCase);

            var kind = user.FindFirst("tenant_kind")?.Value;
            var isSystemKind = string.Equals(kind, "system", StringComparison.OrdinalIgnoreCase);

            if (!isOperator || !isSystemKind)
            {
                context.Result = new NotFoundResult();
                return Task.CompletedTask;
            }

            return Task.CompletedTask;
        }
    }
}
