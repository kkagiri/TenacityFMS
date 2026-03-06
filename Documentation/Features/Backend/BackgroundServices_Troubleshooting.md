# Background Services Troubleshooting Guide

## Problem: Frequent Background Service Restarts

### Services Affected
- **PolicyTriggerBackgroundService** - Redis-based policy trigger listener
- **AutomatedReconciliationBackgroundService** - Scheduled reconciliation processor

### Symptoms
- Frequent "Service Started" and "Service Stopped" notifications
- Services restarting every few minutes
- Potential performance degradation

## Root Cause Analysis

### 1. Application Pool Recycling
**Most Common Cause**: IIS application pool recycling or manual IIS restarts

**Check:**
```powershell
# Check IIS application pool recycling settings
Get-IISAppPool | Select-Object Name, ProcessModel, Recycling

# Check Windows Event Log for application pool restarts
Get-WinEvent -FilterHashtable @{LogName='System'; ID=5074,5075,5076}
```

**Solutions:**
- Review IIS application pool recycling conditions
- Check if automated deployment is running
- Verify memory limits and idle timeout settings

### 2. Redis Connection Issues
**Symptoms**: Services stop when Redis connection fails

**Check:**
```bash
# Check Redis connectivity
redis-cli ping

# Monitor Redis connections
redis-cli monitor
```

**Solutions:**
- Verify Redis server stability
- Check Redis connection string configuration
- Review Redis authentication settings
- Monitor Redis memory usage

### 3. Service Dependencies Missing
**Symptoms**: Services fail to start due to dependency injection errors

**Check Application Logs:**
```csharp
// Look for these error patterns in logs:
"IPolicyTriggerService not available"
"Service configuration error"
"Failed to resolve service"
```

**Solutions:**
- Verify all required services are registered in DI container
- Check service registration order in Program.cs
- Ensure Redis services are properly configured

### 4. Health Check Failures
**Symptoms**: Services restart due to failed health checks

**Code Reference:**
```csharp
// PolicyTriggerBackgroundService.cs - Line 83
private async Task PerformHealthCheckAsync(...)
{
    // Health checks run every 30 minutes
    var healthCheckInterval = TimeSpan.FromMinutes(30);
}
```

**Check:**
- Review health check logs
- Verify database connectivity
- Check Redis pub/sub subscription status

## Monitoring and Logging

### 1. Enable Detailed Logging
Add to `appsettings.json`:
```json
{
  "Logging": {
    "LogLevel": {
      "FMS.BackgroundServices": "Debug",
      "FMS.Application.Communication.Redis": "Debug",
      "Microsoft.Extensions.Hosting": "Information"
    }
  }
}
```

### 2. Monitor Key Metrics
- Service uptime and restart frequency
- Redis connection status
- Database connection health
- Memory and CPU usage

### 3. Setup Alerts
Configure alerts for:
- Service restart frequency > 5 per hour
- Redis connection failures
- Database connectivity issues
- Memory usage > 80%

## Prevention Strategies

### 1. Deployment Best Practices
- Schedule deployments during maintenance windows
- Use blue-green deployment to minimize downtime
- Implement graceful shutdown procedures

### 2. Redis Resilience
```csharp
// Implement connection retry logic
services.Configure<ConnectionMultiplexerOptions>(options =>
{
    options.ConnectRetry = 3;
    options.ConnectTimeout = 5000;
    options.AbortOnConnectFail = false;
});
```

### 3. Service Health Monitoring
```csharp
// Add health checks
services.AddHealthChecks()
    .AddRedis(redisConnectionString)
    .AddDbContext<GpsdataContext>();
```

### 4. Graceful Degradation
- Implement circuit breakers for external dependencies
- Add fallback mechanisms for Redis failures
- Queue critical operations for retry

## Quick Fixes

### Immediate Actions
1. **Check for active deployments**
2. **Verify Redis server status**
3. **Review recent configuration changes**
4. **Check IIS application pool status**

### Temporary Workarounds
1. **Disable automated deployment during peak hours**
2. **Increase health check intervals**
3. **Add retry logic to service initialization**

## Configuration Examples

### Stable Service Configuration
```json
{
  "AutomatedReconciliation": {
    "ExecutionIntervalMinutes": 15,
    "HealthCheckIntervalMinutes": 60,
    "MaxRetryAttempts": 3,
    "RetryDelayMinutes": 5
  },
  "Redis": {
    "ConnectionTimeout": 10000,
    "OperationTimeout": 5000,
    "RetryCount": 3
  }
}
```

### IIS Application Pool Settings
```xml
<applicationPool>
  <processModel
    idleTimeout="00:00:00"
    maxProcesses="1"
    pingingEnabled="true"
    pingInterval="00:00:30"
    pingResponseTime="00:01:30" />
  <recycling>
    <periodicRestart time="00:00:00" />
  </recycling>
</applicationPool>
```

## Support Information

### Log Locations
- Application logs: `C:\Logs\FMS\`
- IIS logs: `C:\inetpub\logs\LogFiles\`
- Windows Event Log: `Application` and `System`

### Key Files to Review
- `FMS.WebClient\Program.cs` - Service registration
- `FMS.BackgroundServices\FMS\*.cs` - Background service implementations
- `appsettings.json` - Configuration settings
- `web.config` - IIS configuration

### Contact Information
- Development Team: [Team Contact]
- Infrastructure Team: [Infrastructure Contact]
- On-call Support: [Support Contact]