namespace FMS.Application.Features.GPSGate.DTOs
{
    /// <summary>
    /// GPSGate provider settings model for JSON deserialization from provider_configurations table
    /// </summary>
    public class GPSGateProviderSettings
    {
        public string? Username { get; set; }
        public string? Password { get; set; }
        public string? BaseUrl { get; set; }
        public string? ApplicationId { get; set; }
    }
}
