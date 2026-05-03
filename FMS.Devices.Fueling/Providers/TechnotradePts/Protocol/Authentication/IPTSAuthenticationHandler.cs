using System.Net;
using System.Threading.Tasks;

namespace FMS.Devices.Fueling.Providers.TechnotradePts.Protocol.Authentication
{
    public interface IPTSAuthenticationHandler
    {
        Task<bool> AuthenticateAsync(HttpListenerContext context);
        Task<bool> ValidateCredentialsAsync(string username, string password);
    }
}