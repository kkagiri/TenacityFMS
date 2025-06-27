 # Task Module - Product Requirements Document (PRD)

**Document Information**
- Document Type: Product Requirements Document
- Version: 1.0
- Date: December 2024
- Author: Development Team
- Status: Planning Phase

## Executive Summary

The Task Module provides a unified task management system that automatically generates and manages tasks from various FMS modules (maintenance, discrepancies, stock operations) while leveraging existing `INotificationService` and `NotificationPolicy` systems for intelligent task assignment and notifications.

## Problem Statement

### Current Challenges
1. **Scattered Task Management**: Issues tracked separately in `Issuetracker`, discrepancies in reconciliation system
2. **No Unified Assignment**: No central system for assigning operational tasks to stock operators
3. **Manual Task Creation**: No automated task generation from system events
4. **Limited Notification Integration**: Existing notification system not used for task management

## Solution Overview

**Unified Task Management System** that:
- Generates tasks automatically from `DiscrepancyDetectionService` events
- Converts `Issuetracker` entries to assignable tasks
- Provides centralized task CRUD operations
- Integrates with `NotificationPolicy` for smart notifications
- Supports both manual and automated task assignment

## Core Features

### 1. Task Entity Design
```csharp
//Cursor - Create Task entity in FMS.Domain/Entities/Task.cs
public class Task
{
    public int Id { get; set; }
    public string Title { get; set; } = null!;
    public string Description { get; set; } = null!;
    public TaskType Type { get; set; } // Maintenance, Discrepancy, Stock, Manual
    public TaskPriority Priority { get; set; } // Low, Medium, High, Critical
    public TaskStatus Status { get; set; } // Pending, InProgress, Completed, Cancelled

    // Assignment
    public string? AssignedTo { get; set; }
    public string? AssignedBy { get; set; }
    public DateTime? AssignedOn { get; set; }
    public DateTime? DueDate { get; set; }

    // Source tracking
    public string? SourceType { get; set; } // "Discrepancy", "Issue", "Manual"
    public int? SourceId { get; set; }
    public int? SiteId { get; set; }
    public int? TankId { get; set; }

    // Completion
    public DateTime? CompletedOn { get; set; }
    public string? CompletionNotes { get; set; }

    // Audit
    public string CreatedBy { get; set; } = null!;
    public DateTime CreatedOn { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedOn { get; set; }
    public string? UpdatedBy { get; set; }

    // Navigation properties
    public virtual User AssignedToNavigation { get; set; } = null!;
    public virtual User AssignedByNavigation { get; set; } = null!;
    public virtual User CreatedByNavigation { get; set; } = null!;
    public virtual User? UpdatedByNavigation { get; set; }
    public virtual Site? Site { get; set; }
    public virtual Tank? Tank { get; set; }
}

//Cursor - Create enums in FMS.Domain/Entities/enums/
public enum TaskType
{
    Manual = 0,
    Maintenance = 1,
    Discrepancy = 2,
    Stock = 3,
    Inspection = 4,
    Calibration = 5
}

public enum TaskPriority
{
    Low = 0,
    Medium = 1,
    High = 2,
    Critical = 3
}

public enum TaskStatus
{
    Pending = 0,
    InProgress = 1,
    Completed = 2,
    Cancelled = 3,
    Overdue = 4
}
```

### 2. Auto-Task Generation Sources

#### From Discrepancy Detection
```csharp
//Cursor - Create TaskGenerationService in FMS.Application/Features/TaskManagement/
public class TaskGenerationService
{
    public async Task HandleDiscrepancyDetected(DiscrepancyDetectedEvent discrepancyEvent)
    {
        var task = new Task
        {
            Title = $"Investigate Tank {discrepancyEvent.TankId} Discrepancy",
            Description = $"Variance detected: {discrepancyEvent.VarianceLiters}L ({discrepancyEvent.VariancePercentage:F2}%)",
            Type = TaskType.Discrepancy,
            Priority = MapSeverityToPriority(discrepancyEvent.Severity),
            SourceType = "Discrepancy",
            SourceId = discrepancyEvent.TankId,
            TankId = discrepancyEvent.TankId,
            CreatedBy = "System"
        };

        await _taskService.CreateAndAssignTaskAsync(task);
    }

    private TaskPriority MapSeverityToPriority(DiscrepancySeverity severity)
    {
        return severity switch
        {
            DiscrepancySeverity.Critical => TaskPriority.Critical,
            DiscrepancySeverity.High => TaskPriority.High,
            DiscrepancySeverity.Medium => TaskPriority.Medium,
            _ => TaskPriority.Low
        };
    }
}
```

#### From Issue Tracker
```csharp
//Cursor - Add conversion method to TaskService
public async Task ConvertIssueToTask(int issueId)
{
    var issue = await _context.Issuetrackers.FindAsync(issueId);

    var task = new Task
    {
        Title = issue.ProblemTitle,
        Description = issue.ProblemDescription,
        Type = TaskType.Maintenance,
        Priority = MapIssuePriorityToTaskPriority(issue.Priority),
        SourceType = "Issue",
        SourceId = issue.Id,
        SiteId = issue.SiteId,
        AssignedTo = issue.AssignTo,
        CreatedBy = "System"
    };

    await _taskService.CreateTaskAsync(task);
}
```

### 3. Smart Assignment System
```csharp
//Cursor - Create TaskAssignmentService
public class TaskAssignmentService
{
    private readonly INotificationService _notificationService;
    private readonly GpsdataContext _context;

    // Auto-assign based on site, workload, and skills
    public async Task<string> FindBestAssignee(Task task)
    {
        var candidates = await GetAvailableOperators(task.SiteId);

        // Consider workload, location, skills
        return SelectOptimalAssignee(candidates, task);
    }

    // Use NotificationPolicy to send assignment notifications
    public async Task NotifyTaskAssignment(Task task)
    {
        var policy = await GetNotificationPolicy("TaskAssignment", task.Priority.ToString());

        if (policy != null && !string.IsNullOrEmpty(task.AssignedTo))
        {
            await _notificationService.SendCustomNotificationAsync(
                $"New Task Assigned: {task.Title}",
                $"Priority: {task.Priority}\nDue: {task.DueDate?.ToString("yyyy-MM-dd HH:mm")}\n\n{task.Description}",
                task.Priority == TaskPriority.Critical
            );
        }
    }

    private async Task<List<User>> GetAvailableOperators(int? siteId)
    {
        return await _context.Users
            .Where(u => u.Role.Contains("Operator") &&
                       (siteId == null || u.SiteId == siteId))
            .ToListAsync();
    }
}
```

## API Endpoints

### Core CRUD Operations
```csharp
//Cursor - Create TaskController in FMS.WebClient/Controllers/
[Route("api/[controller]")]
[ApiController]
[Authorize(Roles = "Admin,User,Supervisor")]
public class TaskController : ControllerBase
{
    [HttpGet]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    public async Task<IActionResult> GetTasks([FromQuery] TaskFilterDTO filter)

    [HttpGet("{id}")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    public async Task<IActionResult> GetTask(int id)

    [HttpPost]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    public async Task<IActionResult> CreateTask([FromBody] CreateTaskDTO taskDto)

    [HttpPut("{id}")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    public async Task<IActionResult> UpdateTask(int id, [FromBody] UpdateTaskDTO taskDto)

    [HttpDelete("{id}")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    public async Task<IActionResult> DeleteTask(int id)

    [HttpPost("{id}/assign")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    public async Task<IActionResult> AssignTask(int id, [FromBody] AssignTaskDTO assignment)

    [HttpPost("{id}/complete")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    public async Task<IActionResult> CompleteTask(int id, [FromBody] CompleteTaskDTO completion)

    [HttpGet("my-tasks")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    public async Task<IActionResult> GetMyTasks()

    [HttpPost("auto-generate-from-discrepancies")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    public async Task<IActionResult> AutoGenerateTasksFromDiscrepancies()

    [HttpPost("convert-issue/{issueId}")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    public async Task<IActionResult> ConvertIssueToTask(int issueId)
}
```

### Required DTOs
```csharp
//Cursor - Create DTOs in FMS.Application/ModelsDTOs/FMS/Task/
public class TaskDTO
{
    public int Id { get; set; }
    public string Title { get; set; } = null!;
    public string Description { get; set; } = null!;
    public string Type { get; set; } = null!;
    public string Priority { get; set; } = null!;
    public string Status { get; set; } = null!;
    public string? AssignedTo { get; set; }
    public string? AssignedToName { get; set; }
    public string? AssignedBy { get; set; }
    public DateTime? AssignedOn { get; set; }
    public DateTime? DueDate { get; set; }
    public string? SourceType { get; set; }
    public int? SourceId { get; set; }
    public int? SiteId { get; set; }
    public string? SiteName { get; set; }
    public int? TankId { get; set; }
    public string? TankName { get; set; }
    public DateTime? CompletedOn { get; set; }
    public string? CompletionNotes { get; set; }
    public string CreatedBy { get; set; } = null!;
    public DateTime CreatedOn { get; set; }
}

public class TaskFilterDTO
{
    public string[]? Types { get; set; }
    public string[]? Priorities { get; set; }
    public string[]? Status { get; set; }
    public string? AssignedTo { get; set; }
    public int[]? SiteIds { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public bool? OverdueOnly { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}

public class CreateTaskDTO
{
    public string Title { get; set; } = null!;
    public string Description { get; set; } = null!;
    public TaskType Type { get; set; }
    public TaskPriority Priority { get; set; }
    public string? AssignedTo { get; set; }
    public DateTime? DueDate { get; set; }
    public int? SiteId { get; set; }
    public int? TankId { get; set; }
}
```

## Database Schema

### Task Table Structure
```sql
-- Cursor - Create tasks table
CREATE TABLE `tasks` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `type` tinyint(4) NOT NULL DEFAULT 0 COMMENT '0=Manual, 1=Maintenance, 2=Discrepancy, 3=Stock, 4=Inspection, 5=Calibration',
  `priority` tinyint(4) NOT NULL DEFAULT 1 COMMENT '0=Low, 1=Medium, 2=High, 3=Critical',
  `status` tinyint(4) NOT NULL DEFAULT 0 COMMENT '0=Pending, 1=InProgress, 2=Completed, 3=Cancelled, 4=Overdue',
  `assigned_to` varchar(450) DEFAULT NULL,
  `assigned_by` varchar(450) DEFAULT NULL,
  `assigned_on` datetime DEFAULT NULL,
  `due_date` datetime DEFAULT NULL,
  `source_type` varchar(50) DEFAULT NULL COMMENT 'Discrepancy, Issue, Manual',
  `source_id` int(11) DEFAULT NULL,
  `site_id` int(11) DEFAULT NULL,
  `tank_id` int(11) DEFAULT NULL,
  `completed_on` datetime DEFAULT NULL,
  `completion_notes` text DEFAULT NULL,
  `created_by` varchar(450) NOT NULL,
  `created_on` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_by` varchar(450) DEFAULT NULL,
  `updated_on` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_assigned_to` (`assigned_to`),
  KEY `idx_status_priority` (`status`, `priority`),
  KEY `idx_site_tank` (`site_id`, `tank_id`),
  KEY `idx_source` (`source_type`, `source_id`),
  KEY `idx_due_date` (`due_date`),
  CONSTRAINT `fk_tasks_assigned_to` FOREIGN KEY (`assigned_to`) REFERENCES `aspnetusers` (`Id`),
  CONSTRAINT `fk_tasks_assigned_by` FOREIGN KEY (`assigned_by`) REFERENCES `aspnetusers` (`Id`),
  CONSTRAINT `fk_tasks_created_by` FOREIGN KEY (`created_by`) REFERENCES `aspnetusers` (`Id`),
  CONSTRAINT `fk_tasks_site` FOREIGN KEY (`site_id`) REFERENCES `sites` (`Id`),
  CONSTRAINT `fk_tasks_tank` FOREIGN KEY (`tank_id`) REFERENCES `tanks` (`Id`)
);
```

## Integration Points

### 1. Notification Integration
- Leverage existing `NotificationPolicy` for task notifications
- Use `INotificationService` for email/SMS/system notifications
- Auto-escalation for overdue tasks

### 2. Source System Integration
- **DiscrepancyDetectionService**: Auto-generate discrepancy investigation tasks
- **Issuetracker**: Convert maintenance issues to tasks
- **Manual Creation**: Admin/supervisor task creation

### 3. Frontend Integration
```javascript
//Cursor - Add Task Management to frontend
// fms.frontend/src/pages/tasks/TaskManagement.js
const TaskManagement = () => {
  return (
    <div className="tw-p-6">
      <ToolbarAnalytics title="Task Management" />

      <Tabs>
        <TabPanel title="My Tasks">
          <MyTasksList />
        </TabPanel>
        <TabPanel title="All Tasks">
          <TaskGrid />
        </TabPanel>
        <TabPanel title="Create Task">
          <TaskCreationForm />
        </TabPanel>
      </Tabs>
    </div>
  );
};

// Add to Stock Management page as additional tab
const StockManagementTabs = [
  { text: "Transaction Management", icon: "fa-light fa-exchange-alt" },
  { text: "Reconciliation", icon: "fa-light fa-balance-scale" },
  { text: "Stock Adjustments", icon: "fa-light fa-adjust" },
  { text: "Task Management", icon: "fa-light fa-tasks" }, // New tab
  { text: "Configuration", icon: "fa-light fa-cog" }
];
```

## Success Metrics

### Operational Metrics
- **Task Resolution Time**: <24 hours for high priority tasks
- **Auto-Assignment Accuracy**: >90% appropriate assignments
- **Task Completion Rate**: >95% task completion within SLA
- **Overdue Task Rate**: <5% of all active tasks

### System Metrics
- **Notification Delivery**: 100% task assignment notifications sent
- **Integration Success**: 100% discrepancy-to-task conversion
- **User Adoption**: >80% operators using task system daily
- **System Performance**: <2 seconds response time for task operations

### Business Impact Metrics
- **Issue Resolution**: 60% faster resolution through automated task creation
- **Operator Efficiency**: 40% improvement in task completion tracking
- **Compliance**: 100% audit trail for all operational tasks
- **Communication**: 50% reduction in missed task assignments

## Risk Mitigation

### High-Risk Items
1. **Notification Overload**: Too many auto-generated tasks
   - **Mitigation**: Smart task aggregation and priority-based throttling
   - **Rule**: Max 5 auto-tasks per operator per day

2. **Assignment Conflicts**: Multiple tasks to same operator
   - **Mitigation**: Workload balancing and skill-based assignment
   - **Rule**: Max 3 high-priority tasks per operator simultaneously

3. **Integration Failures**: Source systems not creating tasks
   - **Mitigation**: Retry mechanisms and fallback manual creation
   - **Monitoring**: Health checks for all integration points

4. **Data Consistency**: Task-source system sync issues
   - **Mitigation**: Event sourcing and compensating transactions
   - **Validation**: Regular sync verification jobs

## Implementation Timeline

### Phase 1: Core Infrastructure (Week 1)
- Task entity and database schema creation
- Basic CQRS commands and queries
- Task repository and service layer
- Basic API endpoints (CRUD operations)

### Phase 2: Assignment & Notifications (Week 2)
- TaskAssignmentService implementation
- Integration with NotificationPolicy system
- Auto-assignment algorithms
- Notification templates and policies

### Phase 3: Source Integration (Week 3)
- DiscrepancyDetectionService event handling
- Issuetracker conversion utilities
- TaskGenerationService implementation
- Event-driven task creation

### Phase 4: Frontend & Testing (Week 4)
- Task management UI components
- Integration with Stock Management page
- Mobile-responsive task interface
- Comprehensive testing and bug fixes

## Technical Considerations

### Performance Requirements
- Support 1000+ concurrent tasks
- Real-time task updates via SignalR
- Efficient query performance with proper indexing
- Caching for frequently accessed task lists

### Security Requirements
- Role-based task visibility and actions
- Audit trail for all task modifications
- Secure task assignment permissions
- Data encryption for sensitive task details

### Scalability Considerations
- Horizontal scaling for high task volumes
- Database partitioning by site/date if needed
- Async processing for bulk operations
- Queue-based task generation for peak loads

## Future Enhancements

### Phase 2 Features (Future)
- **Recurring Tasks**: Scheduled maintenance tasks
- **Task Templates**: Predefined task workflows
- **Mobile App**: Dedicated mobile task management
- **AI Assignment**: Machine learning for optimal task assignment
- **Integration**: External maintenance management systems
- **Analytics**: Task performance dashboards and reports

## Conclusion

The Task Module provides a comprehensive, unified task management system that leverages existing FMS infrastructure while adding intelligent automation for task generation and assignment. By integrating with the notification system and various operational modules, it creates a seamless workflow for operational task management, improving efficiency and ensuring nothing falls through the cracks.

This system transforms reactive issue handling into proactive task management, enabling better resource allocation, faster problem resolution, and improved operational visibility across all FMS sites and operations.