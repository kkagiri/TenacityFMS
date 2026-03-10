using System;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using FMS.Domain.Entities.VehicleTracking;
using FMS.Persistence.DataAccess;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System.Net.Http;

namespace FMS.Infrastructure.ExternalServices.GPS.GPSGate.Services
{
    /// <summary>
    /// Shared configuration provider for all GPSGate services
    /// Loads configuration from provider_configurations table instead of appsettings.json
    /// </summary>
    public interface IGPSGateConfigurationProvider
    {
        Task<(string BaseUrl, int ApplicationId, AuthenticationHeaderValue AuthHeader)> GetProviderSettingsAsync();
    }

    public class GPSGateConfigurationProvider : IGPSGateConfigurationProvider
    {
        private readonly GpsdataContext _context;
        private readonly HttpClient _httpClient;
        private readonly ILogger<GPSGateConfigurationProvider> _logger;

        // Cache configuration and token for 5 minutes to reduce database/API calls.
        // Static cache is required because this provider is created per request.
        private static (string BaseUrl, int ApplicationId, AuthenticationHeaderValue AuthHeader)? _cachedSettings;
        private static DateTime _cacheExpiry = DateTime.MinValue;
        private readonly TimeSpan _cacheDuration = TimeSpan.FromMinutes(5);
        private static readonly SemaphoreSlim CacheLock = new(1, 1);

        public GPSGateConfigurationProvider(
            GpsdataContext context,
            HttpClient httpClient,
            ILogger<GPSGateConfigurationProvider> logger)
        {
            _context = context ?? throw new ArgumentNullException(nameof(context));
            _httpClient = httpClient ?? throw new ArgumentNullException(nameof(httpClient));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        public async Task<(string BaseUrl, int ApplicationId, AuthenticationHeaderValue AuthHeader)> GetProviderSettingsAsync()
        {
            // Return cached settings if still valid
            if (_cachedSettings.HasValue && DateTime.UtcNow < _cacheExpiry)
            {
                return _cachedSettings.Value;
            }

            await CacheLock.WaitAsync();

            try
            {
                if (_cachedSettings.HasValue && DateTime.UtcNow < _cacheExpiry)
                {
                    return _cachedSettings.Value;
                }

                var providerConfig = await _context.ProviderConfigurations
                    .AsNoTracking()
                    .FirstOrDefaultAsync(p => p.Name == "GPSGate" && p.IsEnabled);

                if (providerConfig == null)
                {
                    _logger.LogError("GPSGate provider configuration not found or is disabled in database");
                    throw new InvalidOperationException("GPSGate provider configuration not found or is disabled.");
                }

                var settings = JsonSerializer.Deserialize<GPSGateSettings>(
                    providerConfig.Settings,
                    new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

                if (settings == null || string.IsNullOrEmpty(settings.BaseUrl))
                {
                    _logger.LogError("Invalid GPSGate configuration settings in database");
                    throw new InvalidOperationException("Invalid GPSGate configuration settings.");
                }

                AuthenticationHeaderValue authHeader;
                if (!string.IsNullOrEmpty(settings.ApiKey))
                {
                    // Use pre-configured API Key (static token)
                    authHeader = AuthenticationHeaderValue.Parse(settings.ApiKey);
                    _logger.LogInformation("Using static API Key authentication for GPSGate: {ApiKeyPreview}...",
                        settings.ApiKey.Length > 10 ? settings.ApiKey.Substring(0, 10) : settings.ApiKey);
                }
                else if (!string.IsNullOrEmpty(settings.Username) && !string.IsNullOrEmpty(settings.Password))
                {
                    // Authenticate with GPSGate to get a dynamic token
                    var token = await AuthenticateAndGetTokenAsync(settings.BaseUrl, int.Parse(settings.ApplicationId ?? "1"),
                        settings.Username, settings.Password);

                    if (string.IsNullOrEmpty(token))
                    {
                        _logger.LogError("Failed to authenticate with GPSGate and obtain token");
                        throw new InvalidOperationException("Failed to authenticate with GPSGate.");
                    }

                    // GPSGate uses raw token without "Bearer" or "Basic" scheme
                    authHeader = AuthenticationHeaderValue.Parse(token);
                    _logger.LogInformation("Using dynamic token authentication for GPSGate (username: {Username})", settings.Username);
                }
                else
                {
                    _logger.LogError("GPSGate configuration missing both ApiKey and Username/Password");
                    throw new InvalidOperationException("GPSGate configuration missing both ApiKey and Username/Password.");
                }

                var result = (settings.BaseUrl, int.Parse(settings.ApplicationId ?? "1"), authHeader);

                // Cache the settings
                _cachedSettings = result;
                _cacheExpiry = DateTime.UtcNow.Add(_cacheDuration);

                _logger.LogInformation(
                    "GPSGate configuration loaded successfully. BaseUrl: {BaseUrl}, ApplicationId: {ApplicationId}",
                    settings.BaseUrl,
                    settings.ApplicationId);

                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error loading GPSGate configuration from database");
                throw;
            }
            finally
            {
                CacheLock.Release();
            }
        }

        /// <summary>
        /// Authenticate with GPSGate API to get a dynamic access token
        /// </summary>
        private async Task<string?> AuthenticateAndGetTokenAsync(string baseUrl, int applicationId, string username, string password)
        {
            try
            {
                _logger.LogInformation("🔐 Authenticating with GPSGate API for user {Username}", username);

                var tokenUrl = $"{baseUrl}/applications/{applicationId}/tokens";

                // Create the authentication payload
                var authPayload = new
                {
                    username = username,
                    password = password
                };

                var jsonContent = JsonSerializer.Serialize(authPayload);
                var httpContent = new StringContent(jsonContent, Encoding.UTF8, "application/json");

                // Make the authentication request
                var response = await _httpClient.PostAsync(tokenUrl, httpContent);

                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogError("❌ GPSGate authentication failed. Status: {StatusCode}, Response: {Response}",
                        response.StatusCode, errorContent);
                    return null;
                }

                // Parse the token response
                var responseContent = await response.Content.ReadAsStringAsync();
                var tokenResponse = JsonSerializer.Deserialize<GPSGateTokenResponse>(responseContent, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

                if (tokenResponse == null || string.IsNullOrEmpty(tokenResponse.Token))
                {
                    _logger.LogError("❌ Failed to parse GPSGate token response");
                    return null;
                }

                _logger.LogInformation("✅ Successfully authenticated with GPSGate. Token: {TokenPreview}...",
                    tokenResponse.Token.Length > 10 ? tokenResponse.Token.Substring(0, 10) : tokenResponse.Token);

                return tokenResponse.Token;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error during GPSGate authentication");
                return null;
            }
        }

        private class GPSGateSettings
        {
            public string BaseUrl { get; set; } = string.Empty;
            public string ApplicationId { get; set; } = "1";
            public string? Username { get; set; }
            public string? Password { get; set; }
            public string? ApiKey { get; set; }
        }

        private class GPSGateTokenResponse
        {
            public string? Token { get; set; }
        }
    }
}
