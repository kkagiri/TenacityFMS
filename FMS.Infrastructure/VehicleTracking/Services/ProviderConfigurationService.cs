using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using FMS.Domain.Entities.VehicleTracking;
using FMS.Infrastructure.VehicleTracking.Models;
using FMS.Persistence.DataAccess;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Infrastructure.VehicleTracking.Services
{
    /// <summary>
    /// Service implementation for managing provider configurations.
    /// Uses IDbContextFactory to create separate DbContext instances for each operation,
    /// preventing concurrency issues when multiple vehicles are queried in parallel.
    /// </summary>
    public class ProviderConfigurationService : IProviderConfigurationService
    {
        private readonly IDbContextFactory<GpsdataContext> _contextFactory;
        private readonly ILogger<ProviderConfigurationService> _logger;

        public ProviderConfigurationService(
            IDbContextFactory<GpsdataContext> contextFactory,
            ILogger<ProviderConfigurationService> logger)
        {
            _contextFactory = contextFactory ?? throw new ArgumentNullException(nameof(contextFactory));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        public async Task<List<ProviderConfiguration>> GetAllAsync(bool includeDisabled = false)
        {
            try
            {
                await using var context = await _contextFactory.CreateDbContextAsync();
                var query = context.ProviderConfigurations.AsQueryable();

                if (!includeDisabled)
                {
                    query = query.Where(p => p.IsEnabled);
                }

                var entities = await query
                    .OrderBy(p => p.Priority)
                    .ThenBy(p => p.Name)
                    .ToListAsync();

                return entities.Select(MapToModel).ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting all provider configurations");
                throw;
            }
        }

        public async Task<ProviderConfiguration?> GetByNameAsync(string providerName)
        {
            try
            {
                await using var context = await _contextFactory.CreateDbContextAsync();
                var entity = await context.ProviderConfigurations
                    .FirstOrDefaultAsync(p => p.Name == providerName);

                return entity != null ? MapToModel(entity) : null;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting provider configuration by name: {ProviderName}", providerName);
                throw;
            }
        }

        public async Task<ProviderConfiguration?> GetByIdAsync(int id)
        {
            try
            {
                await using var context = await _contextFactory.CreateDbContextAsync();
                var entity = await context.ProviderConfigurations
                    .FirstOrDefaultAsync(p => p.Id == id);

                return entity != null ? MapToModel(entity) : null;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting provider configuration by ID: {Id}", id);
                throw;
            }
        }

        public async Task<ProviderConfiguration?> GetDefaultAsync()
        {
            try
            {
                await using var context = await _contextFactory.CreateDbContextAsync();
                var entity = await context.ProviderConfigurations
                    .FirstOrDefaultAsync(p => p.IsDefault && p.IsEnabled);

                return entity != null ? MapToModel(entity) : null;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting default provider configuration");
                throw;
            }
        }

        public async Task<ProviderConfiguration?> GetForVehicleAsync(int vehicleId)
        {
            try
            {
                await using var context = await _contextFactory.CreateDbContextAsync();
                // Check if vehicle has a specific provider mapping
                var mapping = await context.VehicleProviderMappings
                    .Include(m => m.ProviderConfiguration)
                    .FirstOrDefaultAsync(m => m.VehicleId == vehicleId && m.IsActive);

                if (mapping?.ProviderConfiguration != null && mapping.ProviderConfiguration.IsEnabled)
                {
                    _logger.LogDebug("Vehicle {VehicleId} has specific provider mapping: {Provider}",
                        vehicleId, mapping.ProviderConfiguration.Name);
                    return MapToModel(mapping.ProviderConfiguration);
                }

                // Fall back to default provider
                _logger.LogDebug("Vehicle {VehicleId} using default provider", vehicleId);
                return await GetDefaultAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting provider configuration for vehicle: {VehicleId}", vehicleId);
                throw;
            }
        }

        public async Task<int> CreateAsync(ProviderConfiguration configuration, string? currentUser = null)
        {
            try
            {
                await using var context = await _contextFactory.CreateDbContextAsync();
                var entity = MapToEntity(configuration);
                entity.CreatedAt = DateTime.UtcNow;
                entity.CreatedBy = currentUser;
                entity.UpdatedAt = DateTime.UtcNow;
                entity.UpdatedBy = currentUser;

                context.ProviderConfigurations.Add(entity);
                await context.SaveChangesAsync();

                _logger.LogInformation("Created provider configuration: {ProviderName} (ID: {Id})",
                    entity.Name, entity.Id);

                return entity.Id;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating provider configuration: {ProviderName}", configuration.Name);
                throw;
            }
        }

        public async Task<bool> UpdateAsync(ProviderConfiguration configuration, string? currentUser = null)
        {
            try
            {
                await using var context = await _contextFactory.CreateDbContextAsync();
                var existing = await context.ProviderConfigurations
                    .FirstOrDefaultAsync(p => p.Id == configuration.Id);

                if (existing == null)
                {
                    _logger.LogWarning("Provider configuration not found for update: {Id}", configuration.Id);
                    return false;
                }

                existing.DisplayName = configuration.DisplayName;
                existing.Description = configuration.Description;
                existing.IsEnabled = configuration.IsEnabled;
                existing.IsDefault = configuration.IsDefault;
                existing.Version = configuration.Version;
                existing.Settings = JsonSerializer.Serialize(configuration.Settings);
                existing.Priority = configuration.Priority;
                existing.UpdatedAt = DateTime.UtcNow;
                existing.UpdatedBy = currentUser;

                await context.SaveChangesAsync();

                _logger.LogInformation("Updated provider configuration: {ProviderName} (ID: {Id})",
                    existing.Name, existing.Id);

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating provider configuration: {Id}", configuration.Id);
                throw;
            }
        }

        public async Task<bool> DeleteAsync(int id, string? currentUser = null)
        {
            try
            {
                await using var context = await _contextFactory.CreateDbContextAsync();
                var entity = await context.ProviderConfigurations
                    .FirstOrDefaultAsync(p => p.Id == id);

                if (entity == null)
                {
                    _logger.LogWarning("Provider configuration not found for deletion: {Id}", id);
                    return false;
                }

                // Soft delete
                entity.IsDeleted = true;
                entity.DeletedAt = DateTime.UtcNow;
                entity.DeletedBy = currentUser;
                entity.IsEnabled = false;

                await context.SaveChangesAsync();

                _logger.LogInformation("Deleted provider configuration: {ProviderName} (ID: {Id})",
                    entity.Name, entity.Id);

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting provider configuration: {Id}", id);
                throw;
            }
        }

        public async Task<bool> SetDefaultAsync(string providerName, string? currentUser = null)
        {
            await using var context = await _contextFactory.CreateDbContextAsync();
            using var transaction = await context.Database.BeginTransactionAsync();
            try
            {
                // Clear existing default
                var existingDefaults = await context.ProviderConfigurations
                    .Where(p => p.IsDefault)
                    .ToListAsync();

                foreach (var config in existingDefaults)
                {
                    config.IsDefault = false;
                    config.UpdatedAt = DateTime.UtcNow;
                    config.UpdatedBy = currentUser;
                }

                // Set new default
                var newDefault = await context.ProviderConfigurations
                    .FirstOrDefaultAsync(p => p.Name == providerName);

                if (newDefault == null)
                {
                    _logger.LogWarning("Provider not found for setting default: {ProviderName}", providerName);
                    return false;
                }

                newDefault.IsDefault = true;
                newDefault.IsEnabled = true; // Ensure it's enabled
                newDefault.UpdatedAt = DateTime.UtcNow;
                newDefault.UpdatedBy = currentUser;

                await context.SaveChangesAsync();
                await transaction.CommitAsync();

                _logger.LogInformation("Set default provider: {ProviderName}", providerName);
                return true;
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, "Error setting default provider: {ProviderName}", providerName);
                throw;
            }
        }

        public async Task<bool> SetEnabledAsync(string providerName, bool enabled, string? currentUser = null)
        {
            try
            {
                await using var context = await _contextFactory.CreateDbContextAsync();
                var entity = await context.ProviderConfigurations
                    .FirstOrDefaultAsync(p => p.Name == providerName);

                if (entity == null)
                {
                    _logger.LogWarning("Provider not found for enable/disable: {ProviderName}", providerName);
                    return false;
                }

                entity.IsEnabled = enabled;
                entity.UpdatedAt = DateTime.UtcNow;
                entity.UpdatedBy = currentUser;

                // If disabling the default provider, clear the default flag
                if (!enabled && entity.IsDefault)
                {
                    entity.IsDefault = false;
                    _logger.LogWarning("Disabled provider was default, clearing default flag: {ProviderName}", providerName);
                }

                await context.SaveChangesAsync();

                _logger.LogInformation("{Action} provider: {ProviderName}",
                    enabled ? "Enabled" : "Disabled", providerName);

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error setting provider enabled status: {ProviderName}", providerName);
                throw;
            }
        }

        public async Task<bool> MapVehicleToProviderAsync(
            int vehicleId,
            string providerName,
            string? externalDeviceId = null,
            string? deviceIMEI = null,
            string? deviceName = null,
            string? deviceType = null,
            string? metadata = null,
            string? currentUser = null)
        {
            try
            {
                await using var context = await _contextFactory.CreateDbContextAsync();
                var provider = await context.ProviderConfigurations
                    .FirstOrDefaultAsync(p => p.Name == providerName);

                if (provider == null)
                {
                    _logger.LogWarning("Provider not found for vehicle mapping: {ProviderName}", providerName);
                    return false;
                }

                // Deactivate existing mappings
                var existingMappings = await context.VehicleProviderMappings
                    .Where(m => m.VehicleId == vehicleId && m.IsActive)
                    .ToListAsync();

                foreach (var mapping in existingMappings)
                {
                    mapping.IsActive = false;
                    mapping.UpdatedAt = DateTime.UtcNow;
                    mapping.UpdatedBy = currentUser;
                }

                // Create new mapping with device metadata
                var newMapping = new VehicleProviderMappingEntity
                {
                    VehicleId = vehicleId,
                    ProviderConfigId = provider.Id,
                    ExternalDeviceId = externalDeviceId,
                    DeviceIMEI = deviceIMEI,
                    DeviceName = deviceName,
                    DeviceType = deviceType,
                    Metadata = metadata,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    CreatedBy = currentUser,
                    UpdatedAt = DateTime.UtcNow,
                    UpdatedBy = currentUser
                };

                context.VehicleProviderMappings.Add(newMapping);
                await context.SaveChangesAsync();

                _logger.LogInformation("Mapped vehicle {VehicleId} to provider {ProviderName} with device {DeviceId}",
                    vehicleId, providerName, externalDeviceId);

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error mapping vehicle {VehicleId} to provider {ProviderName}",
                    vehicleId, providerName);
                throw;
            }
        }

        public async Task<bool> UnmapVehicleFromProviderAsync(int vehicleId, string? currentUser = null)
        {
            try
            {
                await using var context = await _contextFactory.CreateDbContextAsync();
                var mappings = await context.VehicleProviderMappings
                    .Where(m => m.VehicleId == vehicleId && m.IsActive)
                    .ToListAsync();

                foreach (var mapping in mappings)
                {
                    mapping.IsActive = false;
                    mapping.UpdatedAt = DateTime.UtcNow;
                    mapping.UpdatedBy = currentUser;
                }

                await context.SaveChangesAsync();

                _logger.LogInformation("Unmapped vehicle {VehicleId} from provider", vehicleId);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error unmapping vehicle {VehicleId}", vehicleId);
                throw;
            }
        }

        public async Task<List<int>> GetMappedVehiclesAsync(string providerName)
        {
            try
            {
                await using var context = await _contextFactory.CreateDbContextAsync();
                var provider = await context.ProviderConfigurations
                    .FirstOrDefaultAsync(p => p.Name == providerName);

                if (provider == null)
                {
                    return new List<int>();
                }

                return await context.VehicleProviderMappings
                    .Where(m => m.ProviderConfigId == provider.Id && m.IsActive)
                    .Select(m => m.VehicleId)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting mapped vehicles for provider: {ProviderName}", providerName);
                throw;
            }
        }

        public async Task<bool> RecordHealthStatusAsync(ProviderHealthStatus status)
        {
            try
            {
                await using var context = await _contextFactory.CreateDbContextAsync();
                var provider = await context.ProviderConfigurations
                    .FirstOrDefaultAsync(p => p.Name == status.ProviderName);

                if (provider == null)
                {
                    _logger.LogWarning("Provider not found for health status recording: {ProviderName}",
                        status.ProviderName);
                    return false;
                }

                var entity = new ProviderHealthHistoryEntity
                {
                    ProviderConfigId = provider.Id,
                    ProviderName = status.ProviderName,
                    Status = status.Status.ToString(),
                    Message = status.Message,
                    ResponseTimeMs = status.ResponseTimeMs,
                    SuccessRate = status.SuccessRate,
                    ErrorCount = status.ErrorCount,
                    AdditionalMetrics = status.AdditionalMetrics != null && status.AdditionalMetrics.Any()
                        ? JsonSerializer.Serialize(status.AdditionalMetrics)
                        : null,
                    CheckedAt = status.CheckedAt
                };

                context.ProviderHealthHistories.Add(entity);
                await context.SaveChangesAsync();

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error recording health status for provider: {ProviderName}",
                    status.ProviderName);
                throw;
            }
        }

        public async Task<List<ProviderHealthStatus>> GetHealthHistoryAsync(
            string providerName,
            DateTime from,
            DateTime to,
            int limit = 1000)
        {
            try
            {
                await using var context = await _contextFactory.CreateDbContextAsync();
                var entities = await context.ProviderHealthHistories
                    .Where(h => h.ProviderName == providerName
                             && h.CheckedAt >= from
                             && h.CheckedAt <= to)
                    .OrderByDescending(h => h.CheckedAt)
                    .Take(limit)
                    .ToListAsync();

                return entities.Select(MapHealthToModel).ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting health history for provider: {ProviderName}", providerName);
                throw;
            }
        }

        public async Task<ProviderHealthStatus?> GetLatestHealthStatusAsync(string providerName)
        {
            try
            {
                await using var context = await _contextFactory.CreateDbContextAsync();
                var entity = await context.ProviderHealthHistories
                    .Where(h => h.ProviderName == providerName)
                    .OrderByDescending(h => h.CheckedAt)
                    .FirstOrDefaultAsync();

                return entity != null ? MapHealthToModel(entity) : null;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting latest health status for provider: {ProviderName}",
                    providerName);
                throw;
            }
        }

        #region Private Mapping Methods

        private ProviderConfiguration MapToModel(ProviderConfigurationEntity entity)
        {
            var config = new ProviderConfiguration
            {
                Id = entity.Id,
                Name = entity.Name,
                DisplayName = entity.DisplayName,
                Description = entity.Description,
                IsEnabled = entity.IsEnabled,
                IsDefault = entity.IsDefault,
                Version = entity.Version,
                Priority = entity.Priority,
                CreatedAt = entity.CreatedAt,
                UpdatedAt = entity.UpdatedAt,
                CreatedBy = entity.CreatedBy,
                UpdatedBy = entity.UpdatedBy,
                Settings = entity.Settings ?? "{}"
            };

            return config;
        }

        private ProviderConfigurationEntity MapToEntity(ProviderConfiguration model)
        {
            return new ProviderConfigurationEntity
            {
                Id = model.Id,
                Name = model.Name,
                DisplayName = model.DisplayName,
                Description = model.Description,
                IsEnabled = model.IsEnabled,
                IsDefault = model.IsDefault,
                Version = model.Version,
                Settings = model.Settings, // Settings is already a JSON string, don't serialize again
                Priority = model.Priority
            };
        }

        private ProviderHealthStatus MapHealthToModel(ProviderHealthHistoryEntity entity)
        {
            var status = new ProviderHealthStatus
            {
                ProviderName = entity.ProviderName,
                Status = Enum.TryParse<HealthStatus>(entity.Status, out var parsedStatus)
                    ? parsedStatus
                    : HealthStatus.Unknown,
                Message = entity.Message ?? string.Empty,
                ResponseTimeMs = entity.ResponseTimeMs ?? 0,
                SuccessRate = entity.SuccessRate,
                ErrorCount = entity.ErrorCount,
                CheckedAt = entity.CheckedAt,
                AdditionalMetrics = entity.AdditionalMetrics
            };

            // Deserialize additional metrics to Details dictionary
            if (!string.IsNullOrWhiteSpace(entity.AdditionalMetrics))
            {
                try
                {
                    // Use JsonElement to avoid deserialization issues with Dictionary<string, object>
                    var jsonElement = JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(entity.AdditionalMetrics);
                    if (jsonElement != null)
                    {
                        status.Details = new Dictionary<string, object>();
                        foreach (var kvp in jsonElement)
                        {
                            status.Details[kvp.Key] = kvp.Value.ToString();
                        }
                    }
                }
                catch (JsonException ex)
                {
                    _logger.LogError(ex, "Error deserializing additional metrics for provider: {ProviderName}",
                        entity.ProviderName);
                }
            }

            return status;
        }

        #endregion
    }
}
