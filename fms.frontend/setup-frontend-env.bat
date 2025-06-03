@echo off
echo Setting up FMS Frontend Environment Files...

REM Create .env.development
echo # Development Environment Configuration > .env.development
echo REACT_APP_FMS_API_URL_DEV=http://localhost:7009/api >> .env.development
echo REACT_APP_FMS_API_URL_PROD=http://localhost:7009/api >> .env.development
echo REACT_APP_PUBLIC_FMS_API_URL=http://localhost:7009/api >> .env.development
echo REACT_APP_API_URL=http://localhost:7009/api >> .env.development
echo REACT_APP_FMS_API_URL=http://localhost:7009/api >> .env.development
echo # SignalR Configuration >> .env.development
echo REACT_APP_SIGNALR_URL=http://localhost:7009 >> .env.development
echo # Node Environment >> .env.development
echo NODE_ENV=development >> .env.development

REM Create .env.production
echo # Production Environment Configuration > .env.production
echo REACT_APP_FMS_API_URL_DEV=http://localhost:7009/api >> .env.production
echo REACT_APP_FMS_API_URL_PROD=http://localhost:7009/api >> .env.production
echo REACT_APP_PUBLIC_FMS_API_URL=http://localhost:7009/api >> .env.production
echo REACT_APP_API_URL=http://localhost:7009/api >> .env.production
echo REACT_APP_FMS_API_URL=http://localhost:7009/api >> .env.production
echo # SignalR Configuration >> .env.production
echo REACT_APP_SIGNALR_URL=http://localhost:7009 >> .env.production
echo # Node Environment >> .env.production
echo NODE_ENV=production >> .env.production

REM Create .env.local (for local overrides)
echo # Local Environment Overrides > .env.local
echo # Uncomment and modify these lines to override default settings >> .env.local
echo # REACT_APP_FMS_API_URL_DEV=http://192.168.1.100:7009/api >> .env.local
echo # REACT_APP_SIGNALR_URL=http://192.168.1.100:7009 >> .env.local

REM Create .env (default environment)
echo # Default Environment Configuration > .env
echo REACT_APP_FMS_API_URL_DEV=http://localhost:7009/api >> .env
echo REACT_APP_FMS_API_URL_PROD=http://localhost:7009/api >> .env
echo REACT_APP_PUBLIC_FMS_API_URL=http://localhost:7009/api >> .env
echo REACT_APP_API_URL=http://localhost:7009/api >> .env
echo REACT_APP_FMS_API_URL=http://localhost:7009/api >> .env
echo REACT_APP_SIGNALR_URL=http://localhost:7009 >> .env

echo.
echo Frontend environment files created successfully!
echo.
echo Files created:
echo - .env
echo - .env.development
echo - .env.production
echo - .env.local
echo.
echo Note: Update the IP addresses and ports in these files to match your environment
echo For production deployment, update .env.production with your production URLs
echo.
pause