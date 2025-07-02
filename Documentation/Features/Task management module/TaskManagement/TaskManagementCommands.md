# Task Management Feature Documentation

## Overview
The Task Management feature provides comprehensive task creation, assignment, tracking, and completion functionality within the FMS (Fuel Management System). This feature is designed to support various operational workflows including manual tasks, issue resolution, and discrepancy management.

## Architecture

### Command Structure
The task management system follows CQRS (Command Query Responsibility Segregation) pattern with the following command structure:

```
FMS.Application/Features/TaskManagement/
├── Commands/
│   ├── UpdateTaskCommand.cs          # Update existing tasks
│   ├── AssignTaskCommand.cs          # Assign tasks to users
│   ├── CompleteTaskCommand.cs        # Mark tasks as completed
│   └── DeleteTaskCommand.cs          # Soft delete tasks
├── Helpers/
│   ├── TaskMappingHelper.cs          # Entity to DTO mapping utilities
│   └── TaskValidationHelper.cs       # Shared validation logic
└── Queries/
    └── (Future implementation)
```

## Commands

### 1. UpdateTaskCommand
**Purpose**: Updates various properties of an existing task

**Key Features**:
- Partial updates (only provided fields are updated)
- Validation of related entities (Site, Tank)
- Automatic completion tracking when status changes to Completed
- Assignment tracking when AssignedTo is updated

**Usage Example**:
```csharp
var command = new UpdateTaskCommand
{
    Id = 123,
    Title = "Updated Task Title",
    Status = TaskStatus.InProgress,
    UpdatedBy = "user@example.com"
};

var result = await mediator.Send(command);
```

### 2. AssignTaskCommand
**Purpose**: Assigns a task to a specific user

**Key Features**:
- Updates assignment information (AssignedTo, AssignedBy, AssignedOn)
- Changes task status to InProgress
- Allows adding assignment notes
- Prevents assignment of completed tasks

**Usage Example**:
```csharp
var command = new AssignTaskCommand
{
    TaskId = 123,
    AssignedTo = "assignee@example.com",
    AssignedBy = "manager@example.com",
    DueDate = DateTime.UtcNow.AddDays(3),
    Notes = "Urgent task requiring immediate attention"
};

var result = await mediator.Send(command);
```

### 3. CompleteTaskCommand
**Purpose**: Marks a task as completed with completion details

**Key Features**:
- Updates task status to Completed
- Records completion timestamp and user
- Requires completion notes
- Prevents completion of already completed or cancelled tasks

**Usage Example**:
```csharp
var command = new CompleteTaskCommand
{
    TaskId = 123,
    CompletedBy = "user@example.com",
    CompletionNotes = "Task completed successfully. All requirements met.",
    CompletedOn = DateTime.UtcNow
};

var result = await mediator.Send(command);
```

### 4. DeleteTaskCommand
**Purpose**: Soft deletes a task by marking it as cancelled

**Key Features**:
- Soft delete (no physical removal from database)
- Changes status to Cancelled
- Records deletion metadata
- Prevents deletion of completed tasks
- Optional deletion reason

**Usage Example**:
```csharp
var command = new DeleteTaskCommand
{
    TaskId = 123,
    DeletedBy = "admin@example.com",
    DeletionReason = "Task no longer needed due to process change"
};

var result = await mediator.Send(command);
```

## Helper Classes

### TaskMappingHelper
- **Purpose**: Centralized mapping between Task entities and TaskDTO objects
- **Benefits**:
  - Eliminates code duplication
  - Consistent mapping logic
  - Easy maintenance of DTO structure changes
  - Type-safe enum to string conversions

### TaskValidationHelper
- **Purpose**: Shared validation logic for common task operations
- **Methods**:
  - `ValidateRequiredFields()`: Basic field validation
  - `ValidateAssignmentFields()`: Assignment-specific validation
  - `ValidateCompletionFields()`: Completion-specific validation
  - `ValidateDeletionFields()`: Deletion-specific validation

## Response Pattern

All commands return `FMSResponse<T>` which provides:
- **Success/Failure indication**
- **Detailed error messages**
- **Validation error collections**
- **Typed error categories** (Validation, SystemError, etc.)
- **Consistent error handling**

## Validation Rules

### General Rules
- All operations require a valid user identifier
- Task must exist before any operation
- Soft delete prevents data loss

### Assignment Rules
- Cannot assign completed tasks
- AssignedTo and AssignedBy are required
- Assignment automatically changes status to InProgress

### Completion Rules
- Cannot complete already completed tasks
- Cannot complete cancelled tasks
- Completion notes are mandatory
- Completion timestamp is recorded

### Deletion Rules
- Cannot delete completed tasks (business rule)
- Deletion is logged with reason and timestamp
- Task status changed to Cancelled

## Database Considerations

### Entity References
- Site validation via `_context.Sites.AnyAsync()`
- Tank validation via `_context.Tanks.AnyAsync()`
- All operations use Entity Framework change tracking

### Performance Notes
- Commands use `FirstOrDefaultAsync()` for single entity retrieval
- Validation queries use `AnyAsync()` for existence checks
- Batch operations should consider transaction boundaries

## Error Handling

### Exception Handling
- All database exceptions are caught and logged
- System errors return appropriate FMSResponse error types
- Validation errors are collected and returned as validation failures

### Logging
- Information logs for successful operations
- Error logs for exceptions with context
- Performance-sensitive operations include timing information

## Future Enhancements

### Planned Features
1. **Query Implementation**: GetTasksQuery, GetTaskByIdQuery, etc.
2. **Event System**: Task lifecycle events for integration
3. **Notification Integration**: Automatic notifications for assignments/completions
4. **Audit Trail**: Detailed change tracking
5. **Bulk Operations**: Batch assignment, completion, etc.

### Integration Points
- **Notification System**: Task status changes should trigger notifications
- **Audit System**: All task operations should be audited
- **Reporting**: Task metrics and performance tracking
- **Mobile App**: API endpoints for mobile task management

## Configuration

### Dependencies
- Entity Framework Core for data access
- MediatR for command handling
- Microsoft.Extensions.Logging for logging
- FMS.Application.Common for response patterns

### Required Setup
1. Entity configuration in `FMS.Persistence`
2. Database migration for Task entity
3. Dependency injection registration for handlers
4. Controller endpoints in `FMS.WebClient`

## Testing Recommendations

### Unit Tests
- Command validation logic
- Mapping helper accuracy
- Business rule enforcement
- Error handling scenarios

### Integration Tests
- Database operations
- Transaction handling
- Cross-entity validation
- Performance under load

## Security Considerations

### Authorization
- User permissions for task operations
- Role-based access control
- Audit logging for security events

### Data Protection
- Sensitive data handling in completion notes
- User information validation
- SQL injection prevention through parameterized queries
