namespace FMS.Application.Features.PTS {
    public class RemoteServerConfigurationDTO {
        public int[] IpAddress { get; set; }
        public string DomainName { get; set; }
        public int UserId { get; set; }
        public string ProtocolType { get; set; } // e.g. "HTTP" or "HTTPS"
        public int ServerResponseTimeoutSeconds { get; set; }
        public bool UseDeviceIdentifierAsLogin { get; set; }
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
        public int Port { get; set; }
        public string SecretKey { get; set; }
        public bool UpdateSecretKey { get; set; }
        public bool UseWebsocketsCommunication { get; set; }
        public string WebsocketsUri { get; set; }
        public int WebsocketsPort { get; set; }
    }
}