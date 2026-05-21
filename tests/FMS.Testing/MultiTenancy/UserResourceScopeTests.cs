/*
 * File:          UserResourceScopeTests.cs
 * Purpose:       Domain tests for the UserResourceScope schema contract.
 * Dependencies:  FMS.Domain, xUnit
 * Last Modified: 2026-05-20
 */
using System;
using FMS.Domain.Entities.Features.MultiTenancy;
using Xunit;

namespace FMS.Testing.MultiTenancy
{
    public class UserResourceScopeTests
    {
        [Fact]
        public void New_tenant_defaults_to_client_and_site_terminology()
        {
            var tenant = new Tenant();

            Assert.Equal(TenantKind.Client, tenant.TenantKind);
            Assert.Equal(SiteTerminology.Site, tenant.SiteTerminology);
        }

        [Fact]
        public void Resource_kind_values_are_stable_for_database_storage()
        {
            Assert.Equal(0, (int)ResourceKind.Site);
            Assert.Equal(1, (int)ResourceKind.Customer);
            Assert.Equal(2, (int)ResourceKind.Vehicle);
        }

        [Fact]
        public void User_resource_scope_preserves_string_resource_identifier()
        {
            var scope = new UserResourceScope
            {
                Id = Guid.NewGuid(),
                UserId = "user-1",
                ResourceKind = ResourceKind.Site,
                ResourceId = "42",
                CreatedAt = DateTime.UtcNow,
                CreatedBy = "admin-1"
            };

            Assert.Equal("42", scope.ResourceId);
            Assert.Equal(ResourceKind.Site, scope.ResourceKind);
        }
    }
}