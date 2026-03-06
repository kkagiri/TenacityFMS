# PTS Service Control

## Overview
The PTS Service Control feature provides web-based monitoring and management capabilities for the PTS Windows Service. This allows administrators to start, stop, restart, and monitor the service directly from the web interface.

## Features

### Service Monitoring
- Real-time service status display
- Process information (PID, memory usage)
- Auto-refresh capabilities
- Last activity timestamps

### Service Control
- Start service
- Stop service
- Restart service
- View recent log entries

### Security
- Admin/SuperAdmin role required
- All actions are logged with user information
- Confirmation dialogs for destructive operations

## API Endpoints

### GET /PTSService/status
Returns current service status and metrics.

### POST /PTSService/start
Starts the PTS Windows Service.

### POST /PTSService/stop
Stops the PTS Windows Service.

### POST /PTSService/restart
Restarts the PTS Windows Service.

### GET /PTSService/logs
Retrieves recent log entries from the service.

## Frontend Components

### PTSServiceControl.js
Main component providing the service control interface with:
- Service status dashboard
- Action buttons for service control
- Log viewing capabilities
- Auto-refresh functionality

## Implementation Notes

### Backend Services
- `ServiceControlService` handles Windows Service API interactions
- Proper error handling and logging
- Permission checks for service operations

### Frontend Features
- Mobile-responsive design using Tailwind CSS
- Real-time status updates
- DevExtreme components for consistent UI
- Comprehensive error handling

## Usage

1. Navigate to Admin → PTS Service Control
2. View current service status
3. Use action buttons to control service
4. Enable auto-refresh for live monitoring
5. View logs for troubleshooting

## Security Considerations

- Requires elevated permissions to control Windows services
- All operations are audited
- Confirmation required for service control actions
- Role-based access control enforced

## Troubleshooting

### Service Not Found
- Verify service is installed
- Check service name configuration
- Ensure proper permissions

### Permission Denied
- Run web application with appropriate service account
- Verify user has admin