# Notification Preferences CRUD Implementation

## Overview
Complete implementation of notification preferences management system with CQRS architecture, admin interface, and proper data validation following FMS project structure guidelines.

## Implementation Date
August 7, 2025

## Components Implemented

### Backend Components

#### 1. Domain Entity
- **Location**: `FMS.Domain/Entities/UserNotificationPreference.cs`
- **Purpose**: Core entity for storing user notification preferences
- **Key Features**:
  - TimeSpan properties for quiet hours
  - Comma-separated delivery methods storage
  - Rate limiting (per hour/day)
  - Acknowledgment requirements
  - Audit fields (CreatedBy, UpdatedBy, timestamps)

#### 2. DTOs (Data Transfer Objects)
- **Location**: `FMS.Application/Features/Notification/DTOs/UserNotificationPreferenceDTOs.cs`
- **Purpose**: Request/Response objects for API communication
- **Classes**:
  - `CreateUserNotificationPreferenceRequest`
  - `UpdateUserNotificationPreferenceRequest`
  - `UserNotificationPreferenceDto`
  - `GetUserNotificationPreferencesRequest`
  - `BulkUpdateUserNotificationPreferencesRequest`
  - `NotificationCategoryDto`

#### 3. CQRS Commands
- **Location**: `FMS.Application/Features/Notification/Commands/`
- **Commands Implemented**:
  - `CreateUserNotificationPreferenceCommand.cs`
  - `UpdateUserNotificationPreferenceCommand.cs`
  - `DeleteUserNotificationPreferenceCommand.cs`
  - `BulkUpdateUserNotificationPreferencesCommand.cs`
  - `CreateNotificationCategoryCommand.cs`
  - `UpdateNotificationCategoryCommand.cs`
  - `DeleteNotificationCategoryCommand.cs`

#### 4. CQRS Queries
- **Location**: `FMS.Application/Features/Notification/Queries/`
- **Queries Implemented**:
  - `GetUserNotificationPreferencesQuery.cs`
  - `GetNotificationCategoriesQuery.cs`

#### 5. API Controller
- **Location**: `FMS.WebClient/Controllers/NotificationController.cs`
- **Endpoints Added**:
  - `GET /api/notifications/preferences/user/{userId}` - Get user preferences
  - `GET /api/notifications/preferences/user/current-user` - Get current user preferences
  - `POST /api/notifications/preferences/bulk-update` - Bulk update preferences
  - `POST /api/notifications/preferences` - Create preference
  - `PUT /api/notifications/preferences/{id}` - Update preference
  - `DELETE /api/notifications/preferences/{id}` - Delete preference
  - `GET /api/notifications/categories` - Get notification categories

### Frontend Components

#### 1. Admin Interface
- **Location**: `fms.frontend/src/pages/admin/notification-settings/`
- **Components**:
  - `NotificationSettings.js` - Main container with tab navigation
  - `NotificationCategoriesTab.js` - DataGrid for category management
  - `NotificationPoliciesTab.js` - Placeholder for future policies
  - `NotificationSettings.css` - Professional styling
  - `index.js` - Module exports

#### 2. API Services
- **Location**: `fms.frontend/src/api/`
- **Services**:
  - `notificationPreferencesApi.js` - User preferences API service
  - `notificationCategoriesApi.js` - Categories API service

## Key Features

### User Notification Preferences
- ✅ **Category-based Configuration**: Preferences organized by notification categories
- ✅ **Delivery Methods**: Support for System, Email, SMS delivery options
- ✅ **Priority Levels**: Critical, High, Medium, Low, Info priority settings
- ✅ **Quiet Hours**: TimeSpan-based quiet periods with start/end times
- ✅ **Rate Limiting**: Configurable limits per hour and per day
- ✅ **Acknowledgment Settings**: Per-category acknowledgment requirements
- ✅ **Bulk Operations**: Efficient bulk update of multiple preferences

### Notification Categories Management
- ✅ **Dynamic Categories**: Database-driven category management
- ✅ **Admin Interface**: Full CRUD interface for category management
- ✅ **Icon Support**: FontAwesome icon class selection
- ✅ **Display Ordering**: Configurable display order for UI
- ✅ **Default Settings**: Category-level default preferences
- ✅ **Active/Inactive States**: Enable/disable categories

### Technical Implementation
- ✅ **CQRS Architecture**: Separation of command and query responsibilities
- ✅ **FMSResponse Pattern**: Consistent response structure with validation
- ✅ **Entity Framework Integration**: Proper database context integration
- ✅ **MediatR Integration**: Mediator pattern for command/query handling
- ✅ **Validation**: Comprehensive input validation and error handling
- ✅ **Logging**: Structured logging for operations and errors

## Database Schema

### UserNotificationPreference Table
```sql
CREATE TABLE UserNotificationPreferences (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    UserId NVARCHAR(450) NOT NULL,
    NotificationCategory NVARCHAR(100) NOT NULL,
    DeliveryMethods NVARCHAR(500) NULL,
    IsEnabled BIT NOT NULL DEFAULT 1,
    Priority NVARCHAR(50) NULL,
    QuietHoursStart TIME NULL,
    QuietHoursEnd TIME NULL,
    MaxNotificationsPerHour INT NOT NULL DEFAULT 0,
    MaxNotificationsPerDay INT NOT NULL DEFAULT 0,
    RequireAcknowledgment BIT NOT NULL DEFAULT 0,
    CreatedAt DATETIME2 NOT NULL,
    UpdatedAt DATETIME2 NULL,
    CreatedBy NVARCHAR(450) NOT NULL,
    UpdatedBy NVARCHAR(450) NULL,
    INDEX IX_UserNotificationPreferences_UserId (UserId),
    INDEX IX_UserNotificationPreferences_Category (NotificationCategory),
    CONSTRAINT UK_UserNotificationPreferences_User_Category
        UNIQUE (UserId, NotificationCategory)
);
```

### NotificationCategory Table
```sql
CREATE TABLE NotificationCategories (
    Id NVARCHAR(100) PRIMARY KEY,
    Name NVARCHAR(200) NOT NULL,
    Description NVARCHAR(1000) NULL,
    DefaultPriority NVARCHAR(50) NOT NULL DEFAULT 'Medium',
    IsActive BIT NOT NULL DEFAULT 1,
    DisplayOrder INT NOT NULL DEFAULT 0,
    IconClass NVARCHAR(100) NULL,
    DefaultRequireAcknowledgment BIT NOT NULL DEFAULT 0,
    DefaultDeliveryMethods NVARCHAR(500) NULL,
    CreatedAt DATETIME2 NOT NULL,
    UpdatedAt DATETIME2 NULL,
    CreatedBy NVARCHAR(450) NOT NULL,
    UpdatedBy NVARCHAR(450) NULL
);
```

## API Usage Examples

### Get Current User Preferences
```javascript
const response = await notificationPreferencesApi.getCurrentUserPreferences();
if (response.isSuccess) {
    console.log("User preferences:", response.data);
}
```

### Bulk Update Preferences
```javascript
const preferences = [
    {
        notificationCategory: "SensorVariance",
        deliveryMethods: ["System", "Email"],
        isEnabled: true,
        priority: "High",
        quietHoursStart: "22:00",
        quietHoursEnd: "08:00",
        maxNotificationsPerHour: 5,
        requireAcknowledgment: true
    }
];

const response = await notificationPreferencesApi.bulkUpdatePreferences(userId, preferences);
```

### Manage Categories (Admin)
```javascript
// Get all categories
const categories = await notificationCategoriesApi.getAllCategories();

// Create new category
const newCategory = {
    id: "CustomAlert",
    name: "Custom Alerts",
    description: "User-defined custom alerts",
    defaultPriority: "Medium",
    isActive: true,
    displayOrder: 10,
    iconClass: "fa-solid fa-bell-exclamation",
    defaultDeliveryMethods: ["System"]
};

const result = await notificationCategoriesApi.createCategory(newCategory);
```

## Validation Rules

### User Preferences
- **UserId**: Required, must be valid user identifier
- **NotificationCategory**: Required, must exist in NotificationCategories
- **DeliveryMethods**: At least one method required
- **Priority**: Must be one of: Critical, High, Medium, Low, Info
- **QuietHours**: Valid time format (HH:mm)
- **Rate Limits**: Non-negative integers

### Categories
- **Id**: Required, unique, alphanumeric with underscores only
- **Name**: Required, 1-200 characters
- **DefaultPriority**: Must be valid priority level
- **DisplayOrder**: Non-negative integer
- **IconClass**: Valid FontAwesome class format

## Security Considerations

- ✅ **User Authorization**: Users can only modify their own preferences
- ✅ **Admin Authorization**: Category management requires Admin role
- ✅ **JWT Authentication**: All endpoints protected with JWT Bearer tokens
- ✅ **Input Validation**: Comprehensive validation at API and domain levels
- ✅ **SQL Injection Protection**: Entity Framework parameterized queries

## Error Handling

All operations return structured `FMSResponse<T>` objects with:
- **IsSuccess**: Boolean indicating operation result
- **Message**: Human-readable success/error message
- **Data**: Response payload (on success)
- **ValidationErrors**: List of validation errors (on failure)

## Future Enhancements

### Phase 2 - Notification Policies
- [ ] Escalation rules configuration
- [ ] Global rate limiting policies
- [ ] Delivery schedule management
- [ ] Template management system
- [ ] Priority-based routing rules

### Phase 3 - Advanced Features
- [ ] Mobile push notifications
- [ ] Slack/Teams integration
- [ ] Webhook delivery methods
- [ ] A/B testing for notifications
- [ ] Analytics and reporting dashboard

## Troubleshooting

### Common Issues

1. **404 Errors on API Calls**
   - Verify route attribute: `[Route("api/notifications")]`
   - Check frontend API base URL configuration

2. **Type Mismatch Errors**
   - Ensure using Application layer DTOs (`FMS.Application.Features.Notification.DTOs`)
   - Remove any local DTO definitions in controllers

3. **Database Connection Issues**
   - Verify Entity Framework context registration
   - Check connection string configuration
   - Ensure database migrations are applied

4. **Authorization Failures**
   - Verify JWT token configuration
   - Check user roles and claims
   - Ensure `[Authorize]` attributes are properly configured

## Implementation Notes

### Project Structure Compliance
- ✅ All DTOs placed in `FMS.Application/Features/Notification/DTOs/`
- ✅ Commands and Queries follow CQRS pattern
- ✅ Controllers in `FMS.WebClient/Controllers/`
- ✅ Frontend components organized by feature in `pages/admin/notification-settings/`
- ✅ Proper separation of concerns maintained

### Code Quality
- ✅ Comprehensive error handling and logging
- ✅ Input validation at multiple levels
- ✅ Consistent naming conventions
- ✅ Proper async/await usage
- ✅ Clean, maintainable code structure

This implementation provides a solid foundation for the notification preferences system and can be extended with additional features as requirements evolve.
