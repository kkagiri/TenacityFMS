using System.Collections.Generic;

namespace FMS.Application.Features.PTS {
    /// <summary>
    /// Represents the configuration of pump nozzles for a specific pump
    /// </summary>
    public class PumpNozzlesConfigurationDTO {
        public List<PumpNozzleItemDTO> PumpNozzles { get; set; }
    }

    public class PumpNozzleItemDTO {
        public int PumpId { get; set; }
        public int[] FuelGradeIds { get; set; }
        public int[] TankIds { get; set; } // Optional
    }
}