# Unified Transaction & Task Management System - User Flow Documentation

**Document Information**
- Document Type: User Flow Documentation
- Version: 1.0
- Date: December 2024
- Author: Development Team
- Status: Planning Phase

## Overview

This document outlines detailed user flows for the Unified Transaction & Task Management System within the FMS. The system combines **Manual Transaction Correction Center** (focused on dispensing/refueling entry corrections) with **Intelligent Task Management** into a single operational platform.

## User Personas

### **Primary Users**

1. **Admin/Site Manager**
   - Has `_editStock` permission
   - Responsible for transaction corrections and oversight
   - Assigns and approves critical tasks

2. **Stock Operator**
   - Receives and completes assigned tasks
   - Reports issues and discrepancies
   - Monitors reconciliation status

3. **Supervisor**
   - Oversees task completion
   - Escalates overdue tasks
   - Reviews correction impact analysis

4. **System Administrator**
   - Configures auto-task generation rules
   - Manages notification policies
   - System maintenance and monitoring

## User Flow Scenarios

### **Scenario 1: Manual Transaction Correction (Admin)**

#### **1A: Correcting Dispensing Entry Error**

**Trigger**: Admin receives report of incorrect refueling transaction

```
1. Admin Access Check
   → Navigate to Operational Management Dashboard
   → System validates user has _editStock permission AND Admin role
   → Transaction Correction Center tab becomes available

2. Locate Problem Transaction
   → Click "Transaction Corrections" tab
   → Use search/filter to find transaction:
     - Filter by date range
     - Filter by tank
     - Filter by changeReason = "Dispensing"
     - Search by transaction ID or operator name
   → Review transaction list with:
     - Transaction ID, Date/Time, Tank, Type, Volume Change, Balance After, Recorded By

3. Analyze Impact Before Correction
   → Select problematic transaction
   → Click "Analyze Impact" button
   → System displays DeletionImpactModal:
     - Number of affected subsequent transactions
     - Volume history chain impact
     - Current tank stock change
     - Warning messages
     - Reconciliation requirements

4. Make Decision
   → If impact acceptable:
     ✓ Proceed with correction
   → If impact too significant:
     ✓ Cancel operation
     ✓ Consider alternative approach
     ✓ Consult with supervisor

5. Execute Correction
   → Click "Delete" or "Edit" button
   → System prompts for deletion/correction reason
   → Enter detailed reason (mandatory field)
   → Confirm action in confirmation dialog
   → System executes deletion/correction
   → Automatic reconciliation policy triggered for affected tank

6. Verify Results
   → Review success notification
   → Check reconciliation status in dashboard
   → Verify tank volume history is consistent
   → Review auto-generated follow-up task (if created)

7. Follow-up Task Creation (Automatic)
   → System automatically creates task:
     - Title: "Follow-up: Transaction {ID} Correction"
     - Type: TransactionCorrection
     - Assigned to: Stock Operator for affected tank
     - Due: 24 hours
     - Description: Verify correction impact and reconciliation results
```

#### **1B: Bulk Review of Suspicious Transactions**

**Trigger**: Multiple transaction correction requests or reconciliation discrepancies

```
1. Dashboard Overview
   → Admin views Operational Management Dashboard
   → Notices alerts for multiple discrepancies/corrections needed
   → Clicks Transaction Corrections tab

2. Advanced Filtering
   → Filter transactions by:
     - Date range (last 24-48 hours)
     - Change reason = "Dispensing" OR "Adjustment"
     - Tanks with reconciliation alerts
     - Specific operators (if pattern detected)

3. Pattern Analysis
   → Review filtered results for patterns:
     - Multiple corrections by same operator
     - Consistent volume error patterns
     - Time-based patterns (shift changes, etc.)
     - Tank-specific issues

4. Strategic Correction Planning
   → Prioritize corrections by:
     - Volume impact size
     - Tank criticality
     - Subsequent transaction count
     - Business impact

5. Execute Corrections in Priority Order
   → Start with highest impact transactions
   → Follow standard correction workflow for each
   → Monitor reconciliation queue status
   → Adjust pace based on system performance

6. Generate Management Report
   → Document correction patterns
   → Create tasks for operational improvements
   → Schedule training if operator-related patterns found
```

### **Scenario 2: Task Management Flows**

#### **2A: Stock Operator Daily Task Management**

**Trigger**: Operator begins shift and checks assigned tasks

```
1. Login and Dashboard Access
   → Operator logs into FMS
   → Navigates to Operational Management Dashboard
   → Clicks "Task Management" tab
   → Defaults to "My Tasks" view

2. Review Assigned Tasks
   → View task list sorted by priority and due date:
     - Critical tasks (red indicator)
     - High priority tasks (orange indicator)
     - Medium priority tasks (yellow indicator)
     - Due today tasks (highlighted)
     - Overdue tasks (urgent notification)

3. Task Prioritization
   → Operator reviews:
     - Task type and description
     - Due dates and time remaining
     - Tank/site location information
     - Any linked issues or discrepancies

4. Execute High Priority Task
   → Click on Critical/High priority task
   → Task details modal opens:
     - Full description and context
     - Source information (if auto-generated)
     - Tank/site details
     - Previous related tasks
     - Required completion notes

5. Field Work Execution
   → If field work required:
     - Mobile interface opens
     - GPS location verification
     - Photo capture capabilities
     - Real-time status updates
     - Voice-to-text note capability

6. Task Completion
   → Fill completion notes:
     - Work performed summary
     - Issues encountered
     - Additional observations
     - Photos/documentation attached
   → Set task status to "Completed"
   → Submit completion

7. System Follow-up
   → System notifies supervisor of completion
   → Auto-creates follow-up tasks if needed
   → Updates tank/site status if applicable
   → Triggers reconciliation if volume-related
```

#### **2B: Auto-Task Generation from Discrepancy**

**Trigger**: AutomatedReconciliation system detects discrepancy

```
1. Discrepancy Detection
   → DiscrepancyDetectionService identifies tank variance > threshold
   → System captures:
     - Tank ID and current volume
     - Expected vs actual variance
     - Variance percentage
     - Time of detection
     - Contributing factors

2. Automatic Task Creation
   → TaskGenerationService creates task:
     - Title: "Investigate Tank {X} Discrepancy"
     - Type: Discrepancy
     - Priority: Based on variance severity
     - Description: Detailed variance information
     - Source: Links to discrepancy record

3. Smart Assignment Algorithm
   → System evaluates available operators:
     - Workload analysis (active task count)
     - Skill matching (discrepancy investigation experience)
     - Site proximity/assignment
     - Current availability status
   → Assigns to best-matched operator

4. Notification Dispatch
   → Uses NotificationPolicy for "DiscrepancyTask"
   → Sends notification via:
     - Mobile push notification
     - Email (if configured)
     - Dashboard alert
     - SMS for critical priorities

5. Operator Response
   → Operator receives notification
   → Views task in mobile/dashboard interface
   → Accepts task assignment
   → Begins investigation workflow

6. Investigation Process
   → Operator follows guided workflow:
     - Physical tank inspection
     - ATG reading verification
     - Recent transaction review
     - Environmental factor check
     - Photo documentation

7. Resolution and Reporting
   → Operator submits findings:
     - Root cause identified
     - Corrective actions taken
     - Recommendations for prevention
     - Request for follow-up tasks if needed
   → System updates discrepancy record
   → Closes or escalates based on findings
```

#### **2C: Supervisor Task Oversight and Escalation**

**Trigger**: Supervisor reviews team performance and overdue tasks

```
1. Supervisor Dashboard View
   → Navigate to Task Management
   → Switch to "All Tasks" view
   → Filter by:
     - Assigned team members
     - Task status (overdue, in-progress)
     - Priority levels
     - Due date ranges

2. Overdue Task Identification
   → System highlights overdue tasks
   → Review overdue reasons:
     - Operator unavailability
     - Task complexity issues
     - Resource constraints
     - System/equipment problems

3. Escalation Decision Process
   → For each overdue task:
     - Contact assigned operator for status
     - Assess task urgency and business impact
     - Determine if reassignment needed
     - Consider resource allocation

4. Task Reassignment Workflow
   → If reassignment needed:
     - Remove from current operator
     - Re-run smart assignment algorithm
     - Add urgency flag and escalation notes
     - Notify new assignee with context

5. Performance Analysis
   → Review team metrics:
     - Task completion rates
     - Average completion times
     - Escalation frequency
     - Quality of completions
   → Identify training needs or process improvements

6. Resource Planning
   → Based on task load and performance:
     - Adjust operator schedules
     - Request additional resources
     - Modify auto-task generation rules
     - Update training requirements
```

### **Scenario 3: System Administrator Flows**

#### **3A: Configuring Auto-Task Generation Rules**

**Trigger**: Need to adjust automated task creation based on operational patterns

```
1. System Configuration Access
   → Navigate to Admin section of Operational Management
   → Access "Auto-Task Generation" settings
   → Review current rule configurations

2. Rule Analysis
   → Analyze existing rules:
     - Discrepancy threshold triggers
     - Issue-to-task conversion rules
     - Transaction correction follow-up rules
     - Notification policy mappings

3. Rule Modification
   → Adjust parameters based on operational feedback:
     - Increase/decrease discrepancy thresholds
     - Modify priority assignment logic
     - Update auto-assignment criteria
     - Change notification timing

4. Testing and Validation
   → Test rule changes in staging environment
   → Validate with sample data
   → Confirm notification delivery
   → Review assignment algorithm results

5. Deployment and Monitoring
   → Deploy changes to production
   → Monitor task generation patterns
   → Track operator feedback
   → Adjust based on performance metrics
```

#### **3B: Notification Policy Management**

**Trigger**: Review and optimize notification effectiveness

```
1. Policy Review
   → Access NotificationPolicy configurations
   → Review delivery success rates
   → Analyze response times to notifications
   → Identify delivery failures or delays

2. Policy Optimization
   → Adjust notification timing:
     - Immediate vs. batched notifications
     - Escalation timing intervals
     - Quiet hours configuration
     - Priority-based delivery methods

3. Integration Testing
   → Test INotificationService integration
   → Verify email, SMS, and push delivery
   → Validate notification content formatting
   → Confirm recipient filtering accuracy

4. Performance Monitoring
   → Track notification metrics:
     - Delivery success rates
     - Response times
     - User engagement rates
     - Escalation effectiveness
```

## Mobile User Flows

### **Mobile Operator Workflow**

```
1. Mobile Login and Dashboard
   → Operator opens FMS mobile app
   → Views condensed task dashboard
   → Sees priority-sorted task list
   → Quick access to urgent/overdue items

2. Task Execution on Mobile
   → Select task from list
   → View task details in mobile-optimized format
   → Access tank/site information
   → Use GPS for location verification

3. Field Documentation
   → Capture photos with automatic tagging
   → Record voice notes (converted to text)
   → Fill mobile-friendly completion forms
   → Upload evidence documents

4. Real-time Sync
   → All actions sync immediately to backend
   → Offline capability for poor connectivity areas
   → Automatic sync when connection restored
   → Conflict resolution for offline changes

5. Notification Handling
   → Push notifications for new task assignments
   → Urgent notifications with sound/vibration
   → Background app notifications
   → Quick action buttons for common responses
```

## Error Handling Flows

### **Transaction Correction Errors**

```
1. Permission Denied Scenario
   → User attempts transaction correction without _editStock permission
   → System displays permission denied message
   → Suggests contacting administrator
   → Logs unauthorized attempt for security audit

2. Reconciliation System Unavailable
   → Transaction correction attempted during system maintenance
   → System queues correction request
   → Notifies user of delayed processing
   → Executes correction when reconciliation system available

3. High Impact Correction Warning
   → Correction would affect >50 subsequent transactions
   → System requires additional approval step
   → Escalates to senior administrator
   → Provides detailed impact analysis report
```

### **Task Management Errors**

```
1. Assignment Algorithm Failure
   → No available operators match task requirements
   → System escalates to supervisor for manual assignment
   → Sends notification about assignment delay
   → Queues task in unassigned tasks list

2. Notification Delivery Failure
   → Primary notification method fails (email server down)
   → System automatically tries secondary method (SMS)
   → If all methods fail, creates dashboard alert
   → Logs delivery failure for system monitoring

3. Task Completion Validation Error
   → Required completion fields missing
   → System prevents submission with clear error messages
   → Highlights missing information
   → Provides guidance for proper completion
```

## Integration Flow Examples

### **AutomatedReconciliation Integration**

```
1. Transaction Correction Trigger
   → Admin deletes/edits transaction
   → System identifies affected tank
   → Looks up reconciliation policy for "TransactionDeletion" trigger
   → Executes appropriate reconciliation workflow

2. Reconciliation Status Updates
   → Real-time updates in dashboard
   → Progress indicators for reconciliation steps
   → Notification when reconciliation completes
   → Alert if reconciliation identifies additional issues

3. Follow-up Task Creation
   → Reconciliation completed successfully
   → Auto-creates verification task
   → Assigns to appropriate operator
   → Links to original correction for context
```

## Success Indicators

### **User Experience Metrics**
- **Task Completion Rate**: >95% tasks completed within SLA
- **User Satisfaction**: >4.5/5 rating for interface usability
- **Error Rate**: <5% user errors in task/correction workflows
- **Mobile Adoption**: >80% field tasks completed via mobile interface

### **Operational Efficiency Metrics**
- **Correction Time**: 70% reduction in time to complete transaction corrections
- **Task Response Time**: <30 minutes average response to urgent tasks
- **Escalation Rate**: <10% tasks require supervisor escalation
- **Auto-Assignment Success**: >90% successful auto-assignments

### **System Integration Metrics**
- **Reconciliation Integration**: 100% successful triggers after corrections
- **Notification Delivery**: >99% successful notification delivery
- **Real-time Updates**: <2 seconds for dashboard updates
- **Mobile Sync**: <30 seconds for offline to online data sync

## Conclusion

These user flows provide a comprehensive guide for all user interactions with the Unified Transaction & Task Management System. The flows prioritize operational efficiency while maintaining data integrity and providing clear audit trails. The mobile-first approach ensures field operators can efficiently complete tasks, while the dashboard provides comprehensive oversight for administrators and supervisors.

The integration with existing FMS systems (AutomatedReconciliation, NotificationPolicy, INotificationService) ensures seamless operation within the broader FMS ecosystem while providing enhanced operational capabilities for manual transaction management and intelligent task automation.