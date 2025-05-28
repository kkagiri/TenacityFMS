//Cursor
using System.Collections.Generic;

namespace FMS.Domain.PTSCommon.Responses {
    // Based on 31. DateTime response
    public class DateTimeResponse {
        public string DateTime { get; set; }
        public bool AutoSynchronize { get; set; }
        public int UTCOffset { get; set; }
    }

    // Based on 34. PtsNetworkSettings response
    public class PtsNetworkSettingsResponse {
        public List<int> IpAddress { get; set; }
        public List<int> NetMask { get; set; }
        public List<int> Gateway { get; set; }
        public int HttpPort { get; set; }
        public int HttpsPort { get; set; }
        public List<int> Dns1 { get; set; }
        public List<int> Dns2 { get; set; }
        public string UsedProtocolType { get; set; }
        public string UsedAuthenticationType { get; set; }
    }

    // Based on 50. PumpsConfiguration response
    public class PumpsConfigurationResponse {
        public List<PumpPortConfig> Ports { get; set; }
        public List<PumpConfig> Pumps { get; set; }
    }

    public class PumpPortConfig {
        public int Id { get; set; }
        public int Protocol { get; set; }
        public int BaudRate { get; set; }
    }

    public class PumpConfig {
        public int Id { get; set; }
        public int Port { get; set; }
        public int Address { get; set; }
    }

    // Based on 53. ProbesConfiguration response
    public class ProbesConfigurationResponse {
        public List<ProbePortConfig> Ports { get; set; }
        public List<ProbeConfig> Probes { get; set; }
    }

    public class ProbePortConfig {
        public string Id { get; set; } // "DISP", "LOG", "USER", "PC"
        public int Protocol { get; set; }
        public int BaudRate { get; set; }
    }

    public class ProbeConfig {
        public int Id { get; set; }
        public string Port { get; set; } // "DISP", "LOG", "USER", "PC"
        public int Address { get; set; }
    }

    // Based on 59. FuelGradesConfiguration response
    public class FuelGradesConfigurationResponse {
        public List<FuelGradeConfig> FuelGrades { get; set; }
    }

    public class FuelGradeConfig {
        public int Id { get; set; }
        public string Name { get; set; }
        public decimal Price { get; set; }
        public decimal ExpansionCoefficient { get; set; }
        public int? BlendTank1Id { get; set; }
        public int? BlendTank1Percentage { get; set; }
        public int? BlendTank2Id { get; set; }
    }

    // Based on 71. TanksConfiguration response
    public class TanksConfigurationResponse {
        public List<TankConfig> Tanks { get; set; }
    }

    public class TankConfig {
        public int Id { get; set; }
        public int FuelGradeId { get; set; }
        public int Height { get; set; }
        public int? CriticalHighProductAlarmHeight { get; set; }
        public int? HighProductAlarmHeight { get; set; }
        public int? LowProductAlarmHeight { get; set; }
        public int? CriticalLowProductAlarmHeight { get; set; }
        public int? HighWaterAlarmHeight { get; set; }
        public bool StopPumpsAtCriticalLowProductHeight { get; set; }
        public bool AutomaticCalibrationEnabled { get; set; }
        public bool AutomaticCalibrationReadyForGeneration { get; set; }
    }
}