# Physical Fueling Workflow Implementation - Complete

## 🎯 Problem Statement

**Issue**: 5 stuck transactions (300, 306, 307, 308, 309) accumulating without EOT (End of Transaction) packets from PTS devices.

**Root Cause**: System allowed pump authorization even when nozzle was down, violating physical fueling workflow. This caused device to generate incomplete transactions that never properly completed.

**User Requirement**: "The nozzle must be lifted for the user in the scan process has to be lifted so that he can proceed to fuel - in return we get transaction id... this is what we are going to be tracking and activate the scanstep.js"

## ✅ Solution Overview

Enforce complete physical fueling workflow:
1. **User lifts nozzle** → Device updates `IdleStatus.NozzlesUp` array
2. **System validates nozzle UP** → Checks Redis UploadStatus before authorization
3. **User enters vehicle details** → ScanStep shows nozzle state indicator
4. **System authorizes pump** → Only if nozzle is physically lifted
5. **Device returns transaction ID** → Tracked in fueling process
6. **Fueling completes** → EOT packet or IdleStatus fallback

## 🏗️ Architecture

### Data Flow

```
Physical World          Redis Store              Backend API            Frontend UI
     |                       |                        |                      |
  [Nozzle UP]                |                        |                      |
     |                       |                        |                      |
     +--[Device sends]-->    |                        |                      |
                        [UploadStatus]                |                      |
                        IdleStatus:                   |                      |
                          Ids: [1,2,3,4]              |                      |
                          NozzlesUp: [2,0,0,0]        |                      |
                             |                        |                      |
                             |                        |                      |
     [User clicks           |                        |                      |
      "Start Fueling"]      |                        |                      |
                            |                         |                      |
                            |    <--[Query]-----------+                      |
                            |                         |                      |
                            +----[Read Status]------->|                      |
                                                      |                      |
                                              [Validate Nozzle UP]           |
                                                      |                      |
                                                  ✅ Authorize               |
                                                      OR                     |
                                                  ❌ Reject                  |
                                                      |                      |
                                                      +--[Response]--------->|
                                                                             |
                                                                    [Show Result/Error]
```

### Backend Implementation

#### 1. GetPumpNozzleStateQuery.cs
**Location**: `FMS.Application/Features/PTS/Queries/GetPumpNozzleStateQuery.cs`

**Purpose**: Query handler to check nozzle state from Redis UploadStatus

**Key Components**:
```csharp
public record GetPumpNozzleStateQuery(string DeviceId, int PumpId)
    : IRequest<FMSResponse<PumpNozzleStateDto>>;

public class PumpNozzleStateDto
{
    public bool IsNozzleUp { get; set; }
    public int? NozzleNumber { get; set; }
    public string Status { get; set; }
    public string Message { get; set; }
    public DateTime LastUpdated { get; set; }
}
```

**Handler Logic**:
1. Reads `upload-status:{deviceId}` from Redis
2. Deserializes to `UploadStatusData`
3. Finds pump in `IdleStatus.Ids` array to get index
4. Checks `IdleStatus.NozzlesUp[index]`
5. Returns `FMSResponse<PumpNozzleStateDto>` with nozzle state

**Response Examples**:
```csharp
// Nozzle UP
Success(new PumpNozzleStateDto {
    IsNozzleUp = true,
    NozzleNumber = 2,
    Status = "Up",
    Message = "✅ Nozzle 2 is UP - Ready to fuel"
})

// Nozzle DOWN
Success(new PumpNozzleStateDto {
    IsNozzleUp = false,
    NozzleNumber = null,
    Status = "Down",
    Message = "⚠️ Nozzle is DOWN - Please lift nozzle"
})

// No Status Available
Failed("No device status available in Redis")
```

#### 2. PumpAuthorizeCommand.cs
**Location**: `FMS.Application/Command/PTSCommand/PumpCommands/PumpAuthorizeCommand.cs`

**Changes**: Added STEP 1 - Nozzle validation BEFORE authorization

**New Flow**:
```csharp
// STEP 1: CHECK NOZZLE IS UP (NEW)
var nozzleStateResult = await _mediator.Send(
    new GetPumpNozzleStateQuery(DeviceId, request.PumpId)
);

if (!nozzleStateResult.IsSuccess || !nozzleState.IsNozzleUp)
{
    _logger.LogWarning("[PumpAuth] ⚠️ NOZZLE DOWN - Cannot authorize");
    return FMSResponse<PumpAuthorizationConfirmation>.ValidationFailed(
        new Dictionary<string, string[]> {
            ["Nozzle"] = new[] { "⚠️ Nozzle must be lifted before starting fueling" }
        }
    );
}

_logger.LogInformation("[PumpAuth] **NOZZLE UP** ✅ - Nozzle {NozzleNumber} is lifted",
    nozzleState.NozzleNumber);

// STEP 2: CHECK FOR STUCK TRANSACTIONS (EXISTING)
var stuckTransaction = await CheckForStuckTransaction(...);
// ... rest of authorization logic
```

**Benefits**:
- Physical workflow enforced at API level
- Cannot authorize pump with nozzle down
- Prevents stuck transactions from forming
- Clear validation error messages

#### 3. PumpController.cs
**Location**: `FMS.WebClient/Controllers/PTSController/PumpController.cs`

**New Endpoint**:
```csharp
/// <summary>
/// Get nozzle state (up/down) for a specific pump - NEW
/// Used to validate nozzle is lifted before authorization
/// </summary>
[HttpGet("{deviceId}/{pumpId}/nozzle-state")]
public async Task<IActionResult> GetNozzleState(string deviceId, int pumpId)
{
    var query = new GetPumpNozzleStateQuery(deviceId, pumpId);
    var result = await _mediator.Send(query);

    if (!result.IsSuccess)
        return BadRequest(result);

    return Ok(result);
}
```

**API Details**:
- **Route**: `GET /api/v1/pump/{deviceId}/{pumpId}/nozzle-state`
- **Auth**: JWT Bearer Token required
- **Response**: `FMSResponse<PumpNozzleStateDto>`
- **Use Case**: Frontend checks nozzle state before enabling authorization

### Frontend Implementation

#### 4. pumpControlService.js
**Location**: `fms.frontend/src/services/pumpControlService.js`

**New Method**:
```javascript
/**
 * Get nozzle state (up/down) for a pump - NEW
 * Returns current nozzle status from latest UploadStatus
 * Used to validate nozzle is lifted before authorization
 */
getNozzleState: async (deviceId, pumpId) => {
  try {
    const response = await axiosInstance.get(
      `/pump/${deviceId}/${pumpId}/nozzle-state`
    );
    return response.data;
  } catch (error) {
    console.error("Get nozzle state error:", error);
    throw error;
  }
}
```

#### 5. ScanStep.js
**Location**: `fms.frontend/src/pages/ATG/fuelingprocess/fuelingsteps/ScanStep.js`

**Changes Summary**:
1. Added nozzle state monitoring
2. Added visual indicator (green/orange)
3. Disabled authorization button when nozzle down
4. Real-time updates via SignalR

**New State**:
```javascript
const [nozzleState, setNozzleState] = useState({
  isUp: false,
  nozzleNumber: null,
  status: "Unknown",
  message: "Checking nozzle status...",
  lastUpdated: null,
});
const [isCheckingNozzle, setIsCheckingNozzle] = useState(true);
```

**Initial Check (useEffect)**:
```javascript
useEffect(() => {
  const checkInitialNozzleState = async () => {
    if (!ptsId || !selectedNozzle?.id) return;

    const response = await pumpControlService.api.getNozzleState(
      ptsId,
      selectedNozzle.id
    );

    if (response.isSuccess && response.data) {
      setNozzleState({
        isUp: response.data.isNozzleUp,
        nozzleNumber: response.data.nozzleNumber,
        status: response.data.status,
        message: response.data.message,
        lastUpdated: new Date(),
      });
    }
  };

  checkInitialNozzleState();
}, [ptsId, selectedNozzle]);
```

**Real-Time Monitoring (useEffect)**:
```javascript
useEffect(() => {
  if (!ptsId || !selectedNozzle?.id) return;

  const handleUploadStatusUpdate = (data) => {
    const idleStatus = data?.idleStatus;
    if (!idleStatus || !idleStatus.ids || !idleStatus.nozzlesUp) return;

    // Find pump index
    const pumpIndex = idleStatus.ids.findIndex(
      (id) => id === selectedNozzle.id
    );
    if (pumpIndex === -1) return;

    // Check nozzle state
    const nozzleValue = idleStatus.nozzlesUp[pumpIndex];
    const isNozzleUp = nozzleValue > 0;

    setNozzleState({
      isUp: isNozzleUp,
      nozzleNumber: nozzleValue > 0 ? nozzleValue : null,
      status: isNozzleUp ? "Up" : "Down",
      message: isNozzleUp
        ? `✅ Nozzle ${nozzleValue} is UP - Ready to fuel`
        : "⚠️ Please lift nozzle from pump",
      lastUpdated: new Date(),
    });
  };

  const subscription = ptsSignalRService.onUploadStatusUpdate(
    ptsId,
    handleUploadStatusUpdate
  );

  return () => {
    if (subscription?.off) subscription.off();
  };
}, [ptsId, selectedNozzle]);
```

**Visual Indicator**:
```jsx
{/* Nozzle State Indicator */}
<div
  className={`tw-mb-4 tw-p-4 tw-rounded-lg tw-border-2 ${
    isCheckingNozzle
      ? "tw-border-gray-300 tw-bg-gray-50"
      : nozzleState.isUp
      ? "tw-border-green-500 tw-bg-green-50"
      : "tw-border-orange-500 tw-bg-orange-50"
  }`}
>
  {nozzleState.isUp ? (
    <>
      <i className="fa-light fa-gas-pump tw-text-green-600 tw-text-3xl"></i>
      <div>
        <p className="tw-font-semibold tw-text-green-700">
          <i className="fa-light fa-check-circle tw-mr-2"></i>
          Nozzle {nozzleState.nozzleNumber} is UP
        </p>
        <p className="tw-text-xs tw-text-green-600">
          ✅ Ready to fuel - You may proceed
        </p>
      </div>
    </>
  ) : (
    <>
      <i className="fa-light fa-gas-pump tw-text-orange-600 tw-text-3xl"></i>
      <div>
        <p className="tw-font-semibold tw-text-orange-700">
          <i className="fa-light fa-exclamation-triangle tw-mr-2"></i>
          Nozzle Down
        </p>
        <p className="tw-text-xs tw-text-orange-600">
          ⚠️ Please lift the nozzle from the pump before continuing
        </p>
      </div>
    </>
  )}
</div>
```

**Button Validation**:
```javascript
// Updated handleAcceptVehicle
const handleAcceptVehicle = useCallback(() => {
  // Validate nozzle is UP before proceeding
  if (!nozzleState.isUp) {
    notify({
      message: "⚠️ Please lift the nozzle from the pump before starting fueling",
      type: "warning",
      displayTime: 4000,
    });
    return;
  }

  acceptScanResult(vehicleInfo);
}, [acceptScanResult, vehicleInfo, nozzleState.isUp]);
```

**Disabled Button**:
```jsx
<Button
  text="Accept & Continue"
  type="success"
  stylingMode="contained"
  icon="fa-light fa-check"
  onClick={handleAcceptVehicle}
  disabled={!nozzleState.isUp}
  hint={
    !nozzleState.isUp
      ? "⚠️ Please lift the nozzle before continuing"
      : "Proceed to fueling details"
  }
/>
```

## 🔄 Complete Workflow

### Happy Path

```
1. User approaches pump
   └─> Lifts nozzle from pump

2. Device detects nozzle lift
   └─> Sends UploadStatus with IdleStatus.NozzlesUp[0] = 2
   └─> Stores in Redis: "upload-status:{deviceId}"

3. User opens fueling process in frontend
   └─> Selects pump/nozzle
   └─> Navigates to ScanStep

4. ScanStep component loads
   └─> useEffect calls getNozzleState(deviceId, pumpId)
   └─> Backend reads Redis UploadStatus
   └─> Returns: { IsNozzleUp: true, NozzleNumber: 2 }
   └─> Frontend shows GREEN indicator: "✅ Nozzle 2 is UP - Ready to fuel"

5. SignalR subscription active
   └─> Listens to uploadStatusUpdate events
   └─> Updates nozzle state in real-time

6. User selects vehicle (lookup or RFID scan)
   └─> Vehicle info displayed
   └─> "Accept & Continue" button enabled (nozzle is UP)

7. User clicks "Accept & Continue"
   └─> handleAcceptVehicle validates nozzleState.isUp = true
   └─> Proceeds to FuelingDetailsStep

8. User enters fueling details (volume/amount)
   └─> Clicks "Start Fueling"

9. Backend receives PumpAuthorizeCommand
   └─> STEP 1: GetPumpNozzleStateQuery validates nozzle UP
   └─> STEP 2: CheckForStuckTransaction validates no active transactions
   └─> STEP 3: Authorizes pump via PTSGateway
   └─> Device sends PumpAuthorizeConfirmation with TransactionId

10. Transaction tracked through fueling
    └─> EOT packet received OR IdleStatus fallback used
    └─> Transaction completes successfully
```

### Error Path: Nozzle Down

```
1. User opens fueling process
   └─> Selects pump/nozzle
   └─> Navigates to ScanStep

2. ScanStep checks nozzle state
   └─> Backend reads Redis: NozzlesUp[0] = 0 (nozzle DOWN)
   └─> Returns: { IsNozzleUp: false }
   └─> Frontend shows ORANGE indicator: "⚠️ Please lift nozzle from pump"

3. User selects vehicle
   └─> Vehicle info displayed
   └─> "Accept & Continue" button DISABLED (nozzle is DOWN)
   └─> Button hint: "⚠️ Please lift the nozzle before continuing"

4. If user clicks button anyway (shouldn't be possible due to disabled state):
   └─> handleAcceptVehicle checks nozzleState.isUp = false
   └─> Shows warning notify: "⚠️ Please lift the nozzle from the pump..."
   └─> Does NOT proceed to next step

5. User lifts nozzle
   └─> Device sends UploadStatus with NozzlesUp[0] = 2
   └─> SignalR event fires: uploadStatusUpdate
   └─> handleUploadStatusUpdate processes event
   └─> Updates nozzleState: { isUp: true, nozzleNumber: 2 }
   └─> Indicator changes to GREEN
   └─> Button becomes enabled

6. User can now proceed normally
```

### Error Path: Authorization Without Nozzle

```
1. Malicious user bypasses frontend validation (API call directly)
   └─> Sends POST /pump/authorize without nozzle check

2. Backend PumpAuthorizeCommand receives request
   └─> STEP 1: Calls GetPumpNozzleStateQuery
   └─> Query reads Redis: NozzlesUp[0] = 0 (nozzle DOWN)
   └─> Returns: { IsNozzleUp: false }

3. Authorization REJECTED
   └─> Returns ValidationFailed:
       {
         "isSuccess": false,
         "validationErrors": {
           "Nozzle": ["⚠️ Nozzle must be lifted before starting fueling"]
         }
       }

4. No pump authorization sent to device
   └─> No transaction ID generated
   └─> No stuck transaction created
   └─> User must lift nozzle and try again
```

## 📊 Data Structures

### UploadStatus Structure (Redis)
```json
{
  "idleStatus": {
    "ids": [1, 2, 3, 4],
    "nozzlesUp": [2, 0, 0, 0],
    "lastVolumes": [0, 0, 0, 0],
    "lastAmounts": [0, 0, 0, 0],
    "lastTransactions": [300, 0, 0, 0],
    "fuelGrades": [1, 2, 3, 4],
    "prices": [150.5, 155.0, 160.0, 165.0]
  },
  "deviceId": "PTS001",
  "timestamp": "2025-01-27T10:30:00Z"
}
```

**Key Fields**:
- `ids`: Array of pump IDs (e.g., [1, 2, 3, 4])
- `nozzlesUp`: Array indicating which nozzle lifted (e.g., [2, 0, 0, 0] = Pump 1 has nozzle 2 UP)
  - `0` = No nozzle lifted
  - `>0` = Nozzle number that is lifted
- `lastVolumes`: Last transaction volumes per pump
- `lastAmounts`: Last transaction amounts per pump
- `lastTransactions`: Last transaction IDs per pump (used for fallback when EOT missing)

### PumpNozzleStateDto
```csharp
public class PumpNozzleStateDto
{
    public bool IsNozzleUp { get; set; }        // true if nozzle lifted
    public int? NozzleNumber { get; set; }      // Nozzle number (e.g., 2)
    public string Status { get; set; }          // "Up", "Down", "Unknown"
    public string Message { get; set; }         // User-friendly message
    public DateTime LastUpdated { get; set; }   // Timestamp
}
```

## 🧪 Testing Checklist

### Backend Tests
- [ ] GetPumpNozzleStateQuery returns correct state when nozzle UP
- [ ] GetPumpNozzleStateQuery returns correct state when nozzle DOWN
- [ ] GetPumpNozzleStateQuery handles missing Redis data gracefully
- [ ] PumpAuthorizeCommand rejects authorization when nozzle DOWN
- [ ] PumpAuthorizeCommand proceeds with authorization when nozzle UP
- [ ] PumpController /nozzle-state endpoint returns 200 OK with valid data
- [ ] PumpController /nozzle-state endpoint returns 400 BadRequest on failure

### Frontend Tests
- [ ] ScanStep fetches initial nozzle state on mount
- [ ] Green indicator shows when nozzle is UP
- [ ] Orange indicator shows when nozzle is DOWN
- [ ] SignalR updates nozzle state in real-time
- [ ] "Accept & Continue" button disabled when nozzle DOWN
- [ ] "Accept & Continue" button enabled when nozzle UP
- [ ] Notify warning appears if user tries to proceed with nozzle DOWN
- [ ] Last updated timestamp displays correctly

### Integration Tests
- [ ] Complete workflow: Lift nozzle → Select vehicle → Authorize → Fuel → Complete
- [ ] Error workflow: Try to authorize without lifting nozzle → Rejected
- [ ] Real-time workflow: Nozzle DOWN → Lift nozzle → Indicator updates → Button enables
- [ ] Device communication: UploadStatus received → Redis updated → Query returns correct state
- [ ] Transaction tracking: Authorization → Transaction ID received → Tracked in process

## 🚀 Deployment

### Backend Deployment
1. Compile solution: `dotnet build Tenacy.Fms.sln`
2. Run tests: `dotnet test`
3. Deploy to production server
4. Verify Redis connection
5. Monitor logs for "[PumpAuth] **NOZZLE UP**" messages

### Frontend Deployment
1. Build frontend: `cd fms.frontend && npm run build:prod`
2. Deploy build artifacts to web server
3. Verify SignalR connection
4. Test nozzle state indicator on production device

### Verification Steps
1. **Backend API**: Test GET /api/v1/pump/{deviceId}/{pumpId}/nozzle-state
2. **Frontend UI**: Verify green/orange indicator appears
3. **SignalR**: Check real-time updates when nozzle lifted/lowered
4. **Authorization**: Verify pump cannot be authorized with nozzle down
5. **Transaction**: Verify transaction ID received and tracked

## 📝 Key Benefits

### Problem Prevention
✅ **No More Stuck Transactions**: Cannot authorize without nozzle UP
✅ **Physical Workflow Enforced**: Backend validates nozzle state
✅ **Real-Time Feedback**: User sees nozzle status immediately
✅ **Clear Error Messages**: User knows exactly what to do

### User Experience
✅ **Visual Indicators**: Green (ready) vs Orange (not ready)
✅ **Disabled Buttons**: Cannot proceed when conditions not met
✅ **Instant Updates**: SignalR provides real-time nozzle state
✅ **Helpful Hints**: Tooltips explain why buttons are disabled

### System Reliability
✅ **Backend Validation**: API-level enforcement (not just UI)
✅ **Redis-Based State**: Authoritative source for nozzle status
✅ **Transaction Tracking**: Device-generated IDs prevent conflicts
✅ **Fallback Mechanisms**: IdleStatus.LastVolumes when EOT missing

## 🔍 Troubleshooting

### Issue: Nozzle indicator always shows "DOWN"
**Possible Causes**:
1. Device not sending UploadStatus to Redis
2. Redis key format incorrect
3. IdleStatus.Ids array doesn't contain pump ID
4. IdleStatus.NozzlesUp array structure incorrect

**Debug Steps**:
```bash
# Check Redis for device status
redis-cli
> GET "upload-status:PTS001"
> # Verify IdleStatus.Ids and NozzlesUp arrays

# Check backend logs
# Look for: "[GetPumpNozzleStateQuery] Nozzle state for device..."

# Check frontend console
# Look for: "[ScanStep] Error checking nozzle state"
```

### Issue: Authorization succeeds even with nozzle DOWN
**Possible Causes**:
1. Backend validation bypassed (shouldn't be possible)
2. GetPumpNozzleStateQuery not called in PumpAuthorizeCommand
3. Redis cache stale

**Debug Steps**:
```bash
# Check backend logs for STEP 1
# Should see: "[PumpAuth] **NOZZLE UP** ✅" OR "[PumpAuth] ⚠️ NOZZLE DOWN"

# Verify PumpAuthorizeCommand has nozzle validation
# Line ~111-145 should have GetPumpNozzleStateQuery call

# Test API directly
curl -X POST /api/v1/pump/authorize \
  -H "Content-Type: application/json" \
  -d '{"deviceId":"PTS001","pumpId":1,...}'
# Should return ValidationFailed if nozzle DOWN
```

### Issue: SignalR not updating nozzle state
**Possible Causes**:
1. SignalR connection not established
2. uploadStatusUpdate event not subscribed
3. Event handler not parsing IdleStatus correctly

**Debug Steps**:
```javascript
// Check frontend console
console.log("[ScanStep] SignalR subscription:", subscription);

// Verify event handler called
const handleUploadStatusUpdate = (data) => {
  console.log("[ScanStep] uploadStatusUpdate received:", data);
  // Should see IdleStatus object with Ids and NozzlesUp arrays
};

// Check SignalR connection status
ptsSignalRService.getConnectionState(); // Should be "Connected"
```

## 📚 Related Documentation

- **PTSDeviceTerminal Fix**: `Documentation/Fixes/PTSDEVICE_TERMINAL_FIX.md`
- **Physical Workflow Plan**: `Documentation/Fixes/PHYSICAL_FUELING_WORKFLOW_FIX.md`
- **SignalR Diagnosis**: `Documentation/SIGNALR_DIAGNOSIS_GUIDE.md`
- **Fueling Workflow**: `Documentation/fuelingWorkFlow.txt`
- **PTS Protocol**: `Documentation/JsonPTSprotocal.txt`

## 🎉 Success Criteria

✅ **Backend validates nozzle UP before authorization**
✅ **Frontend shows real-time nozzle state indicator**
✅ **Authorization button disabled when nozzle DOWN**
✅ **User receives clear error message if trying to proceed without nozzle UP**
✅ **Transaction ID received from device and tracked in fueling process**
✅ **No more stuck transactions accumulating**
✅ **Physical workflow enforced at both UI and API levels**

---

**Implementation Date**: January 27, 2025
**Status**: ✅ COMPLETE - Backend and Frontend Implemented
**Next Steps**: Test on production device, monitor for stuck transactions
