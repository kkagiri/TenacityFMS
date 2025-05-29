# FMS Environment Setup Guide

This guide explains how to set up the required environment variables for the FMS application when working across different machines.

## Why Environment Variables Are Needed

The FMS application requires several environment variables to be set at the machine level, including:

- Database connection strings
- Redis connection string
- JWT authentication settings
- Application settings

These settings are not stored in the repository for security reasons and must be configured on each development machine.

## Setup Instructions

### 1. Verify Current Environment Variables

First, check if your environment variables are already set:

1. Open PowerShell as Administrator
2. Navigate to the project directory
3. Run the verification script:
   ```
   .\verify-environment.ps1
   ```

This will show you which required variables are missing.

### 2. Set Environment Variables

#### Option 1: Using Batch File (Recommended)

1. Right-click on `setup-environment.bat` in the project directory
2. Select "Run as administrator"
3. Wait for the script to complete and press any key to close the window

#### Option 2: Using PowerShell Script

If you prefer using PowerShell:

1. Open PowerShell as Administrator
2. Navigate to the project directory
3. Run the setup script:
   ```
   .\setup-environment.ps1
   ```

Both methods will set all required environment variables at the machine level.

### 3. Restart Applications

After setting the environment variables:

1. Restart Visual Studio or any other IDE you're using
2. Restart any running instances of the application
3. You may need to restart your terminal/command prompt to see the new variables

## Important Notes

- **Connection Strings**: The setup script configures connection strings for databases and Redis based on the default development environment. You may need to adjust these for your specific environment.

- **JWT Settings**: The JWT secret key should be replaced with a secure value for production environments.

- **Machine-Level Variables**: These variables are set at the machine level and will persist across system reboots.

## Customizing for Your Environment

If you need to use different connection strings for your development machine:

1. Edit the `setup-environment.bat` file
2. Update the connection strings and other settings as needed
3. Run the batch file as administrator
4. Verify the changes with `verify-environment.ps1`

## Troubleshooting

If the application fails to start or connect to required services:

1. Run `.\verify-environment.ps1` to check if all variables are set correctly
2. Ensure the services (MySQL, Redis) are running and accessible
3. Check that the connection strings point to the correct servers with correct credentials
4. On some systems, very long environment variables might be truncated - if this happens, try shortening connection strings

## For Different Environments

When moving between different environments (work, home, development):

1. Update the connection strings in `setup-environment.bat` to match your target environment
2. Run the batch file as Administrator
3. Verify with `verify-environment.ps1`

---

**Note**: Never commit sensitive connection strings or passwords to the repository. Always use environment variables for these values.