using System;
using System.IO;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using FMS.Application.Common;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace FMS.WebClient.Middleware {
    /// <summary>
    /// Middleware for enriching FMSResponse objects with request tracking and path information
    /// Automatically adds RequestId, CorrelationId, Path, and Method to FMSResponse objects
    /// </summary>
    public class ResponseEnrichmentMiddleware {
        private readonly RequestDelegate _next;
        private readonly ILogger<ResponseEnrichmentMiddleware> _logger;
        private readonly IHostEnvironment _environment;

        public ResponseEnrichmentMiddleware (
            RequestDelegate next,
            ILogger<ResponseEnrichmentMiddleware> logger,
            IHostEnvironment environment) {
            _next = next ?? throw new ArgumentNullException (nameof (next));
            _logger = logger ?? throw new ArgumentNullException (nameof (logger));
            _environment = environment ?? throw new ArgumentNullException (nameof (environment));
        }

        public async Task InvokeAsync (HttpContext context) {
            if (context == null) {
                throw new ArgumentNullException (nameof (context));
            }

            // Capture the original response body stream
            var originalBodyStream = context.Response.Body;

            try {
                // Replace the response body stream with a memory stream
                using var memoryStream = new MemoryStream ();
                context.Response.Body = memoryStream;

                // Call the next middleware in the pipeline
                await _next (context);

                // Reset the stream position to read from the beginning
                memoryStream.Seek (0, SeekOrigin.Begin);

                // Read the response body
                var responseBody = await new StreamReader (memoryStream).ReadToEndAsync ();

                // Check if response is JSON and likely an FMSResponse
                if (context.Response.ContentType?.Contains ("application/json") == true &&
                    !string.IsNullOrEmpty (responseBody)) {
                    try {
                        // Try to enrich the response
                        var enrichedResponse = EnrichFMSResponse (responseBody, context);
                        responseBody = enrichedResponse;
                    } catch (Exception ex) {
                        // If enrichment fails, log and continue with original response
                        _logger.LogWarning (ex, "Failed to enrich FMSResponse for {Path}", context.Request.Path);
                    }
                }

                // Write the (potentially enriched) response back to the original stream
                var responseBytes = Encoding.UTF8.GetBytes (responseBody);
                context.Response.ContentLength = responseBytes.Length;

                memoryStream.Seek (0, SeekOrigin.Begin);
                await memoryStream.CopyToAsync (originalBodyStream);
            } finally {
                // Restore the original response body stream
                context.Response.Body = originalBodyStream;
            }
        }

        private string EnrichFMSResponse (string responseBody, HttpContext context) {
            // Try to deserialize as a generic JSON object first to check structure
            using var jsonDoc = JsonDocument.Parse (responseBody);
            var root = jsonDoc.RootElement;

            // Check if it has FMSResponse structure (has isSuccess property)
            if (!root.TryGetProperty ("isSuccess", out _)) {
                return responseBody; // Not an FMSResponse, return as-is
            }

            // Get tracking information from HttpContext
            var requestId = context.Items["RequestId"]?.ToString () ?? string.Empty;
            var correlationId = context.Items["CorrelationId"]?.ToString () ?? string.Empty;
            var path = context.Request.Path.ToString ();
            var method = context.Request.Method;

            // Parse, enrich, and re-serialize
            var options = new JsonSerializerOptions {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                WriteIndented = false
            };

            // Deserialize to a mutable dictionary
            var responseDict = JsonSerializer.Deserialize<System.Collections.Generic.Dictionary<string, object>> (
                responseBody,
                options
            );

            // Add/Update tracking properties if not already set
            if (!responseDict.ContainsKey ("requestId") || string.IsNullOrEmpty (responseDict["requestId"]?.ToString ())) {
                responseDict["requestId"] = requestId;
            }

            if (!responseDict.ContainsKey ("correlationId") || string.IsNullOrEmpty (responseDict["correlationId"]?.ToString ())) {
                responseDict["correlationId"] = correlationId;
            }

            if (!responseDict.ContainsKey ("path") || string.IsNullOrEmpty (responseDict["path"]?.ToString ())) {
                responseDict["path"] = path;
            }

            if (!responseDict.ContainsKey ("method") || string.IsNullOrEmpty (responseDict["method"]?.ToString ())) {
                responseDict["method"] = method;
            }

            // Serialize back to JSON
            return JsonSerializer.Serialize (responseDict, options);
        }
    }

    /// <summary>
    /// Extension methods for registering the ResponseEnrichmentMiddleware
    /// </summary>
    public static class ResponseEnrichmentMiddlewareExtensions {
        /// <summary>
        /// Adds response enrichment middleware to the application pipeline
        /// Should be added after request tracking middleware
        /// </summary>
        public static IApplicationBuilder UseResponseEnrichment (this IApplicationBuilder builder) {
            return builder.UseMiddleware<ResponseEnrichmentMiddleware> ();
        }
    }
}
