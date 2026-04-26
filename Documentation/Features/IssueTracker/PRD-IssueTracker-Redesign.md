# Product Requirements Document (PRD)
# Issue Tracker System Redesign

**Document Version:** 1.0
**Date:** January 12, 2026
**Author:** Development Team
**Status:** Draft

---

## 1. Executive Summary

### 1.1 Purpose
Redesign the Issue Tracker system to provide a device-type-driven, template-based issue management solution with automated monitoring, auto-resolution capabilities, and Active Alarm integration.

### 1.2 Goals
1. Simplify issue creation with device-type-specific templates
2. Enable automated issue creation from device monitoring
3. Implement smart auto-close based on configurable parameters
4. Integrate with Active Alarm system for automatic resolution
5. Align frontend with backend entity structure

### 1.3 Scope
- Backend: New entities, APIs, and background services
- Frontend: Redesigned forms, admin settings, and dashboard
- Integration: Active Alarms, Device Monitoring, Notifications

---

## 2. Current State Analysis

### 2.1 Existing Backend Entity (Issuetracker.cs)
```
| Field              | Type      | Status      |
|--------------------|-----------|-------------|
| Id                 | int       | ✅ Keep     |
| IssueCategoryId    | int       | ⚠️ Rename to IssueTemplateId |
| SiteId             | int       | ✅ Keep     |
| Openby             | string    | ✅ Keep (auto-set) |
| RelatedIssue       | int?      | ✅ Keep     |
| ProblemDescription | string    | ✅ Keep     |
| ProblemTitle       | string    | ✅ Keep (from template) |
| Status             | int?      | ✅ Keep     |
| Priority           | int?      | ✅ Keep     |
| DueDate            | DateTime? | ✅ Keep     |
| OpenDate           | DateTime? | ✅ Keep     |
| ClosingDate        | DateTime? | ✅ Keep     |
| LastModfield       | DateTime? | ✅ Keep     |
| VehicleId          | int       | ✅ Keep     |
| DeviceType         | int?      | ✅ Keep (link to new entity) |
| AssignTo           | string    | ✅ Keep     |
| ActiveAlarmId      | int?      | ✅ Keep     |
```

### 2.2 Frontend Fields to Remove
| Field           | Reason                              |
|-----------------|-------------------------------------|
| budget          | Not in backend                      |
| openby (editable)| Should auto-set to current user    |
| isUrgent        | Redundant - use Priority            |
| notes           | Redundant - use ProblemDescription  |
| requiresApproval| Should be backend workflow setting  |

---

## 3. Proposed System Architecture

### 3.1 New Database Entities

#### 3.1.1 DeviceType (New)
```csharp
public class DeviceType
{
    public int Id { get; set; }
    public string Name { get; set; }              // "GPS Device", "PTS Device", "ATG", "Camera"
    public string Code { get; set; }              // "GPS", "PTS", "ATG", "CAM"
    public string Description { get; set; }
    public bool IsMonitored { get; set; }         // Whether this device type has monitoring
    public string MonitoringEndpoint { get; set; } // API/WebSocket endpoint for monitoring (nullable)
    public bool IsActive { get; set; }
    public DateTime CreatedDate { get; set; }
    public DateTime? ModifiedDate { get; set; }

    // Navigation
    public virtual ICollection<IssueTemplate> IssueTemplates { get; set; }
}
```

#### 3.1.2 IssueTemplate (New - Replaces IssueCategory)
```csharp
public class IssueTemplate
{
    public int Id { get; set; }
    public int DeviceTypeId { get; set; }         // FK to DeviceType
    public string Name { get; set; }              // "Device Offline", "Timeout", "Firmware Issue"
    public string DefaultTitle { get; set; }      // Template for ProblemTitle
    public string DefaultDescription { get; set; } // Template for ProblemDescription
    public int DefaultPriorityId { get; set; }    // FK to IssuePriority
    public bool CanAutoClose { get; set; }        // Whether this issue type supports auto-close
    public string AutoCloseCondition { get; set; } // JSON config for auto-close parameters
    public int? DefaultDueDays { get; set; }      // Auto-calculate DueDate
    public bool IsActive { get; set; }
    public DateTime CreatedDate { get; set; }
    public string CreatedBy { get; set; }
    public DateTime? ModifiedDate { get; set; }
    public string ModifiedBy { get; set; }

    // Navigation
    public virtual DeviceType DeviceType { get; set; }
    public virtual IssuePriority DefaultPriority { get; set; }
    public virtual ICollection<Issuetracker> Issues { get; set; }
}
```

#### 3.1.3 IssueAutoCloseConfig (New)
```csharp
public class IssueAutoCloseConfig
{
    public int Id { get; set; }
    public int IssueTemplateId { get; set; }      // FK to IssueTemplate
    public string CheckerType { get; set; }       // "OnlineChecker", "AlarmCleared", "Custom"
    public string CheckerParameters { get; set; } // JSON: {"endpoint": "/api/device/status", "expectedValue": "online"}
    public int CheckIntervalMinutes { get; set; } // How often to check
    public bool RequiresConfirmation { get; set; } // Require user confirmation before auto-close
    public bool IsActive { get; set; }

    // Navigation
    public virtual IssueTemplate IssueTemplate { get; set; }
}
```

#### 3.1.4 Updated Issuetracker Entity
```csharp
public partial class Issuetracker
{
    public int Id { get; set; }
    public int IssueTemplateId { get; set; }      // Changed from IssueCategoryId
    public int DeviceTypeId { get; set; }         // Explicit link to device type
    public int SiteId { get; set; }
    public string Openby { get; set; }            // Auto-set by backend
    public int? RelatedIssue { get; set; }
    public string ProblemDescription { get; set; }
    public string ProblemTitle { get; set; }
    public int? Status { get; set; }
    public int? Priority { get; set; }
    public DateTime? DueDate { get; set; }
    public DateTime? OpenDate { get; set; }
    public DateTime? ClosingDate { get; set; }
    public DateTime? LastModfield { get; set; }
    public int VehicleId { get; set; }
    public int? DeviceId { get; set; }            // Specific device instance
    public string AssignTo { get; set; }
    public int? ActiveAlarmId { get; set; }
    public bool CanAutoClose { get; set; }        // Inherited from template, can override
    public string AutoCloseReason { get; set; }   // If auto-closed, why?
    public bool IsAutoCreated { get; set; }       // Created by monitoring system

    // Navigation properties
    public virtual IssueTemplate IssueTemplate { get; set; }
    public virtual DeviceType DeviceType { get; set; }
    public virtual Site Site { get; set; }
    public virtual Vehicle Vehicle { get; set; }
    public virtual IssuePriority PriorityNavigation { get; set; }
    public virtual IssueStatus StatusNavigation { get; set; }
    public virtual ActiveAlarm ActiveAlarm { get; set; }
}
```

### 3.2 Database Schema (MySQL)

```sql
-- DeviceType table
CREATE TABLE devicetypes (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    Name VARCHAR(100) NOT NULL,
    Code VARCHAR(20) NOT NULL UNIQUE,
    Description VARCHAR(500),
    IsMonitored TINYINT(1) DEFAULT 0,
    MonitoringEndpoint VARCHAR(255),
    IsActive TINYINT(1) DEFAULT 1,
    CreatedDate DATETIME DEFAULT CURRENT_TIMESTAMP,
    ModifiedDate DATETIME ON UPDATE CURRENT_TIMESTAMP
);

-- Seed initial device types
INSERT INTO devicetypes (Name, Code, Description, IsMonitored, IsActive) VALUES
('GPS Device', 'GPS', 'GPS tracking devices', 1, 1),
('PTS Device', 'PTS', 'Point of Sale/Fuel dispensing terminals', 1, 1),
('ATG Device', 'ATG', 'Automatic Tank Gauges', 1, 1),
('Camera', 'CAM', 'Security/Fleet cameras', 0, 1),
('Vehicle', 'VEH', 'Vehicle-level issues', 0, 1),
('Other', 'OTH', 'Other device types', 0, 1);

-- IssueTemplate table
CREATE TABLE issuetemplates (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    DeviceTypeId INT NOT NULL,
    Name VARCHAR(100) NOT NULL,
    DefaultTitle VARCHAR(200) NOT NULL,
    DefaultDescription TEXT,
    DefaultPriorityId INT,
    CanAutoClose TINYINT(1) DEFAULT 0,
    AutoCloseCondition JSON,
    DefaultDueDays INT,
    IsActive TINYINT(1) DEFAULT 1,
    CreatedDate DATETIME DEFAULT CURRENT_TIMESTAMP,
    CreatedBy VARCHAR(450),
    ModifiedDate DATETIME ON UPDATE CURRENT_TIMESTAMP,
    ModifiedBy VARCHAR(450),
    FOREIGN KEY (DeviceTypeId) REFERENCES devicetypes(Id),
    FOREIGN KEY (DefaultPriorityId) REFERENCES issuepriority(Id)
);

-- Seed GPS device templates
INSERT INTO issuetemplates (DeviceTypeId, Name, DefaultTitle, DefaultDescription, DefaultPriorityId, CanAutoClose) VALUES
(1, 'Device Offline', 'GPS Device Offline - {VehicleName}', 'GPS device has stopped transmitting data.', 2, 1),
(1, 'Satellite Connection Lost', 'Satellite Connection Lost - {VehicleName}', 'GPS device lost satellite signal.', 3, 1),
(1, 'Timeout Error', 'GPS Timeout - {VehicleName}', 'GPS device is experiencing timeout errors.', 3, 1),
(1, 'Time Sync Issues', 'GPS Time Sync Error - {VehicleName}', 'GPS device time is not synchronized.', 4, 0),
(1, 'Firmware Update Required', 'Firmware Update Needed - {VehicleName}', 'GPS device firmware is outdated.', 4, 0);

-- Seed PTS device templates
INSERT INTO issuetemplates (DeviceTypeId, Name, DefaultTitle, DefaultDescription, DefaultPriorityId, CanAutoClose) VALUES
(2, 'Communication Error', 'PTS Communication Error - {SiteName}', 'PTS device is not communicating.', 2, 1),
(2, 'Card Reader Failure', 'Card Reader Failure - {SiteName}', 'Card reader malfunction detected.', 2, 0),
(2, 'Pump Malfunction', 'Pump Malfunction - {SiteName}', 'Fuel pump not operating correctly.', 1, 0),
(2, 'Display Error', 'Display Error - {SiteName}', 'PTS display showing errors.', 3, 0);

-- Seed ATG device templates
INSERT INTO issuetemplates (DeviceTypeId, Name, DefaultTitle, DefaultDescription, DefaultPriorityId, CanAutoClose) VALUES
(3, 'Probe Failure', 'Tank Probe Failure - {TankName}', 'ATG probe is not responding.', 2, 0),
(3, 'False Alarm', 'ATG False Alarm - {TankName}', 'ATG triggered a false alarm.', 4, 0),
(3, 'Communication Lost', 'ATG Communication Lost - {SiteName}', 'ATG device lost communication.', 2, 1),
(3, 'Calibration Issue', 'ATG Calibration Required - {TankName}', 'ATG readings are inaccurate.', 3, 0);

-- IssueAutoCloseConfig table
CREATE TABLE issueautocloseconfigs (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    IssueTemplateId INT NOT NULL,
    CheckerType VARCHAR(50) NOT NULL,
    CheckerParameters JSON,
    CheckIntervalMinutes INT DEFAULT 15,
    RequiresConfirmation TINYINT(1) DEFAULT 0,
    IsActive TINYINT(1) DEFAULT 1,
    FOREIGN KEY (IssueTemplateId) REFERENCES issuetemplates(Id)
);

-- Seed auto-close configs
INSERT INTO issueautocloseconfigs (IssueTemplateId, CheckerType, CheckerParameters, CheckIntervalMinutes) VALUES
(1, 'OnlineChecker', '{"checkOnlineStatus": true, "minOnlineMinutes": 5}', 15),
(2, 'OnlineChecker', '{"checkOnlineStatus": true, "minOnlineMinutes": 10}', 15),
(3, 'OnlineChecker', '{"checkOnlineStatus": true, "minOnlineMinutes": 5}', 10),
(6, 'OnlineChecker', '{"checkOnlineStatus": true, "minOnlineMinutes": 5}', 15),
(11, 'OnlineChecker', '{"checkOnlineStatus": true, "minOnlineMinutes": 10}', 15);

-- Alter issuetrackers table for new fields
ALTER TABLE issuetrackers
    ADD COLUMN IssueTemplateId INT AFTER IssueCategoryId,
    ADD COLUMN DeviceTypeId INT AFTER IssueTemplateId,
    ADD COLUMN DeviceId INT AFTER VehicleId,
    ADD COLUMN CanAutoClose TINYINT(1) DEFAULT 0,
    ADD COLUMN AutoCloseReason VARCHAR(255),
    ADD COLUMN IsAutoCreated TINYINT(1) DEFAULT 0,
    ADD FOREIGN KEY (IssueTemplateId) REFERENCES issuetemplates(Id),
    ADD FOREIGN KEY (DeviceTypeId) REFERENCES devicetypes(Id);

-- Migrate existing data (IssueCategoryId -> IssueTemplateId)
-- This would be done via migration script based on existing categories
```

---

## 4. API Design

### 4.1 Device Types API

```
GET    /api/devicetypes                    - List all device types
GET    /api/devicetypes/{id}               - Get device type by ID
POST   /api/devicetypes                    - Create device type (Admin)
PUT    /api/devicetypes/{id}               - Update device type (Admin)
DELETE /api/devicetypes/{id}               - Soft delete device type (Admin)
GET    /api/devicetypes/{id}/templates     - Get templates for device type
```

### 4.2 Issue Templates API

```
GET    /api/issuetemplates                        - List all templates
GET    /api/issuetemplates/{id}                   - Get template by ID
GET    /api/issuetemplates/bydevicetype/{deviceTypeId} - Get templates by device type
POST   /api/issuetemplates                        - Create template (Admin)
PUT    /api/issuetemplates/{id}                   - Update template (Admin)
DELETE /api/issuetemplates/{id}                   - Soft delete template (Admin)
GET    /api/issuetemplates/{id}/autoclose-config  - Get auto-close config
PUT    /api/issuetemplates/{id}/autoclose-config  - Update auto-close config (Admin)
```

### 4.3 Issues API (Updated)

```
GET    /api/issues                         - List issues with filters
GET    /api/issues/{id}                    - Get issue by ID
POST   /api/issues                         - Create issue
PUT    /api/issues/{id}                    - Update issue
DELETE /api/issues/{id}                    - Delete issue
POST   /api/issues/{id}/close              - Manually close issue
POST   /api/issues/{id}/reopen             - Reopen issue
GET    /api/issues/bydevicetype/{deviceTypeId} - Get issues by device type
GET    /api/issues/byvehicle/{vehicleId}   - Get issues by vehicle
GET    /api/issues/pending-autoclose       - Get issues pending auto-close
POST   /api/issues/autoclose/{id}          - Trigger auto-close check
```

### 4.4 Request/Response DTOs

#### CreateIssueDTO
```csharp
public class CreateIssueDTO
{
    public int IssueTemplateId { get; set; }      // Required - Template selection
    public int DeviceTypeId { get; set; }         // Required
    public int SiteId { get; set; }               // Required
    public int VehicleId { get; set; }            // Required
    public int? DeviceId { get; set; }            // Optional - specific device
    public string ProblemTitle { get; set; }      // Optional - override template
    public string ProblemDescription { get; set; } // Optional - override template
    public int? Priority { get; set; }            // Optional - override template
    public DateTime? DueDate { get; set; }        // Optional - override template
    public string AssignTo { get; set; }          // Required
    public int? RelatedIssue { get; set; }        // Optional
    public int? ActiveAlarmId { get; set; }       // Optional - link to alarm

    // Note: Openby is set by backend from authenticated user
    // Note: OpenDate is set by backend to current datetime
    // Note: Status defaults to "Open"
}
```

#### IssueResponseDTO (Updated)
```csharp
public class IssueResponseDTO
{
    public int Id { get; set; }

    // Template information
    public int IssueTemplateId { get; set; }
    public string TemplateName { get; set; }

    // Device information
    public int DeviceTypeId { get; set; }
    public string DeviceTypeName { get; set; }
    public string DeviceTypeCode { get; set; }
    public int? DeviceId { get; set; }

    // Issue details
    public string ProblemTitle { get; set; }
    public string ProblemDescription { get; set; }
    public DateTime? OpenDate { get; set; }
    public DateTime? DueDate { get; set; }
    public DateTime? ClosingDate { get; set; }
    public DateTime? LastModfield { get; set; }

    // Status & Priority
    public int? Status { get; set; }
    public string StatusName { get; set; }
    public int? Priority { get; set; }
    public string PriorityName { get; set; }

    // Location
    public int SiteId { get; set; }
    public string SiteName { get; set; }
    public int VehicleId { get; set; }
    public string VehicleNumber { get; set; }

    // Users
    public string OpenbyId { get; set; }
    public string OpenbyUserName { get; set; }
    public string AssignToId { get; set; }
    public string AssignToUserName { get; set; }

    // Auto-close
    public bool CanAutoClose { get; set; }
    public string AutoCloseReason { get; set; }
    public bool IsAutoCreated { get; set; }

    // Related
    public int? RelatedIssue { get; set; }
    public int? ActiveAlarmId { get; set; }
}
```

---

## 5. Background Services

### 5.1 Issue Monitoring Service

```csharp
public class IssueMonitoringService : BackgroundService
{
    // Runs every X minutes to:
    // 1. Check monitored devices for issues
    // 2. Auto-create issues when problems detected
    // 3. Check auto-close conditions for open issues
    // 4. Send notifications for overdue issues
}
```

### 5.2 Auto-Close Checker Types

| Checker Type    | Description                                      | Parameters                          |
|-----------------|--------------------------------------------------|-------------------------------------|
| OnlineChecker   | Checks if device is back online                  | minOnlineMinutes, endpoint          |
| AlarmCleared    | Checks if linked ActiveAlarm is cleared          | -                                   |
| StatusChecker   | Checks device status endpoint                    | endpoint, expectedStatus            |
| Custom          | Custom logic via configuration                   | customHandler, parameters           |

### 5.3 Active Alarm Integration

```csharp
// When ActiveAlarm is cleared, check if linked issue should auto-close
public async Task OnAlarmCleared(int alarmId)
{
    var linkedIssues = await _context.Issuetrackers
        .Where(i => i.ActiveAlarmId == alarmId && i.Status != ClosedStatus)
        .ToListAsync();

    foreach (var issue in linkedIssues)
    {
        if (issue.CanAutoClose)
        {
            await AutoCloseIssue(issue.Id, "Linked alarm cleared automatically");
        }
    }
}
```

---

## 6. Frontend Design

### 6.1 Issue Creation Form (Redesigned)

**Flow:**
1. User selects **Device Type** → Loads available templates
2. User selects **Issue Template** → Pre-fills title, description, priority
3. User can override pre-filled values if needed
4. User selects Vehicle/Site/Assignee
5. Submit → Backend sets Openby, OpenDate, Status automatically

**Fields:**
| Field            | Type       | Required | Source        |
|------------------|------------|----------|---------------|
| Device Type      | Select     | Yes      | User input    |
| Issue Template   | Select     | Yes      | User input (filtered by device type) |
| Problem Title    | Text       | Yes      | Template default (editable) |
| Problem Description | TextArea | Yes    | Template default (editable) |
| Priority         | Select     | Yes      | Template default (editable) |
| Vehicle          | Search     | Yes      | User input    |
| Site             | Select     | Yes      | User input    |
| Assigned To      | Select     | Yes      | User input    |
| Due Date         | Date       | No       | Template default (editable) |
| Related Issue    | Select     | No       | User input    |

**Removed Fields:**
- Opened By (auto-set by backend)
- Budget
- Is Urgent (use Priority)
- Notes (use Description)
- Requires Approval

### 6.2 Admin Settings Pages

#### 6.2.1 Device Types Management
- List all device types
- Add/Edit device type
- Toggle IsMonitored
- Configure monitoring endpoint

#### 6.2.2 Issue Templates Management
- List templates by device type
- Add/Edit template
- Configure:
  - Default title template (with placeholders)
  - Default description
  - Default priority
  - Default due days
  - Can auto-close toggle
  - Auto-close configuration

#### 6.2.3 Auto-Close Configuration
- Per template configuration
- Select checker type
- Configure checker parameters
- Set check interval
- Enable/disable

### 6.3 Issue Dashboard Updates

**New Filters:**
- Filter by Device Type
- Filter by Template
- Filter by Auto-Created (yes/no)
- Filter by Can Auto-Close

**New Columns:**
- Device Type (icon + name)
- Template Name
- Auto-Close Status

---

## 7. Notification Integration

### 7.1 Issue Notifications

| Event                    | Recipients         | Channel           |
|--------------------------|-------------------|-------------------|
| Issue Created            | Assignee          | In-App, Email     |
| Issue Assigned           | New Assignee      | In-App, Email     |
| Issue Overdue            | Assignee, Manager | In-App, Email     |
| Issue Auto-Closed        | Assignee, Opener  | In-App            |
| Issue Status Changed     | Watchers          | In-App            |
| Issue Pending X Days     | Manager           | Email             |

### 7.2 Scheduler Jobs

| Job                      | Frequency    | Action                           |
|--------------------------|--------------|----------------------------------|
| Check Auto-Close         | Every 15 min | Evaluate auto-close conditions   |
| Check Overdue Issues     | Daily 8 AM   | Send overdue notifications       |
| Check Pending Issues     | Daily 8 AM   | Escalate long-pending issues     |
| Device Monitoring        | Every 5 min  | Create issues for device problems|

---

## 8. Implementation Phases

### Phase 1: Database & Backend Foundation (Week 1-2)
1. Create new entities (DeviceType, IssueTemplate, IssueAutoCloseConfig)
2. Create database migrations
3. Seed initial data
4. Update Issuetracker entity
5. Create new DTOs
6. Implement Device Types API
7. Implement Issue Templates API
8. Update Issues API

### Phase 2: Frontend Cleanup & Basic UI (Week 2-3)
1. Remove unused form fields
2. Create Device Types dropdown component
3. Create Issue Templates dropdown (filtered)
4. Update Issue Create/Edit form
5. Update Issue List with new columns
6. Update Issue filters

### Phase 3: Admin Configuration (Week 3-4)
1. Device Types management page
2. Issue Templates management page
3. Auto-Close configuration UI
4. Validation and testing

### Phase 4: Background Services (Week 4-5)
1. Issue Monitoring Service
2. Auto-Close Checker implementation
3. Active Alarm integration
4. Notification service updates

### Phase 5: Testing & Refinement (Week 5-6)
1. End-to-end testing
2. Performance optimization
3. Documentation
4. User training materials

---

## 9. Success Metrics

| Metric                          | Target                    |
|---------------------------------|---------------------------|
| Issue creation time             | < 30 seconds              |
| Auto-close accuracy             | > 95%                     |
| Issues from monitoring          | Tracked and measured      |
| Manual close rate               | Decrease by 30%           |
| User satisfaction               | > 4.0/5.0                 |

---

## 10. Risks & Mitigations

| Risk                            | Impact | Mitigation                        |
|---------------------------------|--------|-----------------------------------|
| Data migration issues           | High   | Careful mapping, test thoroughly  |
| Auto-close closes valid issues  | Medium | RequiresConfirmation option       |
| Too many auto-created issues    | Medium | Smart thresholds, deduplication   |
| Performance with monitoring     | Medium | Efficient queries, caching        |

---

## 11. Appendix

### A. Placeholder Variables for Templates
| Placeholder       | Description                    |
|-------------------|--------------------------------|
| {VehicleName}     | Vehicle registration/name      |
| {VehicleCode} | Tenacy vehicle number          |
| {SiteName}        | Site name                      |
| {TankName}        | Tank name (for ATG)            |
| {DeviceName}      | Device identifier              |
| {DateTime}        | Current date/time              |

### B. Status Values
| ID | Status      | Description              |
|----|-------------|--------------------------|
| 1  | Open        | Newly created            |
| 2  | In Progress | Being worked on          |
| 3  | Pending     | Waiting for input        |
| 4  | Resolved    | Fixed, awaiting verify   |
| 5  | Closed      | Completed                |
| 6  | Auto-Closed | Closed by system         |

### C. Priority Values
| ID | Priority | Description              |
|----|----------|--------------------------|
| 1  | Critical | Immediate attention      |
| 2  | High     | Same day resolution      |
| 3  | Medium   | Within 3 days            |
| 4  | Low      | Within 1 week            |

---

**Document Approvals:**

| Role              | Name | Date | Signature |
|-------------------|------|------|-----------|
| Product Owner     |      |      |           |
| Tech Lead         |      |      |           |
| Development Lead  |      |      |           |

---

*End of Document*
