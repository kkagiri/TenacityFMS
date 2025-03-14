# HyoungFMS Deployment Tool

A comprehensive C# deployment application that integrates with GitHub Actions workflow for selective deployments of frontend and backend components.

## Features

- **Selective Deployment**: Deploy only frontend, only backend, or both components
- **IIS Management**: Specialized component for IIS operations using Microsoft.Web.Administration
- **File Management**: Robust file transfer system with backup capabilities and proper transaction handling
- **Health Check System**: Configurable health check mechanism with retry capabilities
- **Notification Service**: Modular notification system supporting email
- **Rollback Capability**: Automatic rollback on deployment failure
- **Logging**: Comprehensive logging with Serilog

## Installation

### Prerequisites

- Windows Server with IIS installed
- .NET 8.0 SDK or Runtime
- Administrator privileges

### Installation Steps

1. Clone the repository or download the release package
2. Run the installation script as Administrator:

```powershell
.\install.ps1 -InstallDir "C:\HyoungFMS\Deployment"
```

This will:

- Build the deployment tool
- Copy all necessary files to the installation directory
- Set appropriate permissions
- Create a shortcut on the desktop

## Usage

### Command Line Options

```
deployment.cmd [options]
```

Options:

- `-f, --frontend-only`: Deploy only the frontend component
- `-b, --backend-only`: Deploy only the backend component
- `-e, --environment <env>`: Deployment environment (development, production)
- `-v, --verbose`: Set output to verbose
- `-n, --no-backup`: Skip backup before deployment
- `-s, --skip-health-check`: Skip health check after deployment
- `-r, --rollback-on-failure`: Automatically rollback on deployment failure
- `-l, --log-file <path>`: Custom log file path

### Examples

Deploy both frontend and backend:

```
deployment.cmd
```

Deploy only frontend:

```
deployment.cmd -f
```

Deploy only backend:

```
deployment.cmd -b
```

Deploy to development environment with verbose logging:

```
deployment.cmd -e development -v
```

Deploy with automatic rollback on failure:

```
deployment.cmd -r
```

## Configuration

The application uses the following configuration files:

- `appsettings.json`: Main configuration
- `appsettings.development.json`: Development environment configuration
- `appsettings.production.json`: Production environment configuration

### Configuration Settings

#### Deployment Settings

```json
"DeploymentSettings": {
  "Environment": "production",
  "ReactDeploymentPath": "C:\\inetpub\\wwwroot\\hyoungFMS\\reactApp",
  "WebApiDeploymentPath": "C:\\inetpub\\wwwroot\\hyoungFMS\\webAPI",
  "IisSiteName": "ReactApp",
  "BackendSiteName": "apihyoungfms",
  "IisAppPool": "apihyoungfms",
  "HealthCheckUrl": "http://10.0.10.153:7009/api/health",
  "HealthCheckRetries": 5,
  "HealthCheckRetryDelay": 10
}
```

#### Backup Settings

```json
"BackupSettings": {
  "BackupDirectory": "C:\\backups\\hyoungFMS",
  "MaxBackupsToKeep": 5
}
```

#### Build Settings

```json
"BuildSettings": {
  "BuildFrontendOnServer": false,
  "BuildBackendOnServer": false
}
```

#### Email Settings

```json
"EmailSettings": {
  "SmtpServer": "mail.hyoung.co.ke",
  "SmtpPort": 25,
  "UseSsl": false,
  "Username": "hy.gps@hyoung.co.ke",
  "Password": "Hyoung2030",
  "From": "hy.gps@hyoung.co.ke",
  "To": "kevin.kagiri@hyoung.co.ke"
}
```

#### Log Settings

```json
"LogSettings": {
  "FilePath": "./logs/deployment_log_{timestamp}.txt",
  "MinimumLevel": "Information"
}
```

## GitHub Actions Integration

To integrate with GitHub Actions, update your workflow YAML file to call the deployment tool with the appropriate parameters:

```yaml
- name: Deploy frontend only
  if: ${{ needs.detect-changes.outputs.frontend-changed == 'True' && needs.detect-changes.outputs.backend-changed != 'True' }}
  run: |
    C:\HyoungFMS\Deployment\deployment.cmd -f

- name: Deploy backend only
  if: ${{ needs.detect-changes.outputs.backend-changed == 'True' && needs.detect-changes.outputs.frontend-changed != 'True' }}
  run: |
    C:\HyoungFMS\Deployment\deployment.cmd -b

- name: Deploy both
  if: ${{ needs.detect-changes.outputs.frontend-changed == 'True' && needs.detect-changes.outputs.backend-changed == 'True' }}
  run: |
    C:\HyoungFMS\Deployment\deployment.cmd
```

## Troubleshooting

### Common Issues

1. **IIS Site or App Pool Not Found**

   - Verify the site and app pool names in the configuration file
   - Ensure the IIS sites and app pools exist

2. **File Locking Issues**

   - The tool attempts to release locks automatically
   - If issues persist, manually stop IIS services before deployment

3. **Email Notification Failures**
   - Check SMTP server settings in the configuration file
   - Verify network connectivity to the SMTP server

### Logs

Logs are stored in the `logs` directory by default. Check the logs for detailed information about deployment failures.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, please contact kevin.kagiri@hyoung.co.ke
