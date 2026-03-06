# GPSGate Provider Authentication Update

## Overview

The GPSGate provider has been updated from static API key authentication to dynamic username/password-based token authentication. This provides better security and aligns with GPSGate API best practices.

## Changes Summary

### Before (API Key Method)
```json
{
  "ApiKey": "static_key_12345",
  "BaseUrl": "http://10.0.10.150/comGpsGate/api/v.1",
  "ApplicationId": "12"
}
```

**Problems:**
- Static API key stored in database
- No automatic token refresh
- Security risk if database is compromised
- Manual key rotation required

### After (Username/Password Method)
```json
{
  "Username": "kkagiri",
  "Password": "Niwewe1000",
  "BaseUrl": "http://10.0.10.150/comGpsGate/api/v.1",
  "ApplicationId": "12"
}
```

**Benefits:**
- ✅ Dynamic token generation
- ✅ Automatic token refresh (expires in 24h)
- ✅ Password can be encrypted
- ✅ Token stored in memory only (not database)
- ✅ 5-minute expiry buffer for automatic refresh

## Authentication Flow

```mermaid
sequenceDiagram
    participant FMS as FMS Application
    participant GPSGate as GPSGate API
    participant DB as Database

    Note over FMS: Provider Initialization
    FMS->>DB: Get provider configuration
    DB-->>FMS: Username, Password, BaseUrl, AppId

    Note over FMS: Token Authentication
    FMS->>GPSGate: POST /applications/{appId}/tokens<br/>{ username, password }
    GPSGate-->>FMS: { Token, ExpiresAt }

    Note over FMS: Store token in memory<br/>(NOT in database)

    Note over FMS: Use Token for API Calls
    FMS->>GPSGate: GET /applications/{appId}/users<br/>Authorization: {Token}
    GPSGate-->>FMS: Device data

    Note over FMS: Auto-refresh before expiry<br/>(5 minute buffer)
    FMS->>GPSGate: POST /applications/{appId}/tokens<br/>{ username, password }
    GPSGate-->>FMS: New { Token, ExpiresAt }
```

## Technical Implementation

### 1. Configuration Model Changes

**ProviderMetadata.ConfigurationRequirements:**
```csharp
new List<ConfigurationRequirement>
{
    new ConfigurationRequirement {
        Key = "Username",
        DisplayName = "Username",
        IsRequired = true,
        IsSecure = false
    },
    new ConfigurationRequirement {
        Key = "Password",
        DisplayName = "Password",
        IsRequired = true,
        IsSecure = true  // Marked as secure for UI masking
    },
    new ConfigurationRequirement {
        Key = "BaseUrl",
        DisplayName = "Base URL",
        IsRequired = true
    },
    new ConfigurationRequirement {
        Key = "ApplicationId",
        DisplayName = "Application ID",
        IsRequired = true,
        DataType = "int"
    }
}
```

### 2. Provider Class Changes

**GPSGateProvider.cs - New Fields:**
```csharp
private string? _username;
private string? _password;
private string? _apiToken;          // Token obtained from API
private string? _baseUrl;
private int _applicationId;
private bool _initialized = false;
private DateTime _tokenExpiresAt = DateTime.MinValue;
```

**InitializeAsync Method:**
```csharp
public async Task<FMSResponse<bool>> InitializeAsync(ProviderConfiguration configuration)
{
    // Extract username and password
    _username = configuration.GetValue<string>("Username");
    _password = configuration.GetValue<string>("Password");
    _baseUrl = configuration.GetValue<string>("BaseUrl");
    _applicationId = int.Parse(configuration.GetValue<string>("ApplicationId"));

    // Authenticate and get token
    var authResult = await AuthenticateAsync();
    if (!authResult.IsSuccess)
        return FMSResponse<bool>.Failed($"Authentication failed: {authResult.Message}");

    // Test connection with token
    var testResponse = await ValidateConnectionAsync();

    _initialized = true;
    return FMSResponse<bool>.Success(true, "Provider initialized");
}
```

**AuthenticateAsync Method:**
```csharp
private async Task<FMSResponse<bool>> AuthenticateAsync()
{
    var tokenUrl = $"{_baseUrl}/applications/{_applicationId}/tokens";

    var authPayload = new
    {
        username = _username,
        password = _password
    };

    var jsonContent = JsonSerializer.Serialize(authPayload);
    var httpContent = new StringContent(jsonContent, Encoding.UTF8, "application/json");

    var response = await _httpClient.PostAsync(tokenUrl, httpContent);

    if (!response.IsSuccessStatusCode)
        return FMSResponse<bool>.Failed($"Authentication failed: {response.StatusCode}");

    var responseContent = await response.Content.ReadAsStringAsync();
    var tokenResponse = JsonSerializer.Deserialize<GPSGateTokenResponse>(responseContent);

    _apiToken = tokenResponse.Token;
    _tokenExpiresAt = tokenResponse.ExpiresAt ?? DateTime.UtcNow.AddHours(24);

    // Set token in HTTP client header
    _httpClient.DefaultRequestHeaders.Clear();
    _httpClient.DefaultRequestHeaders.Add("Authorization", _apiToken);

    return FMSResponse<bool>.Success(true, "Authentication successful");
}
```

**EnsureTokenValidAsync Method:**
```csharp
private async Task<bool> EnsureTokenValidAsync()
{
    // Check if token expired or about to expire (5 min buffer)
    if (string.IsNullOrEmpty(_apiToken) ||
        DateTime.UtcNow.AddMinutes(5) >= _tokenExpiresAt)
    {
        _logger.LogInformation("Token expired, re-authenticating");
        var authResult = await AuthenticateAsync();
        return authResult.IsSuccess;
    }
    return true;
}
```

### 3. New Response Model

**GPSGateTokenResponse.cs:**
```csharp
public class GPSGateTokenResponse
{
    public string? Token { get; set; }
    public DateTime? ExpiresAt { get; set; }
}
```

## GPSGate API Endpoints

### Token Generation Endpoint

**Request:**
```http
POST http://10.0.10.150/comGpsGate/api/v.1/applications/12/tokens
Content-Type: application/json

{
  "username": "kkagiri",
  "password": "Niwewe1000"
}
```

**Response:**
```json
{
  "Token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c",
  "ExpiresAt": "2025-10-29T10:14:24Z"
}
```

**Using the Token:**
```http
GET http://10.0.10.150/comGpsGate/api/v.1/applications/12/users
Authorization: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Database Configuration Update

### SQL Script

Run the following script to update existing GPSGate configuration:

```sql
-- Update with your actual credentials
UPDATE provider_configurations
SET
    settings = JSON_OBJECT(
        'Username', 'kkagiri',
        'Password', 'Niwewe1000',
        'BaseUrl', 'http://10.0.10.150/comGpsGate/api/v.1',
        'ApplicationId', '12'
    ),
    updated_at = UTC_TIMESTAMP(),
    updated_by = 'admin',
    version = '2.0.0'
WHERE name = 'GPSGate';
```

**Verify:**
```sql
SELECT name, settings, version, is_enabled
FROM provider_configurations
WHERE name = 'GPSGate';
```

## Security Considerations

### 1. Password Storage

**Current (Development):**
- Password stored as plain text in database
- ⚠️ **NOT recommended for production**

**Recommended (Production):**
```sql
-- Encrypt password using MySQL AES
UPDATE provider_configurations
SET settings = JSON_SET(
    settings,
    '$.Password', AES_ENCRYPT('Niwewe1000', 'your-encryption-key')
)
WHERE name = 'GPSGate';
```

**Application-level encryption:**
```csharp
// Decrypt password when reading from config
var encryptedPassword = configuration.GetValue<string>("Password");
_password = DecryptPassword(encryptedPassword);
```

### 2. Environment Variables (Recommended)

Instead of storing credentials in database:

**appsettings.json:**
```json
{
  "GPSGate": {
    "Username": "${GPSGATE_USERNAME}",
    "Password": "${GPSGATE_PASSWORD}",
    "BaseUrl": "${GPSGATE_BASE_URL}",
    "ApplicationId": "${GPSGATE_APP_ID}"
  }
}
```

**Environment:**
```bash
GPSGATE_USERNAME=kkagiri
GPSGATE_PASSWORD=Niwewe1000
GPSGATE_BASE_URL=http://10.0.10.150/comGpsGate/api/v.1
GPSGATE_APP_ID=12
```

### 3. Azure Key Vault (Production Best Practice)

```csharp
// Retrieve from Azure Key Vault
var client = new SecretClient(vaultUri, credential);
_username = (await client.GetSecretAsync("GPSGate-Username")).Value.Value;
_password = (await client.GetSecretAsync("GPSGate-Password")).Value.Value;
```

### 4. Token Security

✅ **Good Practices:**
- Token stored in memory only (never database)
- Token auto-refreshes before expiry
- HTTPS should be used for API calls in production
- Token has limited lifetime (24 hours)

❌ **Avoid:**
- Storing token in database
- Logging token in plain text
- Sharing token across systems
- Using expired tokens

## Migration Guide

### Step 1: Update Code
✅ Already done - GPSGateProvider.cs updated

### Step 2: Update Database Configuration
```sql
-- Run the update script
UPDATE provider_configurations
SET settings = JSON_OBJECT(
    'Username', 'your_username',
    'Password', 'your_password',
    'BaseUrl', 'http://your-server/api/v.1',
    'ApplicationId', 'your_app_id'
),
version = '2.0.0'
WHERE name = 'GPSGate';
```

### Step 3: Test Diagnostic Endpoint
```http
GET http://localhost:7009/api/v1/providers/GPSGate/diagnose
```

**Expected Response:**
```json
{
  "success": true,
  "diagnostics": {
    "providerName": "GPSGate",
    "timestamp": "2025-10-28T10:14:24Z",
    "tests": [
      {
        "test": "1. Configuration Exists",
        "status": "✓ PASS",
        "details": "Found config ID: 1, Enabled: True"
      },
      {
        "test": "2. Configuration Parsing",
        "status": "✓ PASS",
        "details": "Username: 7 chars, Password: 10 chars, BaseUrl: ..., AppId: 12"
      },
      {
        "test": "3. Provider Instance",
        "status": "✓ PASS",
        "details": "GPSGate v2.0.0"
      },
      {
        "test": "4. Initialize Provider",
        "status": "✓ PASS",
        "details": "GPSGate provider initialized successfully"
      },
      {
        "test": "5. Connection Validation",
        "status": "✓ PASS",
        "details": "Successfully connected to GPSGate"
      },
      {
        "test": "6. Fetch Devices",
        "status": "✓ PASS",
        "details": "Found 150 devices"
      }
    ],
    "summary": {
      "total": 6,
      "passed": 6,
      "failed": 0,
      "errors": 0,
      "status": "✓ SUCCESS"
    }
  }
}
```

### Step 4: Restart Application
```bash
# Restart FMS.WebClient API
# Provider will initialize with new authentication flow
```

### Step 5: Verify Device Fetching
```http
GET http://localhost:7009/api/v1/providers/devices?providerName=GPSGate
```

## Testing

### Manual Test: cURL

**1. Get Token:**
```bash
curl -X POST "http://10.0.10.150/comGpsGate/api/v.1/applications/12/tokens" \
  -H "Content-Type: application/json" \
  -d '{"username":"kkagiri","password":"Niwewe1000"}'
```

**2. Use Token:**
```bash
TOKEN="<token_from_step_1>"
curl -X GET "http://10.0.10.150/comGpsGate/api/v.1/applications/12/users" \
  -H "Authorization: $TOKEN"
```

### Automated Test: Diagnostic Endpoint

Use the new diagnostic endpoint to test all 6 stages:

```bash
curl http://localhost:7009/api/v1/providers/GPSGate/diagnose
```

## Troubleshooting

### Issue: "Authentication failed: 401"

**Causes:**
- Incorrect username or password
- User doesn't have access to application
- Application ID is wrong

**Solution:**
1. Verify credentials in GPSGate admin panel
2. Check user has access to application ID
3. Confirm application ID is correct

### Issue: "Configuration parsing error"

**Causes:**
- Invalid JSON in settings column
- Missing required fields

**Solution:**
```sql
-- Check current settings
SELECT name, settings FROM provider_configurations WHERE name = 'GPSGate';

-- Fix JSON structure
UPDATE provider_configurations
SET settings = JSON_OBJECT(
    'Username', 'your_username',
    'Password', 'your_password',
    'BaseUrl', 'your_base_url',
    'ApplicationId', 'your_app_id'
)
WHERE name = 'GPSGate';
```

### Issue: "Token expired" frequent refreshes

**Causes:**
- GPSGate returning short token expiry
- System clock drift

**Solution:**
1. Check GPSGate server time
2. Verify system clock synchronization (NTP)
3. Check token ExpiresAt value in logs

## Related Files

- **Implementation**: `FMS.Infrastructure/VehicleTracking/Providers/GPSGateProvider.cs`
- **Models**: `FMS.Infrastructure/VehicleTracking/Models/ProviderConfiguration.cs`
- **Database**: `FMS.Domain/Entities/VehicleTracking/ProviderConfigurationEntity.cs`
- **SQL Script**: `Documentation/Features/VehicleTrackingIntergration/database/update_gpsgate_auth_config.sql`
- **API Controller**: `FMS.WebClient/Controllers/VehicleManagement/ProviderManagementController.cs`

## Changelog

**Version 2.0.0** (2025-10-28)
- ✅ Changed from API key to username/password authentication
- ✅ Added dynamic token generation and refresh
- ✅ Token stored in memory only (security improvement)
- ✅ Added 5-minute expiry buffer for automatic refresh
- ✅ Updated configuration requirements
- ✅ Added GPSGateTokenResponse model
- ✅ Added AuthenticateAsync() method
- ✅ Added EnsureTokenValidAsync() method
- ✅ Updated ValidateConfigurationAsync() method
- ✅ Created diagnostic endpoint for testing

**Version 1.0.0**
- Static API key authentication
- Manual token management
