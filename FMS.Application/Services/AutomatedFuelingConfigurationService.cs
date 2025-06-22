//Cursor: Service for managing automated fueling configuration settings
using System;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Common.Constants;
using FMS.Domain.Entities;
using FMS.Domain.Entities.enums;
using FMS.Persistence.DataAccess;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Services {
    public interface IAutomatedFuelingConfigurationService {
        Task<AutomatedFuelingConfiguration> GetConfigurationAsync (int? siteId = null, CancellationToken cancellationToken = default);
        Task<bool> ShouldUpdateTankVolumeFromBookKeepingAsync (int? siteId = null, CancellationToken cancellationToken = default);
        Task<bool> ShouldUsePtsProbeReadingsAsync (int? siteId = null, CancellationToken cancellationToken = default);
        Task<bool> ShouldAutoCreateLedgerEntriesAsync (int? siteId = null, CancellationToken cancellationToken = default);
        Task<FMSResponseMessage> UpdateTankCurrentVolumeAsync (int tankId, decimal newVolume, string source, CancellationToken cancellationToken = default);
    }

    public class AutomatedFuelingConfigurationService : IAutomatedFuelingConfigurationService {
        private readonly GpsdataContext _context;
        private readonly ILogger<AutomatedFuelingConfigurationService> _logger;

        public AutomatedFuelingConfigurationService (
            GpsdataContext context,
            ILogger<AutomatedFuelingConfigurationService> logger) {
            _context = context;
            _logger = logger;
        }

        public async Task<AutomatedFuelingConfiguration> GetConfigurationAsync (int? siteId = null, CancellationToken cancellationToken = default) {
            try {
                // First try to get site-specific configuration
                if (siteId.HasValue) {
                    var siteConfig = await _context.AutomatedFuelingConfigurations
                        .FirstOrDefaultAsync (c => c.SiteId == siteId && c.IsActive, cancellationToken);

                    if (siteConfig != null) {
                        return siteConfig;
                    }
                }

                // Fall back to global configuration
                var globalConfig = await _context.AutomatedFuelingConfigurations
                    .FirstOrDefaultAsync (c => c.SiteId == null && c.IsActive, cancellationToken);

                if (globalConfig != null) {
                    return globalConfig;
                }

                // Return default configuration if none found
                return GetDefaultConfiguration ();
            } catch (Exception ex) {
                _logger.LogError (ex, "Error retrieving automated fueling configuration for site {SiteId}", siteId);
                return GetDefaultConfiguration ();
            }
        }

        public async Task<bool> ShouldUpdateTankVolumeFromBookKeepingAsync (int? siteId = null, CancellationToken cancellationToken = default) {
            var config = await GetConfigurationAsync (siteId, cancellationToken);
            return config.UpdateTankVolumeFromBookKeeping;
        }

        public async Task<bool> ShouldUsePtsProbeReadingsAsync (int? siteId = null, CancellationToken cancellationToken = default) {
            var config = await GetConfigurationAsync (siteId, cancellationToken);
            return config.UsePtsProbeReadings;
        }

        public async Task<bool> ShouldAutoCreateLedgerEntriesAsync (int? siteId = null, CancellationToken cancellationToken = default) {
            var config = await GetConfigurationAsync (siteId, cancellationToken);
            return config.AutoCreateLedgerEntries;
        }

        public async Task<FMSResponseMessage> UpdateTankCurrentVolumeAsync (int tankId, decimal newVolume, string source, CancellationToken cancellationToken = default) {
            try {
                var tank = await _context.Tanks.FindAsync (new object[] { tankId }, cancellationToken);
                if (tank == null) {
                    return new FMSResponseMessage (false, $"Tank with ID {tankId} not found");
                }

                // Get configuration for the tank's site
                var config = await GetConfigurationAsync (tank.SiteId, cancellationToken);

                // Check if we should update based on the source and configuration
                bool shouldUpdate = source
                switch {
                    "BookKeeping" => config.UpdateTankVolumeFromBookKeeping,
                    "PtsProbe" => config.UsePtsProbeReadings,
                    _ => false
                };

                if (!shouldUpdate) {
                    _logger.LogDebug ("Tank volume update skipped for tank {TankId} from source {Source} based on configuration",
                        tankId, source);
                    return new FMSResponseMessage (true, "Update skipped based on configuration");
                }

                // Update the tank volume
                var oldVolume = tank.CurrentStock;
                tank.CurrentStock = newVolume;
                tank.LastStockUpdate = DateTime.UtcNow;

                await _context.SaveChangesAsync (cancellationToken);

                _logger.LogInformation ("Updated tank {TankId} current volume from {OldVolume} to {NewVolume} (source: {Source})",
                    tankId, oldVolume, newVolume, source);

                return new FMSResponseMessage (true, "Tank volume updated successfully");
            } catch (Exception ex) {
                _logger.LogError (ex, "Error updating tank {TankId} current volume", tankId);
                return new FMSResponseMessage (false, $"Error updating tank volume: {ex.Message}");
            }
        }

        private AutomatedFuelingConfiguration GetDefaultConfiguration () {
            return new AutomatedFuelingConfiguration {
                UpdateTankVolumeFromBookKeeping = true,
                    UsePtsProbeReadings = false,
                    VolumeSourcePriority = (int) VolumeSourcePriority.BookKeeping,
                    AutoCreateLedgerEntries = true,
                    CheckForDuplicateManualEntries = true,
                    DuplicateVolumeTolerance = 0.01m, // 1%
                    AutoReconcileTankVolumes = false,
                    ReconciliationFrequencyMinutes = 60,
                    MaxVolumeDiscrepancyThreshold = 10.0m, // 10 liters
                    DiscrepancyAction = (int) DiscrepancyActionType.Alert,
                    IsActive = true,
                    CreatedOn = DateTime.UtcNow,
                    CreatedBy = SystemConstants.Defaults.SystemCreatedBy
            };
        }
    }
}