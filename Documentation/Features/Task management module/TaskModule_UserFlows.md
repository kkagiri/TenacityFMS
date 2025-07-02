# Task Module - User Flow Documentation

**Document Information**
- Document Type: User Flow Documentation
- Version: 1.0
- Date: December 2024
- Author: Development Team
- Status: Planning Phase

## Overview

This document outlines detailed user flows for the Task Module within the FMS system. The Task Module provides unified task management that automatically generates tasks from system events and supports manual task creation with intelligent assignment and notification capabilities.

## User Personas

### Primary Users
1. **Stock Operator** - Receives and completes assigned tasks
2. **Site Supervisor** - Assigns tasks, monitors completion, approves work
3. **System Administrator** - Configures auto-task generation rules and policies
4. **Maintenance Technician** - Handles maintenance and calibration tasks
5. **Automated System** - Auto-generates tasks from discrepancy/issue events

## Core User Flows

### Flow 1: Auto-Generated Discrepancy Task

**Trigger**: DiscrepancyDetectionService detects significant variance in Tank 5

#### Happy Path
```
System Event → Tank 5 Discrepancy Detected (-500L variance, 12% difference)
            ↓
System Analysis:
- Variance exceeds threshold (10L or 5%)
- Severity: High (based on percentage and absolute amount)
- Site: Site A, Tank: Tank 5
            ↓
TaskGenerationService Auto-Creates Task:
- Title: "Investigate Tank 5 Stock Discrepancy"
- Description: "Variance detected: -500L (-12.5%)"
- Type: Discrepancy Investigation
- Priority: High (mapped from discrepancy severity)
- SourceType: "Discrepancy", SourceId: Tank 5 ID
            ↓
Auto-Assignment Process:
- Query available operators at Site A
- Check current workload (max 3 high-priority tasks)
- Select operator with lowest current task count
- Assigned to: "john.doe@fms.com"
            ↓
Notification System Activation:
- Check NotificationPolicy for "TaskAssignment" + "High" priority
- Email sent: "URGENT: New task assigned - Tank 5 discrepancy investigation"
- SMS sent if enabled in policy
- System notification appears in operator's dashboard
            ↓
Operator Experience:
- Task appears in "My Tasks" with red priority indicator
- Shows tank location, variance details, investigation checklist
- Due date auto-set to 4 hours from creation
- Real-time notification with sound alert
```

#### Alternative Paths
**No Available Operators**:
```
Auto-Assignment Fails → No operators available at Site A
                     ↓
Fallback Process:
- Task remains unassigned with "Needs Assignment" status
- Notify all supervisors for manual assignment
- Task appears in "Unassigned Tasks" queue
- Auto-retry assignment every 30 minutes
```

**Notification Delivery Failure**:
```
Email/SMS Service Down → Notification delivery fails
                      ↓
Retry Mechanism:
- Retry 3 times with exponential backoff
- Fall back to system notification only
- Log failure for administrator review
- Task still created and assigned successfully
```

---

### Flow 2: Manual Task Creation by Supervisor

**Objective**: Site supervisor needs to assign sensor replacement task

#### Happy Path
```
Supervisor Login → Navigate to Task Management section
                ↓
Dashboard Overview:
- Current active tasks: 15
- Overdue tasks: 2 (highlighted)
- Completed today: 8
- Team workload visualization
                ↓
Click "Create New Task" → Task creation modal opens
                       ↓
Task Form Completion:
- Title: "Replace Tank 3 ATG Sensor"
- Description: "Sensor showing erratic readings, affecting stock accuracy"
- Type: Maintenance
- Priority: Medium
- Site: Site A (auto-selected from supervisor's site)
- Tank: Tank 3 (dropdown with site tanks)
- Due Date: Tomorrow 5:00 PM
                       ↓
Assignment Selection:
- System suggests 3 best operators:
  * "Alice Johnson" - 2 current tasks, maintenance certified
  * "Bob Smith" - 1 current task, ATG specialist
  * "Carol Davis" - 3 current tasks, general operator
- Supervisor selects "Bob Smith" based on specialization
                       ↓
Task Validation:
- Check Bob's availability (not on leave)
- Verify maintenance permissions for Tank 3
- Confirm due date is reasonable (within business hours)
- All validations pass
                       ↓
Task Creation:
- Save task to database
- Generate task ID: TSK-2024-001234
- Set status to "Pending"
- Link to Tank 3 and Site A
                       ↓
Notification Process:
- Email to Bob: "New maintenance task assigned - Tank 3 sensor replacement"
- System notification in Bob's dashboard
- Calendar entry created for due date
- Supervisor receives confirmation: "Task assigned successfully"
                       ↓
Task Tracking:
- Task appears in supervisor's "Team Tasks" view
- Real-time status updates via SignalR
- Mobile notification sent to Bob's phone
```

#### Alternative Paths
**Validation Errors**:
```
Invalid Due Date (past date) → Form validation fails
                            ↓
Error Handling:
- Highlight due date field in red
- Show error: "Due date cannot be in the past"
- Prevent form submission
- User corrects date and resubmits
```

**Operator Unavailable**:
```
Selected Operator on Leave → Assignment validation fails
                           ↓
Alternative Selection:
- Show warning: "Bob Smith is on leave until [date]"
- Suggest alternative operators
- Allow supervisor to reassign or schedule for later
```

---

### Flow 3: Operator Task Completion

**Objective**: Operator completes discrepancy investigation task

#### Happy Path
```
Operator Login → Check "My Tasks" dashboard
               ↓
Task List Display:
- 3 pending tasks total
- 1 High priority: "Investigate Tank 5 Discrepancy" (due in 2 hours)
- 2 Medium priority: routine maintenance tasks
- High priority task highlighted with red border
               ↓
Click High Priority Task → Task details modal opens
                        ↓
Task Details View:
- Complete task information and investigation checklist
- Tank location map and current readings
- Historical variance data (last 7 days)
- Expected vs actual volume comparison
- Investigation steps checklist:
  □ Visual tank inspection
  □ Check ATG sensor calibration
  □ Verify recent transactions
  □ Test for leaks
  □ Document findings
               ↓
Start Investigation:
- Click "Start Task" button
- Status changes to "In Progress"
- Timer starts tracking time spent
- Task locks to prevent conflicts
               ↓
Physical Investigation Process:
- Operator goes to Tank 5 location
- Performs visual inspection (no visible issues)
- Checks ATG sensor readings vs manual dip stick
- Reviews recent delivery and consumption records
- Discovers sensor calibration drift (2% variance)
               ↓
Complete Investigation Checklist:
- ✓ Visual tank inspection: No leaks or damage
- ✓ Check ATG sensor calibration: 2% drift detected
- ✓ Verify recent transactions: All normal
- ✓ Test for leaks: None detected
- ✓ Document findings: Sensor needs recalibration
               ↓
Record Completion:
- Fill completion form:
  * Root Cause: "ATG sensor calibration drift"
  * Action Taken: "Recalibrated sensor, verified accuracy"
  * Resolution: "Discrepancy resolved, readings now accurate"
  * Additional Notes: "Recommend monthly calibration checks"
  * Attach photos of sensor readings before/after
               ↓
Submit Completion:
- Click "Complete Task" button
- System validates all required fields completed
- Task status changes to "Completed"
- Completion timestamp recorded
- Total time spent: 1 hour 45 minutes
               ↓
Automatic Updates:
- Supervisor notified via email: "Task completed by operator"
- Original discrepancy record marked as "Resolved"
- Tank 5 discrepancy cleared from alerts
- Operator's task count decremented
- Completion logged in audit trail
```

#### Alternative Paths
**Unable to Complete Investigation**:
```
Operator Encounters Issue → Cannot access tank due to delivery in progress
                          ↓
Escalation Process:
- Click "Request Help" button
- Select reason: "Site access restricted"
- Add notes: "Delivery truck blocking tank access"
- Task status changes to "Needs Assistance"
- Supervisor automatically notified
- Due date can be extended if needed
```

**Incomplete Form Submission**:
```
Missing Required Fields → Validation prevents completion
                        ↓
Error Handling:
- Highlight missing fields (Root Cause, Action Taken)
- Show specific error messages
- Save form data as draft to prevent loss
- Allow operator to complete missing information
```

---

### Flow 4: Issue-to-Task Conversion

**Trigger**: Critical pump malfunction requires immediate attention

#### Happy Path
```
System/Admin Review → Issuetracker Entry #4567 created
                    ↓
Issue Details:
- Problem: "Tank 2 pump #3 not responding to PTS commands"
- Category: Equipment Malfunction
- Priority: Critical
- Site: Site B
- Status: Open
- Current Assignment: Unassigned
                    ↓
Administrator Assessment:
- Issue requires immediate field investigation
- Needs to be assigned to qualified maintenance staff
- Requires task tracking for SLA compliance
                    ↓
Click "Convert to Task" → Conversion process starts
                        ↓
Automatic Task Creation:
- Inherits title from issue: "Tank 2 pump #3 not responding"
- Maps description: "PTS command failure, investigate communication issue"
- Maps priority: Critical Issue → Critical Task
- Links: SourceType = "Issue", SourceId = 4567
- Type set to: Maintenance
- Site: Site B (inherited)
                        ↓
Smart Assignment Process:
- Find operators with pump maintenance skills
- Filter by Site B location
- Check availability and current workload
- Select: "Mike Turner" (pump specialist, 1 current task)
                        ↓
High Priority Notifications:
- Immediate phone call to assigned operator
- Emergency SMS: "CRITICAL: Pump failure at Tank 2, immediate response required"
- Email to site supervisor
- System alert with audio notification
                        ↓
Task-Issue Linking:
- Original issue status updated to "Task Created"
- Bidirectional link established
- Issue comments synchronized with task updates
- Both records show linked status
                        ↓
Operator Response:
- Mike receives notifications within 2 minutes
- Acknowledges task receipt via mobile app
- ETA provided: "On-site in 15 minutes"
- Supervisor notified of acknowledgment
```

#### Alternative Paths
**No Qualified Personnel Available**:
```
Auto-Assignment Fails → No pump specialists available
                      ↓
Escalation Protocol:
- Notify maintenance manager immediately
- Contact external contractor if needed
- Create "URGENT" task in unassigned queue
- Send alerts to all maintenance staff
- Log incident for resource planning
```

**Issue Already Resolved**:
```
Convert Closed Issue → Validation prevents conversion
                     ↓
Smart Handling:
- Show warning: "Issue is already closed"
- Option to create follow-up task for verification
- Allow creation of "Post-Resolution Inspection" task
```

---

### Flow 5: Task Dashboard Monitoring & Management

**Objective**: Supervisor monitors team performance and manages workload

#### Happy Path
```
Supervisor Login → Navigate to Task Dashboard
                ↓
Dashboard Overview Display:
- Key Metrics Cards:
  * Active Tasks: 23 (3 critical, 7 high, 10 medium, 3 low)
  * Overdue Tasks: 3 (blinking red indicators)
  * Completed Today: 8 of 12 scheduled
  * Team Utilization: 75% (green indicator)
  * Average Resolution Time: 4.2 hours
                ↓
Real-Time Task Grid:
- Sortable columns: Priority, Assignee, Due Date, Status, Type
- Color coding: Red (overdue), Orange (due soon), Green (on track)
- Quick action buttons: Reassign, Extend Due Date, Add Notes
- Filter options: By operator, by type, by status, by site
                ↓
Workload Balancing View:
- Operator Cards showing:
  * "Alice Johnson": 3 tasks (1 high, 2 medium) - 60% capacity
  * "Bob Smith": 5 tasks (2 critical, 3 medium) - 100% capacity
  * "Carol Davis": 1 task (1 low) - 20% capacity
- Visual indicators for workload distribution
                ↓
Identify Overdue Issues:
- 3 overdue tasks highlighted
- Click on overdue task: "Tank 7 calibration" (2 hours overdue)
- Assigned to: Bob Smith (overloaded)
- Original due date: Yesterday 3:00 PM
                ↓
Workload Rebalancing:
- Click "Reassign Task" button
- System suggests: "Carol Davis" (low workload, qualified)
- Supervisor selects Carol and adds note: "Urgent - was overdue"
- System sends notifications to both operators
- Bob notified of task removal, Carol notified of new assignment
                ↓
Real-Time Updates:
- Dashboard updates immediately via SignalR
- Overdue count decreases from 3 to 2
- Workload indicators update
- Task completion notifications appear in real-time
- Mobile alerts sent for high-priority changes
```

#### Alternative Paths
**System Performance Issues**:
```
Dashboard Loading Slowly → Performance degradation detected
                         ↓
Graceful Degradation:
- Show simplified view with essential data only
- Cache frequently accessed data
- Provide "Refresh" button for latest data
- Display performance warning to user
```

**Bulk Task Management**:
```
Multiple Task Operations → Supervisor needs to update many tasks
                         ↓
Batch Operations:
- Select multiple tasks via checkboxes
- Bulk actions: Extend due dates, Change priority, Reassign
- Confirmation dialog for bulk changes
- Progress indicator for batch processing
- Summary of changes completed
```

---

### Flow 6: Automated Task Escalation

**Trigger**: High priority discrepancy task becomes overdue

#### Happy Path
```
Task Due Date Passed → System runs escalation check (every 15 minutes)
                     ↓
Escalation Assessment:
- Task: "Investigate Tank 3 Discrepancy"
- Priority: High
- Due date: 2 hours ago
- Current status: In Progress
- Assigned to: "John Doe"
                     ↓
Apply Escalation Rules:
- Check NotificationPolicy for "TaskEscalation" + "High"
- Rule: High priority tasks escalate after 2 hours overdue
- Current overdue time: 2 hours 15 minutes
- Escalation triggered: Yes
                     ↓
First Level Escalation:
- Send reminder to assigned operator:
  * Email: "URGENT: Overdue task requires immediate attention"
  * SMS: "Task TSK-001234 is 2+ hours overdue, please update status"
  * Mobile push notification with alarm sound
- Update task status to "Overdue"
- Log escalation event in audit trail
                     ↓
Monitor for Response:
- Wait 30 minutes for operator response
- No status update received
- Operator hasn't logged into system
- Escalation continues to next level
                     ↓
Second Level Escalation (2.5 hours overdue):
- Notify site supervisor:
  * Phone call (if enabled in policy)
  * Email: "CRITICAL: Task escalation - operator not responding"
  * Include task details and operator contact info
- Create "Operator Response" sub-task for supervisor
- Highlight in supervisor dashboard with critical alert
                     ↓
Supervisor Intervention:
- Supervisor receives notification
- Contacts operator directly
- Operator responds: "Equipment malfunction, need backup"
- Supervisor reassigns task to available operator
- Updates task with escalation notes
                     ↓
Resolution Tracking:
- New operator accepts assignment
- Original delay documented in task history
- Escalation log provides audit trail
- Supervisor notified when task completed
- Escalation policy effectiveness tracked for future improvements
```

#### Alternative Paths
**Operator Responds During Escalation**:
```
Operator Updates Task → Task status changed before escalation completes
                      ↓
Escalation Cancellation:
- Stop escalation process immediately
- Cancel pending notifications
- Log response time for performance metrics
- Remove overdue status if task progresses
```

**Critical Task Escalation**:
```
Critical Priority Task Overdue → Immediate maximum escalation
                                ↓
Emergency Protocol:
- Skip normal escalation delays
- Immediate notification to site manager
- Automated phone calls to emergency contacts
- Create incident report automatically
- Alert all available qualified personnel
```

---

## Error Handling Scenarios

### Scenario 1: Network Connectivity Issues
```
Operator Mobile App Offline → Task updates cannot sync
                            ↓
Offline Mode Handling:
- App caches task data locally
- Allow offline task status updates
- Queue changes for sync when online
- Show offline indicator in app
- Sync data automatically when connectivity restored
```

### Scenario 2: Concurrent Task Modifications
```
Multiple Users Edit Same Task → Optimistic locking conflict
                              ↓
Conflict Resolution:
- Detect version mismatch
- Show conflict resolution dialog
- Display current values vs. user changes
- Allow user to merge changes or overwrite
- Create audit log of conflict resolution
```

### Scenario 3: Auto-Assignment Failures
```
TaskAssignmentService Down → Cannot assign auto-generated tasks
                           ↓
Fallback Process:
- Queue tasks for manual assignment
- Notify administrators of service failure
- Use simplified round-robin assignment
- Retry assignment service every 5 minutes
- Log all assignment attempts for analysis
```

## Mobile Experience Considerations

### Mobile Task Management Flow
```
Operator on Mobile → Simplified task interface optimized for touch
                   ↓
Key Mobile Features:
- Swipe gestures for quick status updates
- Voice notes for completion details
- Photo capture for documentation
- GPS verification for task location
- Offline mode for poor connectivity areas
- Push notifications for urgent tasks
```

### Mobile-Specific User Flows
```
Receive Task Notification → Push notification with task summary
                          ↓
Quick Actions:
- "Accept" - Changes status to In Progress
- "View Details" - Opens full task information
- "Request Help" - Sends message to supervisor
- "Delay" - Sets new estimated completion time
```

## Integration Touch Points

### System Integration Flows
1. **NotificationPolicy Integration**: Automatic policy-based notification routing
2. **INotificationService Integration**: Multi-channel delivery (email, SMS, system)
3. **Issuetracker Synchronization**: Bidirectional sync between issues and tasks
4. **DiscrepancyDetectionService**: Event-driven task creation from variance detection
5. **User Management**: Role-based permissions and site-specific assignments
6. **SignalR Real-time Updates**: Live dashboard updates and notifications

## Success Metrics & KPIs

### User Experience Metrics
- **Task Assignment Accuracy**: >90% appropriate auto-assignments
- **Task Completion Time**: <24 hours average for standard tasks
- **User Satisfaction**: >4.5/5 rating for task management interface
- **Mobile Adoption**: >70% operators using mobile task features

### System Performance Metrics
- **Auto-Generation Speed**: <5 seconds from event to task creation
- **Notification Delivery**: >99% successful delivery rate
- **Dashboard Load Time**: <3 seconds for full task overview
- **System Availability**: >99.9% uptime for task management

### Business Impact Metrics
- **Issue Resolution Speed**: 60% faster resolution through automated task creation
- **Operator Efficiency**: 40% improvement in task completion tracking
- **Compliance**: 100% audit trail for all operational tasks
- **Communication**: 50% reduction in missed assignments

## Accessibility & Usability

### Accessibility Features
- Screen reader compatibility for visually impaired users
- High contrast mode for low vision users
- Keyboard navigation support
- Voice command integration for hands-free operation
- Multi-language support for diverse teams

### Usability Enhancements
- Progressive disclosure to avoid information overload
- Smart defaults based on user behavior patterns
- Contextual help and tooltips
- Undo functionality for accidental changes
- Bulk operations for efficiency

## Conclusion

These comprehensive user flows ensure the Task Module provides an intuitive, efficient, and reliable task management experience. The flows cover all major scenarios from automated task generation to manual management, with robust error handling and mobile optimization. The system leverages existing FMS infrastructure while adding intelligent automation for improved operational efficiency and compliance tracking.

The Task Module transforms fragmented task management into a unified, proactive system that ensures nothing falls through the cracks while providing clear visibility into operational performance and resource utilization.