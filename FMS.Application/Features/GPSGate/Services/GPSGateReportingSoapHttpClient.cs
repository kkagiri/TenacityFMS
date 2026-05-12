using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;
using System.Xml.Linq;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.GPSGate.Services
{
    /// <summary>
    /// Direct SOAP HTTP client for GPSGate Reporting service.
    /// Bypasses WCF client which has .NET Core compatibility issues with CustomBinding.
    /// </summary>
    public class GPSGateReportingSoapHttpClient : IDisposable
    {
        private readonly HttpClient _httpClient;
        private readonly ILogger _logger;
        private readonly string _baseUrl;

        private static readonly XNamespace SoapNs = "http://schemas.xmlsoap.org/soap/envelope/";
        private static readonly XNamespace ReportNs = "http://gpsgate.com/services/";

        public GPSGateReportingSoapHttpClient(string baseUrl, ILogger logger)
        {
            _baseUrl = baseUrl.TrimEnd('/');
            _logger = logger;
            _httpClient = new HttpClient
            {
                Timeout = TimeSpan.FromSeconds(120) // Longer timeout for reports
            };
        }

        /// <summary>
        /// Initiates report generation
        /// </summary>
        public async Task<(bool Success, int? HandleId, string Message)> GenerateReportAsync(
            string sessionId, int reportId, DateTime startDate, DateTime endDate)
        {
            var endpoint = $"{_baseUrl}/GpsGateServer/Services/reporting.asmx";

            var soapBody = new XElement(SoapNs + "Envelope",
                new XAttribute(XNamespace.Xmlns + "xsi", "http://www.w3.org/2001/XMLSchema-instance"),
                new XAttribute(XNamespace.Xmlns + "xsd", "http://www.w3.org/2001/XMLSchema"),
                new XAttribute(XNamespace.Xmlns + "soap", SoapNs),
                new XElement(SoapNs + "Body",
                    new XElement(ReportNs + "GenerateReport",
                        new XElement(ReportNs + "strSessionID", sessionId),
                        new XElement(ReportNs + "iReportID", reportId),
                        new XElement(ReportNs + "startDate", startDate.ToString("yyyy-MM-ddTHH:mm:ss")),
                        new XElement(ReportNs + "endDate", endDate.ToString("yyyy-MM-ddTHH:mm:ss"))
                    )
                )
            );

            try
            {
                var request = new HttpRequestMessage(HttpMethod.Post, endpoint)
                {
                    Content = new StringContent(soapBody.ToString(), Encoding.UTF8, "text/xml")
                };
                request.Headers.Add("SOAPAction", "http://gpsgate.com/services/GenerateReport");

                _logger.LogDebug("Sending GPSGate GenerateReport SOAP request to {Endpoint}", endpoint);

                var response = await _httpClient.SendAsync(request);
                var responseContent = await response.Content.ReadAsStringAsync();

                _logger.LogDebug("GPSGate GenerateReport response status: {Status}, Content: {Content}",
                    response.StatusCode, responseContent);

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogWarning("GPSGate GenerateReport failed with HTTP {StatusCode}: {Content}",
                        response.StatusCode, responseContent);
                    return (false, null, $"HTTP {(int)response.StatusCode}: {response.ReasonPhrase}");
                }

                // Parse SOAP response
                var responseXml = XDocument.Parse(responseContent);

                // Check for <error> element FIRST (GPSGate returns this for validation errors)
                var errorNode = responseXml.Descendants("error").FirstOrDefault();
                if (errorNode != null)
                {
                    var exceptionNode = errorNode.Descendants("exception").FirstOrDefault();
                    if (exceptionNode != null)
                    {
                        var errorMessage = exceptionNode.Descendants("message").FirstOrDefault()?.Value ?? "Unknown error";
                        var errorType = exceptionNode.Descendants("type").FirstOrDefault()?.Value;

                        _logger.LogWarning("GPSGate GenerateReport validation error - Type: {Type}, Message: {Message}",
                            errorType, errorMessage);

                        return (false, null, errorMessage);
                    }
                }

                // Check for SOAP fault
                var faultNode = responseXml.Descendants(SoapNs + "Fault").FirstOrDefault();
                if (faultNode != null)
                {
                    var faultMessage = faultNode.Descendants("faultstring").FirstOrDefault()?.Value ?? "Unknown SOAP fault";
                    _logger.LogWarning("GPSGate GenerateReport SOAP fault: {Message}", faultMessage);
                    return (false, null, faultMessage);
                }

                // Look for exception in response body (different location than <error>)
                var bodyExceptionNode = responseXml.Descendants(SoapNs + "Body")
                    .Descendants("exception").FirstOrDefault();
                if (bodyExceptionNode != null)
                {
                    var errorMessage = bodyExceptionNode.Descendants("message").FirstOrDefault()?.Value ?? "Unknown error";
                    _logger.LogWarning("GPSGate GenerateReport exception: {Message}", errorMessage);
                    return (false, null, errorMessage);
                }

                // Find handleId in response - check reportHandler container first
                XElement? handleIdNode = null;

                // Try reportHandler > handleid (this is the correct structure)
                var reportHandlerNode = responseXml.Descendants()
                    .FirstOrDefault(e => e.Name.LocalName.Equals("reportHandler", StringComparison.OrdinalIgnoreCase));

                if (reportHandlerNode != null)
                {
                    handleIdNode = reportHandlerNode.Descendants()
                        .FirstOrDefault(e => e.Name.LocalName.Equals("handleid", StringComparison.OrdinalIgnoreCase));

                    _logger.LogDebug("Found reportHandler structure in response");
                }

                // Fallback: search anywhere in document
                if (handleIdNode == null)
                {
                    handleIdNode = responseXml.Descendants()
                        .FirstOrDefault(e => e.Name.LocalName.Equals("handleid", StringComparison.OrdinalIgnoreCase));
                }

                if (handleIdNode == null || !int.TryParse(handleIdNode.Value, out var handleId))
                {
                    _logger.LogWarning("GPSGate GenerateReport response missing handleId: {Content}", responseContent);
                    return (false, null, "Invalid response: Missing handleId");
                }

                return (true, handleId, "Report generation initiated");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during GPSGate GenerateReport to {Endpoint}", endpoint);
                return (false, null, ex.Message);
            }
        }

        /// <summary>
        /// Gets the status of a report being generated
        /// </summary>
        public async Task<(bool Success, string? Status, int Progress, string Message)> GetReportStatusAsync(
            string sessionId, int handleId)
        {
            var endpoint = $"{_baseUrl}/GpsGateServer/Services/reporting.asmx";

            var soapBody = new XElement(SoapNs + "Envelope",
                new XAttribute(XNamespace.Xmlns + "xsi", "http://www.w3.org/2001/XMLSchema-instance"),
                new XAttribute(XNamespace.Xmlns + "xsd", "http://www.w3.org/2001/XMLSchema"),
                new XAttribute(XNamespace.Xmlns + "soap", SoapNs),
                new XElement(SoapNs + "Body",
                    new XElement(ReportNs + "GetReportStatus",
                        new XElement(ReportNs + "strSessionID", sessionId),
                        new XElement(ReportNs + "iHandleID", handleId)
                    )
                )
            );

            try
            {
                var request = new HttpRequestMessage(HttpMethod.Post, endpoint)
                {
                    Content = new StringContent(soapBody.ToString(), Encoding.UTF8, "text/xml")
                };
                request.Headers.Add("SOAPAction", "http://gpsgate.com/services/GetReportStatus");

                _logger.LogDebug("Sending GPSGate GetReportStatus SOAP request for handle {HandleId}", handleId);

                var response = await _httpClient.SendAsync(request);
                var responseContent = await response.Content.ReadAsStringAsync();

                _logger.LogInformation("GPSGate GetReportStatus RAW Response for handle {HandleId}: {Response}",
                    handleId, responseContent);

                if (!response.IsSuccessStatusCode)
                {
                    return (false, null, 0, $"HTTP {(int)response.StatusCode}: {response.ReasonPhrase}");
                }

                // Parse SOAP response
                var responseXml = XDocument.Parse(responseContent);

                // Check for exception
                var exceptionNode = responseXml.Descendants("exception").FirstOrDefault();
                if (exceptionNode != null)
                {
                    var errorMessage = exceptionNode.Descendants("message").FirstOrDefault()?.Value ?? "Unknown error";
                    _logger.LogWarning("GPSGate returned exception for handle {HandleId}: {Error}", handleId, errorMessage);
                    return (false, null, 0, errorMessage);
                }

                // Find status/state and progress (case-insensitive)
                // GPSGate returns <state> not <status>
                var statusNode = responseXml.Descendants()
                    .FirstOrDefault(e => e.Name.LocalName.Equals("state", StringComparison.OrdinalIgnoreCase)
                                      || e.Name.LocalName.Equals("status", StringComparison.OrdinalIgnoreCase));
                var progressNode = responseXml.Descendants()
                    .FirstOrDefault(e => e.Name.LocalName.Equals("progress", StringComparison.OrdinalIgnoreCase));

                var status = statusNode?.Value ?? "Unknown";
                var progress = 0;
                if (progressNode != null)
                {
                    int.TryParse(progressNode.Value, out progress);
                }

                _logger.LogInformation("GPSGate report {HandleId} PARSED status: '{Status}', progress: {Progress}",
                    handleId, status, progress);

                return (true, status, progress, $"Report is {status}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during GPSGate GetReportStatus for handle {HandleId}", handleId);
                return (false, null, 0, ex.Message);
            }
        }

        /// <summary>
        /// Fetches completed report data
        /// </summary>
        public async Task<(bool Success, string? ReportData, string Message)> FetchReportAsync(
            string sessionId, int handleId)
        {
            var endpoint = $"{_baseUrl}/GpsGateServer/Services/reporting.asmx";

            var soapBody = new XElement(SoapNs + "Envelope",
                new XAttribute(XNamespace.Xmlns + "xsi", "http://www.w3.org/2001/XMLSchema-instance"),
                new XAttribute(XNamespace.Xmlns + "xsd", "http://www.w3.org/2001/XMLSchema"),
                new XAttribute(XNamespace.Xmlns + "soap", SoapNs),
                new XElement(SoapNs + "Body",
                    new XElement(ReportNs + "FetchReport",
                        new XElement(ReportNs + "strSessionID", sessionId),
                        new XElement(ReportNs + "iHandleID", handleId)
                    )
                )
            );

            try
            {
                var request = new HttpRequestMessage(HttpMethod.Post, endpoint)
                {
                    Content = new StringContent(soapBody.ToString(), Encoding.UTF8, "text/xml")
                };
                request.Headers.Add("SOAPAction", "http://gpsgate.com/services/FetchReport");

                _logger.LogDebug("Sending GPSGate FetchReport SOAP request for handle {HandleId}", handleId);

                var response = await _httpClient.SendAsync(request);
                var responseContent = await response.Content.ReadAsStringAsync();

                if (!response.IsSuccessStatusCode)
                {
                    return (false, null, $"HTTP {(int)response.StatusCode}: {response.ReasonPhrase}");
                }

                // Parse SOAP response
                var responseXml = XDocument.Parse(responseContent);

                // Check for exception
                var exceptionNode = responseXml.Descendants("exception").FirstOrDefault();
                if (exceptionNode != null)
                {
                    var errorMessage = exceptionNode.Descendants("message").FirstOrDefault()?.Value ?? "Unknown error";
                    return (false, null, errorMessage);
                }

                // Find FetchReportResult node
                var resultNode = responseXml.Descendants().FirstOrDefault(e => e.Name.LocalName == "FetchReportResult");
                if (resultNode == null)
                {
                    _logger.LogWarning("GPSGate FetchReport response missing FetchReportResult: {Content}", responseContent);
                    return (false, null, "Invalid response: Missing FetchReportResult");
                }

                return (true, resultNode.ToString(), "Report fetched successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during GPSGate FetchReport for handle {HandleId}", handleId);
                return (false, null, ex.Message);
            }
        }

        /// <summary>
        /// Cancels a report being generated
        /// </summary>
        public async Task<(bool Success, string Message)> CancelReportAsync(string sessionId, int handleId)
        {
            var endpoint = $"{_baseUrl}/GpsGateServer/Services/reporting.asmx";

            var soapBody = new XElement(SoapNs + "Envelope",
                new XAttribute(XNamespace.Xmlns + "xsi", "http://www.w3.org/2001/XMLSchema-instance"),
                new XAttribute(XNamespace.Xmlns + "xsd", "http://www.w3.org/2001/XMLSchema"),
                new XAttribute(XNamespace.Xmlns + "soap", SoapNs),
                new XElement(SoapNs + "Body",
                    new XElement(ReportNs + "CancelReport",
                        new XElement(ReportNs + "strSessionID", sessionId),
                        new XElement(ReportNs + "iHandleID", handleId)
                    )
                )
            );

            try
            {
                var request = new HttpRequestMessage(HttpMethod.Post, endpoint)
                {
                    Content = new StringContent(soapBody.ToString(), Encoding.UTF8, "text/xml")
                };
                request.Headers.Add("SOAPAction", "http://gpsgate.com/services/CancelReport");

                _logger.LogDebug("Sending GPSGate CancelReport SOAP request for handle {HandleId}", handleId);

                var response = await _httpClient.SendAsync(request);
                var responseContent = await response.Content.ReadAsStringAsync();

                if (!response.IsSuccessStatusCode)
                {
                    return (false, $"HTTP {(int)response.StatusCode}: {response.ReasonPhrase}");
                }

                // Parse SOAP response
                var responseXml = XDocument.Parse(responseContent);

                // Check for exception
                var exceptionNode = responseXml.Descendants("exception").FirstOrDefault();
                if (exceptionNode != null)
                {
                    var errorMessage = exceptionNode.Descendants("message").FirstOrDefault()?.Value ?? "Unknown error";
                    return (false, errorMessage);
                }

                return (true, "Report cancelled successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during GPSGate CancelReport for handle {HandleId}", handleId);
                return (false, ex.Message);
            }
        }

        /// <summary>
        /// Get list of currently processing reports
        /// </summary>
        public async Task<(bool Success, List<ProcessingReportInfo> Reports, string Message)> GetProcessingReportsAsync(
            string sessionId, int applicationId)
        {
            var endpoint = $"{_baseUrl}/GpsGateServer/Services/reporting.asmx";

            var soapBody = new XElement(SoapNs + "Envelope",
                new XAttribute(XNamespace.Xmlns + "xsi", "http://www.w3.org/2001/XMLSchema-instance"),
                new XAttribute(XNamespace.Xmlns + "xsd", "http://www.w3.org/2001/XMLSchema"),
                new XAttribute(XNamespace.Xmlns + "soap", SoapNs),
                new XElement(SoapNs + "Body",
                    new XElement(ReportNs + "GetProcessingReports",
                        new XElement(ReportNs + "strSessionID", sessionId),
                        new XElement(ReportNs + "iAppplicationID", applicationId)
                    )
                )
            );

            try
            {
                var request = new HttpRequestMessage(HttpMethod.Post, endpoint)
                {
                    Content = new StringContent(soapBody.ToString(), Encoding.UTF8, "text/xml")
                };
                request.Headers.Add("SOAPAction", "http://gpsgate.com/services/GetProcessingReports");

                _logger.LogDebug("Sending GPSGate GetProcessingReports SOAP request for applicationId {ApplicationId}", applicationId);

                var response = await _httpClient.SendAsync(request);
                var responseContent = await response.Content.ReadAsStringAsync();

                _logger.LogDebug("GPSGate GetProcessingReports response: {Response}", responseContent);

                if (!response.IsSuccessStatusCode)
                {
                    return (false, new List<ProcessingReportInfo>(), $"HTTP {(int)response.StatusCode}: {response.ReasonPhrase}");
                }

                // Parse SOAP response
                var responseXml = XDocument.Parse(responseContent);

                // Check for exception
                var exceptionNode = responseXml.Descendants("exception").FirstOrDefault();
                if (exceptionNode != null)
                {
                    var errorMessage = exceptionNode.Descendants("message").FirstOrDefault()?.Value ?? "Unknown error";
                    return (false, new List<ProcessingReportInfo>(), errorMessage);
                }

                // Parse processing reports - structure may vary
                var reports = new List<ProcessingReportInfo>();

                // Try to find report entries in the response
                var reportNodes = responseXml.Descendants()
                    .Where(e => e.Name.LocalName == "handleId" || e.Name.LocalName == "Report" || e.Name.LocalName == "item")
                    .ToList();

                // Also try finding by handle attribute or element
                var handleNodes = responseXml.Descendants()
                    .Where(e => e.Name.LocalName.Contains("handle", StringComparison.OrdinalIgnoreCase))
                    .ToList();

                foreach (var node in handleNodes)
                {
                    if (int.TryParse(node.Value, out var handleId))
                    {
                        reports.Add(new ProcessingReportInfo { HandleId = handleId });
                    }
                }

                _logger.LogInformation("Found {Count} processing reports", reports.Count);
                return (true, reports, $"Found {reports.Count} processing reports");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during GPSGate GetProcessingReports");
                return (false, new List<ProcessingReportInfo>(), ex.Message);
            }
        }

        public void Dispose()
        {
            _httpClient?.Dispose();
        }
    }

    /// <summary>
    /// Information about a currently processing report
    /// </summary>
    public class ProcessingReportInfo
    {
        public int HandleId { get; set; }
        public int? ReportId { get; set; }
        public string? Status { get; set; }
        public int? Progress { get; set; }
    }
}
