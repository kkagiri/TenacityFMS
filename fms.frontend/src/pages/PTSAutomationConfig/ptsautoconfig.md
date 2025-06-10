Complete System Overview: Automated Fueling with Tank Volume Management
1. Configuration Foundation
AutomatedFuelingConfiguration Entity
Apply to PTSAutomatio...
Key Features:
Site-specific or Global: Each site can have custom settings or use global defaults
Flexible Volume Sources: Choose between book keeping ledger or PTS probe readings
Duplicate Prevention: Configurable duplicate detection with tolerance settings
Discrepancy Management: Alert, block, or auto-adjust when volume discrepancies occur
Supporting Enums
VolumeChangeReasonEnum.AutomatedDispensing - Distinguishes automated from manual dispensing
VolumeSourcePriority - BookKeeping vs PtsProbe priority
DiscrepancyActionType - Alert, Block, or AutoAdjust actions
2. Configuration Service
AutomatedFuelingConfigurationService
Apply to PTSAutomatio...
Key Features:
Hierarchical Configuration: Site-specific → Global → Default fallback
Cached Performance: Global config cached for 5 minutes
Source-Aware Updates: Different behavior for BookKeeping vs PtsProbe sources
Default Safety: Always returns valid configuration even if database is unavailable
3. Integration Services
PumpTransactionIntegrationService
Bridges pump transactions with tank volume history system:
Apply to PTSAutomatio...
CheckDuplicateFuelRefillQuery
Prevents double-counting between manual and automated entries:
Apply to PTSAutomatio...
4. Enhanced Transaction Processing
Updated CreatePumpTransactionCommand
Now fully integrated with configuration system:
Apply to PTSAutomatio...
5. Data Flow Architecture
Apply to PTSAutomatio...
6. Key Benefits
Unified Ledger System: Both manual and automated fueling now use the same ledger
Configurable Behavior: Each site can have different automation rules
Duplicate Prevention: Automatic detection prevents double-counting
Audit Trail: All dispensing tracked with proper reason codes
Volume Source Flexibility: Choose between book keeping or probe readings
Backwards Compatibility: Existing manual system unchanged
7. Configuration Examples
Conservative Site (Manual verification preferred)
Apply to PTSAutomatio...
Fully Automated Site
Apply to PTSAutomatio...
8. Next Steps
To complete the implementation, you would need to:
Database Migration: Add AutomatedFuelingConfiguration table
Service Registration: Register new services in DI container
Admin Interface: Create UI for managing configuration settings
Default Data: Insert default global configuration
Testing: Verify integration with existing AutoTransactionCompletionService
This system now provides a complete, configurable solution for integrating automated PTS fueling with your tank volume ledger system while preventing duplicate entries and maintaining data integrity.