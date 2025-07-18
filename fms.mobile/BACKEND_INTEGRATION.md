# FMS Mobile - Backend Integration Guide

This guide explains how to connect the FMS Mobile app to your existing FMS backend.

## Backend API Endpoints

The mobile app expects the following API endpoints to be available:

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh` - Refresh token

### Device Management
- `GET /api/device/list` - Get all PTS devices
- `GET /api/device/{id}/status` - Get device status
- `GET /api/device/{id}/pumps` - Get pumps for device

### Transaction Management
- `GET /api/transaction/history` - Get transaction history with filters
- `GET /api/transaction/{id}` - Get transaction details
- `GET /api/transaction/summary` - Get transaction summary

### Pump Operations
- `POST /api/pump/authorize` - Authorize pump transaction
- `POST /api/pump/stop` - Stop pump
- `POST /api/pump/complete` - Complete transaction

### Vehicle & Tag Management
- `GET /api/vehicle/list` - Get vehicle list
- `POST /api/tag/validate` - Validate RFID tag

### Site Management
- `GET /api/site/list` - Get site information

## Environment Configuration

### 1. Create .env file

Create a `.env` file in the mobile project root:

```env
# For Android Emulator (default)
API_BASE_URL=http://10.0.2.2:5000/api
SIGNALR_HUB_URL=http://10.0.2.2:5000/fuelingHub

# For iOS Simulator
# API_BASE_URL=http://localhost:5000/api
# SIGNALR_HUB_URL=http://localhost:5000/fuelingHub

# For Physical Device (replace with your computer's IP)
# API_BASE_URL=http://192.168.1.100:5000/api
# SIGNALR_HUB_URL=http://192.168.1.100:fuelingHub

# App Configuration
DEBUG_MODE=true
DEFAULT_TIMEOUT=30000
```

### 2. Backend Configuration

Ensure your FMS backend is configured for mobile client access:

#### CORS Configuration (C#)
```csharp
// In Startup.cs or Program.cs
services.AddCors(options =>
{
    options.AddPolicy("MobilePolicy", builder =>
    {
        builder
            .AllowAnyOrigin()
            .AllowAnyMethod()
            .AllowAnyHeader();
    });
});

// Use the policy
app.UseCors("MobilePolicy");
```

#### Authentication Configuration
```csharp
// Ensure JWT tokens are properly configured
services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = Configuration["Jwt:Issuer"],
            ValidAudience = Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(Configuration["Jwt:Key"]))
        };
    });
```

## API Response Format

The mobile app expects responses in the following format using FMSResponse.cs:

### Success Response
```json
{
  "isSuccess": true,
  "data": {
    // Your data here
  },
  "message": "Operation completed successfully",
  "errors": null
}
```

### Error Response
```json
{
  "isSuccess": false,
  "data": null,
  "message": "Error message",
  "errors": [
    "Detailed error 1",
    "Detailed error 2"
  ]
}
```

### Transaction History Response
```json
{
  "isSuccess": true,
  "data": [
    {
      "id": "12345",
      "createdAt": "2024-01-15T10:30:00Z",
      "status": "completed",
      "pumpNumber": 1,
      "deviceName": "Station A",
      "deviceId": "device-1",
      "vehicleId": "V123",
      "vehiclePlate": "ABC-123",
      "tagId": "TAG-456",
      "volume": 45.67,
      "amount": 89.34,
      "fuelType": "Diesel"
    }
  ],
  "totalCount": 150,
  "currentPage": 1,
  "pageSize": 20,
  "hasMore": true
}
```

## Network Security Configuration

### Android Network Security Config

Create `android/app/src/main/res/xml/network_security_config.xml`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <domain-config cleartextTrafficPermitted="true">
        <domain includeSubdomains="true">10.0.2.2</domain>
        <domain includeSubdomains="true">localhost</domain>
        <domain includeSubdomains="true">your-backend-domain.com</domain>
    </domain-config>
</network-security-config>
```

### Update AndroidManifest.xml

Add to `android/app/src/main/AndroidManifest.xml`:

```xml
<application
    android:networkSecurityConfig="@xml/network_security_config"
    android:usesCleartextTraffic="true"
    ... >
</application>
```

## Testing Backend Connection

### 1. Start Your Backend
Ensure your FMS backend is running on the expected port (usually 5000).

### 2. Test API Endpoints

From your development machine:
```bash
# Test health endpoint
curl http://localhost:5000/api/health

# Test login endpoint
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test"}'
```

From Android emulator:
```bash
# Use adb shell
adb shell
curl http://10.0.2.2:5000/api/health
```

### 3. Common Network Issues

#### Issue: Connection Refused
- Check if backend is running
- Verify port number
- Check firewall settings

#### Issue: Network timeout
- Increase timeout in ApiService.js
- Check network connectivity
- Verify IP addresses

#### Issue: CORS errors
- Ensure CORS is properly configured in backend
- Check allowed origins, methods, and headers

## SignalR Integration

The mobile app supports real-time updates via SignalR:

### Backend Hub Configuration
```csharp
// Configure SignalR
services.AddSignalR();

// Map hub
app.MapHub<FuelingHub>("/fuelingHub");
```

### Hub Events Expected by Mobile App
- `DeviceStatusUpdate` - Device status changes
- `TransactionUpdate` - Transaction progress updates
- `PumpStatusUpdate` - Pump status changes

## Database Integration

Ensure your backend can handle the following data operations:

### Transaction Queries
- Filtering by date range
- Filtering by pump/device
- Pagination support
- Sorting options

### Example Query Implementation
```csharp
public async Task<PaginatedResult<Transaction>> GetTransactionHistory(
    TransactionFilter filter)
{
    var query = _context.Transactions.AsQueryable();

    // Apply filters
    if (filter.StartDate.HasValue)
        query = query.Where(t => t.CreatedAt >= filter.StartDate);

    if (filter.EndDate.HasValue)
        query = query.Where(t => t.CreatedAt <= filter.EndDate);

    if (!string.IsNullOrEmpty(filter.PumpId))
        query = query.Where(t => t.PumpId == filter.PumpId);

    // Apply sorting
    query = filter.SortOrder == "desc"
        ? query.OrderByDescending(GetSortExpression(filter.SortBy))
        : query.OrderBy(GetSortExpression(filter.SortBy));

    // Apply pagination
    var totalCount = await query.CountAsync();
    var items = await query
        .Skip((filter.Page - 1) * filter.PageSize)
        .Take(filter.PageSize)
        .ToListAsync();

    return new PaginatedResult<Transaction>
    {
        Data = items,
        TotalCount = totalCount,
        CurrentPage = filter.Page,
        PageSize = filter.PageSize,
        HasMore = totalCount > filter.Page * filter.PageSize
    };
}
```

## Troubleshooting

### 1. Authentication Issues
- Verify JWT token format
- Check token expiration
- Ensure proper token storage in mobile app

### 2. Data Format Issues
- Ensure dates are in ISO format
- Check numeric precision for amounts/volumes
- Verify enum values match between backend and mobile

### 3. Performance Considerations
- Implement proper pagination
- Use appropriate indexes on transaction tables
- Consider caching for frequently accessed data

### 4. Error Handling
- Return consistent error formats
- Provide meaningful error messages
- Log errors for debugging

## Security Considerations

1. **HTTPS in Production**: Always use HTTPS for production deployments
2. **Token Security**: Implement proper token refresh mechanisms
3. **Data Validation**: Validate all input data on the backend
4. **Rate Limiting**: Implement rate limiting for API endpoints
5. **Audit Logging**: Log all mobile app transactions for audit purposes

For additional support, refer to your FMS backend documentation or contact the development team.