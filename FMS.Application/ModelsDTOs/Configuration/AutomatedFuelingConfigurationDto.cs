using System;

namespace FMS.Application.Features.Configuration
{
    public class AutomatedFuelingConfigurationDto
    {
        public int Id { get; set; }

        /// <summary>
        /// Site ID this configuration applies to (null for global settings)
        /// </summary>
        public int? SiteId { get; set; }

        /// <summary>
        /// Site name for display purposes
        /// </summary>
        public string? SiteName { get; set; }

        /// <summary>
        /// Whether to update tank current volume from book keeping (ledger)
        /// </summary>
        public bool UpdateTankVolumeFromBookKeeping { get; set; }

        /// <summary>
        /// Whether to use PTS probe readings for tank volume
        /// </summary>
        public bool UsePtsProbeReadings { get; set; }

        /// <summary>
        /// Priority when both sources are available: 1 = BookKeeping, 2 = PTS Probe
        /// </summary>
        public int VolumeSourcePriority { get; set; }

        /// <summary>
        /// Whether to automatically create ledger entries for pump transactions
        /// </summary>
        public bool AutoCreateLedgerEntries { get; set; }

        /// <summary>
        /// Whether to check for duplicate manual entries
        /// </summary>
        public bool CheckForDuplicateManualEntries { get; set; }

        /// <summary>
        /// Volume tolerance percentage for duplicate detection (e.g., 0.01 = 1%)
        /// </summary>
        public decimal DuplicateVolumeTolerance { get; set; }

        /// <summary>
        /// Whether to reconcile tank volumes automatically
        /// </summary>
        public bool AutoReconcileTankVolumes { get; set; }

        /// <summary>
        /// Reconciliation frequency in minutes
        /// </summary>
        public int ReconciliationFrequencyMinutes { get; set; }

        /// <summary>
        /// Maximum allowed discrepancy between book keeping and probe readings
        /// </summary>
        public decimal? MaxVolumeDiscrepancyThreshold { get; set; }

        /// <summary>
        /// Action to take when discrepancy exceeds threshold: 1 = Alert, 2 = Block, 3 = Auto-Adjust
        /// </summary>
        public int DiscrepancyAction { get; set; }

        /// <summary>
        /// Whether the configuration is active
        /// </summary>
        public bool IsActive { get; set; }

        // ===== Mobile Fueling Validation Settings =====

        /// <summary>
        /// Whether to check if vehicle has fueling rules before allowing fueling (mobile app)
        /// </summary>
        public bool EnableFuelRulesCheck { get; set; }

        /// <summary>
        /// Whether to validate fuel volume against vehicle tank capacity (mobile app)
        /// </summary>
        public bool EnableFuelCapacityValidation { get; set; }

        /// <summary>
        /// Whether to use GPS fuel level sensor to calculate remaining tank capacity (mobile app)
        /// </summary>
        public bool EnableGPSFuelLevelCheck { get; set; }

        /// <summary>
        /// Created date
        /// </summary>
        public DateTime CreatedOn { get; set; }

        /// <summary>
        /// Last modified date
        /// </summary>
        public DateTime? ModifiedOn { get; set; }

        /// <summary>
        /// Created by user ID
        /// </summary>
        public string CreatedBy { get; set; }

        /// <summary>
        /// Modified by user ID
        /// </summary>
        public string? ModifiedBy { get; set; }

        // Computed properties for frontend compatibility
        /// <summary>
        /// Configuration name for display (computed)
        /// </summary>
        public string Name => SiteId.HasValue ? $"Site {SiteId} Configuration" : "Global Configuration";

        /// <summary>
        /// Whether this is a global configuration (computed)
        /// </summary>
        public bool IsGlobal => !SiteId.HasValue;

        /// <summary>
        /// Volume source priority as string for display (computed)
        /// </summary>
        public string VolumeSourcePriorityText => VolumeSourcePriority == 1 ? "BookKeeping" : "PTS Probe";

        /// <summary>
        /// Discrepancy action as string for display (computed)
        /// </summary>
        public string DiscrepancyActionText => DiscrepancyAction
        switch
        {
            1 => "Alert",
            2 => "Block",
            3 => "Auto-Adjust",
            _ => "Unknown"
        };
    }

    /// <summary>
    /// Lightweight DTO for mobile app fueling validation settings
    /// </summary>
    public class MobileFuelingValidationSettingsDto
    {
        /// <summary>
        /// Whether to check if vehicle has fueling rules before allowing fueling
        /// </summary>
        public bool EnableFuelRulesCheck { get; set; } = true;

        /// <summary>
        /// Whether to validate fuel volume against vehicle tank capacity
        /// </summary>
        public bool EnableFuelCapacityValidation { get; set; } = true;

        /// <summary>
        /// Whether to use GPS fuel level sensor to calculate remaining tank capacity
        /// </summary>
        public bool EnableGPSFuelLevelCheck { get; set; } = true;
    }

    public class CreateAutomatedFuelingConfigurationDto
    {
        /// <summary>
        /// Site ID this configuration applies to (null for global settings)
        /// </summary>
        public int? SiteId { get; set; }

        /// <summary>
        /// Whether to update tank current volume from book keeping (ledger)
        /// </summary>
        public bool UpdateTankVolumeFromBookKeeping { get; set; } = true;

        /// <summary>
        /// Whether to use PTS probe readings for tank volume
        /// </summary>
        public bool UsePtsProbeReadings { get; set; } = false;

        /// <summary>
        /// Priority when both sources are available: 1 = BookKeeping, 2 = PTS Probe
        /// </summary>
        public int VolumeSourcePriority { get; set; } = 1;

        /// <summary>
        /// Whether to automatically create ledger entries for pump transactions
        /// </summary>
        public bool AutoCreateLedgerEntries { get; set; } = true;

        /// <summary>
        /// Whether to check for duplicate manual entries
        /// </summary>
        public bool CheckForDuplicateManualEntries { get; set; } = true;

        /// <summary>
        /// Volume tolerance percentage for duplicate detection (e.g., 0.01 = 1%)
        /// </summary>
        public decimal DuplicateVolumeTolerance { get; set; } = 0.01m;

        /// <summary>
        /// Whether to reconcile tank volumes automatically
        /// </summary>
        public bool AutoReconcileTankVolumes { get; set; } = false;

        /// <summary>
        /// Reconciliation frequency in minutes
        /// </summary>
        public int ReconciliationFrequencyMinutes { get; set; } = 60;

        /// <summary>
        /// Maximum allowed discrepancy between book keeping and probe readings
        /// </summary>
        public decimal? MaxVolumeDiscrepancyThreshold { get; set; } = 10.0m;

        /// <summary>
        /// Action to take when discrepancy exceeds threshold: 1 = Alert, 2 = Block, 3 = Auto-Adjust
        /// </summary>
        public int DiscrepancyAction { get; set; } = 1;

        /// <summary>
        /// Whether the configuration is active
        /// </summary>
        public bool IsActive { get; set; } = true;

        // ===== Mobile Fueling Validation Settings =====

        /// <summary>
        /// Whether to check if vehicle has fueling rules before allowing fueling (mobile app)
        /// </summary>
        public bool EnableFuelRulesCheck { get; set; } = true;

        /// <summary>
        /// Whether to validate fuel volume against vehicle tank capacity (mobile app)
        /// </summary>
        public bool EnableFuelCapacityValidation { get; set; } = true;

        /// <summary>
        /// Whether to use GPS fuel level sensor to calculate remaining tank capacity (mobile app)
        /// </summary>
        public bool EnableGPSFuelLevelCheck { get; set; } = true;
    }

    public class UpdateAutomatedFuelingConfigurationDto
    {
        public int Id { get; set; }

        /// <summary>
        /// Whether to update tank current volume from book keeping (ledger)
        /// </summary>
        public bool UpdateTankVolumeFromBookKeeping { get; set; }

        /// <summary>
        /// Whether to use PTS probe readings for tank volume
        /// </summary>
        public bool UsePtsProbeReadings { get; set; }

        /// <summary>
        /// Priority when both sources are available: 1 = BookKeeping, 2 = PTS Probe
        /// </summary>
        public int VolumeSourcePriority { get; set; }

        /// <summary>
        /// Whether to automatically create ledger entries for pump transactions
        /// </summary>
        public bool AutoCreateLedgerEntries { get; set; }

        /// <summary>
        /// Whether to check for duplicate manual entries
        /// </summary>
        public bool CheckForDuplicateManualEntries { get; set; }

        /// <summary>
        /// Volume tolerance percentage for duplicate detection (e.g., 0.01 = 1%)
        /// </summary>
        public decimal DuplicateVolumeTolerance { get; set; }

        /// <summary>
        /// Whether to reconcile tank volumes automatically
        /// </summary>
        public bool AutoReconcileTankVolumes { get; set; }

        /// <summary>
        /// Reconciliation frequency in minutes
        /// </summary>
        public int ReconciliationFrequencyMinutes { get; set; }

        /// <summary>
        /// Maximum allowed discrepancy between book keeping and probe readings
        /// </summary>
        public decimal? MaxVolumeDiscrepancyThreshold { get; set; }

        /// <summary>
        /// Action to take when discrepancy exceeds threshold: 1 = Alert, 2 = Block, 3 = Auto-Adjust
        /// </summary>
        public int DiscrepancyAction { get; set; }

        /// <summary>
        /// Whether the configuration is active
        /// </summary>
        public bool IsActive { get; set; }

        // ===== Mobile Fueling Validation Settings =====

        /// <summary>
        /// Whether to check if vehicle has fueling rules before allowing fueling (mobile app)
        /// </summary>
        public bool EnableFuelRulesCheck { get; set; }

        /// <summary>
        /// Whether to validate fuel volume against vehicle tank capacity (mobile app)
        /// </summary>
        public bool EnableFuelCapacityValidation { get; set; }

        /// <summary>
        /// Whether to use GPS fuel level sensor to calculate remaining tank capacity (mobile app)
        /// </summary>
        public bool EnableGPSFuelLevelCheck { get; set; }
    }
}