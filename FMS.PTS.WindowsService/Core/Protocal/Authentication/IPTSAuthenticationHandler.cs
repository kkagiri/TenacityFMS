using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Text;
using System.Threading.Tasks;

namespace FMS.PTS.WindowsService.Core.Protocal.Authentication
{
    public interface IPTSAuthenticationHandler
    {
        Task<bool> AuthenticateAsync(HttpListenerContext context);
        Task<bool> ValidateCredentialsAsync(string username, string password);
    }
}
