# FMS Frontend Setup Guide

## Overview
This guide covers the setup and configuration of the FMS React frontend application, including environment variables and recent changes made to improve configuration management.

## Recent Changes Made

### 1. Environment Variable Configuration
- **Fixed hardcoded URLs**: Replaced hardcoded API URLs with environment variables
- **Created environment files**: Set up proper `.env` files for different environments
- **Updated SignalR service**: Replaced hardcoded SignalR URL with configurable environment variable

### 2. Files Modified

#### `src/signalR/SignalRService.js`
- **Before**: `const baseURL = "http://10.0.11.90:7009";`
- **After**: `const baseURL = process.env.REACT_APP_SIGNALR_URL || "http://localhost:7009";`

#### Environment Files Created
- `.env` - Default environment configuration
- `setup-frontend-env.bat` - Script to recreate environment files

## Environment Variables Used

The frontend uses multiple environment variables for different API endpoints:

```bash
# API URLs (all should point to the same backend)
REACT_APP_FMS_API_URL_DEV=http://localhost:7009/api
REACT_APP_FMS_API_URL_PROD=http://localhost:7009/api
REACT_APP_PUBLIC_FMS_API_URL=http://localhost:7009/api
REACT_APP_API_URL=http://localhost:7009/api
REACT_APP_FMS_API_URL=http://localhost:7009/api

# SignalR Configuration
REACT_APP_SIGNALR_URL=http://localhost:7009
```

## Setup Instructions

### 1. Clone Repository
```bash
git clone <repository-url>
cd FMS.frontend
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Set Up Environment Variables

#### Option A: Run Setup Script
```bash
.\setup-frontend-env.bat
```

#### Option B: Manual Setup
Create a `.env` file in the root directory with the following content:
```bash
# Default Environment Configuration
REACT_APP_FMS_API_URL_DEV=http://localhost:7009/api
REACT_APP_FMS_API_URL_PROD=http://localhost:7009/api
REACT_APP_PUBLIC_FMS_API_URL=http://localhost:7009/api
REACT_APP_API_URL=http://localhost:7009/api
REACT_APP_FMS_API_URL=http://localhost:7009/api
REACT_APP_SIGNALR_URL=http://localhost:7009
```

### 4. Update URLs for Your Environment
Edit the `.env` file to match your backend server:
- Replace `localhost:7009` with your backend server IP/domain
- For production, update all URLs to use HTTPS and production domains

## Configuration Details

### API URL Resolution
The frontend uses a smart API URL resolution system in `src/api/axiosInstance.js`:

1. **Development**: Uses `REACT_APP_FMS_API_URL_DEV`
2. **Production**:
   - First tries `REACT_APP_PUBLIC_FMS_API_URL` with health check
   - Falls back to `REACT_APP_FMS_API_URL_PROD` if health check fails

### SignalR Connection
- Uses `REACT_APP_SIGNALR_URL` for WebSocket connections
- Connects to `/signalHub` endpoint
- Supports automatic reconnection with exponential backoff

## Development vs Production

### Development Environment
```bash
REACT_APP_FMS_API_URL_DEV=http://localhost:7009/api
REACT_APP_SIGNALR_URL=http://localhost:7009
```

### Production Environment
```bash
REACT_APP_FMS_API_URL_PROD=https://your-production-domain.com/api
REACT_APP_PUBLIC_FMS_API_URL=https://your-production-domain.com/api
REACT_APP_SIGNALR_URL=https://your-production-domain.com
```

## Running the Application

### Development Mode
```bash
npm start
```

### Production Build
```bash
npm run build
```

## Troubleshooting

### Common Issues

1. **API Connection Errors**
   - Verify backend is running on the configured port
   - Check CORS settings in backend
   - Ensure environment variables are set correctly

2. **SignalR Connection Issues**
   - Verify SignalR hub is available at `/signalHub`
   - Check WebSocket support in browser
   - Verify firewall/proxy settings

3. **Environment Variables Not Loading**
   - Ensure `.env` file is in the root directory
   - Restart development server after changing environment variables
   - Check that variable names start with `REACT_APP_`

### Network Configuration

For different network setups:

#### Local Development
```bash
REACT_APP_SIGNALR_URL=http://localhost:7009
```

#### Network Development (other machines)
```bash
REACT_APP_SIGNALR_URL=http://192.168.1.100:7009
```

#### Production
```bash
REACT_APP_SIGNALR_URL=https://your-domain.com
```

## Dependencies

### Key Dependencies
- React 18+
- DevExtreme (UI components)
- SignalR (@microsoft/signalr)
- Axios (HTTP client)
- Redux (state management)

### DevExtreme Configuration
- Uses `devextreme.json` for theme configuration
- Custom CSS classes use `tw-` prefix to avoid conflicts
- License configuration in `devextreme.json`

## File Structure

```
FMS.frontend/
├── src/
│   ├── api/
│   │   └── axiosInstance.js     # API configuration
│   ├── signalR/
│   │   └── SignalRService.js    # Real-time communication
│   ├── redux/                   # State management
│   └── components/              # React components
├── public/                      # Static assets
├── .env                         # Environment variables
├── package.json                 # Dependencies
└── setup-frontend-env.bat       # Environment setup script
```

## Next Steps

1. **Test the application**: Start both backend and frontend to verify connectivity
2. **Configure for your network**: Update IP addresses in environment files
3. **Set up production environment**: Create production-specific environment files
4. **Monitor connections**: Use browser dev tools to verify API and SignalR connections

## Support

For issues related to:
- **API connectivity**: Check backend logs and CORS configuration
- **SignalR issues**: Verify WebSocket support and hub availability
- **Environment setup**: Ensure all required variables are set correctly