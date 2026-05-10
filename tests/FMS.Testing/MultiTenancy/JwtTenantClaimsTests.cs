/*
 * File:          JwtTenantClaimsTests.cs
 * Purpose:       Verifies JwtTokenGenerator emits the tenant context
 *                claims (tenant_id, tenant_kind, parent_tenant_id,
 *                is_platform_operator) that fms.frontend ViewMode logic
 *                and TenantResolutionMiddleware depend on.
 * Last Modified: 2026-05-10
 */
using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Threading.Tasks;
using FMS.Application.Infrastructure.Services.Authentication;
using FMS.Domain.Entities.Features.MultiTenancy;
using Microsoft.Extensions.Configuration;
using Xunit;

namespace FMS.Testing.MultiTenancy
{
    public class JwtTenantClaimsTests
    {
        private static JwtTokenGenerator BuildGenerator()
        {
            var inMemorySettings = new Dictionary<string, string?>
            {
                ["Jwt:Key"] = "this-is-a-test-secret-key-of-sufficient-length-for-hmac-sha256",
                ["Jwt:Issuer"] = "tenacy-fms-test",
                ["Jwt:Audience"] = "tenacy-fms-test-audience",
                ["Jwt:ExpiryInMinutes"] = "60",
            };

            IConfiguration cfg = new ConfigurationBuilder()
                .AddInMemoryCollection(inMemorySettings)
                .Build();

            return new JwtTokenGenerator(cfg);
        }

        [Fact]
        public async Task Token_omits_tenant_claims_when_tenantClaims_is_null()
        {
            var gen = BuildGenerator();

            var token = await gen.GenerateTokenWithPermissions(
                userId: Guid.NewGuid().ToString(),
                username: "alice",
                email: "alice@example.com",
                roles: new[] { "Driver" });

            var jwt = new JwtSecurityTokenHandler().ReadJwtToken(token);

            Assert.Null(jwt.Claims.FirstOrDefault(c => c.Type == "tenant_id"));
            Assert.Null(jwt.Claims.FirstOrDefault(c => c.Type == "tenant_kind"));
            Assert.Null(jwt.Claims.FirstOrDefault(c => c.Type == "is_platform_operator"));
        }

        [Fact]
        public async Task Token_includes_tenant_id_and_kind_for_client_user()
        {
            var gen = BuildGenerator();
            var tenantId = Guid.NewGuid();

            var token = await gen.GenerateTokenWithPermissions(
                userId: Guid.NewGuid().ToString(),
                username: "alice",
                email: "alice@example.com",
                roles: new[] { "Driver" },
                tenantClaims: new TenantClaims(
                    TenantId: tenantId,
                    TenantKind: TenantKind.Client,
                    ParentTenantId: null,
                    IsPlatformOperator: false));

            var jwt = new JwtSecurityTokenHandler().ReadJwtToken(token);

            Assert.Equal(tenantId.ToString(), jwt.Claims.First(c => c.Type == "tenant_id").Value);
            Assert.Equal("client", jwt.Claims.First(c => c.Type == "tenant_kind").Value);

            // parent_tenant_id absent when null
            Assert.Null(jwt.Claims.FirstOrDefault(c => c.Type == "parent_tenant_id"));

            // is_platform_operator only present when true
            Assert.Null(jwt.Claims.FirstOrDefault(c => c.Type == "is_platform_operator"));
        }

        [Fact]
        public async Task Token_includes_parent_tenant_id_for_customer_user()
        {
            var gen = BuildGenerator();
            var tenantId = Guid.NewGuid();
            var parentId = Guid.NewGuid();

            var token = await gen.GenerateTokenWithPermissions(
                userId: Guid.NewGuid().ToString(),
                username: "bob",
                email: "bob@example.com",
                roles: Array.Empty<string>(),
                tenantClaims: new TenantClaims(
                    TenantId: tenantId,
                    TenantKind: TenantKind.Customer,
                    ParentTenantId: parentId,
                    IsPlatformOperator: false));

            var jwt = new JwtSecurityTokenHandler().ReadJwtToken(token);

            Assert.Equal("customer", jwt.Claims.First(c => c.Type == "tenant_kind").Value);
            Assert.Equal(parentId.ToString(), jwt.Claims.First(c => c.Type == "parent_tenant_id").Value);
        }

        [Fact]
        public async Task Token_emits_is_platform_operator_when_true()
        {
            var gen = BuildGenerator();
            var tenantId = Guid.NewGuid();

            var token = await gen.GenerateTokenWithPermissions(
                userId: Guid.NewGuid().ToString(),
                username: "ops",
                email: "ops@fms.example.com",
                roles: new[] { "PlatformOperator" },
                tenantClaims: new TenantClaims(
                    TenantId: tenantId,
                    TenantKind: TenantKind.System,
                    ParentTenantId: null,
                    IsPlatformOperator: true));

            var jwt = new JwtSecurityTokenHandler().ReadJwtToken(token);

            Assert.Equal("system", jwt.Claims.First(c => c.Type == "tenant_kind").Value);
            Assert.Equal("true", jwt.Claims.First(c => c.Type == "is_platform_operator").Value);
        }
    }
}
