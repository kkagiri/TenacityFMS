# Complete Fueling Transaction Flow Documentation

## Overview
This document outlines the complete end-to-end flow of a fueling transaction in the FMS system, from initial pump selection in the frontend through backend authorization, monitoring, auto-completion, and frontend notification of completion.

## Flow Architecture Diagram

```
Frontend (React)     Backend (ASP.NET)     PTS Device     Redis/SignalR
     |                      |                    |              |
     |---> Pump Selection   |                    |              |
     |---> Nozzle Selection |                    |              |
     |---> Vehicle/Tag ID   |                    |              |
     |---> Authorization    |                    |              |
     |                      |                    |              |
     |   startFueling() --> |                    |              |
     |                   PumpController         |              |
     |                      |                    |              |
     |                   Validation             |              |
     |                      |                    |              |
     |                 PumpAuthorizeCommand     |              |
     |                      |                    |              |
     |              AuthorizationStateTracker   |              |
     |                      |                    |              |
     |                TransactionMonitoring     |              |
     |                      |                    |              |
     |                   PumpService            |              |
     |                      |                    |              |
     |                 CommandExecutor          |              |
     |                      |                    |              |
     |                      |---> Redis Pub --> | <-- Redis ---|
     |                      |                    |              |
     |                      |              Device Response     |
     |                      |                    |              |
     |                      | <--- Redis Sub <--| ---> Redis --|
     |                      |                    |              |
     |              Auto Transaction Monitoring |              |
     |                      |                    |              |
     |            EndOfTransaction Detection    |              |
     |                      |                    |              |
     |              AutoTransactionCompletion   |              |
     |                      |                    |              |
     |                Database Recording        |              |
     |                      |                    |              |
     | <--- SignalR Update <|                    |              |
     |                      |                    |              |
     | Frontend Notification                    |              |
```

## Phase 1: Frontend Pump Selection and Authorization

### 1.1 Component: `fuelingprocess.js`

**Purpose**: Main orchestrator component managing the entire fueling process

**Key State Management**:
```javascript
const [step, setStep] = useState("pump"); // Current UI step
const [selectedPump, setSelectedPump] = useState(null);
const [selectedNozzle, setSelectedNozzle] = useState(null);
const [vehicleReg, setVehicleReg] = useState("");
const [vehicleInfo, setVehicleInfo] = useState(null);
const [currentTransactionId, setCurrentTransactionId] = useState(null);
```

**Step Flow**:
1. **Pump Selection** (`step = "pump"`)
2. **Nozzle Selection** (`step = "nozzle"`)
3. **Vehicle/Tag Identification** (`step = "scan"`)
4. **Fueling Details & Authorization** (`step = "details"`)

### 1.2 Component: `FuelingProcessRenderer.js`

**Purpose**: Renders UI components for each step of the fueling process

**Pump Selection**:
```javascript
renderPumpSelection: (availablePumps, activePumps, setSelectedPump, setStep) => {
  // Displays available pumps with status indicators
  // Filters pumps by status (idle, nozzleUp, fueling, offline)
  // Allows selection only of idle/available pumps
}
```

**Nozzle Selection**:
```javascript
renderNozzleSelection: (nozzles, setSelectedNozzle, setStep) => {
  // Shows nozzles for selected pump
  // Displays fuel type and pricing information
  // Validates nozzle availability
}
```

**Vehicle/Tag Identification**:
```javascript
renderScanProcess: (
  isScanning, scanResult, vehicleInfo,
  selectionMethod, vehicles, vehicleReg
) => {
  // Two methods: RFID scan or vehicle lookup
  // Validates tag/vehicle information
  // Shows fuel limits and usage
}
```

### 1.3 Component: `FuelingDetailsStep.js`

**Purpose**: Final authorization step with preset options

**Authorization Types**:
- **Volume**: Specific liters to dispense
- **Full Tank**: Fill to capacity (respecting limits)

**Key Validations**:
- Vehicle fuel limits (daily/monthly/per-transaction)
- Pump/nozzle availability
- Tag authentication

## Phase 2: Backend Authorization Processing

### 2.1 Controller: `PumpController`

**Endpoint**: `POST /api/pump/authorize`

**Request Processing**:
```csharp
[HttpPost("authorize")]
public async Task<IActionResult> AuthorizePump([FromBody] PumpAuthorizeRequest request)
{
    var command = new PumpAuthorizeCommand
    {
        DeviceId = request.DeviceId,
        PumpId = request.PumpId,
        Nozzle = request.Nozzle,
        Type = MapAuthorizationType(request.Type),
        Dose = request.Dose,
        Tag = request.Tag,
        VehicleId = request.VehicleId,
        UserId = GetCurrentUserId() // For auto-assign master tag
    };

    var result = await _mediator.Send(command);
    return Ok(result);
}
```

### 2.2 Command: `PumpAuthorizeCommand.cs`

**Purpose**: Handles pump authorization with comprehensive validation

**Key Properties**:
```csharp
public record PumpAuthorizeCommand : IRequest<FMSResponse<PumpAuthorizeConfirmation>>
{
    public string? DeviceId { get; set; }
    public int PumpId { get; set; }
    public int Nozzle { get; set; }
    public double? Dose { get; set; }
    public PumpAuthorizeType Type { get; set; }
    public string? Tag { get; set; }
    public int? VehicleId { get; set; }
    public string? UserId { get; set; } // For auto-assign
}
```

**Handler Process**:
1. **Validation**: Device connectivity, pump availability, tag/vehicle validation
2. **Authorization State**: Create authorization record
3. **Transaction Context**: Store in Redis for monitoring
4. **Command Execution**: Send authorize command to device
5. **Monitoring Setup**: Initialize transaction monitoring

**Key Methods**:
```csharp
public async Task<FMSResponse<PumpAuthorizeConfirmation>> Handle(
    PumpAuthorizeCommand request, CancellationToken cancellationToken)
{
    // 1. Validate request
    var validation = await ValidateRequest(request);
    if (!validation.Success) return validation;

    // 2. Auto-assign master tag if needed
    if (ShouldAutoAssignMasterTag(request))
    {
        request.Tag = await GetUserMasterTag(request.UserId);
    }

    // 3. Create authorization state
    await _authTracker.SetAuthorized(request.DeviceId, request.Nozzle, authState);

    // 4. Store transaction context in Redis
    await StoreTransactionContextInRedis(deviceId, transactionId, tankId, vehicleId, connectionType, autoCloseTransaction);

    // 5. Execute pump authorization
    var response = await _pumpService.AuthorizePump(request);

    // 6. Start transaction monitoring
    await _transactionMonitoringService.StartMonitoringTransaction(
        request.DeviceId, request.PumpId, request.Nozzle, transactionId);

    return response;
}
```

### 2.3 Service: `AuthorizationStateTracker.cs`

**Purpose**: Manages authorization states and nozzle tracking

**Key Components**:

**AuthState Model**:
```csharp
public class AuthState
{
    public string? DeviceId { get; set; }
    public int PumpId { get; set; }
    public int NozzleId { get; set; }
    public string? TagId { get; set; }
    public int? VehicleId { get; set; }
    public DateTime AuthorizedAt { get; set; }
    public DateTime ExpiresAt { get; set; }
    public decimal? AuthorizedAmount { get; set; }
    public string? Status { get; set; } // "Authorized", "InProgress", "Completed"
    public int TransactionId { get; set; }
}
```

**Key Methods**:
```csharp
// Set authorization state when pump is authorized
Task SetAuthorized(string deviceId, int nozzleId, AuthState authState);

// Check if nozzle is currently authorized
Task<bool> IsAuthorized(string deviceId, int nozzleId);

// Update authorization status during transaction
Task UpdateAuthState(string deviceId, int nozzleId, string newStatus);

// Track nozzle up/down states
Task UpdateNozzleState(string deviceId, int pumpId, int nozzleId, bool isUp);

// Get current authorization for pump
Task<AuthState> GetAuthorizationState(string deviceId, int pumpId);
```

**Integration Points**:
- **Authorization**: Creates auth state when pump authorized
- **Monitoring**: Updates state during transaction progress
- **Completion**: Clears state when transaction completes

## Phase 3: Device Communication and Transaction Monitoring

### 3.1 Service: `PumpService`

**Purpose**: Manages pump operations and device communication

**Authorization Method**:
```csharp
public async Task<FMSResponse<PumpAuthorizeConfirmation>> AuthorizePump(PumpAuthorizeCommand request)
{
    // Create PTS message for device
    var ptsMessage = CreateAuthorizeMessage(request);

    // Send via CommandExecutor (Redis pub/sub)
    var response = await _commandExecutor.SendPTSMessageAsync(
        request.DeviceId, ptsMessage, timeout: TimeSpan.FromSeconds(10));

    return ParseAuthorizeResponse(response);
}
```

### 3.2 Service: `CommandExecutor`

**Purpose**: Handles Redis pub/sub communication with PTS devices

**Command Sending**:
```csharp
public async Task<PTSMessage> SendPTSMessageAsync(string deviceId, PTSMessage message, TimeSpan timeout)
{
    // 1. Generate correlation ID
    var correlationId = Guid.NewGuid().ToString();

    // 2. Store correlation for response matching
    _pendingCommands[correlationId] = new TaskCompletionSource<PTSMessage>();

    // 3. Publish to Redis command channel
    await _redisDb.PublishAsync("pts-commands", JsonConvert.SerializeObject(new {
        DeviceId = deviceId,
        CorrelationId = correlationId,
        Command = message,
        Timestamp = DateTime.UtcNow
    }));

    // 4. Wait for response with timeout
    var responseTask = _pendingCommands[correlationId].Task;
    var timeoutTask = Task.Delay(timeout);

    var completedTask = await Task.WhenAny(responseTask, timeoutTask);

    if (completedTask == timeoutTask)
        throw new TimeoutException($"Command timeout for device {deviceId}");

    return await responseTask;
}
```

### 3.3 Service: `TransactionMonitoringService.cs`

**Purpose**: Monitors transaction execution and progress

**Start Monitoring**:
```csharp
public async Task StartMonitoringTransaction(string deviceId, int pumpId, int nozzleId, int transactionId)
{
    // Store monitoring context in Redis
    var monitoringData = new {
        DeviceId = deviceId,
        PumpId = pumpId,
        NozzleId = nozzleId,
        TransactionId = transactionId,
        StartTime = DateTime.UtcNow,
        Status = "Monitoring",
        ConnectionType = await GetDeviceConnectionType(deviceId)
    };

    await _redisDb.StringSetAsync(
        $"transaction_monitoring:{deviceId}:{transactionId}",
        JsonConvert.SerializeObject(monitoringData),
        TimeSpan.FromHours(2) // Expiry
    );

    _logger.LogInformation("[Monitoring] Started monitoring transaction {TransactionId} for device {DeviceId}, pump {PumpId}",
        transactionId, deviceId, pumpId);
}
```

**Validation Methods**:
```csharp
// Validate transaction execution via different connection types
public async Task<bool> ValidateTransactionExecution(string deviceId, int pumpId, int expectedTransactionId)
{
    var connectionType = await GetDeviceConnectionType(deviceId);

    return connectionType switch
    {
        "WebSocket" => await ValidateTransactionFromUploadStatus(deviceId, pumpId, expectedTransactionId),
        "HTTPPolling" => await ValidateTransactionFromUploadStatus(deviceId, pumpId, expectedTransactionId),
        "HTTPDirect" => await ValidateTransactionDirect(deviceId, pumpId, expectedTransactionId),
        _ => false
    };
}
```

## Phase 4: Transaction Execution and Real-time Updates

### 4.1 Device Communication Modes

**WebSocket Connection**:
- Real-time bidirectional communication
- Immediate status updates
- Redis pub/sub for command routing

**HTTP Polling**:
- Device polls for commands periodically
- Status uploaded on regular intervals
- Redis used for command queuing

**HTTP Direct**:
- Direct HTTP requests to device
- Fallback method for offline scenarios
- Manual status querying

### 4.2 Status Update Processing: `UploadStatusCommand.cs`

**Purpose**: Processes status updates from devices

**Enhanced Processing**:
```csharp
public async Task<CommandResult> Handle(UploadStatusCommand request, CancellationToken cancellationToken)
{
    // 1. Store status in Redis for real-time access
    await StoreUploadStatusInRedis(request.DeviceId, request.UploadStatus);

    // 2. Broadcast to frontend via SignalR
    await BroadcastUploadStatusUpdate(request.DeviceId, request.UploadStatus);

    // 3. Process specific status types
    if (request.UploadStatus?.PumpStatus != null)
    {
        await ProcessLivePumpStatusInternally(request.DeviceId, request.UploadStatus.PumpStatus);
    }

    return CommandResult.Success();
}
```

**EndOfTransaction Detection**:
```csharp
private async Task ProcessEndOfTransactionStatusInternalLogic(string deviceId, EndOfTransactionStatus eotStatus)
{
    _logger.LogInformation("[EOT] Processing EndOfTransaction for device {DeviceId}, pump {Pump}, transaction {Transaction}",
        deviceId, eotStatus.Pump, eotStatus.Transaction);

    // 1. Update authorization state
    await _authTracker.UpdateAuthState(deviceId, eotStatus.Nozzle, "Completed");

    // 2. Stop transaction monitoring
    await _transactionMonitoringService.StopMonitoringTransaction(deviceId, eotStatus.Transaction);

    // 3. Trigger auto-completion
    var statusData = JObject.FromObject(eotStatus);
    await _autoCompletionService.ProcessEndOfTransactionAsync(
        deviceId, eotStatus.Pump, eotStatus.Transaction, statusData);

    // 4. Update transaction progress
    await _transactionMonitoringService.UpdateTransactionProgress(
        deviceId, eotStatus.Pump, eotStatus.Transaction, "EndOfTransaction",
        (decimal?)eotStatus.Volume, (decimal?)eotStatus.Amount);
}
```

## Phase 5: Auto-Completion and Database Recording

### 5.1 Service: `AutoTransactionCompletionService.cs`

**Purpose**: Automatically completes and saves transactions

**End of Transaction Processing**:
```csharp
public async Task ProcessEndOfTransactionAsync(string deviceId, int pump, int transaction, JObject statusData)
{
    _logger.LogInformation("[AutoComplete] Processing EndOfTransaction for device {DeviceId}, pump {Pump}, transaction {Transaction}",
        deviceId, pump, transaction);

    try
    {
        // 1. Check if auto-completion should occur
        var shouldAutoComplete = await ShouldAutoCompleteTransaction(deviceId, transaction);
        if (!shouldAutoComplete)
        {
            _logger.LogInformation("[AutoComplete] Skipping auto-completion for transaction {Transaction} (manual completion required)",
                transaction);
            return;
        }

        // 2. Get complete transaction data
        var completeData = await GetCompleteTransactionData(deviceId, pump, transaction, statusData);

        // 3. Complete and save transaction
        var success = await CompleteAndSaveTransactionAsync(deviceId, pump, transaction, completeData);

        if (success)
        {
            // 4. Send close command to device
            await SendCloseCommandToDevice(deviceId, pump, transaction);

            // 5. Cleanup monitoring contexts
            await _transactionMonitoringService.StopMonitoringTransaction(deviceId, transaction);

            _logger.LogInformation("[AutoComplete] Successfully auto-completed transaction {Transaction} for device {DeviceId}",
                transaction, deviceId);
        }
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "[AutoComplete] Error during auto-completion for transaction {Transaction} on device {DeviceId}",
            transaction, deviceId);
    }
}
```

**Database Recording**:
```csharp
public async Task<bool> CompleteAndSaveTransactionAsync(string deviceId, int pump, int transaction, JObject finalData)
{
    using var scope = _scopeFactory.CreateScope();
    var context = scope.ServiceProvider.GetRequiredService<GpsdataContext>();

    try
    {
        // 1. Create transaction object from final data
        var pumpTransaction = CreatePumpTransactionFromData(deviceId, pump, transaction, finalData);

        // 2. Check if transaction already exists (prevent duplicates)
        var existingTransaction = await context.Pumptransactions
            .FirstOrDefaultAsync(t => t.PtsId == deviceId && t.Transaction == transaction);

        if (existingTransaction != null)
        {
            // Update existing transaction
            UpdateExistingTransaction(existingTransaction, pumpTransaction);
            _logger.LogInformation("[AutoComplete] Updated existing transaction {Transaction} for device {DeviceId}",
                transaction, deviceId);
        }
        else
        {
            // Add new transaction
            context.Pumptransactions.Add(pumpTransaction);
            _logger.LogInformation("[AutoComplete] Added new transaction {Transaction} for device {DeviceId}",
                transaction, deviceId);
        }

        // 3. Save to database
        await context.SaveChangesAsync();

        return true;
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "[AutoComplete] Error saving transaction {Transaction} for device {DeviceId}",
            transaction, deviceId);
        return false;
    }
}
```

### 5.2 Service: `TransactionCompletionService.cs`

**Purpose**: Handles manual and automatic transaction completion

**Integration with Auto-Completion**:
```csharp
public async Task HandleEndOfTransactionAsync(string deviceId, int pumpId, int? detectedTransactionId = null)
{
    _logger.LogInformation("[TransactionCompletion] Handling EndOfTransaction for device {DeviceId}, pump {PumpId}",
        deviceId, pumpId);

    try
    {
        // 1. Get transaction ID from context if not provided
        var transactionId = detectedTransactionId ?? await GetTransactionIdFromContext(deviceId, pumpId);

        if (transactionId <= 0)
        {
            _logger.LogWarning("[TransactionCompletion] No valid transaction ID found for device {DeviceId}, pump {PumpId}",
                deviceId, pumpId);
            return;
        }

        // 2. Check if auto-completion is enabled
        var canAutoComplete = await CanAutoCompleteTransaction(deviceId, transactionId);

        if (canAutoComplete)
        {
            // 3. Use auto-completion service
            _logger.LogInformation("[TransactionCompletion] Delegating to auto-completion service for transaction {TransactionId}",
                transactionId);

            // Auto-completion will be handled by AutoTransactionCompletionService
            // via EndOfTransaction status processing
        }
        else
        {
            // 4. Manual completion required
            _logger.LogInformation("[TransactionCompletion] Manual completion required for transaction {TransactionId}",
                transactionId);

            // Keep transaction in monitoring state for manual completion
            await _transactionMonitoringService.UpdateTransactionProgress(
                deviceId, pumpId, transactionId, "AwaitingManualCompletion");
        }
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "[TransactionCompletion] Error handling EndOfTransaction for device {DeviceId}, pump {PumpId}",
            deviceId, pumpId);
    }
}
```

## Phase 6: Frontend Notification and Transaction Display

### 6.1 Real-time Updates via SignalR

**Status Broadcasting**:
```csharp
private async Task BroadcastUploadStatusUpdate(string deviceId, UploadStatus status)
{
    try
    {
        // Create client-friendly status object
        var clientStatus = new {
            deviceId = deviceId,
            timestamp = DateTime.UtcNow,
            pumpStatus = status.PumpStatus,
            // ... other status data
        };

        // Broadcast to all connected clients
        await _hubContext.Clients.All.SendAsync("DeviceStatusUpdate", clientStatus);

        // Broadcast to device-specific group
        await _hubContext.Clients.Group($"device_{deviceId}")
            .SendAsync("PumpStatusUpdate", clientStatus);

        _logger.LogDebug("[Broadcast] Sent status update for device {DeviceId}", deviceId);
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "[Broadcast] Error broadcasting status update for device {DeviceId}", deviceId);
    }
}
```

### 6.2 Frontend Transaction Monitoring: `TransactionMonitoringStatus.js`

**Component Purpose**: Real-time transaction status display

**Key Features**:
- Real-time progress updates
- Transaction cancellation
- Manual completion trigger
- Connection status indication

**SignalR Integration**:
```javascript
useEffect(() => {
    if (!deviceId || !transactionId) return;

    // Subscribe to device-specific updates
    const signalRService = SignalRService;

    const handleStatusUpdate = (statusData) => {
        if (statusData.deviceId === deviceId) {
            setTransactionStatus(statusData);

            // Check for completion
            if (statusData.pumpStatus?.some(p =>
                p.pump === pumpId && p.status === 'endOfTransaction')) {
                setIsCompleted(true);
                onComplete?.(transactionId);
            }
        }
    };

    signalRService.on('DeviceStatusUpdate', handleStatusUpdate);

    return () => {
        signalRService.off('DeviceStatusUpdate', handleStatusUpdate);
    };
}, [deviceId, pumpId, transactionId]);
```

### 6.3 Frontend State Updates: `fuelingprocess.js`

**Transaction Progress Monitoring**:
```javascript
// Effect to Update Popup State Based on Redux
useEffect(() => {
    // Check status of the pump currently selected FOR THE POPUP
    const pumpDetails = activePumpForPopup
        ? getPumpDetails(activePumpForPopup.id)
        : null;

    if (pumpDetails?.status === "fueling") {
        // Pump for popup is fueling -> show popup, update details
        setShowFuelingPopup(true);
        setFuelingComplete(false);
        if (!currentTransactionId && pumpDetails.currentTransaction) {
            setCurrentTransactionId(pumpDetails.currentTransaction);
        }
    } else if (pumpDetails?.status === "endOfTransaction") {
        // Pump for popup just finished -> hide progress, show completion
        setShowFuelingPopup(false);
        setFuelingComplete(true); // Trigger completion popup
        if (!currentTransactionId && pumpDetails.transaction) {
            setCurrentTransactionId(pumpDetails.transaction);
        }
    }
}, [devicePumpStatus, activePumpForPopup, getPumpDetails, showFuelingPopup]);
```

**Event Detection and Dispatching**:
```javascript
// Effect to Dispatch Fueling Events for FuelingEventsList
useEffect(() => {
    const currentStatuses = devicePumpStatus || {};
    const previousStatuses = previousPumpStatuses.current || {};

    Object.keys(currentStatuses).forEach((pumpIdStr) => {
        const pumpId = parseInt(pumpIdStr, 10);
        const current = currentStatuses[pumpId];
        const previous = previousStatuses[pumpId];

        // Skip if status hasn't changed
        if (previous?.status === current.status) return;

        // Detect transition to EndOfTransaction
        if (previous?.status === "fueling" && current.status === "endOfTransaction") {
            dispatch(createFuelingEvent("completed", ptsId, {
                pumpId: current.id,
                transactionId: current.transaction,
                nozzleNumber: current.nozzle,
                transactionDetails: {
                    Volume: current.volume,
                    Amount: current.amount,
                    Price: current.price,
                    Tag: current.tag
                }
            }));

            // Show completion notification
            notify(`Transaction ${current.transaction} completed successfully`, "success", 3000);
        }
    });

    previousPumpStatuses.current = currentStatuses;
}, [devicePumpStatus, ptsId, dispatch]);
```

## Key Integration Points and Data Flow

### 1. Authorization Flow
```
Frontend Selection → PumpController → PumpAuthorizeCommand → AuthorizationStateTracker
       ↓
PumpService → CommandExecutor → Redis Pub → Device
       ↓
TransactionMonitoringService → Redis Context Storage
```

### 2. Transaction Execution Flow
```
Device Response → Redis Sub → CommandExecutor → Response Handler
       ↓
Status Updates → UploadStatusCommand → Redis Storage → SignalR Broadcast
       ↓
Frontend Updates → Real-time UI Changes
```

### 3. Auto-Completion Flow
```
EndOfTransaction Status → UploadStatusCommand → AutoTransactionCompletionService
       ↓
Data Retrieval → Database Recording → Device Close Command
       ↓
Monitoring Cleanup → SignalR Notification → Frontend Update
```

### 4. Frontend Notification Flow
```
Database Transaction → SignalR Broadcast → Frontend SignalR Handler
       ↓
Redux State Update → Component Re-render → UI Notification
       ↓
Transaction History Update → Completion Popup → User Feedback
```

## How Frontend Knows Transaction is Complete

### 1. Real-time SignalR Updates
- **UploadStatusCommand** broadcasts all status changes via SignalR
- Frontend subscribes to device-specific status updates
- **EndOfTransaction** status triggers immediate UI updates

### 2. Redux State Management
- Device status stored in Redux for reactive UI updates
- **useDeviceData** hook provides parsed pump status
- Status changes trigger useEffect hooks for UI transitions

### 3. Transaction Events System
- **createFuelingEvent** dispatches completion events
- Events are stored in Redux and displayed in transaction history
- Real-time event list shows all transaction activities

### 4. Automatic UI Transitions
- **fuelingComplete** state triggers completion popup
- **startNewFueling()** resets UI for next transaction
- **TransactionMonitoringStatus** component shows real-time progress

### 5. Database Integration
- **AutoTransactionCompletionService** saves completed transactions
- Transaction data immediately available in database
- Frontend can query transaction history and details

## Summary

The complete flow ensures:
- **Zero-touch completion**: Transactions complete automatically without user intervention
- **Real-time monitoring**: Frontend receives immediate status updates
- **Comprehensive tracking**: Full audit trail from authorization to completion
- **Fault tolerance**: Multiple communication methods and fallback strategies
- **User experience**: Seamless UI transitions and notifications

This architecture provides a robust, scalable solution for managing fuel transactions with automatic completion while maintaining full visibility and control for operators.