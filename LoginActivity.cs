
using System;

namespace FMS.Domain.Entities;

public class LoginActivity
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public DateTime Timestamp { get; set; }
    public string IpAddress { get; set; }
    public bool IsSuccessful { get; set; }

    public virtual User User { get; set; }
}




using Microsoft.EntityFrameworkCore;

namespace FMS.Persistence.DataAccess;

public class GpsdataContext : DbContext
{
    public DbSet<LoginActivity> LoginActivities { get; set; }

    // Other DbSet declarations and configurations
}





using Microsoft.AspNetCore.Mvc;

namespace FMS.WebClient.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AuthenticationService _authenticationService;

    public AuthController(AuthenticationService authenticationService)
    {
        _authenticationService = authenticationService;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] UserLoginDto userLogin)
    {
        var isSuccess = await _authenticationService.AttemptLogin(userLogin.Username, userLogin.Password);
        if (isSuccess)
        {
            return Ok("Login successful");
        }
        else
        {
            return Unauthorized("Invalid username or password");
        }
    }
}
using FMS.Domain.Entities;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using System.Threading.Tasks;

namespace FMS.Application.Services.Authentication;

public class AuthenticationService
{
    private readonly GpsdataContext _context;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public AuthenticationService(GpsdataContext context, IHttpContextAccessor httpContextAccessor)
    {
        _context = context;
        _httpContextAccessor = httpContextAccessor;
    }

    public async Task<bool> AttemptLogin(string username, string password)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.UserName == username);

        // Simulating password check
        bool isPasswordValid = user != null && user.Password == password; // Implement proper password checking

        // Record login attempt
        var loginActivity = new LoginActivity
        {
            UserId = user?.Id ?? 0, // Use 0 or a specific value for failed logins where user is not found
            Timestamp = DateTime.UtcNow,
            IpAddress = _httpContextAccessor.HttpContext.Connection.RemoteIpAddress.ToString(),
            IsSuccessful = isPasswordValid
        };

        _context.LoginActivities.Add(loginActivity);
        await _context.SaveChangesAsync();

        return isPasswordValid;
    }
}
