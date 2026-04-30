using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace FMS.Infrastructure.VehicleTracking.Models.GPSGate
{
    /// <summary>
    /// GPSGate device information
    /// </summary>
    public class GPSGateDeviceInfo
    {
        [JsonPropertyName("iD")]
        public int Id { get; set; }

        [JsonPropertyName("created")]
        public string? Created { get; set; }  // API returns string, not DateTime

        [JsonPropertyName("name")]
        public string? Name { get; set; }

        [JsonPropertyName("hidePosition")]
        public bool? HidePosition { get; set; }

        [JsonPropertyName("proximity")]
        public double? Proximity { get; set; }

        [JsonPropertyName("iMEI")]
        public string? IMEI { get; set; }

        [JsonPropertyName("mSISDN")]
        public GPSGateMsisdn? Msisdn { get; set; }

        [JsonPropertyName("email")]
        public string? Email { get; set; }

        [JsonPropertyName("aPN")]
        public string? APN { get; set; }

        [JsonPropertyName("gPRSUsername")]
        public string? GprsUsername { get; set; }

        [JsonPropertyName("gPRSPassword")]
        public string? GprsPassword { get; set; }

        [JsonPropertyName("lastIP")]
        public string? LastIP { get; set; }

        [JsonPropertyName("lastPort")]
        public int? LastPort { get; set; }

        [JsonPropertyName("staticIP")]
        public string? StaticIP { get; set; }

        [JsonPropertyName("staticPort")]
        public int? StaticPort { get; set; }

        [JsonPropertyName("protocolID")]
        public string? ProtocolID { get; set; }

        [JsonPropertyName("profileId")]
        public int? ProfileId { get; set; }

        [JsonPropertyName("protocolVersionID")]
        public int? ProtocolVersionID { get; set; }

        [JsonPropertyName("msgFieldDictionaryID")]
        public int? MsgFieldDictionaryID { get; set; }

        [JsonPropertyName("deviceDefinitionID")]
        public int? DeviceDefinitionID { get; set; }

        [JsonPropertyName("mobileNetworkID")]
        public int? MobileNetworkID { get; set; }

        [JsonPropertyName("longitude")]
        public double? Longitude { get; set; }

        [JsonPropertyName("latitude")]
        public double? Latitude { get; set; }

        [JsonPropertyName("timeStamp")]
        public string? TimeStamp { get; set; }  // API returns string, not DateTime

        [JsonPropertyName("ownerID")]
        public int? OwnerID { get; set; }

        [JsonPropertyName("ownerUsername")]
        public string? OwnerUsername { get; set; }

        [JsonPropertyName("ownerName")]
        public string? OwnerName { get; set; }

        [JsonPropertyName("ownerEmail")]
        public string? OwnerEmail { get; set; }

        [JsonPropertyName("devicePassword")]
        public string? DevicePassword { get; set; }

        [JsonPropertyName("oneWireVariables")]
        public List<object>? OneWireVariables { get; set; }
    }
}
