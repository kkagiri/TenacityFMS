using FMS.Domain.Entities.PTS;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FMS.Application.PTSServices.ProbeService
{
    public interface IProbeService
    {
        Task<ProbeMeasurements> GetProbeMeasurementsAsync(int probeId);
        Task<ProbeTankVolumeForHeight> GetProbeTankVolumeForHeight(int probeId, int height);
    }
}
