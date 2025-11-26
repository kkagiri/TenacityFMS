# Simple Implementation Checklist

Quick reference for implementing GPS fetch with SignalR progress updates using **existing infrastructure**.

---

## 🎯 Overview

We're adding GPS fetch functionality that:
- **Reuses** existing FrontEndHub SignalR hub
- **Reuses** existing businessSignalRService.js frontend client
- **Reuses** existing GPSGate commands via IMediator
- **Adds** 3 new methods to FrontEndHub for GPS fetch events
- **Adds** 1 orchestrator command to coordinate the workflow

---

## ✅ Backend Implementation

### 1. Add GPS Fetch Methods to FrontEndHub

**File**: `FMS.Application/Communication/SignalR/FrontEndHub.cs`

**Add these 3 methods:**
```csharp
public async Task BroadcastGpsFetchProgress(string jobId, string status, int progressPercent, string message)
{
    await Clients.All.SendAsync("GpsFetchProgress", new
    {
        jobId,
        status,
        progressPercent,
        message,
        timestamp = DateTime.UtcNow
    });
}

public async Task BroadcastGpsFetchCompleted(string jobId, object result)
{
    await Clients.All.SendAsync("GpsFetchCompleted", new
    {
        jobId,
        result,
        timestamp = DateTime.UtcNow
    });
}

public async Task BroadcastGpsFetchError(string jobId, string error)
{
    await Clients.All.SendAsync("GpsFetchError", new
    {
        jobId,
        error,
        timestamp = DateTime.UtcNow
    });
}
```

---

### 2. Create GPS Fetch Progress Service

**File**: `FMS.Application/Communication/SignalR/IGpsFetchProgressService.cs`

```csharp
namespace FMS.Application.Communication.SignalR
{
    public interface IGpsFetchProgressService
    {
        Task SendProgress(string jobId, string status, int progressPercent, string message);
        Task SendCompleted(string jobId, object result);
        Task SendError(string jobId, string error);
    }
}
```

**File**: `FMS.Application/Communication/SignalR/GpsFetchProgressService.cs`

```csharp
using Microsoft.AspNetCore.SignalR;

namespace FMS.Application.Communication.SignalR
{
    public class GpsFetchProgressService : IGpsFetchProgressService
    {
        private readonly IHubContext<FrontEndHub> _hubContext;

        public GpsFetchProgressService(IHubContext<FrontEndHub> hubContext)
        {
            _hubContext = hubContext;
        }

        public async Task SendProgress(string jobId, string status, int progressPercent, string message)
        {
            await _hubContext.Clients.All.SendAsync("GpsFetchProgress", new
            {
                jobId,
                status,
                progressPercent,
                message,
                timestamp = DateTime.UtcNow
            });
        }

        public async Task SendCompleted(string jobId, object result)
        {
            await _hubContext.Clients.All.SendAsync("GpsFetchCompleted", new
            {
                jobId,
                result,
                timestamp = DateTime.UtcNow
            });
        }

        public async Task SendError(string jobId, string error)
        {
            await _hubContext.Clients.All.SendAsync("GpsFetchError", new
            {
                jobId,
                error,
                timestamp = DateTime.UtcNow
            });
        }
    }
}
```

**Register service in DI container** (`FMS.Application/DependencyInjection.cs`):
```csharp
services.AddScoped<IGpsFetchProgressService, GpsFetchProgressService>();
```

---

### 3. Create Orchestrator Command

**File**: `FMS.Application/Features/FuelComparison/Commands/FetchAndStoreGpsDataCommand.cs`

```csharp
using MediatR;
using FMS.Application.Common;

namespace FMS.Application.Features.FuelComparison.Commands
{
    public record FetchAndStoreGpsDataCommand(
        DateTime StartDate,
        DateTime EndDate,
        string JobId
    ) : IRequest<FMSResponse<GpsFetchResultDto>>;

    public class GpsFetchResultDto
    {
        public int TotalRecordsFetched { get; set; }
        public int NewRecordsSaved { get; set; }
        public int RecordsUpdated { get; set; }
        public int DuplicatesSkipped { get; set; }
        public DateTime FetchStartTime { get; set; }
        public DateTime FetchEndTime { get; set; }
    }
}
```

**File**: `FMS.Application/Features/FuelComparison/Commands/FetchAndStoreGpsDataCommandHandler.cs`

See full code in [FRONTEND_BACKEND_SIGNALR_IMPLEMENTATION.md](./FRONTEND_BACKEND_SIGNALR_IMPLEMENTATION.md#step-3-create-orchestrator-command)

**Key workflow:**
1. Login → `_mediator.Send(new LoginCommand(...))`
2. Generate Report → `_mediator.Send(new GenerateReportCommand(...))`
3. Poll Status → `_mediator.Send(new GetReportStatusQuery(...))`
4. Process Report → `_mediator.Send(new ProcessReportQuery<RefuelingReportDto>(...))`
5. Transform & Save → Create `GpsReportEntry` entities
6. Send progress at each step via `_progressService.SendProgress(...)`

---

### 4. Update Controller

**File**: `FMS.WebClient/Controllers/FuelComparisonController.cs`

**Replace FetchGpsData endpoint:**
```csharp
[HttpPost("fetch-gps-data")]
public IActionResult FetchGpsData([FromBody] FetchGpsDataRequest request)
{
    try
    {
        // Generate unique job ID
        var jobId = Guid.NewGuid().ToString();

        // Fire-and-forget: Start the long-running operation in background
        _ = Task.Run(async () =>
        {
            try
            {
                var command = new FetchAndStoreGpsDataCommand(
                    request.StartDate,
                    request.EndDate,
                    jobId
                );

                await _mediator.Send(command);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Background GPS fetch job {JobId} failed", jobId);
            }
        });

        // Return immediately with job ID
        return Ok(FMSResponse<object>.Success(
            new { jobId },
            "GPS data fetch started. You will receive progress updates via SignalR."
        ));
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Failed to start GPS data fetch");
        return BadRequest(FMSResponse<object>.Failed("Failed to start GPS data fetch"));
    }
}

public class FetchGpsDataRequest
{
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
}
```

---

### 5. Configuration

**Database**: `provider_configurations` table (NOT appsettings.json)

The GPS fetch uses credentials from the database:

```sql
-- Ensure you have a record like this in provider_configurations table:
SELECT * FROM provider_configurations WHERE Name = 'GPSGateSOAP';

-- Example Settings JSON:
{
  "BaseUrl": "https://your-gpsgate-server.com",
  "Username": "your_username",
  "Password": "your_password",
  "ApplicationId": "12"
}
```

**Important**: The handler calls `IGPSGateDirectoryService.AuthenticateAsync()` which automatically reads credentials from `provider_configurations` table where `Name='GPSGateSOAP'` and `IsEnabled=true`.

---

## ✅ Frontend Implementation

### 1. Update Dashboard Component

**File**: `fms.frontend/src/pages/tankStock/fueldatacomparison/dashboard/FuelDataComparisonDashboard.js`

**Add import:**
```javascript
import businessSignalRService from '../../../../signalR/businessSignalRService';
```

**Add state:**
```javascript
const [gpsFetchJob, setGpsFetchJob] = useState(null);
const [gpsFetchProgress, setGpsFetchProgress] = useState({
  status: '',
  progressPercent: 0,
  message: ''
});
```

**Add useEffect for SignalR subscriptions:**
```javascript
useEffect(() => {
  // Ensure SignalR is connected
  if (!businessSignalRService.isConnected) {
    businessSignalRService.start().catch(err => {
      console.error('Failed to connect to SignalR:', err);
    });
  }

  // Subscribe to GPS fetch events
  const cleanupProgress = businessSignalRService.on('GpsFetchProgress', (data) => {
    if (gpsFetchJob && data.jobId === gpsFetchJob) {
      setGpsFetchProgress({
        status: data.status,
        progressPercent: data.progressPercent,
        message: data.message
      });
    }
  });

  const cleanupCompleted = businessSignalRService.on('GpsFetchCompleted', (data) => {
    if (gpsFetchJob && data.jobId === gpsFetchJob) {
      setIsFetchingGps(false);
      setGpsFetchJob(null);

      const result = data.result;
      notify(
        `GPS fetch completed! Fetched: ${result.totalRecordsFetched}, ` +
        `Saved: ${result.newRecordsSaved}, Updated: ${result.recordsUpdated || 0}, ` +
        `Skipped: ${result.duplicatesSkipped}`,
        'success',
        5000
      );

      loadVarianceReport();
    }
  });

  const cleanupError = businessSignalRService.on('GpsFetchError', (data) => {
    if (gpsFetchJob && data.jobId === gpsFetchJob) {
      setIsFetchingGps(false);
      setGpsFetchJob(null);
      notify(`GPS fetch failed: ${data.error}`, 'error', 5000);
    }
  });

  return () => {
    cleanupProgress();
    cleanupCompleted();
    cleanupError();
  };
}, [gpsFetchJob, loadVarianceReport]);
```

**Update handleFetchGpsData:**
```javascript
const handleFetchGpsData = async (startDate, endDate) => {
  try {
    setIsFetchingGps(true);
    setGpsFetchProgress({ status: 'Starting...', progressPercent: 0, message: '' });

    const response = await axiosInstance.post('/api/v1/FuelComparison/fetch-gps-data', {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    });

    if (response.data.isSuccess) {
      const jobId = response.data.data.jobId;
      setGpsFetchJob(jobId);
      notify('GPS data fetch started. You will be notified when complete.', 'info', 3000);
    } else {
      setIsFetchingGps(false);
      notify(`Failed to start GPS fetch: ${response.data.message}`, 'error', 5000);
    }
  } catch (error) {
    console.error('Error starting GPS fetch:', error);
    setIsFetchingGps(false);
    notify('Error starting GPS data fetch', 'error', 5000);
  }
};
```

**Update LoadPanel with progress bar:**
```jsx
<LoadPanel
  visible={isFetchingGps}
  message={gpsFetchProgress.message || 'Fetching GPS data...'}
  showPane={true}
  shading={true}
  shadingColor="rgba(0,0,0,0.4)"
>
  {gpsFetchProgress.progressPercent > 0 && (
    <div className="tw-mt-4">
      <div className="tw-text-sm tw-text-gray-600 tw-mb-2">
        {gpsFetchProgress.status} - {gpsFetchProgress.progressPercent}%
      </div>
      <div className="tw-w-64 tw-bg-gray-200 tw-rounded-full tw-h-2">
        <div
          className="tw-bg-blue-600 tw-h-2 tw-rounded-full tw-transition-all tw-duration-300"
          style={{ width: `${gpsFetchProgress.progressPercent}%` }}
        />
      </div>
    </div>
  )}
</LoadPanel>
```

---

## 🧪 Testing Checklist

### Backend Testing
- [ ] Login to GPSGate works (`POST /api/v1/GPSGate/login`)
- [ ] Report generation works (`POST /api/v1/GPSGate/generate-report`)
- [ ] Report status polling works (`GET /api/v1/GPSGate/report-status`)
- [ ] Report processing works (`GET /api/v1/GPSGate/process-report`)
- [ ] FrontEndHub broadcasts progress events
- [ ] Records saved to `gpsgate_report_entries` table
- [ ] Duplicate detection works (same handleId + vehicleId + date)

### Frontend Testing
- [ ] businessSignalRService connects to FrontEndHub
- [ ] Subscribes to GpsFetchProgress event
- [ ] Subscribes to GpsFetchCompleted event
- [ ] Subscribes to GpsFetchError event
- [ ] LoadPanel shows progress bar
- [ ] Progress updates in real-time (10%, 20%, 30%... 100%)
- [ ] Success notification on completion
- [ ] Error notification on failure
- [ ] Report reloads after successful fetch

### Error Handling
- [ ] GPSGate login failure handled
- [ ] Report generation timeout handled
- [ ] Invalid date range handled
- [ ] Network errors handled
- [ ] SignalR disconnection handled

---

## 🚀 Quick Implementation Summary

| Component | Action | File |
|-----------|--------|------|
| **FrontEndHub** | Add 3 methods | `FMS.Application/Communication/SignalR/FrontEndHub.cs` |
| **Progress Service** | Create interface + implementation | `IGpsFetchProgressService.cs` + `GpsFetchProgressService.cs` |
| **Orchestrator Command** | Create command + handler | `FetchAndStoreGpsDataCommand.cs` + Handler |
| **Controller** | Update FetchGpsData endpoint | `FMS.WebClient/Controllers/FuelComparisonController.cs` |
| **DI Registration** | Register IGpsFetchProgressService | `FMS.Application/DependencyInjection.cs` |
| **Frontend Dashboard** | Add SignalR subscriptions + progress UI | `FuelDataComparisonDashboard.js` |
| **Configuration** | Add GPSGate credentials | `FMS.WebClient/appsettings.json` |

**Total New Files**: 4 (IGpsFetchProgressService, GpsFetchProgressService, Command, Handler)
**Modified Files**: 3 (FrontEndHub, Controller, Dashboard)

---

## 📖 Full Documentation

For detailed explanations and complete code:
- [FRONTEND_BACKEND_SIGNALR_IMPLEMENTATION.md](./FRONTEND_BACKEND_SIGNALR_IMPLEMENTATION.md) - Complete implementation guide
- [ARCHITECTURAL_ISSUE_AND_SOLUTION.md](./ARCHITECTURAL_ISSUE_AND_SOLUTION.md) - Problem analysis
- [DECISION_SUMMARY.md](./DECISION_SUMMARY.md) - Why this approach
- [README.md](./README.md) - Overview and navigation

---

✅ **This implementation reuses existing infrastructure and adds minimal new code!**
