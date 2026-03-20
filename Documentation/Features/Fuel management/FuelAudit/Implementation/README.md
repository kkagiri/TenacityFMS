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
| **Domain Entities** | ✅ Complete | All 7 entities created |
| **Entity Configurations** | ✅ Complete | EF Core configurations |
| **Database Scripts** | ✅ Complete | MySQL 5.5.6 compatible |
| **DTOs** | ✅ Complete | All DTOs for API |
| **Commands** | ✅ Complete | 6 command handlers |
| **Queries** | ✅ Complete | 3 query handlers |
| **GPS Service** | ✅ Complete | Integration with GPSGate |
| **Tank Stock Service** | ✅ Complete | TankVolumeHistory integration |
| **Calculation Service** | ✅ Complete | Core reconciliation logic |
| **API Controller** | ✅ Complete | FuelAuditGPSController |
| **Unit Tests** | ✅ Complete | GPS service tests |
| **Frontend - Wizard** | ✅ Complete | 6-step CreateAuditWizard |
| **Frontend - Dashboard** | 🔄 In Progress | Audit listing and management |
| **Frontend - Detail View** | 🔄 In Progress | Individual audit view |

---

## Document Index

| Document | Description | Status |
|----------|-------------|--------|
| [PRD](./FuelAudit_PRD.md) | Product Requirements | ✅ Updated |
| [Task Breakdown](./FuelAudit_TaskBreakdown.md) | Implementation Tasks | ✅ Updated |
| [Architecture](./FuelAudit_Architecture.md) | System Architecture | ✅ Complete |
| [Sequence Flows](./FuelAudit_SequenceFlows.md) | Operation Flows | ✅ Complete |
| [API Documentation](./FuelAudit_API.md) | API Specification | ✅ Complete |
| [GPS Service Design](./GPSDataService_Design.md) | GPS Integration | ✅ Complete |
| [Frontend Guide](./FuelAudit_Frontend.md) | React Components | ✅ Complete |
| [Database Scripts](./database/) | SQL Migrations | ✅ Complete |

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
    "BaseUrl": "https://gpsgate.hyoung.co.ke/comGpsGate/api/v.1/applications",
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
┌──────────────────────────────────────────────────────────────────────┐
│                           API Layer                                   │
│  ┌────────────────────┐  ┌────────────────────────────────────────┐  │
│  │ FuelAuditGPS       │  │ (Future: FuelAuditController)          │  │
│  │ Controller         │  │                                        │  │
│  └────────────────────┘  └────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────┘
                                    │
┌──────────────────────────────────────────────────────────────────────┐
│                       Application Layer                               │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────┐  │
│  │ Commands        │  │ Queries         │  │ Services            │  │
│  │ ───────         │  │ ───────         │  │ ────────            │  │
│  │ CreateAudit     │  │ GetAudits       │  │ GPS Service         │  │
│  │ CalculateAudit  │  │ GetAuditById    │  │ TankStock Service   │  │
│  │ SubmitTanker    │  │ GetThresholds   │  │ Calculation Service │  │
│  │ FinalizeAudit   │  │                 │  │                     │  │
│  │ ResolveFlag     │  │                 │  │                     │  │
│  │ CancelAudit     │  │                 │  │                     │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────────┘  │
└──────────────────────────────────────────────────────────────────────┘
                                    │
┌──────────────────────────────────────────────────────────────────────┐
│                        Domain Layer                                   │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │ Entities:                                                        │ │
│  │ FuelAudit, FuelAuditTankerReading, FuelAuditVehiclePosition,    │ │
│  │ FuelAuditVariance, FuelAuditFlag, FuelAuditThreshold,           │ │
│  │ FuelAuditGPSReading                                              │ │
│  └─────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────┘
                                    │
┌──────────────────────────────────────────────────────────────────────┐
│                      Persistence Layer                                │
│  ┌─────────────────┐  ┌────────────────────────────────────────────┐ │
│  │ EF Core Config  │  │ External Services                          │ │
│  │                 │  │ ───────────────                            │ │
│  │ GpsdataContext  │  │ GPSGate API                                │ │
│  │                 │  │ TankVolumeHistory                          │ │
│  └─────────────────┘  └────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────┘
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
- Multi-tier reconciliation (Tank → GPS → Pickup)
- Automatic variance detection
- Configurable thresholds
- Flag generation for anomalies

---

## File Structure

```
FMS.Application/Features/FuelAudit/
├── Commands/
│   ├── CalculateAuditCommand.cs
│   ├── CancelAuditCommand.cs
│   ├── CreateFuelAuditCommand.cs
│   ├── FinalizeAuditCommand.cs
│   ├── ResolveFlagCommand.cs
│   └── SubmitTankerReadingCommand.cs
├── Queries/
│   ├── GetAuditThresholdsQuery.cs
│   ├── GetFuelAuditByIdQuery.cs
│   └── GetFuelAuditsQuery.cs
├── DTOs/
│   ├── FleetFuelPositionDTO.cs
│   ├── FuelAuditDTOs.cs
│   ├── FuelDataQuality.cs
│   ├── RefuelEventDTO.cs
│   ├── VehicleFuelConsumptionDTO.cs
│   └── VehicleFuelPositionDTO.cs
└── Services/
    ├── FuelAuditCalculationService.cs
    ├── FuelAuditTankStockService.cs
    ├── IFuelAuditCalculationService.cs
    └── IFuelAuditGPSService.cs

FMS.Domain/Entities/FuelAudit/
├── FuelAudit.cs
├── FuelAuditFlag.cs
├── FuelAuditGPSReading.cs
├── FuelAuditTankerReading.cs
├── FuelAuditThreshold.cs
├── FuelAuditVariance.cs
└── FuelAuditVehiclePosition.cs

FMS.Persistence/EntityConfigurations/FuelAudit/
├── FuelAuditConfiguration.cs
├── FuelAuditFlagConfiguration.cs
├── FuelAuditGPSReadingConfiguration.cs
├── FuelAuditTankerReadingConfiguration.cs
├── FuelAuditThresholdConfiguration.cs
├── FuelAuditVarianceConfiguration.cs
└── FuelAuditVehiclePositionConfiguration.cs

FMS.WebClient/Controllers/FuelManagement/
└── FuelAuditGPSController.cs

FMS.Testing/FuelAudit/
└── FuelAuditGPSServiceTests.cs

fms.frontend/src/
├── pages/tankStock/fuelAudit/
│   ├── components/
│   │   ├── CreateAuditWizard.js      # 6-step wizard
│   │   └── CreateAuditWizard.scss    # Wizard styles
│   └── FuelAuditMain.js              # Module routing
├── redux/slices/
│   └── fuelAuditSlice.js             # State management
└── api/
    └── fuelAuditApi.js               # API client
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
