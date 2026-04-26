# Fuel Audit System - Implementation Guide

**Version:** 2.0
**Last Updated:** November 28, 2025
**Status:** Active Development
**Branch:** `feature/fuel-audit-gps-service`

---

## Overview

The Fuel Audit System provides comprehensive fuel reconciliation for a mixed fleet with:
- **Tank Storage** (fuel tanks with TankVolumeHistory integration)
- **GPS Fleet** (vehicles with fuel sensors via GPSGate API)
- **Pickup Fleet** (vehicles without fuel sensors using full-tank refuel policy)

## Implementation Status

| Component | Status | Description |
|-----------|--------|-------------|
| **Domain Entities** | âœ… Complete | All 7 entities created |
| **Entity Configurations** | âœ… Complete | EF Core configurations |
| **Database Scripts** | âœ… Complete | MySQL 5.5.6 compatible |
| **DTOs** | âœ… Complete | All DTOs for API |
| **Commands** | âœ… Complete | 6 command handlers |
| **Queries** | âœ… Complete | 3 query handlers |
| **GPS Service** | âœ… Complete | Integration with GPSGate |
| **Tank Stock Service** | âœ… Complete | TankVolumeHistory integration |
| **Calculation Service** | âœ… Complete | Core reconciliation logic |
| **API Controller** | âœ… Complete | FuelAuditGPSController |
| **Unit Tests** | âœ… Complete | GPS service tests |
| **Frontend - Wizard** | âœ… Complete | 6-step CreateAuditWizard |
| **Frontend - Dashboard** | ðŸ”„ In Progress | Audit listing and management |
| **Frontend - Detail View** | ðŸ”„ In Progress | Individual audit view |

---

## Document Index

| Document | Description | Status |
|----------|-------------|--------|
| [PRD](./FuelAudit_PRD.md) | Product Requirements | âœ… Updated |
| [Task Breakdown](./FuelAudit_TaskBreakdown.md) | Implementation Tasks | âœ… Updated |
| [Architecture](./FuelAudit_Architecture.md) | System Architecture | âœ… Complete |
| [Sequence Flows](./FuelAudit_SequenceFlows.md) | Operation Flows | âœ… Complete |
| [API Documentation](./FuelAudit_API.md) | API Specification | âœ… Complete |
| [GPS Service Design](./GPSDataService_Design.md) | GPS Integration | âœ… Complete |
| [Frontend Guide](./FuelAudit_Frontend.md) | React Components | âœ… Complete |
| [Database Scripts](./database/) | SQL Migrations | âœ… Complete |

---

## Quick Start

### Prerequisites
- .NET 8.0
- MySQL 5.5.6+
- GPSGate API access configured

### Database Setup
```sql
-- Run in order:
source database/01_fuel_audit_gps_readings.sql
source database/02_fuel_audit_core_tables.sql
source database/03_tankvolumehistory_integration.sql
```

### Configuration
```json
// appsettings.json
{
  "GPSGate": {
    "BaseUrl": "https://gpsgate.example.com/comGpsGate/api/v.1/applications",
    "ApplicationId": 3,
    "Username": "username",
    "Password": "password"
  }
}
```

### API Endpoints
```
GET  /api/FuelAuditGPS/vehicle/{vehicleId}
POST /api/FuelAuditGPS/fleet
GET  /api/FuelAuditGPS/vehicle/{vehicleId}/consumption
GET  /api/FuelAuditGPS/vehicle/{vehicleId}/refuel-events
POST /api/FuelAuditGPS/fleet/audit-period
```

---

## Architecture Overview

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚                           API Layer                                   â”‚
â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”  â”‚
â”‚  â”‚ FuelAuditGPS       â”‚  â”‚ (Future: FuelAuditController)          â”‚  â”‚
â”‚  â”‚ Controller         â”‚  â”‚                                        â”‚  â”‚
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜  â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                                    â”‚
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚                       Application Layer                               â”‚
â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”  â”‚
â”‚  â”‚ Commands        â”‚  â”‚ Queries         â”‚  â”‚ Services            â”‚  â”‚
â”‚  â”‚ â”€â”€â”€â”€â”€â”€â”€         â”‚  â”‚ â”€â”€â”€â”€â”€â”€â”€         â”‚  â”‚ â”€â”€â”€â”€â”€â”€â”€â”€            â”‚  â”‚
â”‚  â”‚ CreateAudit     â”‚  â”‚ GetAudits       â”‚  â”‚ GPS Service         â”‚  â”‚
â”‚  â”‚ CalculateAudit  â”‚  â”‚ GetAuditById    â”‚  â”‚ TankStock Service   â”‚  â”‚
â”‚  â”‚ SubmitTanker    â”‚  â”‚ GetThresholds   â”‚  â”‚ Calculation Service â”‚  â”‚
â”‚  â”‚ FinalizeAudit   â”‚  â”‚                 â”‚  â”‚                     â”‚  â”‚
â”‚  â”‚ ResolveFlag     â”‚  â”‚                 â”‚  â”‚                     â”‚  â”‚
â”‚  â”‚ CancelAudit     â”‚  â”‚                 â”‚  â”‚                     â”‚  â”‚
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜  â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                                    â”‚
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚                        Domain Layer                                   â”‚
â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â” â”‚
â”‚  â”‚ Entities:                                                        â”‚ â”‚
â”‚  â”‚ FuelAudit, FuelAuditTankerReading, FuelAuditVehiclePosition,    â”‚ â”‚
â”‚  â”‚ FuelAuditVariance, FuelAuditFlag, FuelAuditThreshold,           â”‚ â”‚
â”‚  â”‚ FuelAuditGPSReading                                              â”‚ â”‚
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                                    â”‚
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚                      Persistence Layer                                â”‚
â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â” â”‚
â”‚  â”‚ EF Core Config  â”‚  â”‚ External Services                          â”‚ â”‚
â”‚  â”‚                 â”‚  â”‚ â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€                            â”‚ â”‚
â”‚  â”‚ GpsdataContext  â”‚  â”‚ GPSGate API                                â”‚ â”‚
â”‚  â”‚                 â”‚  â”‚ TankVolumeHistory                          â”‚ â”‚
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

---

## Key Features

### 1. GPS Fleet Integration
- Real-time fuel level from GPSGate `/tracks` API
- Parallel processing with throttling (max 10 concurrent)
- Data quality tracking (Exact, Interpolated, NoData)
- Refuel event detection
- Cached readings for performance

### 2. Tank Stock Integration
- Automatic population from TankVolumeHistory
- Opening/closing stock interpolation
- Transaction summaries (deliveries, dispensing, transfers)
- Data quality flagging

### 3. Audit Calculation
- Multi-tier reconciliation (Tank â†’ GPS â†’ Pickup)
- Automatic variance detection
- Configurable thresholds
- Flag generation for anomalies

---

## File Structure

```
FMS.Application/Features/FuelAudit/
â”œâ”€â”€ Commands/
â”‚   â”œâ”€â”€ CalculateAuditCommand.cs
â”‚   â”œâ”€â”€ CancelAuditCommand.cs
â”‚   â”œâ”€â”€ CreateFuelAuditCommand.cs
â”‚   â”œâ”€â”€ FinalizeAuditCommand.cs
â”‚   â”œâ”€â”€ ResolveFlagCommand.cs
â”‚   â””â”€â”€ SubmitTankerReadingCommand.cs
â”œâ”€â”€ Queries/
â”‚   â”œâ”€â”€ GetAuditThresholdsQuery.cs
â”‚   â”œâ”€â”€ GetFuelAuditByIdQuery.cs
â”‚   â””â”€â”€ GetFuelAuditsQuery.cs
â”œâ”€â”€ DTOs/
â”‚   â”œâ”€â”€ FleetFuelPositionDTO.cs
â”‚   â”œâ”€â”€ FuelAuditDTOs.cs
â”‚   â”œâ”€â”€ FuelDataQuality.cs
â”‚   â”œâ”€â”€ RefuelEventDTO.cs
â”‚   â”œâ”€â”€ VehicleFuelConsumptionDTO.cs
â”‚   â””â”€â”€ VehicleFuelPositionDTO.cs
â””â”€â”€ Services/
    â”œâ”€â”€ FuelAuditCalculationService.cs
    â”œâ”€â”€ FuelAuditTankStockService.cs
    â”œâ”€â”€ IFuelAuditCalculationService.cs
    â””â”€â”€ IFuelAuditGPSService.cs

FMS.Domain/Entities/FuelAudit/
â”œâ”€â”€ FuelAudit.cs
â”œâ”€â”€ FuelAuditFlag.cs
â”œâ”€â”€ FuelAuditGPSReading.cs
â”œâ”€â”€ FuelAuditTankerReading.cs
â”œâ”€â”€ FuelAuditThreshold.cs
â”œâ”€â”€ FuelAuditVariance.cs
â””â”€â”€ FuelAuditVehiclePosition.cs

FMS.Persistence/EntityConfigurations/FuelAudit/
â”œâ”€â”€ FuelAuditConfiguration.cs
â”œâ”€â”€ FuelAuditFlagConfiguration.cs
â”œâ”€â”€ FuelAuditGPSReadingConfiguration.cs
â”œâ”€â”€ FuelAuditTankerReadingConfiguration.cs
â”œâ”€â”€ FuelAuditThresholdConfiguration.cs
â”œâ”€â”€ FuelAuditVarianceConfiguration.cs
â””â”€â”€ FuelAuditVehiclePositionConfiguration.cs

FMS.WebClient/Controllers/FuelManagement/
â””â”€â”€ FuelAuditGPSController.cs

FMS.Testing/FuelAudit/
â””â”€â”€ FuelAuditGPSServiceTests.cs

fms.frontend/src/
â”œâ”€â”€ pages/tankStock/fuelAudit/
â”‚   â”œâ”€â”€ components/
â”‚   â”‚   â”œâ”€â”€ CreateAuditWizard.js      # 6-step wizard
â”‚   â”‚   â””â”€â”€ CreateAuditWizard.scss    # Wizard styles
â”‚   â””â”€â”€ FuelAuditMain.js              # Module routing
â”œâ”€â”€ redux/slices/
â”‚   â””â”€â”€ fuelAuditSlice.js             # State management
â””â”€â”€ api/
    â””â”€â”€ fuelAuditApi.js               # API client
```

---

## Next Steps

1. **Frontend Dashboard** - Complete audit listing and management UI
2. **Frontend Detail View** - Individual audit view with readings and variances
3. **Reporting** - PDF/Excel export capability
4. **Notifications** - Alert integration for flags
5. **Pickup Fleet Estimation** - Dead stock calculation service

---

## Related Documentation

- [Hybrid Fuel Audit Algorithm](../hybrid_fuel_audit_algorithm.md)
- [TankVolumeHistory Integration](../../TankStock/TankVolumeHistory.md)
- [GPSGate API Reference](../../GPSGate/)
