using System;

namespace FMS.Application.Features.GPSGate.DTOs
{
    public class GPSGateSessionDto
    {
        public string SessionId { get; set; }
        public string Username { get; set; }
        public int ApplicationId { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? ExpiresAt { get; set; }
        public bool IsActive { get; set; }
    }

    public class LoginRequestDto
    {
        public string Username { get; set; }
        public string Password { get; set; }
        public int ApplicationId { get; set; }
    }

    public class LoginResponseDto
    {
        public string SessionId { get; set; }
        public bool Success { get; set; }
        public string Message { get; set; }
    }
}
