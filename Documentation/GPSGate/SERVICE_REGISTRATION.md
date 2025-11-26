# Service Registration for Report Processors

## Required DI Registrations

Add to `Program.cs` or `Startup.cs` in the `ConfigureServices` method:

```csharp
// ===================================================================
// GPSGate Report Processing Services
// ===================================================================

// Register individual report processors
services.AddScoped<FuelConsumptionReportProcessor>();
services.AddScoped<RefuelingReportProcessor>();

// Register processor factory (Singleton for performance)
services.AddSingleton<IReportProcessorFactory, ReportProcessorFactory>();

// Existing GPSGate services (if not already registered)
services.AddScoped<IGPSGateDirectoryService, GPSGateDirectoryService>();
services.AddScoped<IGPSGateReportingService, GPSGateReportingService>();

// Register generic MediatR handler for report processing
// Note: MediatR should auto-register handlers, but if needed:
// services.AddScoped(typeof(IRequestHandler<ProcessReportQuery<>,FMSResponse<ProcessedReportDto<>>>),
//                    typeof(ProcessReportQueryHandler<>));
```

## Complete Registration Example

```csharp
using FMS.Application.Features.GPSGate.Processors;
using FMS.Application.Features.GPSGate.Services;
using Microsoft.Extensions.DependencyInjection;

namespace FMS.WebClient
{
    public class Startup
    {
        public void ConfigureServices(IServiceCollection services)
        {
            // ... existing services ...

            // GPSGate SOAP Clients
            services.AddScoped<DirectoryServiceReference1.DirectorySoapClient>();
            services.AddScoped<ReportingServiceReference.ReportingSoapClient>();

            // GPSGate Services
            services.AddScoped<IGPSGateDirectoryService, GPSGateDirectoryService>();
            services.AddScoped<IGPSGateReportingService, GPSGateReportingService>();

            // Report Processors
            services.AddScoped<FuelConsumptionReportProcessor>();
            services.AddScoped<RefuelingReportProcessor>();

            // Processor Factory
            services.AddSingleton<IReportProcessorFactory, ReportProcessorFactory>();

            // MediatR (if not already registered)
            services.AddMediatR(cfg =>
                cfg.RegisterServicesFromAssembly(typeof(LoginCommand).Assembly));

            // ... rest of services ...
        }
    }
}
```

## Verification

After registration, verify services are available:

```csharp
// In a controller or service
public class TestController : ControllerBase
{
    private readonly IReportProcessorFactory _factory;

    public TestController(IReportProcessorFactory factory)
    {
        _factory = factory; // Should inject successfully
    }

    [HttpGet("test/processors")]
    public IActionResult TestProcessors()
    {
        var supportedReports = _factory.GetSupportedReportIds();
        return Ok(new {
            message = "Processors registered successfully",
            supportedReportIds = supportedReports
        });
    }
}
```

## Testing Registration

```bash
# After starting the application, test that processors are registered:
curl http://localhost:5000/api/test/processors

# Expected response:
# {
#   "message": "Processors registered successfully",
#   "supportedReportIds": [208, 212]
# }
```

## Adding New Processors

When you create a new processor, add it to registrations:

```csharp
// 1. Register the processor
services.AddScoped<YourNewReportProcessor>();

// 2. Factory will auto-register it if it's in RegisterProcessors() method
// No additional factory registration needed!
```

## Common Issues

### Issue: "Failed to create processor"
**Solution:** Ensure processor is registered with `AddScoped` or `AddTransient`

### Issue: "No processor registered for report ID X"
**Solution:** Check `ReportProcessorFactory.RegisterProcessors()` method includes your processor

### Issue: "Processor has no logger"
**Solution:** Ensure `ILogger<YourProcessor>` is available in DI (registered by default with logging)

## Notes

- Processors are **Scoped** (per request) for thread safety
- Factory is **Singleton** for performance
- MediatR handlers are registered automatically by assembly scanning
