using FMS.Domain.Entities.PTS;
using FMS.Domain.Entities.PTS.Enums;
using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FMS.Application.PTSServices.ProbeService
{
    public class ProbeService : IProbeService
    {
        private static ConcurrentDictionary<int, ProbeStatus> _probeStates = new ConcurrentDictionary<int, ProbeStatus>();


        public async Task<ProbeMeasurements> GetProbeMeasurementsAsync(int probeId)
        {
            throw new NotImplementedException();

        }

        public async Task<ProbeTankVolumeForHeight> GetProbeTankVolumeForHeight(int probeId, int height)
        {
            throw new NotImplementedException();
        }
    }
}
