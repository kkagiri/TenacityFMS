# Mobile Fueling Critical Services - Testing Strategy

## Problem
Missing dependency injection registrations (like `IPushNotificationService`) can cause runtime failures that:
1. Break WebSocket connections to PTS devices
2. Prevent pumps from appearing in the mobile app
3. Only manifest in production, not during build

## Solution: DI Validation Tests

We've added tests in `FMS.Testing/IntegrationTests/DependencyInjection/` that validate:

### 1. PTSServiceDIValidationTests.cs
- Validates all notification channels can be resolved
- Tests `IPushNotificationService` specifically (the service that was missing)
- Tests `PushNotificationChannel` construction with all dependencies
- Documents all `INotificationChannel` implementations and their dependencies

### 2. MobileFuelingCriticalServicesTests.cs
- Tests services critical for mobile app functionality
- Validates notification channel registry can resolve all channels
- Tests complete notification flow dependencies
- Provides a checklist of mobile-critical services

## Running Tests Before Deployment

### Quick Validation (PowerShell)
```powershell
cd FMS.Testing
dotnet test --filter "FullyQualifiedName~DependencyInjection"
```

### Run All Mobile-Critical Tests
```powershell
dotnet test --filter "FullyQualifiedName~MobileFuelingCriticalServicesTests"
```

### Run Specific Critical Test
```powershell
dotnet test --filter "CriticalFix_IPushNotificationService_MustBeRegistered"
```

## CI/CD Integration

Add to your deployment pipeline:

```yaml
# Azure DevOps / GitHub Actions
- name: Run DI Validation Tests
  run: |
    cd FMS.Testing
    dotnet test --filter "Category=Critical" --logger "trx;LogFileName=di-validation.trx"
  
- name: Fail on DI Errors
  if: failure()
  run: echo "CRITICAL: DI registration errors detected. Mobile app will not function."
```

## Adding New Critical Service Tests

When adding a new service that mobile depends on:

```csharp
[Theory]
[InlineData(typeof(INewService), "Description of what mobile uses it for")]
public void MobileAppDependency_ServiceMustBeRegistered(Type serviceType, string purpose)
{
    // Register your services
    _services.AddScoped<INewService, NewService>();
    
    var sp = _services.BuildServiceProvider();
    using var scope = sp.CreateScope();
    var service = scope.ServiceProvider.GetService(serviceType);
    
    Assert.NotNull(service);
}
```

## What These Tests Catch

| Error Type | Example | Test Coverage |
|------------|---------|---------------|
| Missing DI Registration | `IPushNotificationService` not registered | ✅ `PushNotificationService_CanBeResolved` |
| Missing Channel Dependency | `PushNotificationChannel` can't construct | ✅ `PushNotificationChannel_CanBeConstructed` |
| Incomplete Channel Registry | Not all channels available | ✅ `NotificationChannelRegistry_AllChannels_CanBeResolved` |
| Null Reference in Error Handler | `packetId.Value` on null | ✅ Fixed in code |

## Test Categories

- **Critical**: Must pass before deployment
- **Mobile**: Tests for mobile app functionality
- **DI**: Dependency injection validation
- **Integration**: Full service resolution tests

## Recommended Pre-Deployment Checklist

1. [ ] Run `dotnet test --filter "FullyQualifiedName~DependencyInjection"`
2. [ ] All DI tests pass
3. [ ] Check PTS Windows Service can start without DI errors
4. [ ] Verify mobile app can connect and see pumps
5. [ ] Monitor logs for "Unable to resolve service" errors

## Related Files

- [PTSServiceDIValidationTests.cs](../FMS.Testing/IntegrationTests/DependencyInjection/PTSServiceDIValidationTests.cs)
- [MobileFuelingCriticalServicesTests.cs](../FMS.Testing/IntegrationTests/DependencyInjection/MobileFuelingCriticalServicesTests.cs)
- [FMS.PTS.WindowsService/Program.cs](../FMS.PTS.WindowsService/Program.cs) - Service registrations
