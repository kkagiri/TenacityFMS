using System;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using System.Xml;
using DirectoryServiceReference;
using FMS.Application.Features.GPSGate.DTOs;
using FMS.Domain.Entities.VehicleTracking;
using FMS.Persistence.DataAccess;
using Microsoft.Extensions.Logging;
using Microsoft.EntityFrameworkCore;

namespace FMS.Application.Features.GPSGate.Services
{
    public class GPSGateDirectoryService : IGPSGateDirectoryService
    {
        // Note: WCF client has .NET Core compatibility issues with CustomBinding
        // Using direct HTTP client instead (GPSGateSoapHttpClient)
        private GPSGateSoapHttpClient? _httpClient;
        private readonly GpsdataContext _context;
        private readonly ILogger<GPSGateDirectoryService> _logger;
        private ProviderConfigurationEntity? _providerConfig;
        private GPSGateProviderSettings? _settings;

        public GPSGateDirectoryService(
            GpsdataContext context,
            ILogger<GPSGateDirectoryService> logger)
        {
            _context = context;
            _logger = logger;
        }

        private async Task<bool> InitializeClientAsync()
        {
            if (_httpClient != null)
                return true;

            try
            {
                _logger.LogInformation("InitializeClientAsync: Starting to look for GPSGateSOAP provider configuration...");

                // First, let's see what's in the ProviderConfigurations table
                var allConfigs = await _context.ProviderConfigurations
                    .IgnoreQueryFilters()
                    .ToListAsync();

                _logger.LogInformation("InitializeClientAsync: Found {Count} total provider configurations (including deleted)", allConfigs.Count);

                foreach (var cfg in allConfigs)
                {
                    _logger.LogInformation("InitializeClientAsync: Config - Id={Id}, Name={Name}, IsEnabled={IsEnabled}, IsDeleted={IsDeleted}",
                        cfg.Id, cfg.Name, cfg.IsEnabled, cfg.IsDeleted);
                }

                // Get GPSGate SOAP provider configuration from database
                _providerConfig = await _context.ProviderConfigurations
                    .IgnoreQueryFilters() // Ignore global query filter to debug
                    .Where(pc => pc.Name == "GPSGateSOAP" && pc.IsEnabled && !pc.IsDeleted)
                    .OrderByDescending(pc => pc.Priority)
                    .FirstOrDefaultAsync();

                if (_providerConfig == null)
                {
                    _logger.LogError("GPSGate SOAP provider configuration not found in database. Please add a record with Name='GPSGateSOAP' to provider_configurations table.");
                    return false;
                }

                _logger.LogInformation("InitializeClientAsync: Found GPSGateSOAP config with Id={Id}, Settings={Settings}",
                    _providerConfig.Id, _providerConfig.Settings);

                // Parse settings JSON
                _settings = JsonSerializer.Deserialize<GPSGateProviderSettings>(_providerConfig.Settings);
                if (_settings == null || string.IsNullOrEmpty(_settings.BaseUrl))
                {
                    _logger.LogError($"Invalid settings in provider configuration ID {_providerConfig.Id}. Settings JSON: {_providerConfig.Settings}");
                    return false;
                }

                // Validate URL format
                if (!Uri.TryCreate(_settings.BaseUrl, UriKind.Absolute, out var validatedUri) ||
                    (validatedUri.Scheme != Uri.UriSchemeHttp && validatedUri.Scheme != Uri.UriSchemeHttps))
                {
                    _logger.LogError($"BaseUrl in provider configuration is not a valid HTTP/HTTPS URL: {_settings.BaseUrl}");
                    return false;
                }

                _logger.LogInformation("InitializeClientAsync: Creating direct HTTP SOAP client for base URL: {BaseUrl}", _settings.BaseUrl);

                // Use direct HTTP client instead of WCF client
                // The WCF-generated client has .NET Core CustomBinding compatibility issues
                _httpClient = new GPSGateSoapHttpClient(_settings.BaseUrl, _logger);

                _logger.LogInformation($"GPSGate HTTP SOAP client initialized with BaseUrl: {_settings.BaseUrl}");
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error initializing GPSGate SOAP client");
                return false;
            }
        }

        public async Task<LoginResponseDto> AuthenticateAsync()
        {
            if (!await InitializeClientAsync())
            {
                return new LoginResponseDto
                {
                    Success = false,
                    Message = "GPSGate SOAP provider not configured. Please add provider configuration to database."
                };
            }

            // Use credentials from provider configuration
            if (_settings == null || string.IsNullOrEmpty(_settings.Username) || string.IsNullOrEmpty(_settings.Password))
            {
                _logger.LogError("GPSGate credentials not found in provider configuration");
                return new LoginResponseDto
                {
                    Success = false,
                    Message = "GPSGate credentials not configured in provider settings"
                };
            }

            var applicationId = int.TryParse(_settings.ApplicationId, out var appId) ? appId : 12;
            return await LoginAsync(_settings.Username, _settings.Password, applicationId);
        }

        public async Task<LoginResponseDto> LoginAsync(string username, string password, int applicationId)
        {
            if (!await InitializeClientAsync() || _httpClient == null)
            {
                return new LoginResponseDto
                {
                    Success = false,
                    Message = "GPSGate SOAP service not initialized"
                };
            }

            try
            {
                _logger.LogInformation($"Attempting GPSGate login for user: {username}");

                var (success, sessionId, message) = await _httpClient.LoginAsync(username, password, applicationId);

                if (!success || string.IsNullOrEmpty(sessionId))
                {
                    _logger.LogWarning($"GPSGate login failed for user {username}: {message}");
                    return new LoginResponseDto
                    {
                        Success = false,
                        Message = message
                    };
                }

                // Save session to database
                var session = new Domain.Entities.GPSGate.GPSGateSession
                {
                    SessionId = sessionId,
                    Username = username,
                    ApplicationId = applicationId,
                    CreatedAt = DateTime.UtcNow,
                    ExpiresAt = DateTime.UtcNow.AddHours(24),
                    IsActive = true,
                    LastUsed = DateTime.UtcNow
                };

                _context.GPSGateSessions.Add(session);
                await _context.SaveChangesAsync();

                _logger.LogInformation($"GPSGate login successful for user: {username}");

                return new LoginResponseDto
                {
                    SessionId = sessionId,
                    Success = true,
                    Message = "Login successful"
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error during GPSGate login for user: {username}");
                return new LoginResponseDto
                {
                    Success = false,
                    Message = ex.Message
                };
            }
        }

        public async Task<XmlNode> GetLicenseStatusAsync(string sessionId)
        {
            // TODO: Implement using GPSGateSoapHttpClient when needed
            // The WCF client has .NET Core CustomBinding compatibility issues
            await UpdateSessionLastUsed(sessionId);
            throw new NotImplementedException("GetLicenseStatusAsync not yet implemented with direct HTTP client. Use the Reporting service for reports.");
        }

        public async Task<XmlNode> GetUsersInGroupAsync(string sessionId, int applicationId, string groupName, int viewId)
        {
            // TODO: Implement using GPSGateSoapHttpClient when needed
            // The WCF client has .NET Core CustomBinding compatibility issues
            await UpdateSessionLastUsed(sessionId);
            throw new NotImplementedException("GetUsersInGroupAsync not yet implemented with direct HTTP client.");
        }

        public async Task<bool> ValidateSessionAsync(string sessionId)
        {
            try
            {
                var session = await _context.GPSGateSessions
                    .FirstOrDefaultAsync(s => s.SessionId == sessionId && s.IsActive);

                if (session == null)
                    return false;

                if (session.ExpiresAt.HasValue && session.ExpiresAt.Value < DateTime.UtcNow)
                {
                    session.IsActive = false;
                    await _context.SaveChangesAsync();
                    return false;
                }

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error validating session: {sessionId}");
                return false;
            }
        }

        private void CheckError(XmlNode element)
        {
            if (element != null && element.FirstChild != null && element.FirstChild.Name == "exception")
            {
                var errorMessage = element.SelectSingleNode("//exception/message")?.InnerText ?? "Unknown error";
                _logger.LogError($"GPSGate error: {errorMessage}");
                throw new Exception(errorMessage);
            }
        }

        private async Task UpdateSessionLastUsed(string sessionId)
        {
            try
            {
                var session = await _context.GPSGateSessions
                    .FirstOrDefaultAsync(s => s.SessionId == sessionId);

                if (session != null)
                {
                    session.LastUsed = DateTime.UtcNow;
                    await _context.SaveChangesAsync();
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Error updating session last used time");
            }
        }
    }
}
