# Role-Based Dashboard System

This document describes the new role-based dashboard implementation for the Hyoung FMS system.

## Overview

The role-based dashboard provides different views and functionality based on user roles as defined in the `UserDetailDto.cs`. The system supports four main roles:

1. **Admin** - Full system access with administrative capabilities
2. **Management** - Analytics, reports, and operational oversight
3. **User/Operator** - Day-to-day operational tasks
4. **Guest** - Limited read-only access

## Architecture

### Core Components

#### 1. RoleBasedDashboard.js
Main dashboard component that:
- Reads user roles from authentication context (currently mocked)
- Filters widgets and modules based on role permissions
- Provides role-specific configurations

#### 2. QuickActionButtons.js
Top-level action buttons customized by role:
- **All Roles**: Issue Fuel, Tank Status, View Alerts
- **Admin**: User Management, System Configuration, Emergency Stop
- **Management**: Performance Review, Financial Overview
- **User**: Tag Management, Basic Operations
- **Guest**: Read-only actions only

#### 3. RoleTicker.js
Dynamic information ticker that shows:
- Role-specific messages and notifications
- Real-time system status
- User information and master tag details
- Live updates based on role permissions

### Role Configuration

```javascript
const ROLE_CONFIG = {
  admin: {
    widgets: ["quickActions", "ticker", "stats", "alarms", "performance",
              "fuelManagement", "tankStatus", "systemModules", "issues"],
    permissions: ["all"],
    modules: [...] // Admin-specific modules
  },
  management: {
    widgets: ["quickActions", "ticker", "stats", "performance",
              "fuelManagement", "tankStatus", "systemModules"],
    permissions: ["view_reports", "manage_operations"],
    modules: [...] // Management-specific modules
  },
  // ... other roles
}
```

## Widget Descriptions

### A. Quick Action Buttons (All Roles)
- **Purpose**: Provide immediate access to common tasks
- **Role-based**: Different actions available per role
- **Examples**: Issue Fuel, Emergency Stop, Generate Reports

### B. Role Ticker (All Roles)
- **Purpose**: Display role-appropriate information and alerts
- **Features**:
  - Scrolling messages based on role
  - System status indicators
  - User identification and master tag info
  - Real-time clock and statistics

### C. Key Statistics (All Roles)
- **Purpose**: Show operational metrics
- **Content**: Previous day consumption, engine hours, distance, fuel issued
- **Access**: Data filtered based on role permissions

### D. Performance Metrics (Admin, Management, User)
- **Purpose**: Display fuel efficiency and weekly performance
- **Components**: Fuel efficiency charts, engine hours, distance metrics
- **Access**: Full data for admin/management, filtered for users

### E. Fuel Management (Admin, Management, User)
- **Purpose**: Track fuel consumption and costs
- **Features**: Vehicle-type breakdown, site comparisons, cost analysis
- **Access**: Full financial data for admin/management, operational data for users

### F. Tank Status (All Roles)
- **Purpose**: Monitor fuel tank levels and pump status
- **Features**: Real-time tank levels, pump status, alerts
- **Access**: All roles can view, different control levels

### G. System Modules (All Roles)
- **Purpose**: Navigation to different system sections
- **Content**: Role-filtered module cards
- **Access**: Modules filtered by role permissions

## Integration with UserDetailDto

The dashboard integrates with the backend user system through the `UserDetailDto.cs`:

```csharp
public class UserDetailDto
{
    public string Id { get; set; }
    public string UserName { get; set; }
    public string Email { get; set; }
    public List<string> Roles { get; set; } = new List<string>();
    public string? MasterTagName { get; set; }
    public bool? HasMasterTag { get; set; }
    // ... other properties
}
```

### Role Mapping
- Frontend roles map directly to backend roles
- Primary role determined by first role in the `Roles` array
- Fallback to 'guest' if no roles defined

## Usage

### Basic Implementation
```javascript
import { RoleBasedDashboard } from './components/dashboard';

// In your app component
function App() {
  return <RoleBasedDashboard />;
}
```

### With Authentication Context
```javascript
import { RoleBasedDashboard } from './components/dashboard';
import { useAuth } from './contexts/AuthContext';

function Dashboard() {
  const { user } = useAuth(); // Get user from your auth context

  return <RoleBasedDashboard user={user} />;
}
```

## Features

### 1. Role-Based Widget Filtering
- Widgets automatically shown/hidden based on role
- No need for manual permission checks in individual components

### 2. Dynamic Module Lists
- System modules filtered by role
- Prioritized ordering within roles
- Automatic navigation restrictions

### 3. Real-Time Updates
- Ticker messages update every 4 seconds
- System status updates every 30 seconds
- Role-specific alert priorities

### 4. Responsive Design
- Mobile-friendly layout
- Adaptive grid systems
- Touch-friendly quick actions

## Customization

### Adding New Roles
1. Add role configuration to `ROLE_CONFIG`
2. Define role-specific modules and permissions
3. Update widget visibility logic
4. Add role-specific quick actions

### Adding New Widgets
1. Create widget component
2. Add to role configuration widgets array
3. Implement permission checking
4. Add to dashboard rendering logic

### Modifying Permissions
1. Update role permissions in `ROLE_CONFIG`
2. Adjust widget visibility logic
3. Update API calls to respect permissions
4. Test role transitions

## Development Notes

### Demo Features (Remove in Production)
- Role switching buttons for testing
- Mock user data
- Simulated API responses

### Security Considerations
- All role checking happens on frontend (for UI only)
- Backend API must enforce permissions
- Sensitive data should be filtered server-side
- User roles should be validated with each request

### Performance
- Role configurations cached at component level
- Widget components lazy-loaded where possible
- Real-time updates throttled appropriately

## Future Enhancements

1. **Dynamic Role Assignment**: Allow role changes without re-login
2. **Custom Dashboards**: Let users customize their widget layout
3. **Permission Inheritance**: Support role hierarchies
4. **Audit Trail**: Track role-based actions and access
5. **Multi-Role Support**: Better handling of users with multiple roles

## Testing

### Unit Tests
```javascript
// Test role-based widget visibility
test('admin sees all widgets', () => {
  const dashboard = render(<RoleBasedDashboard role="admin" />);
  expect(dashboard.getByText('User Management')).toBeInTheDocument();
});

test('guest sees limited widgets', () => {
  const dashboard = render(<RoleBasedDashboard role="guest" />);
  expect(dashboard.queryByText('User Management')).not.toBeInTheDocument();
});
```

### Integration Tests
- Test role transitions
- Verify API permission enforcement
- Check responsive behavior
- Validate real-time updates

This role-based dashboard system provides a comprehensive, secure, and user-friendly interface that adapts to different user roles while maintaining consistency across the application.
