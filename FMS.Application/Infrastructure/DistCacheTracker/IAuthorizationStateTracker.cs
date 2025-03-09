using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FMS.Application.Infrastructure.DistCacheTracker
{
    public interface IAuthorizationStateTracker
    {
        Task<bool> IsAuthorized(string deviceId, int nozzleId);
        Task SetAuthorized(string deviceId, int nozzleId, AuthState authState);
        Task ClearAuthorization(string deviceId, int nozzleId);

        Task UpdateAuthState(string deviceId, int nozzleId, string newStatus);

        Task UpdateNozzleState(string deviceId, int pumpId, int nozzleId, bool isUp);
        Task<bool> IsNozzleUp(string deviceId, int pumpId);
        Task<AuthState> GetAuthorizationState(string deviceId, int pumpId);

        Task<IEnumerable<AuthState>> GetAllActiveAuthorizations();
    }
}
