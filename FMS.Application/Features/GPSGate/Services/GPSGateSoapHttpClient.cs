using System;
using System.Linq;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;
using System.Xml.Linq;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.GPSGate.Services
{
    /// <summary>
    /// Direct SOAP HTTP client for GPSGate services.
    /// Bypasses WCF client which has .NET Core compatibility issues with CustomBinding.
    /// </summary>
    public class GPSGateSoapHttpClient : IDisposable
    {
        private readonly HttpClient _httpClient;
        private readonly ILogger _logger;
        private readonly string _baseUrl;

        private static readonly XNamespace SoapNs = "http://schemas.xmlsoap.org/soap/envelope/";
        private static readonly XNamespace GpsGateNs = "http://gpsgate.com/services/";

        public GPSGateSoapHttpClient(string baseUrl, ILogger logger)
        {
            _baseUrl = baseUrl.TrimEnd('/');
            _logger = logger;
            _httpClient = new HttpClient
            {
                Timeout = TimeSpan.FromSeconds(60)
            };
        }

        /// <summary>
        /// Performs GPSGate login and returns session ID
        /// </summary>
        public async Task<(bool Success, string? SessionId, string Message)> LoginAsync(
            string username, string password, int applicationId)
        {
            var endpoint = $"{_baseUrl}/GpsGateServer/Services/directory.asmx";

            var soapBody = new XElement(SoapNs + "Envelope",
                new XAttribute(XNamespace.Xmlns + "soap", SoapNs),
                new XAttribute(XNamespace.Xmlns + "gps", GpsGateNs),
                new XElement(SoapNs + "Body",
                    new XElement(GpsGateNs + "Login",
                        new XElement(GpsGateNs + "strUsername", username),
                        new XElement(GpsGateNs + "strPassword", password),
                        new XElement(GpsGateNs + "iApplicationID", applicationId)
                    )
                )
            );

            try
            {
                var request = new HttpRequestMessage(HttpMethod.Post, endpoint)
                {
                    Content = new StringContent(soapBody.ToString(), Encoding.UTF8, "text/xml")
                };
                request.Headers.Add("SOAPAction", "http://gpsgate.com/services/Login");

                _logger.LogDebug("Sending GPSGate Login SOAP request to {Endpoint}", endpoint);

                var response = await _httpClient.SendAsync(request);
                var responseContent = await response.Content.ReadAsStringAsync();

                _logger.LogDebug("GPSGate Login response status: {Status}", response.StatusCode);

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogWarning("GPSGate Login failed with HTTP {StatusCode}: {Content}",
                        response.StatusCode, responseContent);
                    return (false, null, $"HTTP {(int)response.StatusCode}: {response.ReasonPhrase}");
                }

                // Parse SOAP response
                var responseXml = XDocument.Parse(responseContent);
                var loginResultNode = responseXml.Descendants(GpsGateNs + "LoginResult").FirstOrDefault();

                if (loginResultNode == null)
                {
                    _logger.LogWarning("GPSGate Login response missing LoginResult: {Content}", responseContent);
                    return (false, null, "Invalid response: Missing LoginResult");
                }

                var result = loginResultNode.Value;

                if (string.IsNullOrEmpty(result) || result.StartsWith("ERROR", StringComparison.OrdinalIgnoreCase))
                {
                    return (false, null, result ?? "Login failed");
                }

                // Result is the session ID
                return (true, result, "Login successful");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during GPSGate SOAP login to {Endpoint}", endpoint);
                return (false, null, ex.Message);
            }
        }

        /// <summary>
        /// Gets all users/tracks in an application
        /// </summary>
        public async Task<(bool Success, XDocument? Data, string Message)> GetUsersAsync(
            string sessionId, int applicationId)
        {
            var endpoint = $"{_baseUrl}/GpsGateServer/Services/directory.asmx";

            var soapBody = new XElement(SoapNs + "Envelope",
                new XAttribute(XNamespace.Xmlns + "soap", SoapNs),
                new XAttribute(XNamespace.Xmlns + "gps", GpsGateNs),
                new XElement(SoapNs + "Body",
                    new XElement(GpsGateNs + "GetUsers",
                        new XElement(GpsGateNs + "strSessionID", sessionId),
                        new XElement(GpsGateNs + "iApplicationID", applicationId)
                    )
                )
            );

            try
            {
                var request = new HttpRequestMessage(HttpMethod.Post, endpoint)
                {
                    Content = new StringContent(soapBody.ToString(), Encoding.UTF8, "text/xml")
                };
                request.Headers.Add("SOAPAction", "http://gpsgate.com/services/GetUsers");

                var response = await _httpClient.SendAsync(request);
                var responseContent = await response.Content.ReadAsStringAsync();

                if (!response.IsSuccessStatusCode)
                {
                    return (false, null, $"HTTP {(int)response.StatusCode}: {response.ReasonPhrase}");
                }

                var responseXml = XDocument.Parse(responseContent);
                return (true, responseXml, "Success");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting GPSGate users");
                return (false, null, ex.Message);
            }
        }

        /// <summary>
        /// Performs logout
        /// </summary>
        public async Task<bool> LogoutAsync(string sessionId, int applicationId)
        {
            var endpoint = $"{_baseUrl}/GpsGateServer/Services/directory.asmx";

            var soapBody = new XElement(SoapNs + "Envelope",
                new XAttribute(XNamespace.Xmlns + "soap", SoapNs),
                new XAttribute(XNamespace.Xmlns + "gps", GpsGateNs),
                new XElement(SoapNs + "Body",
                    new XElement(GpsGateNs + "Logout",
                        new XElement(GpsGateNs + "strSessionID", sessionId),
                        new XElement(GpsGateNs + "iApplicationID", applicationId)
                    )
                )
            );

            try
            {
                var request = new HttpRequestMessage(HttpMethod.Post, endpoint)
                {
                    Content = new StringContent(soapBody.ToString(), Encoding.UTF8, "text/xml")
                };
                request.Headers.Add("SOAPAction", "http://gpsgate.com/services/Logout");

                var response = await _httpClient.SendAsync(request);
                return response.IsSuccessStatusCode;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during GPSGate logout");
                return false;
            }
        }

        public void Dispose()
        {
            _httpClient?.Dispose();
        }
    }
}
