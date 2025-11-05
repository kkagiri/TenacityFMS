# Vehicle Tracking System - Documentation

## Overview

The FMS Vehicle Tracking System is a plugin-based, multi-provider GPS tracking architecture that enables flexible integration with various GPS tracking providers. The system provides automatic failover, health monitoring, and dynamic configuration without requiring code changes.

## Key Features

- **Multi-Provider Support**: Integrate multiple GPS tracking providers simultaneously
- **Plugin Architecture**: Add new providers through simple plugin implementation
- **Automatic Failover**: Health-aware provider switching ensures continuous tracking
- **Dynamic Configuration**: Update provider settings without restarting the system
- **Real-Time Monitoring**: Live health checks and performance metrics
- **Centralized Management**: Admin UI for provider configuration and monitoring
- **High Performance**: Built-in caching and parallel processing

## Documentation Structure

### For Developers

Start here if you're developing with or extending the Vehicle Tracking System.

📘 **[DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md)** - Quick Start & API Reference
- Quick start guide
- Service usage examples
- Complete REST API reference
- Creating custom providers
- Configuration options
- Testing strategies
- Troubleshooting guide
- Best practices

📐 **[ARCHITECTURE.md](./ARCHITECTURE.md)** - System Architecture & Design
- System overview and design principles
- Component diagrams and data flows
- Core interfaces and contracts
- Design patterns used
- Database schema
- Performance optimizations
- Security considerations
- Extensibility guide

📦 **[IMPLEMENTATION.md](./IMPLEMENTATION.md)** - Implementation Details
- What's implemented in each layer
- Domain entities and EF Core configurations
- Infrastructure services and providers
- Application DTOs
- WebClient API and React UI
- Database migrations
- Integration points

### For Administrators

📗 **[USER_GUIDE.md](./USER_GUIDE.md)** - User Guide for Administrators
- Accessing the system
- Dashboard overview
- Managing provider configurations
- Assigning vehicles to providers
- Common administrative tasks
- Troubleshooting

### API Documentation

📙 **[API_REFERENCE.md](./API_REFERENCE.md)** - REST API Reference
- Complete endpoint documentation
- Request/response examples
- Authentication guide
- Error handling

### Quick References

📝 **[QUICK_REFERENCE.md](./QUICK_REFERENCE.md)** - Quick Reference Guide
- Common tasks
- Code snippets
- Database queries

## Quick Start

### 1. Add Services

```csharp
// In Program.cs
builder.Services.AddVehicleTracking(options =>
{
    options.AutoDiscoverProviders = true;
    options.LocationCacheDurationSeconds = 30;
    options.HealthCacheDurationSeconds = 60;
    options.EnableFailover = true;
});
```

### 2. Run Database Migrations

```bash
mysql -u username -p database_name < database/phase2_provider_configuration.sql
mysql -u username -p database_name < Phase4/01_GPSGateProvider_Configuration.sql
mysql -u username -p database_name < Phase7/01_ProviderManagement_Navigation.sql
```

### 3. Use the Service

```csharp
public class VehicleController : ControllerBase
{
    private readonly IVehicleTrackingService _trackingService;

    public VehicleController(IVehicleTrackingService trackingService)
    {
        _trackingService = trackingService;
    }

    [HttpGet("{vehicleId}/location")]
    public async Task<IActionResult> GetLocation(int vehicleId)
    {
        var location = await _trackingService.GetVehicleLocationAsync(vehicleId);
        if (location == null)
            return NotFound();
        return Ok(location);
    }
}
```

## System Architecture

```
┌─────────────────────────────────────────────┐
│           Web Client Layer                  │
│  (React UI + REST API)                      │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│        Infrastructure Layer                 │
│  - VehicleTrackingService (Unified API)     │
│  - ProviderFactory (Dynamic Creation)       │
│  - ProviderRegistry (Auto-Discovery)        │
│  - Providers (GPSGate, Future providers)    │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│      Domain & Persistence Layer             │
│  - Configuration Management                 │
│  - Health History Tracking                  │
│  - Vehicle-Provider Mappings                │
└─────────────────────────────────────────────┘
```

## Implementation Status

| Component              | Status      | Location                          |
| ---------------------- | ----------- | --------------------------------- |
| Core Interfaces        | ✅ Complete | FMS.Infrastructure                |
| Provider Factory       | ✅ Complete | FMS.Infrastructure                |
| Provider Registry      | ✅ Complete | FMS.Infrastructure                |
| Configuration Service  | ✅ Complete | FMS.Infrastructure                |
| Tracking Service       | ✅ Complete | FMS.Infrastructure                |
| GPSGate Provider       | ✅ Complete | FMS.Infrastructure                |
| Database Schema        | ✅ Complete | Documentation/database            |
| Domain Entities        | ✅ Complete | FMS.Domain                        |
| EF Core Configs        | ✅ Complete | FMS.Persistence                   |
| REST API               | ✅ Complete | FMS.WebClient                     |
| React Admin UI         | ✅ Complete | FMS.WebClient/ClientApp           |
| Documentation          | ✅ Complete | Documentation/Features/VehicleTracking |

## Key Technologies

- **.NET 8.0** - Target framework
- **Entity Framework Core 8.0** - ORM
- **MySQL 8.0+** - Database
- **React 18** - Frontend UI
- **DevExtreme** - UI components
- **Tailwind CSS** - Styling

## Design Patterns

- **Plugin Pattern** - Extensible provider system
- **Factory Pattern** - Dynamic provider instantiation
- **Registry Pattern** - Provider discovery
- **Adapter Pattern** - Backward compatibility
- **Repository Pattern** - Data access
- **Clean Architecture** - Layer separation

## Implemented Providers

### GPSGate Provider
- ✅ Real-time location tracking
- ✅ Historical track data
- ✅ Odometer/mileage tracking
- ✅ Health monitoring
- ✅ Token-based authentication
- ✅ Full GPSGate API v.1 integration

### Future Providers
- 🔄 Geotab (Planned)
- 🔄 Traccar (Planned)
- 🔄 Custom providers (Easy to add!)

## Getting Help

### Documentation

- **Quick Start**: See [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md)
- **Architecture**: See [ARCHITECTURE.md](./ARCHITECTURE.md)
- **Implementation**: See [IMPLEMENTATION.md](./IMPLEMENTATION.md)
- **Admin Guide**: See [USER_GUIDE.md](./USER_GUIDE.md)

### Common Issues

**Provider not discovered?**
- Check [Troubleshooting section in DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md#troubleshooting)

**Location not updating?**
- Check provider health: `GET /api/v1/providers/health`
- Verify vehicle mapping in database

**Performance issues?**
- Adjust cache durations
- Use batch operations for multiple vehicles

## Support & Maintenance

### Monitoring

- Dashboard: `/providermanagement/dashboard`
- API Health: `GET /api/v1/providers/health`
- Statistics: `GET /api/v1/providers/statistics`

### Database Maintenance

```sql
-- Clean old health history (older than 30 days)
DELETE FROM provider_health_history
WHERE checked_at < DATE_SUB(NOW(), INTERVAL 30 DAY);

-- View provider statistics
SELECT
    provider_name,
    COUNT(*) as checks,
    AVG(response_time_ms) as avg_response_time,
    SUM(CASE WHEN status = 'Healthy' THEN 1 ELSE 0 END) * 100.0 / COUNT(*) as uptime_pct
FROM provider_health_history
WHERE checked_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
GROUP BY provider_name;
```

## Contributing

### Adding a New Provider

1. Implement `IVehicleTrackingProvider`
2. Add `[Provider]` attribute
3. Register HttpClient if needed
4. Add database configuration
5. Test and deploy

See [Creating Custom Providers in DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md#creating-custom-providers) for detailed instructions.

### Code Quality

- Follow Clean Architecture principles
- Use dependency injection
- Write comprehensive tests
- Document public APIs
- Handle errors gracefully
- Log important events

## Version History

### Version 2.0.0 (Current)
- ✅ Complete plugin architecture
- ✅ Multi-provider support
- ✅ Automatic failover
- ✅ Admin UI
- ✅ Comprehensive documentation

### Version 1.0.0 (Legacy)
- Basic GPSGate integration
- Hardcoded configuration
- No failover support

## Archived Documentation

Historical implementation documentation has been moved to `archive/` folder:
- Phase-based implementation documents
- Legacy quick references
- Old testing checklists

These are kept for reference but superseded by the current consolidated documentation.

## License

Copyright © 2025 Hyoung-EA FMS. All rights reserved.

---

**Last Updated**: November 2025
**Version**: 2.0.0
**Status**: Production Ready ✅

---

## Quick Links

- 🚀 [Quick Start](./DEVELOPER_GUIDE.md#quick-start)
- 📐 [Architecture Overview](./ARCHITECTURE.md)
- 🔧 [Implementation Details](./IMPLEMENTATION.md)
- 📖 [API Reference](./API_REFERENCE.md)
- 👨‍💻 [Developer Guide](./DEVELOPER_GUIDE.md)
- 👥 [User Guide](./USER_GUIDE.md)
- ❓ [Troubleshooting](./DEVELOPER_GUIDE.md#troubleshooting)
