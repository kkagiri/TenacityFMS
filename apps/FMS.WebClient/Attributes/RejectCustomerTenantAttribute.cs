/*
 * File:          RejectCustomerTenantAttribute.cs
 * Purpose:       Blocks Customer tenant users from operational device/provider endpoints.
 * Dependencies:  ITenantContext, FMSResponse
 * Last Modified: 2026-05-15
 *
 * Key Functions:
 * - OnAuthorizationAsync(): Returns 403 for Customer view requests.
 */
using System;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.MultiTenancy.Services;
using FMS.Domain.Entities.Features.MultiTenancy;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace FMS.WebClient.Attributes
{
    [AttributeUsage(AttributeTargets.Class | AttributeTargets.Method, AllowMultiple = false, Inherited = true)]
    public sealed class RejectCustomerTenantAttribute : Attribute, IAsyncAuthorizationFilter
    {
        public Task OnAuthorizationAsync(AuthorizationFilterContext context)
        {
            var tenantContext = context.HttpContext.RequestServices.GetService(typeof(ITenantContext)) as ITenantContext;

            if (tenantContext?.TenantKind == TenantKind.Customer)
            {
                context.Result = new ObjectResult(FMSResponse.Forbidden(
                    "CUSTOMER_TENANT_RESTRICTED",
                    "Customer users cannot access device provider configuration or device command endpoints."))
                {
                    StatusCode = 403
                };
            }

            return Task.CompletedTask;
        }
    }
}
