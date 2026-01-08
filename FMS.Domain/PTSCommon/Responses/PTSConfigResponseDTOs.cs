//Cursor
using System.Collections.Generic;

namespace FMS.Domain.PTSCommon.Responses
{
    // Based on 31. DateTime response
    public class DateTimeResponse
    {
        public string DateTime { get; set; }
        public bool AutoSynchronize { get; set; }
        public int UTCOffset { get; set; }
    }

    // Based on 34. PtsNetworkSettings response
    public class PtsNetworkSettingsResponse
    {
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
    public class PumpsConfigurationResponse
    {
        public List<PumpPortConfig> Ports { get; set; }
        public List<PumpConfig> Pumps { get; set; }
    }

    public class PumpPortConfig
    {
        public int Id { get; set; }
        public int Protocol { get; set; }
        public int BaudRate { get; set; }
    }

    public class PumpConfig
    {
        public int Id { get; set; }
        public int Port { get; set; }
        public int Address { get; set; }
    }

    // Based on 53. ProbesConfiguration response
    public class ProbesConfigurationResponse
    {
        public List<ProbePortConfig> Ports { get; set; }
        public List<ProbeConfig> Probes { get; set; }
    }

    public class ProbePortConfig
    {
        public string Id { get; set; } // "DISP", "LOG", "USER", "PC"
        public int Protocol { get; set; }
        public int BaudRate { get; set; }
    }

    public class ProbeConfig
    {
        public int Id { get; set; }
        public string Port { get; set; } // "DISP", "LOG", "USER", "PC"
        public int Address { get; set; }
    }

    // Based on 59. FuelGradesConfiguration response
    public class FuelGradesConfigurationResponse
    {
        public List<FuelGradeConfig> FuelGrades { get; set; }
    }

    public class FuelGradeConfig
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public decimal Price { get; set; }
        public decimal ExpansionCoefficient { get; set; }
        public int? BlendTank1Id { get; set; }
        public int? BlendTank1Percentage { get; set; }
        public int? BlendTank2Id { get; set; }
    }

    // Based on 71. TanksConfiguration response
    public class TanksConfigurationResponse
    {
        public List<TankConfig> Tanks { get; set; }
    }

    public class TankConfig
    {
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

    /// <summary>
    /// Based on 37. RemoteServerConfiguration response
    /// Contains all remote server and WebSocket configuration settings
    /// </summary>
    public class RemoteServerConfigurationResponse
    {
        // Server Address
        public List<int> IpAddress { get; set; }
        public string DomainName { get; set; }
        public int UserId { get; set; }
        public string ProtocolType { get; set; }
        public int ServerResponseTimeoutSeconds { get; set; }
        public bool UseDeviceIdentifierAsLogin { get; set; }

        // HTTP Upload Settings
        public bool UploadPumpTransactions { get; set; }
        public string UploadPumpTransactionsUri { get; set; }
        public bool UploadTankMeasurements { get; set; }
        public string UploadTankMeasurementsUri { get; set; }
        public bool UploadInTankDeliveries { get; set; }
        public string UploadInTankDeliveriesUri { get; set; }
        public bool UploadGpsRecords { get; set; }
        public string UploadGpsRecordsUri { get; set; }
        public bool UploadAlertRecords { get; set; }
        public string UploadAlertRecordsUri { get; set; }
        public bool UploadConfiguration { get; set; }
        public string UploadConfigurationUri { get; set; }
        public bool UploadStatus { get; set; }
        public string UploadStatusUri { get; set; }
        public int UploadStatusRequestsPeriodSeconds { get; set; }
        public bool RequestTagsInformation { get; set; }
        public string RequestTagsInformationUri { get; set; }
        public int Port { get; set; }
        public bool IsUploadSuccessful { get; set; }

        // WebSocket Settings
        public string WebsocketsUri { get; set; }
        public int WebsocketsPort { get; set; }
        public bool WebsocketsUploadPumpTransactions { get; set; }
        public bool WebsocketsUploadTankMeasurements { get; set; }
        public bool WebsocketsUploadInTankDeliveries { get; set; }
        public bool WebsocketsUploadGpsRecords { get; set; }
        public bool WebsocketsUploadAlertRecords { get; set; }
        public bool WebsocketsUploadConfiguration { get; set; }
        public bool WebsocketsUploadStatus { get; set; }
        public int WebsocketsUploadStatusRequestsPeriodSeconds { get; set; }
        public bool WebsocketsRequestTagsInformation { get; set; }
        public bool IsWebsocketsCommunicationSuccessful { get; set; }
        public bool UseWebsocketsCommunication { get; set; }
        public bool IsConnectionSuccessful { get; set; }
    }

    /// <summary>
    /// Request DTO for setting remote server configuration
    /// All properties are optional - only send what needs to change
    /// </summary>
    public class SetRemoteServerConfigurationRequest
    {
        // Server Address (optional)
        public List<int>? IpAddress { get; set; }
        public string? DomainName { get; set; }
        public int? UserId { get; set; }
        public string? ProtocolType { get; set; }
        public int? ServerResponseTimeoutSeconds { get; set; }
        public bool? UseDeviceIdentifierAsLogin { get; set; }

        // HTTP Upload Settings (optional)
        public bool? UploadPumpTransactions { get; set; }
        public string? UploadPumpTransactionsUri { get; set; }
        public bool? UploadTankMeasurements { get; set; }
        public string? UploadTankMeasurementsUri { get; set; }
        public bool? UploadInTankDeliveries { get; set; }
        public string? UploadInTankDeliveriesUri { get; set; }
        public bool? UploadGpsRecords { get; set; }
        public string? UploadGpsRecordsUri { get; set; }
        public bool? UploadAlertRecords { get; set; }
        public string? UploadAlertRecordsUri { get; set; }
        public bool? UploadConfiguration { get; set; }
        public string? UploadConfigurationUri { get; set; }
        public bool? UploadStatus { get; set; }
        public string? UploadStatusUri { get; set; }
        public int? UploadStatusRequestsPeriodSeconds { get; set; }
        public bool? RequestTagsInformation { get; set; }
        public string? RequestTagsInformationUri { get; set; }
        public int? Port { get; set; }
        public string? SecretKey { get; set; }
        public bool? UpdateSecretKey { get; set; }

        // WebSocket Settings (optional)
        public string? WebsocketsUri { get; set; }
        public int? WebsocketsPort { get; set; }
        public bool? WebsocketsUploadPumpTransactions { get; set; }
        public bool? WebsocketsUploadTankMeasurements { get; set; }
        public bool? WebsocketsUploadInTankDeliveries { get; set; }
        public bool? WebsocketsUploadGpsRecords { get; set; }
        public bool? WebsocketsUploadAlertRecords { get; set; }
        public bool? WebsocketsUploadConfiguration { get; set; }
        public bool? WebsocketsUploadStatus { get; set; }
        public int? WebsocketsUploadStatusRequestsPeriodSeconds { get; set; }
        public bool? WebsocketsRequestTagsInformation { get; set; }
        public bool? UseWebsocketsCommunication { get; set; }
    }
}