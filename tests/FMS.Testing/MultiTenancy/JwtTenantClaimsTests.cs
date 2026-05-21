/*
 * File:          JwtTenantClaimsTests.cs
 * Purpose:       Verifies JwtTokenGenerator emits the tenant context
 *                claims (tenant_id, tenant_kind, user_scopes,
 *                is_platform_operator) that TenantResolutionMiddleware
 *                and scoped navigation depend on.
 * Last Modified: 2026-05-20
 */
using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Text.Json;
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
        public async Task Token_normalizes_customer_tenant_kind_to_client()
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

            Assert.Equal("client", jwt.Claims.First(c => c.Type == "tenant_kind").Value);
            Assert.Null(jwt.Claims.FirstOrDefault(c => c.Type == "parent_tenant_id"));
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

        [Fact]
        public async Task Token_includes_compact_user_scopes_claim()
        {
            var gen = BuildGenerator();
            var tenantId = Guid.NewGuid();

            var token = await gen.GenerateTokenWithPermissions(
                userId: Guid.NewGuid().ToString(),
                username: "scoped-user",
                email: "scoped@example.com",
                roles: new[] { "ExternalViewer" },
                tenantClaims: new TenantClaims(
                    TenantId: tenantId,
                    TenantKind: TenantKind.Client,
                    ParentTenantId: null,
                    IsPlatformOperator: false,
                    UserScopes: new[]
                    {
                        new UserScopeClaim(ResourceKind.Site, new[] { "12", "5" }),
                        new UserScopeClaim(ResourceKind.Customer, new[] { "acme" }),
                    }));

            var jwt = new JwtSecurityTokenHandler().ReadJwtToken(token);
            var userScopes = jwt.Claims.First(c => c.Type == "user_scopes").Value;
            using var document = JsonDocument.Parse(userScopes);

            Assert.Equal(2, document.RootElement.GetArrayLength());
            Assert.Contains(document.RootElement.EnumerateArray(), scope =>
                scope.GetProperty("k").GetString() == "site" &&
                scope.GetProperty("ids").EnumerateArray().Select(id => id.GetString()).SequenceEqual(new[] { "12", "5" }.OrderBy(id => id)));
            Assert.Contains(document.RootElement.EnumerateArray(), scope =>
                scope.GetProperty("k").GetString() == "customer" &&
                scope.GetProperty("ids").EnumerateArray().Single().GetString() == "acme");
        }
    }
}
