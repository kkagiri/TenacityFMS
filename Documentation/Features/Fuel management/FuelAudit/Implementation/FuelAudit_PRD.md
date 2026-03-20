# Fuel Audit System - Product Requirements Document (PRD)

**Version:** 1.0
**Created:** November 27, 2025
**Status:** Draft
**Database:** MySQL 5.5.6 Compatible

---

## 1. Executive Summary

### 1.1 Purpose
Implement a comprehensive Fuel Audit System that reconciles fuel across a mixed fleet with:
- **Tankers** (fuel storage with physical dip readings)
- **GPS Fleet** (vehicles with fuel sensors - full tracking capability)
- **Pickup Fleet** (vehicles without fuel sensors - full-tank refuel policy)

### 1.2 Business Objectives
| Objective | Measure of Success |
|-----------|-------------------|
| Reduce fuel losses | Track variance to < 1% per audit period |
| Improve accountability | 100% of dispensing transactions traced |
| Enable proactive detection | Flag anomalies within 24 hours |
| Support compliance | Generate auditable reports |

### 1.3 Scope
| In Scope | Out of Scope |
|----------|--------------|
| Tanker stock reconciliation | Fuel procurement management |
| GPS fleet fuel tracking | Driver behavior scoring |
| Pickup fleet estimation | Route optimization |
| Variance analysis & flags | Predictive maintenance |
| Audit reporting | Fuel price management |

---

## 2. User Stories & Requirements

### 2.1 User Roles

| Role | Description | Key Permissions |
|------|-------------|-----------------|
| Fleet Manager | Oversees fleet operations | View all audits, run reports |
| Fuel Auditor | Conducts fuel reconciliation | Create/edit audits, approve variances |
| Station Attendant | Records dispensing | Enter fuel transactions |
| System Admin | System configuration | Configure thresholds, manage users |

### 2.2 User Stories

#### Epic 1: Audit Configuration
| ID | User Story | Priority | Acceptance Criteria |
|----|------------|----------|---------------------|
| US-001 | As a Fuel Auditor, I want to define an audit period so that I can reconcile fuel for a specific timeframe | High | Can select start/end dates, system validates date range |
| US-002 | As a Fuel Auditor, I want to configure variance thresholds so that flags are relevant to our operations | Medium | Can set % and absolute thresholds per category |
| US-003 | As a System Admin, I want to classify vehicles as GPS/Pickup so that the system applies correct algorithms | High | Vehicle type stored and used in calculations |

#### Epic 2: Data Collection
| ID | User Story | Priority | Acceptance Criteria |
|----|------------|----------|---------------------|
| US-010 | As a Fuel Auditor, I want to capture tanker opening/closing stock so that I can track storage variance | High | Manual entry with timestamp, supports multiple tankers |
| US-011 | As a Fuel Auditor, I want to automatically pull GPS fleet consumption data so that I don't manually enter | High | System aggregates GPS data for audit period |
| US-012 | As a Fuel Auditor, I want to view all dispensing transactions so that I can verify fuel distribution | High | List of all transactions with vehicle, litres, date |
| US-013 | As a Fuel Auditor, I want to estimate pickup dead stock so that I have complete fleet position | Medium | System calculates based on refuel history |

#### Epic 3: Reconciliation
| ID | User Story | Priority | Acceptance Criteria |
|----|------------|----------|---------------------|
| US-020 | As a Fuel Auditor, I want the system to calculate expected vs actual closing stock so that I can identify variance | High | Formula: Opening + Deliveries - Consumption = Expected |
| US-021 | As a Fuel Auditor, I want to see variance broken down by fleet type so that I can isolate issues | High | Separate variance for Tanker, GPS Fleet, Pickup Fleet |
| US-022 | As a Fuel Auditor, I want confidence levels on estimated values so that I know data reliability | Medium | % confidence based on estimation factors |

#### Epic 4: Alerts & Flags
| ID | User Story | Priority | Acceptance Criteria |
|----|------------|----------|---------------------|
| US-030 | As a Fleet Manager, I want automatic alerts when variance exceeds threshold so that I can act quickly | High | Real-time flags generated during reconciliation |
| US-031 | As a Fuel Auditor, I want to see pattern-based flags so that I can detect systematic issues | Medium | Trending analysis across multiple audits |
| US-032 | As a Fuel Auditor, I want to acknowledge/resolve flags so that I can track investigation status | Medium | Flag lifecycle: Open → Investigating → Resolved |

#### Epic 5: Reporting
| ID | User Story | Priority | Acceptance Criteria |
|----|------------|----------|---------------------|
| US-040 | As a Fleet Manager, I want a summary audit report so that I can review fuel position at a glance | High | PDF/Excel export with sections A-F per algorithm |
| US-041 | As a Fuel Auditor, I want drill-down capability so that I can investigate specific variances | Medium | Click variance → see contributing transactions |
| US-042 | As a Fleet Manager, I want historical audit comparison so that I can track improvement over time | Low | Graph/table comparing audits over time |

---

## 3. Functional Requirements

### 3.1 Data Collection Requirements

#### FR-001: Tanker Data Collection
| Requirement | Description |
|-------------|-------------|
| FR-001.1 | System shall capture opening stock per tanker (litres, timestamp, method: dip/gauge) |
| FR-001.2 | System shall capture closing stock per tanker (litres, timestamp, method: dip/gauge) |
| FR-001.3 | System shall aggregate deliveries from existing delivery records |
| FR-001.4 | System shall aggregate dispensing from existing transaction records |

#### FR-002: GPS Fleet Data Collection
| Requirement | Description |
|-------------|-------------|
| FR-002.1 | System shall retrieve opening dead stock from GPS sensor at audit start |
| FR-002.2 | System shall retrieve closing dead stock from GPS sensor at audit end |
| FR-002.3 | System shall calculate total consumption from GPS data for period |
| FR-002.4 | System shall match dispensing transactions to GPS refuel events |

#### FR-003: Pickup Fleet Data Collection
| Requirement | Description |
|-------------|-------------|
| FR-003.1 | System shall retrieve tank capacity per pickup from vehicle master |
| FR-003.2 | System shall retrieve all refuel transactions for period |
| FR-003.3 | System shall calculate estimated dead stock based on refuel history |
| FR-003.4 | System shall track confidence level of estimations |

### 3.2 Reconciliation Requirements

#### FR-010: Tanker Reconciliation
| Requirement | Description |
|-------------|-------------|
| FR-010.1 | Calculate: Expected Closing = Opening + Deliveries - Dispensed |
| FR-010.2 | Calculate: Variance = Actual Closing - Expected Closing |
| FR-010.3 | Aggregate across all tankers for total tanker position |

#### FR-011: GPS Fleet Reconciliation
| Requirement | Description |
|-------------|-------------|
| FR-011.1 | Per vehicle: Expected Closing = Opening + Refueled - Consumed (GPS) |
| FR-011.2 | Per vehicle: Variance = Actual Closing (sensor) - Expected Closing |
| FR-011.3 | Cross-verify: Tanker dispensed to GPS = GPS fleet refueled |
| FR-011.4 | Flag mismatch if dispensing != GPS received |

#### FR-012: Pickup Fleet Reconciliation
| Requirement | Description |
|-------------|-------------|
| FR-012.1 | Consumption = Sum of refuel litres (full-tank policy) |
| FR-012.2 | Estimate opening dead stock based on last refuel before audit start |
| FR-012.3 | Estimate closing dead stock based on days since last refuel |
| FR-012.4 | Calculate confidence: Recent refuel = high, old refuel = low |

#### FR-013: System Reconciliation
| Requirement | Description |
|-------------|-------------|
| FR-013.1 | System Opening = Tanker Opening + GPS Fleet Opening + Pickup Fleet Opening |
| FR-013.2 | System Closing = Tanker Closing + GPS Fleet Closing + Pickup Fleet Closing |
| FR-013.3 | Expected Closing = Opening + External In - External Out |
| FR-013.4 | System Variance = Actual Closing - Expected Closing |

### 3.3 Alert Requirements

#### FR-020: Threshold Alerts
| Requirement | Description |
|-------------|-------------|
| FR-020.1 | Flag if vehicle variance > configurable threshold (default: 5L) |
| FR-020.2 | Flag if tanker variance > configurable threshold (default: 20L) |
| FR-020.3 | Flag if system variance % > configurable threshold (default: 1%) |
| FR-020.4 | Flag if pickup last refuel > 14 days (uncertain estimation) |

#### FR-021: Pattern Alerts
| Requirement | Description |
|-------------|-------------|
| FR-021.1 | Flag if variance trends consistently negative across audits |
| FR-021.2 | Flag if dispensing to GPS > GPS fleet received |
| FR-021.3 | Flag if vehicle consumption anomaly vs historical average |

---

## 4. Non-Functional Requirements

### 4.1 Performance
| Requirement | Target |
|-------------|--------|
| Audit calculation time | < 30 seconds for 500 vehicles |
| Report generation | < 10 seconds |
| Data retrieval | < 5 seconds per query |

### 4.2 Scalability
| Requirement | Target |
|-------------|--------|
| Fleet size | Up to 1,000 vehicles |
| Tanker count | Up to 50 tankers |
| Audit history | 5 years retention |

### 4.3 Security
| Requirement | Description |
|-------------|-------------|
| Authentication | Integrate with existing FMS JWT auth |
| Authorization | Permission-based access per user role |
| Audit Trail | Log all audit actions with user/timestamp |

### 4.4 Compatibility
| Requirement | Specification |
|-------------|---------------|
| Database | MySQL 5.5.6 |
| Backend | .NET 8.0 |
| Frontend | React 18 + DevExtreme |

---

## 5. Data Requirements

### 5.1 New Entities (To Be Created)
| Entity | Description |
|--------|-------------|
| FuelAudit | Master audit record with period and status |
| FuelAuditTankerReading | Tanker opening/closing readings |
| FuelAuditVehiclePosition | Per-vehicle fuel position snapshot |
| FuelAuditVariance | Calculated variances with flags |
| FuelAuditFlag | Alert/flag records with status |
| FuelAuditThreshold | Configurable threshold settings |

### 5.2 Existing Entities (To Reference)
| Entity | Usage |
|--------|-------|
| Vehicle | Fleet master with type (GPS/Pickup) |
| Tank | Tanker master data |
| FuelRefill | Dispensing transactions |
| PumpTransaction | Pump-based transactions |
| *GPS Consumption Data* | TBD - need to identify source |

### 5.3 Estimation Parameters
| Parameter | Default | Description |
|-----------|---------|-------------|
| avg_refuel_interval_days | 7 | Average days between refuels |
| high_confidence_threshold | 3 days | Refuel within X days = high confidence |
| medium_confidence_threshold | 7 days | Refuel within X days = medium confidence |

---

## 6. UI/UX Requirements

### 6.1 Screens Required

| Screen | Purpose | Priority |
|--------|---------|----------|
| Audit Dashboard | Overview of current/recent audits | High |
| Create Audit Wizard | Step-by-step audit creation | High |
| Audit Detail View | Full audit with all sections | High |
| Tanker Reading Entry | Enter dip/gauge readings | High |
| Variance Analysis | Drill-down into variances | Medium |
| Flag Management | View/resolve flags | Medium |
| Threshold Configuration | Admin settings | Medium |
| Audit History | Historical audit list | Low |

### 6.2 Report Outputs

| Report | Format | Content |
|--------|--------|---------|
| Summary Audit Report | PDF/Excel | Sections A-F per algorithm |
| Variance Detail Report | Excel | Transaction-level breakdown |
| Flag Report | PDF | All flags with status |

---

## 7. Integration Requirements

### 7.1 Internal Integrations
| System | Integration Type | Purpose |
|--------|-----------------|---------|
| GPS Tracking | Read | Get consumption and sensor data |
| Fuel Management | Read | Get dispensing transactions |
| Vehicle Master | Read | Get vehicle details and type |
| Tank Management | Read | Get tank/tanker details |
| Notification System | Write | Send alerts for flags |

### 7.2 External Integrations
| System | Integration Type | Purpose |
|--------|-----------------|---------|
| None identified | - | - |

---

## 8. Assumptions & Constraints

### 8.1 Assumptions
1. All GPS vehicles have working fuel sensors
2. Pickup fleet follows full-tank refuel policy
3. Tanker readings are taken by trained personnel
4. Historical consumption data exists for estimation

### 8.2 Constraints
1. Database must be MySQL 5.5.6 compatible (no JSON columns, etc.)
2. Must use existing FMS authentication/authorization
3. Must follow CQRS pattern with FMSResponse<T>

### 8.3 Dependencies
1. GPS consumption data source must be identified
2. Vehicle type classification must exist or be added
3. Tank capacity must be available for all pickups

---

## 9. Risks & Mitigations

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| GPS data gaps | Inaccurate reconciliation | Medium | Flag vehicles with missing data |
| Pickup estimation uncertainty | Low confidence results | High | Force refuels on audit dates for critical audits |
| Historical data quality | Poor baseline | Medium | Allow manual override with audit trail |
| User adoption | System unused | Low | Training and intuitive UI |

---

## 10. Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Audit completion rate | 100% monthly | # audits completed / expected |
| Variance detection | < 1% unresolved | Variance after investigation |
| Flag resolution time | < 48 hours | Time from flag to resolution |
| User adoption | 90% of fleet managers | Active users / total users |

---

## 11. Approval

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Product Owner | | | |
| Technical Lead | | | |
| Fleet Manager | | | |

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Nov 27, 2025 | | Initial draft |