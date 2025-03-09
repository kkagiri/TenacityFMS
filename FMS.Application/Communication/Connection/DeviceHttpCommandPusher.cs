using System;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Json;
using System.Text.Json;
using System.Threading.Tasks;
using FMS.Application.Infrastructure.ErrorCodes.Common;
using FMS.Domain.PTSCommon;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Communication.Connection;


public class DeviceHttpCommandPusher : IDeviceHttpCommandPusher
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<DeviceHttpCommandPusher> _logger;


    public DeviceHttpCommandPusher(HttpClient httpClient, ILogger<DeviceHttpCommandPusher> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
    }



    public async Task<(bool Success, int? ErrorCode, PTSMessage? Response)> SendPTSMessageAsync(string ipAddress, int port, PTSMessage ptsMessage, string? bearerToken = null)
    {
        try
        {
            var url = $"http://{ipAddress}:{port}";
            var jsonRequest = JsonSerializer.Serialize(ptsMessage);
            _logger.LogDebug("Sending PTSMessage via HTTP to {Url}: {Json}", url, jsonRequest);

            using var request = new HttpRequestMessage(HttpMethod.Post, url)
            {
                Content = new StringContent(jsonRequest, System.Text.Encoding.UTF8, "application/json")
            };


            if (!string.IsNullOrEmpty(bearerToken))
            {
                request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", bearerToken);
            }

            var response = await _httpClient.SendAsync(request);
            var responseBody = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning(
                    "HTTP request to device at {Url} failed with status {StatusCode}. Body: {Body}",
                    url, response.StatusCode, responseBody
                );
                // Attempt to parse a PTSMessage from the error body
                var errorMsg = TryParsePTSMessage(responseBody);
                var errorPacket = errorMsg?.Packets.FirstOrDefault(p => p.Error == true);
                if (errorPacket != null && errorPacket.Code.HasValue)
                {
                    return (false, errorPacket.Code, errorMsg);
                }
                // If we can't parse a valid error code, fallback to an unknown error
                return (false, 1, errorMsg);
            }

            // If success, parse the JSON into a PTSMessage
            var ptsResponse = TryParsePTSMessage(responseBody);
            if (ptsResponse == null)
            {
                // If the device didn't return a valid PTSMessage
                _logger.LogWarning("Device responded with non-PTS JSON: {Body}", responseBody);
                return (true, null, null);
            }

            // Check if there's an error packet in the response
            var packetError = ptsResponse.Packets.FirstOrDefault(p => p.Error == true);
            if (packetError != null && packetError.Code.HasValue)
            {
                return (false, packetError.Code, ptsResponse);
            }

            // Otherwise, it's a success scenario
            return (true, null, ptsResponse);
        }

        catch (JsonException ex)
        {
            _logger.LogError(ex, "Failed to serialize PTSMessage to JSON: {PTSMessage}", ptsMessage);
            return (false, 1, null);
        }
    }

    private PTSMessage? TryParsePTSMessage(string json)
    {
        try
        {
            return JsonSerializer.Deserialize<PTSMessage>(json);
        }
        catch (JsonException ex)
        {
            _logger.LogWarning(ex, "Failed to deserialize PTSMessage from JSON: {Json}", json);
            return null;
        }
    }
}

