using System;
using System.Threading.Tasks;
using System.Xml;
using FMS.Application.Features.GPSGate.DTOs;

namespace FMS.Application.Features.GPSGate.Services
{
    public interface ITrackingDirectoryService
    {
        Task<LoginResponseDto> LoginAsync(string username, string password, int applicationId);
        Task<LoginResponseDto> AuthenticateAsync(); // Convenience method using default credentials
        Task<XmlNode> GetLicenseStatusAsync(string sessionId);
        Task<XmlNode> GetUsersInGroupAsync(string sessionId, int applicationId, string groupName, int viewId);
        Task<bool> ValidateSessionAsync(string sessionId);
    }

    public interface IGPSGateDirectoryService : ITrackingDirectoryService
    {
    }
}
