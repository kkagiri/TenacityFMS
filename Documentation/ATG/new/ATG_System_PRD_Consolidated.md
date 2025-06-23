 # ATG Fueling System - Product Requirements Document (PRD)

**Document Version:** 1.0
**Last Updated:** December 2024
**Owner:** FMS Development Team

## Executive Summary

The ATG (Automatic Tank Gauging) Fueling System is a comprehensive solution for managing fuel dispensing operations, tank monitoring, and transaction processing within the FMS (Fuel Management System). This document consolidates all system requirements, current state analysis, and implementation roadmap based on existing documentation.

## Table of Contents

1. [System Overview](#system-overview)
2. [Current State Analysis](#current-state-analysis)
3. [Core Features & Requirements](#core-features--requirements)
4. [Implementation Task List](#implementation-task-list)
5. [Technical Specifications](#technical-specifications)

## System Overview

### Purpose
The ATG Fueling System provides:
- Real-time fuel dispensing control and monitoring
- Automated transaction processing
- Tank level monitoring and management
- Integration with PTS (Petroleum Terminal System) devices
- Mobile and web-based user interfaces

### Key Stakeholders
- **Fuel Operations Staff**: Primary users for daily operations
- **System Administrators**: Configuration and maintenance
- **Fleet Managers**: Monitoring and reporting
- **Field Technicians**: Mobile interface users

## Current State Analysis

### As-Is System Components

#### 1. Backend Services (`FMS.Application/Features/`)
- **ATG Transaction Processing**: Handles fueling transactions
- **Device Communication**: PTS device integration via TCP/IP and HTTP polling
- **Real-time Monitoring**: Tank and pump status using SignalR
- **Data Persistence**: Transaction and inventory data in MySQL

#### 2. Frontend Components (`fms.frontend/src/`)
- **Fueling Dashboard**: Real-time operations view
- **Transaction Management**: Historical transaction data
- **Tank Monitoring**: Current tank levels and status
- **Mobile Interface**: Field operations support

#### 3. Background Services (`FMS.BackgroundServices/FMS/`)
- **Automated Reconciliation**: Stock level reconciliation
- **Transaction Completion**: Auto-completion service
- **Alarm Processing**: Alert and notification handling

### Current Gaps & Pain Points

1. **User Experience Issues**
   - Complex navigation between fueling operations
   - Limited mobile responsiveness
   - Inconsistent error handling across interfaces

2. **System Integration Challenges**
   - PTS device communication reliability issues
   - Real-time data synchronization delays
   - Transaction state management inconsistencies

3. **Operational Inefficiencies**
   - Manual reconciliation processes
   - Limited automated workflows
   - Insufficient real-time monitoring capabilities

## Core Features & Requirements

### 1. Fueling Transaction Management

#### Functional Requirements
- **FR-001**: Initiate fueling transactions via mobile/web interface
- **FR-002**: Real-time transaction monitoring and control
- **FR-003**: Automatic transaction completion based on business rules
- **FR-004**: Transaction cancellation and error handling
- **FR-005**: Multi-pump concurrent operation support

#### Non-Functional Requirements
- **NFR-001**: Transaction response time < 3 seconds
- **NFR-002**: 99.9% uptime for critical operations
- **NFR-003**: Support for 50+ concurrent transactions
- **NFR-004**: Real-time data latency < 1 second

### 2. Tank Monitoring System

#### Functional Requirements
- **FR-006**: Real-time tank level monitoring
- **FR-007**: Low-level and overfill alerts
- **FR-008**: Historical tank data tracking
- **FR-009**: Tank reconciliation automation
- **FR-010**: Multi-product tank support

### 3. Mobile Operations

#### Functional Requirements
- **FR-011**: Mobile fueling interface for field operations
- **FR-012**: Offline operation capability
- **FR-013**: Barcode/QR code scanning integration
- **FR-014**: GPS location tracking for transactions
- **FR-015**: Push notifications for alerts

## Implementation Task List

### Phase 1: Critical Stabilization (Weeks 1-2)

#### Backend Tasks - Critical Priority
- [ ] **B-001**: Fix PTS device communication timeout issues
  - **Location**: `FMS.Application/Communication/`
  - **Effort**: 3 days
  - **Description**: Resolve connection timeouts and implement retry mechanisms

- [ ] **B-002**: Implement proper transaction state management
  - **Location**: `FMS.Application/Features/ATG/`
  - **Effort**: 5 days
  - **Description**: Create robust state machine for transaction lifecycle

- [ ] **B-003**: Enhance error handling in packet processing
  - **Location**: `FMS.Application/Handlers/PacketHandlers/`
  - **Effort**: 2 days
  - **Description**: Add comprehensive error codes and recovery procedures

#### Frontend Tasks - High Priority
- [ ] **F-001**: Standardize all components with tw- prefix for Tailwind
  - **Location**: `fms.frontend/src/components/`
  - **Effort**: 3 days
  - **Description**: Apply tw- prefix to avoid DevExtreme conflicts

- [ ] **F-002**: Implement consistent error messaging system
  - **Location**: `fms.frontend/src/`
  - **Effort**: 2 days
  - **Description**: Create unified error handling and user notifications

- [ ] **F-003**: Optimize SignalR connection management
  - **Location**: `fms.frontend/src/services/`
  - **Effort**: 2 days
  - **Description**: Improve real-time connection stability

### Phase 2: Enhancement & Mobile (Weeks 3-6)

#### Mobile Development - High Priority
- [ ] **M-001**: Create React Native project structure
  - **Location**: `fms.mobile/`
  - **Effort**: 3 days
  - **Description**: Set up mobile app architecture with Expo

- [ ] **M-002**: Implement offline data synchronization
  - **Location**: `fms.mobile/src/services/`
  - **Effort**: 5 days
  - **Description**: Enable offline operations with sync capabilities

- [ ] **M-003**: Develop mobile fueling interface
  - **Location**: `fms.mobile/src/screens/`
  - **Effort**: 4 days
  - **Description**: Create touch-optimized fueling control interface

#### System Integration - Medium Priority
- [ ] **S-001**: Implement automated reconciliation service
  - **Location**: `FMS.BackgroundServices/FMS/`
  - **Effort**: 4 days
  - **Description**: Automate daily/hourly reconciliation processes

- [ ] **S-002**: Enhance notification system integration
  - **Location**: `FMS.Application/Infrastructure/`
  - **Effort**: 3 days
  - **Description**: Integrate with existing notification system

### Phase 3: Testing & Quality Assurance (Weeks 7-8)

#### Test Coverage - High Priority
- [ ] **T-001**: Unit tests for ATG transaction processing
  - **Location**: `FMS.Testing/ATGTest/`
  - **Effort**: 3 days
  - **Description**: Comprehensive unit test coverage for core transactions

- [ ] **T-002**: Integration tests for PTS communication
  - **Location**: `FMS.Testing/IntegrationTests/`
  - **Effort**: 4 days
  - **Description**: End-to-end testing of device communication

- [ ] **T-003**: Mobile app testing suite
  - **Location**: `fms.mobile/tests/`
  - **Effort**: 3 days
  - **Description**: Automated testing for mobile interfaces

## Technical Specifications

### Technology Stack

#### Backend
- **Framework**: .NET Core 6.0+
- **Architecture**: Clean Architecture with CQRS
- **Database**: MySQL with Entity Framework Core
- **Communication**: SignalR, TCP/IP, HTTP
- **Response Pattern**: Use `FMSResponse.cs` for all API responses

#### Frontend
- **Web**: React 18+ with TypeScript
- **Mobile**: React Native with Expo
- **UI Framework**: DevExtreme with tw- prefixed Tailwind CSS
- **State Management**: Redux Toolkit
- **Icons**: Font Awesome with "fa-light fa-icon" prefix

#### Key Architectural Patterns
- All API responses must use `FMSResponse.cs` pattern
- Validation checks required for all CRUD operations
- Background services for automated processes
- Real-time updates via SignalR

### File Structure Compliance
```
FMS.Application/                // Business logic, DTOs, commands, queries
├── Features/                   // Feature-based organization
├── Common/FMSResponse.cs      // Standardized API responses
└── Services/                   // Application services

FMS.WebClient/                  // API controllers
├── Controllers/                // RESTful API endpoints

fms.frontend/                   // React frontend
├── src/components/            // Reusable UI components (tw- prefix)
├── src/redux/reducer/         // State management
└── src/services/              // API communication

fms.mobile/                     // React Native mobile app
├── src/screens/               // Mobile screens
└── src/services/              // Mobile-specific services

FMS.Testing/                    // Test projects
├── ATGTest/                   // ATG-specific tests
└── IntegrationTests/          // Cross-system tests
```

## Success Metrics

### Technical KPIs
- **System Uptime**: 99.9%
- **Transaction Response Time**: < 3 seconds
- **Error Rate**: < 0.1%
- **Mobile App Performance**: 60 FPS, < 2s load time
- **Test Coverage**: 90%+ for core modules

### Business KPIs
- **User Satisfaction**: 90%+ positive feedback
- **Operational Efficiency**: 25% reduction in manual processes
- **Data Accuracy**: 99.5% transaction accuracy
- **Cost Savings**: 20% reduction in operational costs

### Quality Gates
- [ ] All critical bugs resolved
- [ ] Performance benchmarks met
- [ ] Security audit passed
- [ ] User acceptance testing completed
- [ ] Documentation updated

## Risk Assessment & Mitigation

### High Risks
1. **PTS Device Integration**: Legacy device compatibility issues
   - **Mitigation**: Comprehensive device testing and fallback protocols

2. **Real-time Performance**: Network latency affecting operations
   - **Mitigation**: Local caching and offline operation capabilities

3. **Data Integrity**: Transaction data consistency during failures
   - **Mitigation**: Multiple validation checkpoints and reconciliation

### Medium Risks
1. **Mobile Platform Compatibility**: iOS/Android differences
   - **Mitigation**: Use React Native with platform-specific testing

2. **User Adoption**: Resistance to new mobile interface
   - **Mitigation**: Gradual rollout with comprehensive training

## Next Steps

1. **Immediate Actions (This Week)**
   - Begin Phase 1 critical stabilization tasks
   - Set up development environment for mobile app
   - Establish testing framework

2. **Short Term (Month 1)**
   - Complete backend stabilization
   - Launch mobile app development
   - Implement core testing suite

3. **Medium Term (Months 2-3)**
   - Deploy mobile app for pilot testing
   - Enhance system integration
   - Gather user feedback and iterate

---

**Document Control**
- **Created**: December 2024
- **Version**: 1.0
- **Next Review**: January 2025
- **Approval Required**: Development Team Lead, Product Owner