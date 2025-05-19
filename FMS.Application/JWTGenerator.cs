using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using FMS.Application.Queries.Database.FMSQuery.UserManagement.Permissions;
using FMS.Application.Queries.Database.FMSQuery.UserManagement.Roles;
using FMS.Domain.Entities;
using FMS.Domain.Entities.Auth;
using MediatR;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace FMS.Application;

public interface IJwtGenerator
{
    Task<string> CreateToken(User user);
}

public class JwtSettings
{
    public string SecretKey { get; set; }
    public string Issuer { get; set; }
    public string Audience { get; set; }
    public int ExpireDays { get; set; }
}

public class JwtGenerator : IJwtGenerator
{
    private readonly JwtSettings _jwtSettings;
    private readonly IMediator _mediator;

    public JwtGenerator(IOptions<JwtSettings> jwtSettings, IMediator mediator)
    {
        _jwtSettings = jwtSettings?.Value ?? throw new ArgumentNullException(nameof(jwtSettings));
        _mediator = mediator ?? throw new ArgumentNullException(nameof(mediator));
    }

    public async Task<string> CreateToken(User user)
    {
        if (user == null)
            throw new ArgumentNullException(nameof(user));
        if (string.IsNullOrEmpty(_jwtSettings.SecretKey))
            throw new InvalidOperationException("JWT Secret Key is not configured");

        var userRoles = await _mediator.Send(new GetRolesByUserIDQuery(user.Id));
        var userPermissions = await _mediator.Send(new GetUserPermissionsQuery(user.Id));

        var claims = new List<Claim>
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.UserName ?? string.Empty),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
        };

        claims.AddRange(
            userRoles?.Select(role => new Claim(ClaimTypes.Role, role)) ?? Enumerable.Empty<Claim>()
        );
        claims.AddRange(
            userPermissions?.Select(permission => new Claim("permissions", permission))
                ?? Enumerable.Empty<Claim>()
        );

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtSettings.SecretKey));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var expires = DateTime.Now.AddDays(Convert.ToDouble(_jwtSettings.ExpireDays));

        var token = new JwtSecurityToken(
            issuer: _jwtSettings.Issuer,
            audience: _jwtSettings.Audience,
            claims: claims,
            expires: expires,
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
