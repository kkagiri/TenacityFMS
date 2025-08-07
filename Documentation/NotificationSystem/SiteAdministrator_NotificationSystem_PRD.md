# Site Administrator Notification System - Product Requirements Document (PRD)

## Document Information
- **Document Version**: 1.0
- **Created Date**: August 6, 2025
- **Last Updated**: August 6, 2025
- **Created By**: System Architect
- **Status**: Draft
- **Project**: FMS Notification System Enhancement

## Executive Summary

This PRD outlines the enhancement of the FMS Notification System to implement mandatory Site Administrator roles and dynamic recipient resolution. The current system relies on hardcoded recipients and lacks proper site-level administrative control. This enhancement will provide business-rule-driven notification routing while ensuring each site has a designated administrator responsible for critical notifications.

## Problem Statement

### Current Issues
1. **No Mandatory Site Administrator**: Sites lack dedicated administrators responsible for notifications
2. **Hardcoded Recipients**: Notification recipients are manually specified in code
3. **Limited Flexibility**: No dynamic recipient selection based on business rules
4. **No User Preferences**: Users cannot control what notifications they receive
5. **Missing Escalation**: No proper escalation chains for critical notifications

### Business Impact
- **Operational Risk**: Critical alerts may not reach responsible personnel
- **Maintenance Overhead**: Code changes required for recipient modifications
- **Poor User Experience**: Users receive irrelevant notifications
- **Compliance Issues**: No clear accountability for site-level incidents

## Solution Overview

### Core Enhancements
1. **Mandatory Site Administrator** - Each site must have a designated administrator
2. **Dynamic Recipient Resolution** - Business-rule-driven recipient selection
3. **User Notification Preferences** - Personal notification management
4. **Subscription Management** - Category-based notification subscriptions
5. **Escalation Chains** - Automated escalation for critical notifications

## Target Users

### Primary Users
1. **Site Administrators**
   - **Role**: Responsible for all site-related notifications
   - **Responsibilities**: Receive and act on critical site alerts
   - **Requirements**: Must be assigned to each site (mandatory)

2. **System Administrators**
   - **Role**: Configure notification policies and site administrators
   - **Responsibilities**: Manage global notification settings
   - **Requirements**: Full access to notification configuration

3. **Operations Managers**
   - **Role**: Monitor operations across multiple sites
   - **Responsibilities**: Strategic oversight and escalation handling
   - **Requirements**: Cross-site notification access

### Secondary Users
1. **Regular Users** - Receive and manage personal notification preferences
2. **Maintenance Staff** - Receive maintenance-related notifications
3. **IT Support** - Receive system-level notifications

## Functional Requirements

### 1. Site Administrator Management

#### 1.1 Mandatory Site Administrator Assignment
**Priority**: Critical | **Effort**: Medium

**Requirements**:
- Every site MUST have an assigned Site Administrator
- Site Administrator is a required field in Site entity
- Cannot delete a site without reassigning the administrator
- Administrator changes must be logged and audited

**Acceptance Criteria**:
- [ ] Site entity includes mandatory SiteAdministratorId field
- [ ] Database constraint prevents null Site Administrator
- [ ] Frontend validation ensures administrator selection
- [ ] Change logging tracks administrator assignments
- [ ] API endpoints for administrator management

**User Stories**:
```
As a System Administrator
I want to assign a Site Administrator to each site
So that there is clear accountability for site notifications

As a Site Administrator
I want to be automatically included in all site-related notifications
So that I am aware of critical issues at my site
```

#### 1.2 Site Administrator Interface
**Priority**: High | **Effort**: Medium

**Requirements**:
- Dedicated interface for managing site administrators
- Bulk assignment capabilities
- Administrator contact information management
- Site-specific notification preferences

**Acceptance Criteria**:
- [ ] Site Administrator management interface
- [ ] Bulk operations for multiple sites
- [ ] Integration with user management system
- [ ] Contact information validation
- [ ] Role-based access control

### 2. Dynamic Recipient Resolution Service

#### 2.1 Recipient Resolver Implementation
**Priority**: Critical | **Effort**: High

**Requirements**:
- Service-based recipient resolution instead of hardcoded lists
- Business rule engine for recipient selection
- Context-aware recipient determination
- Fallback mechanisms for missing recipients

**Acceptance Criteria**:
- [ ] INotificationRecipientResolver service interface
- [ ] NotificationRecipientResolver implementation
- [ ] NotificationContext for resolution parameters
- [ ] Unit tests for all resolution scenarios
- [ ] Integration with existing notification service

**Technical Specifications**:
```csharp
public interface INotificationRecipientResolver
{
    Task<List<CreateNotificationRecipientRequest>> ResolveRecipientsAsync(
        NotificationContext context,
        CancellationToken cancellationToken = default);
}

public class NotificationContext
{
    public string NotificationType { get; set; }
    public string Category { get; set; }
    public string Priority { get; set; }
    public int? SiteId { get; set; }
    public int? TankId { get; set; }
    public string? PtsDeviceId { get; set; }
    public int? NotificationPolicyId { get; set; }
}
```

#### 2.2 Resolution Rules Engine
**Priority**: High | **Effort**: High

**Requirements**:
- Rule-based recipient selection
- Priority-based escalation
- Role-based notifications
- Location-based filtering

**Resolution Priority Order**:
1. **Site Administrator** (always included for site notifications)
2. **Policy Recipients** (from notification policies)
3. **Role-based Recipients** (users with specific roles)
4. **Subscription Recipients** (users subscribed to categories)
5. **Escalation Recipients** (for critical notifications)

**Acceptance Criteria**:
- [ ] Rule engine processes resolution priority order
- [ ] Duplicate recipient filtering
- [ ] Delivery method determination per recipient
- [ ] Performance optimization for large recipient lists
- [ ] Logging for recipient resolution decisions

### 3. User Notification Preferences

#### 3.1 Personal Preference Management
**Priority**: High | **Effort**: Medium

**Requirements**:
- User-controlled notification preferences
- Category-based subscription management
- Delivery method selection per category
- Notification frequency controls

**Acceptance Criteria**:
- [ ] UserNotificationPreference entity
- [ ] User preference management interface
- [ ] Category-based preference settings
- [ ] Delivery method selection (Email, SMS, System)
- [ ] Frequency and timing controls

**Data Model**:
```csharp
public class UserNotificationPreference
{
    public int Id { get; set; }
    public string UserId { get; set; }
    public string NotificationCategory { get; set; }
    public string DeliveryMethods { get; set; }
    public bool IsEnabled { get; set; }
    public string? Priority { get; set; }
    public TimeSpan? QuietHoursStart { get; set; }
    public TimeSpan? QuietHoursEnd { get; set; }
}
```

#### 3.2 Subscription Management
**Priority**: Medium | **Effort**: Medium

**Requirements**:
- Subscribe/unsubscribe from notification categories
- Granular control over notification types
- Bulk preference management
- Default preference templates

**Notification Categories**:
- Tank Monitoring
- Pump Alerts
- Device Status
- System Reports
- Maintenance
- Emergency
- Compliance
- Security

**Acceptance Criteria**:
- [ ] Subscription interface for all categories
- [ ] Bulk subscription management
- [ ] Default preference templates
- [ ] Category-specific delivery preferences
- [ ] Subscription analytics and reporting

### 4. Escalation Chain Management

#### 4.1 Automated Escalation
**Priority**: High | **Effort**: High

**Requirements**:
- Time-based escalation for unacknowledged notifications
- Role-based escalation hierarchy
- Custom escalation paths per site
- Escalation chain visualization

**Escalation Levels**:
1. **Level 1**: Site Administrator + Direct Recipients (Immediate)
2. **Level 2**: Site Supervisor + Operations Team (15 minutes)
3. **Level 3**: Regional Manager + Department Head (30 minutes)
4. **Level 4**: Executive Team + Emergency Contacts (60 minutes)

**Acceptance Criteria**:
- [ ] Escalation chain configuration interface
- [ ] Time-based escalation triggers
- [ ] Escalation level management
- [ ] Escalation path visualization
- [ ] Escalation metrics and reporting

#### 4.2 Acknowledgment System
**Priority**: Medium | **Effort**: Medium

**Requirements**:
- Notification acknowledgment tracking
- Acknowledgment timeout handling
- Bulk acknowledgment capabilities
- Acknowledgment analytics

**Acceptance Criteria**:
- [ ] Acknowledgment tracking database design
- [ ] Acknowledgment interface in frontend
- [ ] Timeout-based escalation triggers
- [ ] Acknowledgment reporting dashboard
- [ ] Mobile-friendly acknowledgment interface

## Non-Functional Requirements

### 1. Performance Requirements
- **Recipient Resolution**: < 500ms for complex resolution scenarios
- **Notification Creation**: < 2 seconds including recipient resolution
- **Escalation Processing**: < 100ms for escalation checks
- **Concurrent Users**: Support 100+ concurrent notification operations

### 2. Scalability Requirements
- **Sites**: Support 1,000+ sites with individual administrators
- **Recipients**: Handle 10,000+ users with individual preferences
- **Notifications**: Process 50,000+ notifications per day
- **Escalations**: Manage 1,000+ active escalation chains

### 3. Security Requirements
- **Authentication**: All notification operations require authentication
- **Authorization**: Role-based access to notification configuration
- **Data Protection**: Encrypt notification content at rest
- **Audit Trail**: Complete logging of all notification activities

### 4. Reliability Requirements
- **Availability**: 99.9% uptime for notification processing
- **Fault Tolerance**: Graceful degradation when external services fail
- **Data Consistency**: ACID compliance for all notification operations
- **Backup/Recovery**: Complete notification history backup and recovery

## Technical Architecture

### 1. Database Schema Changes

#### 1.1 Site Entity Enhancement
```sql
-- Add Site Administrator to Site table
ALTER TABLE sites
ADD COLUMN site_administrator_id VARCHAR(100) NOT NULL,
ADD CONSTRAINT FK_Site_Administrator
    FOREIGN KEY (site_administrator_id) REFERENCES users(id);

-- Create index for performance
CREATE INDEX IX_Site_Administrator ON sites(site_administrator_id);
```

#### 1.2 User Notification Preferences
```sql
-- Create user notification preferences table
CREATE TABLE user_notification_preferences (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(100) NOT NULL,
    notification_category VARCHAR(50) NOT NULL,
    delivery_methods VARCHAR(100) DEFAULT 'System',
    is_enabled BOOLEAN DEFAULT TRUE,
    priority VARCHAR(20),
    quiet_hours_start TIME,
    quiet_hours_end TIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE KEY UK_UserCategory (user_id, notification_category)
);
```

#### 1.3 Escalation Chain Configuration
```sql
-- Create escalation chains table
CREATE TABLE notification_escalation_chains (
    id INT AUTO_INCREMENT PRIMARY KEY,
    site_id INT,
    notification_category VARCHAR(50),
    escalation_level INT NOT NULL,
    escalation_delay_minutes INT DEFAULT 0,
    recipient_type VARCHAR(20) NOT NULL, -- 'User', 'Role', 'Group'
    recipient_id VARCHAR(100) NOT NULL,
    delivery_methods VARCHAR(100) DEFAULT 'System',
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (site_id) REFERENCES sites(id),
    INDEX IX_EscalationChain_Site (site_id),
    INDEX IX_EscalationChain_Category (notification_category)
);
```

### 2. Service Layer Architecture

#### 2.1 Core Services
```csharp
// Core notification services
INotificationService              // Main notification service
INotificationRecipientResolver    // Dynamic recipient resolution
IEscalationService               // Escalation chain management
IUserPreferenceService           // User preference management
ISiteAdministratorService        // Site administrator management
```

#### 2.2 Service Dependencies
```
NotificationService
├── INotificationRecipientResolver
│   ├── ISiteAdministratorService
│   ├── IUserPreferenceService
│   └── IPolicyService
├── IEscalationService
├── IEmailService
├── ISmsService
└── ISignalRService
```

### 3. Frontend Architecture

#### 3.1 New Components
```javascript
// Site Administrator Management
components/notifications/
├── SiteAdministratorManagement.js
├── SiteAdministratorAssignment.js
└── SiteAdministratorDashboard.js

// User Preferences
components/notifications/preferences/
├── UserNotificationPreferences.js
├── CategorySubscriptions.js
└── DeliveryMethodSettings.js

// Escalation Management
components/notifications/escalation/
├── EscalationChainBuilder.js
├── EscalationVisualizer.js
└── EscalationMetrics.js
```

#### 3.2 API Endpoints
```javascript
// Site Administrator APIs
GET    /api/sites/{id}/administrator
PUT    /api/sites/{id}/administrator
GET    /api/site-administrators
POST   /api/site-administrators/bulk-assign

// User Preference APIs
GET    /api/user/notification-preferences
PUT    /api/user/notification-preferences
POST   /api/user/notification-preferences/categories/{category}
DELETE /api/user/notification-preferences/categories/{category}

// Escalation APIs
GET    /api/escalation-chains/site/{siteId}
POST   /api/escalation-chains
PUT    /api/escalation-chains/{id}
DELETE /api/escalation-chains/{id}
```

## Implementation Phases

### Phase 1: Foundation (4 weeks)
**Goal**: Implement core infrastructure changes

**Deliverables**:
- [ ] Database schema updates
- [ ] Site Administrator entity changes
- [ ] Basic recipient resolver service
- [ ] Unit tests for core services

**Success Criteria**:
- All database migrations complete
- Site Administrator field mandatory
- Basic recipient resolution working
- 90%+ test coverage for new services

### Phase 2: User Preferences (3 weeks)
**Goal**: Implement user notification preferences

**Deliverables**:
- [ ] User preference management
- [ ] Category subscription system
- [ ] User preference interface
- [ ] Preference migration tools

**Success Criteria**:
- Users can manage notification preferences
- Category-based subscriptions working
- Preference interface deployed
- Migration completed for existing users

### Phase 3: Escalation System (4 weeks)
**Goal**: Implement escalation chains and acknowledgment

**Deliverables**:
- [ ] Escalation chain configuration
- [ ] Acknowledgment system
- [ ] Escalation visualization
- [ ] Background escalation processing

**Success Criteria**:
- Escalation chains configurable per site
- Acknowledgment tracking functional
- Visual escalation chain builder
- Background processing operational

### Phase 4: Frontend Integration (3 weeks)
**Goal**: Complete frontend integration and testing

**Deliverables**:
- [ ] Site Administrator management interface
- [ ] Complete user preference interface
- [ ] Escalation management interface
- [ ] End-to-end testing

**Success Criteria**:
- All management interfaces functional
- User acceptance testing passed
- Performance benchmarks met
- Documentation complete

## Success Metrics

### 1. Operational Metrics
- **Site Administrator Coverage**: 100% of sites have assigned administrators
- **Response Time**: 95% of critical notifications acknowledged within 15 minutes
- **Escalation Rate**: < 10% of notifications require escalation beyond Level 2
- **User Satisfaction**: > 85% user satisfaction score for notification relevance

### 2. Technical Metrics
- **System Performance**: < 500ms average recipient resolution time
- **Reliability**: 99.9% notification delivery success rate
- **Scalability**: Support 2x current notification volume without degradation
- **Data Quality**: < 1% invalid recipient addresses

### 3. Business Metrics
- **Incident Response**: 50% improvement in critical incident response time
- **Operational Efficiency**: 30% reduction in irrelevant notifications
- **Compliance**: 100% audit trail coverage for all notifications
- **Cost Efficiency**: 25% reduction in notification-related support tickets

## Risk Analysis

### 1. Technical Risks
| Risk | Impact | Probability | Mitigation |
|------|---------|-------------|------------|
| Database migration issues | High | Medium | Comprehensive testing, rollback plan |
| Performance degradation | High | Low | Load testing, performance monitoring |
| Integration complexity | Medium | Medium | Phased rollout, thorough testing |
| Data consistency issues | High | Low | ACID compliance, validation rules |

### 2. Business Risks
| Risk | Impact | Probability | Mitigation |
|------|---------|-------------|------------|
| User adoption resistance | Medium | Medium | Training, gradual rollout |
| Administrator availability | High | Low | Backup administrator assignment |
| Notification spam | Medium | Medium | Rate limiting, preference controls |
| Compliance violations | High | Low | Audit trails, approval workflows |

## Dependencies

### 1. Internal Dependencies
- **User Management System**: For administrator assignment and role management
- **Existing Notification System**: For integration and migration
- **Frontend Framework**: For UI component development
- **Database System**: For schema changes and performance

### 2. External Dependencies
- **Email Service**: For email notification delivery
- **SMS Service**: For SMS notification delivery
- **Authentication System**: For user authorization
- **Monitoring System**: For performance and reliability tracking

## Testing Strategy

### 1. Unit Testing
- **Service Layer**: 95%+ code coverage for all services
- **Business Logic**: Complete coverage of recipient resolution logic
- **Data Layer**: All database operations and constraints
- **Validation**: All input validation and business rules

### 2. Integration Testing
- **API Endpoints**: All REST API endpoints
- **Database Integration**: All data persistence operations
- **External Services**: Email, SMS, and SignalR integration
- **Background Processing**: Escalation and scheduled notifications

### 3. User Acceptance Testing
- **Administrator Workflows**: Site administrator assignment and management
- **User Preferences**: Notification preference management
- **Escalation Scenarios**: End-to-end escalation testing
- **Mobile Experience**: Mobile-responsive interface testing

### 4. Performance Testing
- **Load Testing**: 10x current notification volume
- **Stress Testing**: Peak load scenarios
- **Scalability Testing**: Growth projection scenarios
- **Benchmark Testing**: Response time requirements

## Deployment Plan

### 1. Pre-Deployment
- [ ] Database backup and migration scripts ready
- [ ] Feature flags configured for gradual rollout
- [ ] Monitoring and alerting configured
- [ ] Rollback procedures documented and tested

### 2. Deployment Sequence
1. **Database Migration** (Maintenance window)
2. **Backend Services** (Rolling deployment)
3. **API Endpoints** (Blue-green deployment)
4. **Frontend Components** (Feature flag enabled)
5. **Background Services** (Staged rollout)

### 3. Post-Deployment
- [ ] Monitoring dashboard validation
- [ ] Smoke testing of critical paths
- [ ] User notification and training
- [ ] Performance baseline establishment

## Documentation Requirements

### 1. Technical Documentation
- [ ] API documentation with examples
- [ ] Database schema documentation
- [ ] Service architecture diagrams
- [ ] Deployment and configuration guides

### 2. User Documentation
- [ ] Site Administrator user guide
- [ ] User preference management guide
- [ ] Escalation process documentation
- [ ] Troubleshooting guide

### 3. Operational Documentation
- [ ] Monitoring and alerting playbook
- [ ] Incident response procedures
- [ ] Performance tuning guide
- [ ] Backup and recovery procedures

## Conclusion

This enhancement to the FMS Notification System will provide a robust, scalable, and user-friendly notification infrastructure that ensures critical alerts reach the right people at the right time. The implementation of mandatory Site Administrators, dynamic recipient resolution, and user-controlled preferences will significantly improve operational efficiency and user satisfaction while maintaining system reliability and performance.

The phased implementation approach minimizes risk while delivering value incrementally. Success will be measured through improved response times, reduced notification noise, and enhanced user satisfaction.

---

**Document Approval**:
- [ ] Product Manager Approval
- [ ] Technical Lead Approval
- [ ] Architecture Review Approval
- [ ] Security Review Approval
- [ ] Operations Team Approval
