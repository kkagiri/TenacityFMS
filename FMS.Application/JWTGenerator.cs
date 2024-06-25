using FMS.Domain.Entities;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using FMS.Domain.Entities.Auth;
using Microsoft.Extensions.Options;
using MediatR;
using FMS.Application.Queries.Database.FMSQuery.UserManagement.Roles;
using FMS.Application.Queries.Database.FMSQuery.UserManagement.Permissions;
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
        _jwtSettings = jwtSettings.Value;
        _mediator = mediator;
    }
   




    public async Task<string> CreateToken(User user)
    {

      var userRoles = await _mediator.Send(new GetRolesByUserIDQuery(user.Id));
    var userPermissions = await _mediator.Send(new GetUserPermissionsQuery(user.Id));
        var claims = new List<Claim>
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.UserName),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString())      
    };

       claims.AddRange(userRoles.Select(role => new Claim(ClaimTypes.Role, role)));
        claims.AddRange(userPermissions.Select(permission => new Claim("permissions", permission)));

        var key = new Microsoft.IdentityModel.Tokens.SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtSettings.SecretKey));
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
