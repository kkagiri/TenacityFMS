/*
 * File:          DeviceProviderTenantGuardTests.cs
 * Purpose:       Conformance tests for Phase 4 device-provider multitenancy guards.
 * Dependencies:  FMS.Application, FMS.WebClient, ASP.NET Core MVC test doubles
 * Last Modified: 2026-05-20
 *
 * Key Functions:
 * - Permission_constants_match_task_contract(): Pins exact permission strings.
 * - RejectCustomerTenantAttribute_blocks_customer_users(): Verifies Customer users receive 403.
 * - Provider_and_command_controllers_reject_customer_tenants(): Pins customer endpoint guards.
 * - Operator_device_provider_api_requires_cross_tenant_platform_permissions(): Pins operator API contract.
 */
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using System.Threading.Tasks;
using FMS.Application.Common.Constants;
using FMS.Application.Features.MultiTenancy.Services;
using FMS.Domain.Entities.Features.MultiTenancy;
using FMS.WebClient.Attributes;
using FMS.WebClient.Controllers.FuelManagement;
using FMS.WebClient.Controllers.Operator;
using FMS.WebClient.Controllers.PTSController;
using FMS.WebClient.Controllers.VehicleManagement;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Abstractions;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace FMS.Testing.MultiTenancy
{
    public class DeviceProviderTenantGuardTests
    {
        [Fact]
        public void Permission_constants_match_task_contract()
        {
            Assert.Equal("_Read_DeviceProvider", Permissions.DeviceProvider.Read);
            Assert.Equal("_Manage_DeviceProvider", Permissions.DeviceProvider.Manage);
            Assert.Equal("platform.device-providers.read", Permissions.Platform.ReadDeviceProvider);
            Assert.Equal("platform.device-providers.manage", Permissions.Platform.ManageDeviceProvider);
            Assert.Contains("_Platform_Read_DeviceProvider", LegacyPermissionMap.ToLegacy(Permissions.Platform.ReadDeviceProvider));
            Assert.Contains("_Platform_Manage_DeviceProvider", LegacyPermissionMap.ToLegacy(Permissions.Platform.ManageDeviceProvider));
        }

        [Fact]
        public async Task RejectCustomerTenantAttribute_blocks_customer_users()
        {
            var tenantContext = new TenantContext();
            tenantContext.SetTenant(System.Guid.NewGuid(), TenantKind.Customer, isPlatformOperator: false);
            var context = CreateAuthorizationContext(tenantContext);
            var attribute = new RejectCustomerTenantAttribute();

            await attribute.OnAuthorizationAsync(context);

            var result = Assert.IsType<ObjectResult>(context.Result);
            Assert.Equal(403, result.StatusCode);
        }

        [Fact]
        public async Task RejectCustomerTenantAttribute_allows_client_users()
        {
            var tenantContext = new TenantContext();
            tenantContext.SetTenant(System.Guid.NewGuid(), TenantKind.Client, isPlatformOperator: false);
            var context = CreateAuthorizationContext(tenantContext);
            var attribute = new RejectCustomerTenantAttribute();

            await attribute.OnAuthorizationAsync(context);

            Assert.Null(context.Result);
        }

        [Fact]
        public void Provider_and_command_controllers_reject_customer_tenants()
        {
            AssertRejectsCustomerTenant(typeof(ProviderManagementController));
            AssertRejectsCustomerTenant(typeof(PumpController));
            AssertRejectsCustomerTenant(typeof(PTSConfigController));
            AssertRejectsCustomerTenant(typeof(TankCalibrationController));
        }

        [Fact]
        public void Operator_device_provider_api_requires_cross_tenant_platform_permissions()
        {
            var controllerType = typeof(OperatorDeviceProvidersController);

            Assert.Contains(controllerType.GetCustomAttributes(inherit: true), attribute => attribute is AllowCrossTenantAttribute);

            var actionPermissions = controllerType
                .GetMethods(BindingFlags.Instance | BindingFlags.Public | BindingFlags.DeclaredOnly)
                .Where(method => method.DeclaringType == controllerType && !method.IsSpecialName)
                .Select(method => new
                {
                    Method = method,
                    Permissions = method
                        .GetCustomAttributesData()
                        .Where(attribute => attribute.AttributeType == typeof(RequirePermissionAttribute))
                        .SelectMany(GetPermissionArguments)
                        .ToList()
                })
                .ToList();

            Assert.NotEmpty(actionPermissions);
            Assert.All(actionPermissions, action =>
            {
                Assert.NotEmpty(action.Permissions);
                Assert.All(action.Permissions, permission => Assert.StartsWith("platform.", permission));
                Assert.Contains(action.Permissions, permission =>
                    permission == Permissions.Platform.ReadDeviceProvider ||
                    permission == Permissions.Platform.ManageDeviceProvider);
            });
        }

        private static AuthorizationFilterContext CreateAuthorizationContext(ITenantContext tenantContext)
        {
            var services = new ServiceCollection()
                .AddSingleton(tenantContext)
                .BuildServiceProvider();

            var httpContext = new DefaultHttpContext
            {
                RequestServices = services
            };

            return new AuthorizationFilterContext(
                new ActionContext(httpContext, new RouteData(), new ActionDescriptor()),
                new List<IFilterMetadata>());
        }

        private static void AssertRejectsCustomerTenant(System.Type controllerType)
        {
            Assert.Contains(controllerType.GetCustomAttributes(inherit: true), attribute => attribute is RejectCustomerTenantAttribute);
        }

        private static IEnumerable<string> GetPermissionArguments(CustomAttributeData attribute)
        {
            foreach (var argument in attribute.ConstructorArguments)
            {
                if (argument.ArgumentType == typeof(string) && argument.Value is string value)
                {
                    yield return value;
                }

                if (argument.ArgumentType == typeof(string[]) && argument.Value is IEnumerable<CustomAttributeTypedArgument> values)
                {
                    foreach (var value in values)
                    {
                        if (value.Value is string permission)
                        {
                            yield return permission;
                        }
                    }
                }
            }
        }
    }
}
