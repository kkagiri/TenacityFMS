@echo off
setlocal

REM Deployment wrapper script for HyoungFMS Deployment Tool
REM This script makes it easier to run the deployment tool with common options

set SCRIPT_DIR=%~dp0
cd %SCRIPT_DIR%

REM Check if the deployment tool exists
if not exist "bin\Release\net8.0\HyoungFMS.Deployment.exe" (
    echo Building deployment tool...
    dotnet build -c Release
    if %ERRORLEVEL% neq 0 (
        echo Failed to build deployment tool.
        exit /b %ERRORLEVEL%
    )
)

REM Parse command line arguments
set FRONTEND_ONLY=
set BACKEND_ONLY=
set ENVIRONMENT=
set VERBOSE=
set NO_BACKUP=
set SKIP_HEALTH_CHECK=
set ROLLBACK_ON_FAILURE=
set LOG_FILE=

:parse_args
if "%~1"=="" goto run
if /i "%~1"=="-f" set FRONTEND_ONLY=--frontend-only
if /i "%~1"=="--frontend-only" set FRONTEND_ONLY=--frontend-only
if /i "%~1"=="-b" set BACKEND_ONLY=--backend-only
if /i "%~1"=="--backend-only" set BACKEND_ONLY=--backend-only
if /i "%~1"=="-e" set ENVIRONMENT=--environment %~2
if /i "%~1"=="--environment" set ENVIRONMENT=--environment %~2
if /i "%~1"=="-v" set VERBOSE=--verbose
if /i "%~1"=="--verbose" set VERBOSE=--verbose
if /i "%~1"=="-n" set NO_BACKUP=--no-backup
if /i "%~1"=="--no-backup" set NO_BACKUP=--no-backup
if /i "%~1"=="-s" set SKIP_HEALTH_CHECK=--skip-health-check
if /i "%~1"=="--skip-health-check" set SKIP_HEALTH_CHECK=--skip-health-check
if /i "%~1"=="-r" set ROLLBACK_ON_FAILURE=--rollback-on-failure
if /i "%~1"=="--rollback-on-failure" set ROLLBACK_ON_FAILURE=--rollback-on-failure
if /i "%~1"=="-l" set LOG_FILE=--log-file %~2
if /i "%~1"=="--log-file" set LOG_FILE=--log-file %~2

shift
goto parse_args

:run
echo Running HyoungFMS Deployment Tool...
echo.

REM Run the deployment tool with the specified options
bin\Release\net8.0\HyoungFMS.Deployment.exe %FRONTEND_ONLY% %BACKEND_ONLY% %ENVIRONMENT% %VERBOSE% %NO_BACKUP% %SKIP_HEALTH_CHECK% %ROLLBACK_ON_FAILURE% %LOG_FILE%

REM Return the exit code from the deployment tool
exit /b %ERRORLEVEL%