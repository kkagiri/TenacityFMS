# AI Agent Development Instructions - FMS System

## Project Overview
FMS (Fleet Management System) is a full-stack application with:
- **Backend**: .NET Core with CQRS pattern
- **Frontend**: React with DevExtreme UI components
- **Database**: MySQL with Entity Framework
- **Real-time**: SignalR integration

## Core Development Rules

### 1. File Management
- **Check existing files first** before creating new ones
- Look in documentation folder for similar queries/features (e.g., GetTasksQuery → check task PRD/documents)
- If file exists in another folder, don't recreate it
- **Don't repeat file creation/deletion** if there's no content changes

### 2. Project Structure
```
FMS.Application/        # Business logic, DTOs, commands, queries
FMS.WebClient/         # Web API controllers
FMS.Frontend/          # React frontend
FMS.Persistence/       # Data access layer
FMS.Domain/            # Entities and domain models
FMS.BackgroundServices/# Background jobs
documentation/         # Feature documentation - all documentation go heres
```

## Backend Development Standards

### Response Handling
- **Always use `FMSResponse.cs`** for all API endpoints
- `FMSResponse<T>` for returning data
- `FMSResponse` for errors/validation
- **Always include validation checks**

### CQRS Implementation
- Commands and CommandHandlers in same file
- Queries and QueryHandlers in same file
- Use existing features in `FMS.Application/Features/` before creating new ones

**Example Structure:**
```csharp
public record CreateVehicleCommand : IRequest<FMSResponse<VehicleDto>>
{
    public string Name { get; init; }
    public string LicensePlate { get; init; }
}

public class CreateVehicleCommandHandler : IRequestHandler<CreateVehicleCommand, FMSResponse<VehicleDto>>
{
    // Implementation here
}
```

### Database Operations
- **Use `GPSDataContext`** for all database operations
- Create entity configuration files in `FMS.Persistence`
- Add new entities to `GPSDataContext`
- Generate MySQL syntax and place in documentation/database folder
- **Don't create new PTS models** unless explicitly told

## Frontend Development Standards

### Technology Stack
- React 18.2.0 with hooks
- DevExtreme 23.2.8 for UI components
- Redux Toolkit for state management
- Tailwind CSS with `tw-` prefix
- FontAwesome icons with `fa-light fa-icon`
- SCSS (not CSS)

### Key Rules
1. **All Tailwind classes must use `tw-` prefix** (e.g., `tw-font-semibold`)
2. **Use SCSS, not CSS**
3. **FontAwesome icons**: Start with `"fa-light fa-icon"`
4. **No dark mode** - light mode only
5. **API URLs**: Use `/vehicles` not `/api/vehicles` (axiosInstance handles base URL)

### Mobile Responsiveness
- **Always make applications mobile and web responsive**
- Use height-based collapsing for mobile sidebars (not width-based)
- Reference: TankStock Layout for working mobile implementation

### Popup Configuration
```javascript
// Standard popup settings
showCloseButton={true}
width="auto"
height="auto"
```

## File Organization

### Backend Features
```
FMS.Application/Features/
├── Vehicle/
│   ├── Commands/
│   ├── Queries/
│   ├── Services/
│   └── DTOs/
```

### Frontend Structure
```
src/
├── api/              # HTTP clients
├── components/       # Reusable components
├── pages/           # Page components
├── redux/           # State management
├── services/        # Business logic
├── utils/           # Utility functions
├── contexts/        # React contexts
└── hooks/           # Custom hooks
```

## Documentation Requirements

### After Completing Tasks if user asks for documentation in prefix using [doc]
Create/update documentation in `documentation/[feature-name]/`:
1. **Requirement Document** (PRD) - includes feature description, user stories, and acceptance criteria
2. **Design Document** - includes architecture, data flow, and UI mockups
3. **User Flow Document** - includes step-by-step user interactions
4. **Task List Document** - includes all tasks to be completed for the feature
5. **Database Schema** (if applicable)

### When Creating New Features
1. Check existing implementations first
2. Follow established patterns
3. Update documentation
4. Ensure mobile responsiveness
5. Include proper validation

## Common Patterns

### API Service Example
```javascript
// Frontend service
const getVehicles = async () => {
  const response = await axiosInstance.get('/vehicles');
  return response.data;
};
```

### Component Example
```jsx
// React component with proper styling
<div className="tw-flex tw-flex-col tw-gap-4">
  <i className="fa-light fa-car"></i>
  <span className="tw-font-semibold">Vehicle List</span>
</div>
```

## Quality Checklist

### Before Submitting Code
- [ ] Used proper response types (`FMSResponse`)
- [ ] Included validation
- [ ] Followed naming conventions
- [ ] Added proper error handling
- [ ] Tested mobile responsiveness (frontend)
- [ ] Used `tw-` prefix for Tailwind
- [ ] Updated documentation
- [ ] Checked for existing similar implementations

## Key Files to Reference
- `FMSResponse.cs` - Response handling patterns
- `package.json` - Frontend dependencies
- `tailwind.config.js` - Styling configuration
- `axiosInstance.js` - API communication setup
- Existing feature folders - Implementation patterns

## Important Notes
- **Notification system implementation** - Ask user if notifications need to be implemented
- **GPSGate integration** - Use dedicated axios instance
- **Real-time updates** - Use SignalR for live data
- **Role-based access** - Implement proper permission checks
- **Environment configuration** - Use appropriate environment files