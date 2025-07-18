# Enhanced Fueling Workflow with Connection Type Detection

## Part 1: Pump Authorization with Connection Type Storage

```mermaid
sequenceDiagram
    participant UI as Frontend
    participant PC as PumpController
    participant PAH as PumpAuthorizeCommandHandler
    participant DCT as DeviceConnectionTracker
    participant Redis as Redis Cache
    participant PS as PumpService
    participant PTS as PTS Device

    Note over UI, PTS: Enhanced Pump Authorization Flow

    UI->>PC: POST /pump/authorize {DeviceId, PumpId, Nozzle, etc.}
    PC->>PAH: Handle(PumpAuthorizeCommand)

    PAH->>PAH: Validate request & authenticate tag

    Note over PAH: NEW: Connection Type Detection
    PAH->>DCT: GetWebSocketConnection(deviceId)
    DCT-->>PAH: WebSocketConnectionInfo (or null)

    PAH->>DCT: GetHttpConnection(deviceId)
    DCT-->>PAH: HttpConnectionInfo (or null)

    PAH->>PAH: DetermineConnectionMode(wsInfo, httpInfo)
    Note right of PAH: Returns: WebSocket, HTTPPolling,<br/>HTTPDirect, Mixed, Disconnected, or Unknown

    PAH->>PS: PumpAuthorizeAsync(deviceId, pumpData)
    PS->>PTS: Send authorize command
    PTS-->>PS: Authorization confirmation
    PS-->>PAH: PumpAuthorizeConfirmation

    Note over PAH: NEW: Enhanced Redis Storage
    PAH->>Redis: Store transaction context with connection type
    Note right of Redis: Key: device:{deviceId}:transaction:{txnId}<br/>Data: {DeviceId, TransactionId, TankId,<br/>VehicleId, AuthorizedAt, ConnectionType}

    PAH-->>PC: FMSResponseMessage<PumpAuthorizeConfirmation>
    PC-->>UI: HTTP 200 + confirmation with transaction ID
```

## Connection Type Detection Logic

```mermaid
flowchart TD
    A[Start: GetDeviceConnectionType] --> B[Get WebSocket Connection Info]
    B --> C[Get HTTP Connection Info]
    C --> D{WebSocket Active?}

    D -->|Yes| E{HTTP Active?}
    D -->|No| F{HTTP Active?}

    E -->|Yes| G[ConnectionMode.Mixed]
    E -->|No| H[ConnectionMode.WebSocket]

    F -->|Yes| I{HTTP Polls > 1?}
    F -->|No| J[ConnectionMode.Disconnected]

    I -->|Yes| K[ConnectionMode.HTTPPolling]
    I -->|No| L[ConnectionMode.HTTPDirect]

    G --> M[Return connection type string]
    H --> M
    J --> M
    K --> M
    L --> M

    M --> N[Store in Redis with transaction context]
```

## Redis Storage Structure

```json
{
  "Key": "device:PTS001:transaction:12345",
  "Value": {
    "DeviceId": "PTS001",
    "TransactionId": 12345,
    "TankId": 1,
    "VehicleId": 42,
    "AuthorizedAt": "2024-01-15T10:30:00Z",
    "ConnectionType": "WebSocket"
  },
  "Expiry": "24 hours"
}
```

## Connection Type Impact on Future Processing

```mermaid
flowchart LR
    A[Transaction Context<br/>with Connection Type] --> B{Connection Type?}

    B -->|WebSocket/HTTPDirect| C[Direct Monitoring Strategy]
    B -->|HTTPPolling| D[UploadStatus Monitoring Strategy]
    B -->|Mixed| E[Hybrid Strategy]
    B -->|Disconnected/Unknown| F[Fallback Strategy]

    C --> G[Frontend polls pump status<br/>Direct transaction close]
    D --> H[Wait for UploadStatus<br/>Process EOT from status]
    E --> I[Use best available method<br/>Adaptive approach]
    F --> J[Default to UploadStatus<br/>monitoring]
```

## Benefits of This Enhancement

1. **Intelligent Routing**: System knows how to communicate with each device
2. **Adaptive Monitoring**: Chooses optimal monitoring strategy per device
3. **Reliable Completion**: Ensures transactions complete regardless of connection type
4. **Debugging Support**: Connection type helps troubleshoot issues
5. **Future Extensibility**: Foundation for more sophisticated strategies

## Next Implementation Steps

- **Part 2**: Enhance monitoring based on stored connection type
- **Part 3**: Implement connection-aware transaction completion
- **Part 4**: Update frontend to use connection-specific strategies