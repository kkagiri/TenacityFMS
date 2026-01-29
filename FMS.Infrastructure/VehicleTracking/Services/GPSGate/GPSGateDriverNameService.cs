/**
 * File: GPSGateDriverNameService.cs
 * Purpose: Updates the DriverName custom field in GPSGate whenever fueling occurs
 * Dependencies: HttpClient, IGPSGateConfigurationProvider, GpsdataContext
 * Last Modified: 2026-01-29
 *
 * Key Functions:
 * - UpdateDriverNameAsync(): Updates DriverName using vehicleId and employeeId
 * - UpdateDriverNameByNameAsync(): Updates DriverName using vehicleId and driver name directly
 * - UpdateDriverNameByGpsUserIdAsync(): Updates DriverName using GPSGate userId directly
 */

using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.CommonInterface;
using FMS.Infrastructure.ExternalServices.GPS.GPSGate.Services;
using FMS.Persistence.DataAccess;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Infrastructure.VehicleTracking.Services.GPSGate
{
    /// <summary>
    /// Service for updating the DriverName custom field in GPSGate.
    /// Called when fueling occurs to update the last driver who fueled the vehicle.
    ///
    /// Business Rules:
    /// - Update DriverName when manual fuel refill is created (today or within 5 days back)
    /// - Update DriverName when pump authorization is successful
    ///
    /// API Endpoint: PUT http://10.0.10.150/comGpsGate/api/v.1/applications/{appId}/users/{vehicleId}/customfields/DriverName
    /// </summary>
    public class GPSGateDriverNameService : IGPSGateDriverNameService
    {
        private readonly HttpClient _httpClient;
        private readonly IGPSGateConfigurationProvider _configProvider;
        private readonly IDbContextFactory<GpsdataContext> _contextFactory;
        private readonly ILogger<GPSGateDriverNameService> _logger;

        private static readonly JsonSerializerOptions JsonOptions = new()
        {
            PropertyNameCaseInsensitive = true,
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        };

        public GPSGateDriverNameService(
            HttpClient httpClient,
            IGPSGateConfigurationProvider configProvider,
            IDbContextFactory<GpsdataContext> contextFactory,
            ILogger<GPSGateDriverNameService> logger)
        {
            _httpClient = httpClient ?? throw new ArgumentNullException(nameof(httpClient));
            _configProvider = configProvider ?? throw new ArgumentNullException(nameof(configProvider));
            _contextFactory = contextFactory ?? throw new ArgumentNullException(nameof(contextFactory));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        /// <inheritdoc/>
        public async Task<FMSResponse<bool>> UpdateDriverNameAsync(int vehicleId, int employeeId, CancellationToken cancellationToken = default)
        {
            try
            {
                _logger.LogInformation("Updating GPSGate DriverName for vehicle {VehicleId} with employee {EmployeeId}",
                    vehicleId, employeeId);

                await using var context = await _contextFactory.CreateDbContextAsync(cancellationToken);

                // Get employee full name
                var employee = await context.Employees
                    .AsNoTracking()
                    .FirstOrDefaultAsync(e => e.Id == employeeId, cancellationToken);

                if (employee == null)
                {
                    _logger.LogWarning("Employee {EmployeeId} not found, cannot update GPSGate DriverName", employeeId);
                    return FMSResponse<bool>.Failed($"Employee with ID {employeeId} not found");
                }

                // Build full name - handle nulls gracefully
                var fullName = employee.FullName;
                if (string.IsNullOrWhiteSpace(fullName))
                {
                    _logger.LogWarning("Employee {EmployeeId} has no name set, cannot update GPSGate DriverName", employeeId);
                    return FMSResponse<bool>.Failed("Employee has no name configured");
                }

                return await UpdateDriverNameByNameAsync(vehicleId, fullName, cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating GPSGate DriverName for vehicle {VehicleId} with employee {EmployeeId}",
                    vehicleId, employeeId);
                return FMSResponse<bool>.Failed($"Error updating GPSGate DriverName: {ex.Message}");
            }
        }

        /// <inheritdoc/>
        public async Task<FMSResponse<bool>> UpdateDriverNameByNameAsync(int vehicleId, string driverFullName, CancellationToken cancellationToken = default)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(driverFullName))
                {
                    return FMSResponse<bool>.Failed("Driver name cannot be empty");
                }

                _logger.LogInformation("Updating GPSGate DriverName for vehicle {VehicleId} to '{DriverName}'",
                    vehicleId, driverFullName);

                await using var context = await _contextFactory.CreateDbContextAsync(cancellationToken);

                // Get the GPSGate user ID from VehicleProviderMappings
                var providerMapping = await context.VehicleProviderMappings
                    .AsNoTracking()
                    .FirstOrDefaultAsync(m => m.VehicleId == vehicleId && m.IsActive && m.ExternalDeviceId != null,
                        cancellationToken);

                if (providerMapping == null || string.IsNullOrEmpty(providerMapping.ExternalDeviceId))
                {
                    _logger.LogWarning("No active GPSGate mapping found for vehicle {VehicleId}", vehicleId);
                    return FMSResponse<bool>.Failed($"No GPS provider mapping found for vehicle {vehicleId}");
                }

                if (!int.TryParse(providerMapping.ExternalDeviceId, out var gpsGateUserId))
                {
                    _logger.LogWarning("Invalid GPSGate user ID '{ExternalDeviceId}' for vehicle {VehicleId}",
                        providerMapping.ExternalDeviceId, vehicleId);
                    return FMSResponse<bool>.Failed($"Invalid GPS user ID format: {providerMapping.ExternalDeviceId}");
                }

                return await UpdateDriverNameByGpsUserIdAsync(gpsGateUserId, driverFullName, cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating GPSGate DriverName for vehicle {VehicleId} to '{DriverName}'",
                    vehicleId, driverFullName);
                return FMSResponse<bool>.Failed($"Error updating GPSGate DriverName: {ex.Message}");
            }
        }

        /// <inheritdoc/>
        public async Task<FMSResponse<bool>> UpdateDriverNameByGpsUserIdAsync(int gpsGateUserId, string driverFullName, CancellationToken cancellationToken = default)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(driverFullName))
                {
                    return FMSResponse<bool>.Failed("Driver name cannot be empty");
                }

                var (baseUrl, applicationId, authHeader) = await _configProvider.GetProviderSettingsAsync();

                if (string.IsNullOrEmpty(baseUrl) || applicationId == 0)
                {
                    _logger.LogError("GPSGate configuration not found");
                    return FMSResponse<bool>.Failed("GPSGate configuration not available");
                }

                // API Endpoint: PUT /applications/{appId}/users/{userId}/customfields/DriverName
                var requestUrl = $"{baseUrl}/applications/{applicationId}/users/{gpsGateUserId}/customfields/DriverName";

                _logger.LogInformation("Calling GPSGate API to update DriverName: {Url}", requestUrl);

                // Build request payload
                var payload = new
                {
                    name = "DriverName",
                    value = driverFullName
                };

                var jsonContent = JsonSerializer.Serialize(payload, JsonOptions);

                using var request = new HttpRequestMessage(HttpMethod.Put, requestUrl);
                request.Headers.Authorization = authHeader;
                request.Content = new StringContent(jsonContent, Encoding.UTF8, "application/json");

                var response = await _httpClient.SendAsync(request, cancellationToken);

                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync(cancellationToken);
                    _logger.LogWarning(
                        "Failed to update GPSGate DriverName for user {GpsUserId}. Status: {StatusCode}, Response: {Response}",
                        gpsGateUserId, response.StatusCode, errorContent);
                    return FMSResponse<bool>.Failed($"GPSGate API error: {response.StatusCode} - {errorContent}");
                }

                _logger.LogInformation(
                    "Successfully updated GPSGate DriverName for user {GpsUserId} to '{DriverName}'",
                    gpsGateUserId, driverFullName);

                return FMSResponse<bool>.Success(true, $"DriverName updated to '{driverFullName}'");
            }
            catch (HttpRequestException ex)
            {
                _logger.LogError(ex, "HTTP error updating GPSGate DriverName for user {GpsUserId}", gpsGateUserId);
                return FMSResponse<bool>.Failed($"Network error communicating with GPSGate: {ex.Message}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating GPSGate DriverName for user {GpsUserId}", gpsGateUserId);
                return FMSResponse<bool>.Failed($"Error updating GPSGate DriverName: {ex.Message}");
            }
        }

        /// <summary>
        /// Builds the employee full name from first, middle, and last name components.
        /// </summary>
        private static string BuildEmployeeFullName(string? firstName, string? middleName, string? lastName)
        {
            var parts = new[] { firstName, middleName, lastName }
                .Where(p => !string.IsNullOrWhiteSpace(p))
                .Select(p => p!.Trim());

            return string.Join(" ", parts).ToUpperInvariant();
        }
    }
}
