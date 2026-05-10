# GPSGate SOAP Service Reference Setup Guide

## Overview
The GPSGate integration requires two SOAP service references to be added to the FMS.Application project.

## Issue
Build error: `The type or namespace name 'DirectorySoapClient' could not be found`

This occurs because the SOAP service references haven't been generated yet.

## Solution

### Step 1: Add Directory Service Reference

1. Open **FMS.Application** project in Visual Studio
2. Right-click on the project ? **Add** ? **Connected Service** (or **Service Reference**)
3. Choose **WCF Web Service**
4. Enter WSDL URL: `http://10.0.10.150/GpsGateServer/Services/directory.asmx?WSDL`
5. Set namespace to: `DirectoryServiceReference1`
6. Click **OK** to generate the service reference

### Step 2: Add Reporting Service Reference

1. Right-click on **FMS.Application** project again
2. **Add** ? **Connected Service** (or **Service Reference**)
3. Choose **WCF Web Service**
4. Enter WSDL URL: `http://10.0.10.150/GpsGateServer/Services/reporting.asmx?WSDL`
5. Set namespace to: `ReportingServiceReference`
6. Click **OK** to generate the service reference

### Alternative: Using dotnet-svcutil

If you prefer command line:

```powershell
# Install dotnet-svcutil tool if not already installed
dotnet tool install --global dotnet-svcutil

# Navigate to FMS.Application directory
cd C:\Users\kkagiri\source\repos\Tenacity.Fms\FMS.Application

# Generate Directory Service reference
dotnet-svcutil http://10.0.10.150/GpsGateServer/Services/directory.asmx?WSDL `
    -n "*,DirectoryServiceReference1" `
    -o "Connected Services\DirectoryService\Reference.cs"

# Generate Reporting Service reference
dotnet-svcutil http://10.0.10.150/GpsGateServer/Services/reporting.asmx?WSDL `
    -n "*,ReportingServiceReference" `
    -o "Connected Services\ReportingService\Reference.cs"
```

### Step 3: Update FMS.Application.csproj

Ensure the generated service references are included in the project file. The file should have entries like:

```xml
<ItemGroup>
  <PackageReference Include="System.ServiceModel.Duplex" Version="4.10.*" />
  <PackageReference Include="System.ServiceModel.Http" Version="4.10.*" />
  <PackageReference Include="System.ServiceModel.NetTcp" Version="4.10.*" />
  <PackageReference Include="System.ServiceModel.Security" Version="4.10.*" />
</ItemGroup>
```

### Step 4: Configure Endpoints (if needed)

If auto-configuration doesn't work, add to `appsettings.json`:

```json
{
  "GPSGate": {
    "DirectoryServiceUrl": "http://10.0.10.150/GpsGateServer/Services/directory.asmx",
    "ReportingServiceUrl": "http://10.0.10.150/GpsGateServer/Services/reporting.asmx",
    "Username": "kkagiri",
    "Password": "Niwewe1000",
    "ApplicationId": "1"
  }
}
```

### Step 5: Verify Configuration

After adding the service references:

1. Check that `DirectorySoapClient` class exists in `DirectoryServiceReference1` namespace
2. Check that `ReportingSoapClient` class exists in `ReportingServiceReference` namespace
3. Build the solution: `dotnet build`

## Expected Files

After successful generation, you should see:

```
FMS.Application/
+-- Connected Services/ (or Service References/)
¦   +-- DirectoryService/
¦   ¦   +-- Reference.cs
¦   ¦   +-- ...
¦   +-- ReportingService/
¦       +-- Reference.cs
¦       +-- ...
```

## Troubleshooting

### Issue: Cannot connect to service
- Verify the GPSGate server is accessible: `http://10.0.10.150/GpsGateServer/`
- Try accessing the WSDL in a browser
- Check firewall settings

### Issue: Authentication required
The GPSGate services may require authentication. The code handles this with:
- Username: `kkagiri`
- Password: `Niwewe1000`
- These are configured in the database `provider_configurations` table

### Issue: Wrong endpoint configuration
The services use Soap12 binding:
```csharp
new DirectorySoapClient(DirectorySoapClient.EndpointConfiguration.DirectorySoap12);
```

Make sure the generated configuration includes Soap12 endpoints.

## Next Steps

After adding the service references:

1. **Build the project**: `dotnet build FMS.WebClient/FMS.WebClient.csproj`
2. **Configure authentication**: Add GPSGate configuration to database
3. **Test the endpoints**: Use the test script in `test-report-processing.ps1`

## Database Configuration

Insert GPSGate configuration into `provider_configurations` table:

```sql
INSERT INTO provider_configurations
(Name, ProviderType, Settings, IsEnabled, CreatedAt, UpdatedAt)
VALUES
(
    'GPSGate',
    'GPSGate',
    JSON_OBJECT(
        'BaseUrl', 'http://10.0.10.150/GpsGateServer',
        'Username', 'kkagiri',
        'Password', 'Niwewe1000',
        'ApplicationId', '1'
    ),
    1,
    NOW(),
    NOW()
);
```

## Quick Fix Summary

**Immediate action needed:**
1. Add two SOAP service references to FMS.Application project
2. Rebuild the solution
3. Fix completed - Report 212 processor now correctly maps 7 columns (no Address field)

The code is ready, it just needs the SOAP service client proxies to be generated.
