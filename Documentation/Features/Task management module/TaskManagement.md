# Task Management System Documentation

## Overview
The Task Management System is a comprehensive solution for managing operational tasks within the FMS application. It provides a clean, modern interface for creating, assigning, tracking, and completing various types of tasks.

## Architecture

### Design Language
The Task Management system follows the same design language as the Notification system, featuring:
- Sidebar navigation with collapsible menu
- Clean white content areas with subtle borders
- Consistent use of Tailwind CSS with `tw-` prefix
- FontAwesome icons with `fa-light` prefix
- Responsive design patterns

### Components Structure

#### Layout Component
- **TaskManagementLayout.js**: Main layout wrapper providing sidebar navigation and content area
- **TaskManagementLayout.scss**: Styles following the notification system design patterns

#### Main Page Component
- **TaskManagement.js**: Main orchestrating component that manages view state and renders appropriate child components

#### Feature Components
- **MyTasksList.js**: Displays tasks assigned to the current user with filtering capabilities
- **AllTasksGrid.js**: Administrative view showing all tasks in the system (supervisor/admin only)
- **TaskCreationForm.js**: Form for creating new tasks with validation and assignment options
- **TaskSummaryDashboard.js**: Analytics dashboard showing task metrics and performance data
- **TaskDetailsModal.js**: Modal for viewing and editing detailed task information

### Navigation Structure
- **My Tasks**: Personal task list for regular users
- **All Tasks**: System-wide task overview (admin/supervisor)
- **Dashboard**: Analytics and performance metrics
- **Settings Section**: Configuration options for task types and templates
- **Create Task Button**: Quick access to task creation (admin/supervisor)

## Navigation System

### Navigation Helper (`utils/navigationHelper.js`)
The task management system includes a comprehensive navigation helper that provides:

#### Route Management
- **getTaskManagementRoute(subPath)**: Builds complete route paths for task management views
- **taskManagementRoutes**: Object containing all predefined routes for the system
- **isActiveRoute(currentPath, targetPath)**: Determines if a route is currently active for UI highlighting

#### View State Management
- **getViewFromPath(path)**: Extracts the current view name from a path
- **getNavigationState(currentPath)**: Returns comprehensive navigation state including view type flags

#### Breadcrumb Support
- **getTaskBreadcrumbs(currentPath, taskTitle)**: Generates breadcrumb navigation for current view

### Navigation Implementation
All components receive navigation props:
- **onNavigate**: Callback function to change views
- **onTaskUpdated**: Callback to refresh data after task modifications

### Inter-Component Navigation Flow
1. **TaskManagement.js** manages overall view state and navigation
2. **TaskManagementLayout.js** provides sidebar navigation using the navigation helper
3. Child components trigger navigation through callback props
4. **TaskDetailsModal** is triggered from both MyTasksList and AllTasksGrid for task details/editing

### Route Structure
```
/task-management
├── /my-tasks          # Personal task list
├── /all-tasks         # All tasks (admin/supervisor)
├── /dashboard         # Analytics dashboard
├── /create            # Task creation form
├── /edit/{id}         # Task editing (via modal)
├── /details/{id}      # Task details (via modal)
├── /task-types        # Task type configuration
└── /templates         # Task templates
```

## Key Features

### User Role-Based Access
- **Regular Users**: Access to My Tasks and Dashboard
- **Supervisors/Admins**: Full access including All Tasks and Create Task functionality

### Task Management Capabilities
- Task creation with detailed information and assignments
- Priority-based categorization (Critical, High, Medium, Low)
- Status tracking (Pending, In Progress, Completed, Cancelled)
- Task type classification (Maintenance, Discrepancy, Stock, Manual)
- Due date management and overdue tracking
- Assignment and reassignment functionality

### Filtering and Search
- Multi-criteria filtering by status, priority, and type
- Advanced search capabilities in data grids
- Real-time filtering with immediate visual feedback

### Data Visualization
- Task distribution by status, priority, and type
- Performance metrics and completion rates
- Overdue task tracking and alerts
- Historical activity tracking

## Implementation Details

### State Management
- Local component state for UI interactions
- Redux integration for user authentication and authorization
- Service layer for API communication

### Service Integration
- **TaskService**: Centralized API communication for all task operations
- Error handling with user-friendly notifications
- Loading states and progress indicators

### Responsive Design
- Mobile-first approach with responsive grid layouts
- Collapsible sidebar for mobile devices
- Adaptive table and chart layouts

## Design Patterns

### Consistent Styling
- White background cards with subtle borders
- Consistent spacing using Tailwind CSS utilities
- Hover effects and transitions for interactive elements
- Status badges with color-coded indicators

### Component Reusability
- Shared modal components for task details
- Consistent button and form styling
- Reusable badge components for status/priority display

### User Experience
- Intuitive navigation with clear visual hierarchy
- Loading states and error handling
- Confirmation dialogs for destructive actions
- Immediate feedback for user actions

## Future Enhancements

### Planned Features
- Real-time notifications for task updates
- Advanced reporting and analytics
- Task templates and automation

### Technical Improvements
- Enhanced caching strategies
- Performance optimizations for large datasets
- Advanced filtering and search capabilities
- Bulk operations support

## API Integration

### Task Service Methods
- `getTasks()`: Retrieve tasks with filtering and pagination
- `createTask()`: Create new task with validation
- `updateTask()`: Update existing task information
- `deleteTask()`: Remove task from system
- `assignTask()`: Assign task to user
- `updateTaskStatus()`: Change task status

### Data Models
- Task entity with comprehensive metadata
- User assignment tracking
- Audit trail for task changes
- Priority and status enumerations

## Deployment Notes

### Dependencies
- DevExtreme components for UI elements
- Redux for state management
- Axios for HTTP communication
- Tailwind CSS for styling
- FontAwesome for iconography

### Configuration
- Environment-specific API endpoints
- Role-based access control configuration
- Default task types and priorities
- System notification settings

This documentation serves as a comprehensive guide for developers working on the Task Management system and provides insights into the design decisions and implementation patterns used throughout the system.
