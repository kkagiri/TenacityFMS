# Fueling Transaction Flow - Mermaid Diagrams

This document contains comprehensive Mermaid diagrams visualizing the complete fueling transaction flow in the FMS system.

## 1. Complete End-to-End Flow Diagram

```mermaid
flowchart TD
    %% Frontend Components
    A[User Selects Pump] --> B[fuelingprocess.js]
    B --> C[FuelingProcessRenderer.js]
    C --> D[Select Nozzle]
    D --> E[Scan Tag/Select Vehicle]
    E --> F[FuelingDetailsStep.js]
    F --> G[Authorization Request]

    %% Backend Authorization
    G --> H[PumpController.authorize]
    H --> I[PumpAuthorizeCommand]
    I --> J[Validation & Auth State]
    J --> K[AuthorizationStateTracker]
    K --> L[TransactionMonitoringService]
    L --> M[PumpService]
    M --> N[CommandExecutor]

    %% Redis Communication
    N --> O[Redis Pub: pts-commands]
    O --> P[PTS Device]
    P --> Q[Device Response]
    Q --> R[Redis Sub: pts-command-responses]
    R --> S[Authorization Confirmed]

    %% Transaction Monitoring
    S --> T[Transaction Starts]
    T --> U[Real-time Status Updates]
    U --> V[UploadStatusCommand]
    V --> W[Redis Storage & SignalR Broadcast]
    W --> X[Frontend UI Updates]

    %% Auto-Completion Flow
    U --> Y{EndOfTransaction Detected?}
    Y -->|Yes| Z[AutoTransactionCompletionService]
    Y -->|No| U
    Z --> AA[Get Complete Transaction Data]
    AA --> BB[Save to Database]
    BB --> CC[Send Close Command]
    CC --> DD[Cleanup Monitoring]
    DD --> EE[SignalR Notification]
    EE --> FF[Frontend Completion UI]

    %% Styling
    classDef frontend fill:#e1f5fe,stroke:#01579b,stroke-width:2px
    classDef backend fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
    classDef redis fill:#ffebee,stroke:#b71c1c,stroke-width:2px
    classDef device fill:#e8f5e8,stroke:#1b5e20,stroke-width:2px
    classDef auto fill:#fff3e0,stroke:#e65100,stroke-width:2px

    class A,B,C,D,E,F,G,X,FF frontend
    class H,I,J,K,L,M,V,W backend
    class N,O,R,W redis
    class P,Q device
    class Y,Z,AA,BB,CC,DD,EE auto
```

## 2. Frontend Component Flow

```mermaid
sequenceDiagram
    participant User
    participant FP as fuelingprocess.js
    participant FPR as FuelingProcessRenderer.js
    participant FDS as FuelingDetailsStep.js
    participant Redux as Redux Store
    participant API as Backend API

    User->>FP: Select Pump
    FP->>FPR: renderPumpSelection()
    FPR->>FP: setSelectedPump()
    FP->>FP: setStep("nozzle")

    User->>FP: Select Nozzle
    FP->>FPR: renderNozzleSelection()
    FPR->>FP: setSelectedNozzle()
    FP->>FP: setStep("scan")

    User->>FP: Scan Tag/Select Vehicle
    FP->>FPR: renderScanProcess()
    FPR->>FP: setVehicleInfo()
    FP->>FP: setStep("details")

    User->>FDS: Confirm Authorization
    FDS->>API: POST /api/pump/authorize
    API->>Redux: Authorization Response
    Redux->>FP: Update Transaction State
    FP->>FP: Start Monitoring
```

## 3. Backend Authorization Flow

```mermaid
flowchart LR
    A[PumpController] --> B[PumpAuthorizeCommand]
    B --> C{Validation}
    C -->|Pass| D[Auto-assign Master Tag?]
    C -->|Fail| E[Return Error]

    D -->|Yes| F[Get User Master Tag]
    D -->|No| G[Use Provided Tag]
    F --> H[AuthorizationStateTracker]
    G --> H

    H --> I[Create Auth State]
    I --> J[Store in Redis]
    J --> K[PumpService]
    K --> L[CommandExecutor]
    L --> M[Redis Pub/Sub]
    M --> N[Start Monitoring]
    N --> O[Return Success]

    style C fill:#fff2cc
    style D fill:#fff2cc
    style I fill:#d5e8d4
    style M fill:#f8cecc
```

## 4. Redis Communication Architecture

```mermaid
graph TB
    subgraph "Web Application"
        A[CommandExecutor]
        B[UploadStatusCommand]
        C[RedisCommandService]
    end

    subgraph "Redis Channels"
        D[pts-commands]
        E[pts-command-responses]
        F[pts-status-updates]
    end

    subgraph "Windows Service"
        G[RedisPTSCommandProcessor]
        H[PTSDeviceConnection]
        I[WebSocketListener]
    end

    subgraph "PTS Device"
        J[Device Hardware]
    end

    A -->|Publish Command| D
    D -->|Subscribe| G
    G -->|WebSocket/HTTP| H
    H -->|Send Command| J
    J -->|Response| H
    H -->|Publish Response| E
    E -->|Subscribe| C
    C -->|Complete Request| A

    J -->|Status Updates| I
    I -->|Upload Status| B
    B -->|Publish Status| F
    F -->|SignalR Broadcast| A

    style D fill:#ffcdd2
    style E fill:#ffcdd2
    style F fill:#ffcdd2
```

## 5. Transaction Monitoring and Auto-Completion

```mermaid
stateDiagram-v2
    [*] --> Authorized: Pump Authorized
    Authorized --> Monitoring: Start Monitoring
    Monitoring --> InProgress: Fueling Started
    InProgress --> Monitoring: Status Updates
    InProgress --> EndDetected: End of Transaction

    EndDetected --> AutoCheck: Check Auto-Complete
    AutoCheck --> AutoComplete: Auto-Complete Enabled
    AutoCheck --> ManualRequired: Manual Required

    AutoComplete --> GetData: Retrieve Transaction Data
    GetData --> SaveDB: Save to Database
    SaveDB --> SendClose: Send Close Command
    SendClose --> Cleanup: Cleanup Monitoring
    Cleanup --> NotifyFrontend: SignalR Notification
    NotifyFrontend --> [*]

    ManualRequired --> AwaitManual: Await Manual Completion
    AwaitManual --> [*]: User Completes

    note right of AutoCheck
        Checks connection type:
        - WebSocket: Auto
        - HTTPDirect: Auto
        - HTTPPolling: Manual
    end note
```

## 6. Device Connection Types and Flow

```mermaid
graph LR
    subgraph "Device Connection Types"
        A[WebSocket Connection]
        B[HTTP Polling]
        C[HTTP Direct]
    end

    subgraph "Communication Flow"
        D[Real-time Bidirectional]
        E[Periodic Status Upload]
        F[Direct Request/Response]
    end

    subgraph "Auto-Completion Support"
        G[✅ Full Auto-Complete]
        H[⚠️ Manual Required]
        I[✅ Full Auto-Complete]
    end

    A --> D --> G
    B --> E --> H
    C --> F --> I

    style A fill:#c8e6c9
    style C fill:#c8e6c9
    style B fill:#ffecb3
    style G fill:#c8e6c9
    style I fill:#c8e6c9
    style H fill:#ffecb3
```

## 7. Frontend Real-time Updates

```mermaid
sequenceDiagram
    participant Device as PTS Device
    participant WS as Windows Service
    participant Redis as Redis
    participant Backend as Backend
    participant SignalR as SignalR Hub
    participant Frontend as React Frontend

    Device->>WS: Status Update
    WS->>Backend: UploadStatusCommand
    Backend->>Redis: Store Status
    Backend->>SignalR: Broadcast Update
    SignalR->>Frontend: DeviceStatusUpdate
    Frontend->>Frontend: Update Redux State
    Frontend->>Frontend: Re-render Components

    Note over Device,Frontend: Real-time status flow

    Device->>WS: EndOfTransaction
    WS->>Backend: EndOfTransaction Status
    Backend->>Backend: Auto-Complete Process
    Backend->>Backend: Save to Database
    Backend->>SignalR: Transaction Completed
    SignalR->>Frontend: Transaction Complete Event
    Frontend->>Frontend: Show Completion UI
```

## 8. Data Flow and State Management

```mermaid
flowchart TD
    subgraph "Frontend State"
        A[selectedPump]
        B[selectedNozzle]
        C[vehicleInfo]
        D[currentTransactionId]
        E[fuelingComplete]
    end

    subgraph "Backend State"
        F[AuthorizationState]
        G[TransactionContext]
        H[MonitoringState]
        I[DeviceConnections]
    end

    subgraph "Database"
        J[Pumptransactions]
        K[AuthStates]
        L[DeviceStatus]
    end

    A --> F
    B --> F
    C --> G
    D --> H

    F --> K
    G --> J
    H --> L
    I --> L

    J --> E
    L --> E

    style A fill:#e3f2fd
    style B fill:#e3f2fd
    style C fill:#e3f2fd
    style D fill:#e3f2fd
    style E fill:#e3f2fd
    style F fill:#f3e5f5
    style G fill:#f3e5f5
    style H fill:#f3e5f5
    style I fill:#f3e5f5
    style J fill:#e8f5e8
    style K fill:#e8f5e8
    style L fill:#e8f5e8
```

## 9. Error Handling and Fallback Mechanisms

```mermaid
flowchart TD
    A[Command Sent] --> B{Device Response?}
    B -->|Success| C[Process Response]
    B -->|Timeout| D[Retry Logic]
    B -->|Error| E[Error Handling]

    D --> F{Retry Count < Max?}
    F -->|Yes| G[Wait & Retry]
    F -->|No| H[Fallback Method]
    G --> A

    H --> I{HTTP Direct Available?}
    I -->|Yes| J[Direct HTTP Query]
    I -->|No| K[Manual Intervention]

    J --> L{Success?}
    L -->|Yes| C
    L -->|No| K

    E --> M[Log Error]
    M --> N[Notify Frontend]
    N --> O[User Action Required]

    C --> P[Update State]
    P --> Q[Continue Flow]

    style D fill:#fff3c4
    style H fill:#fff3c4
    style E fill:#ffcdd2
    style K fill:#ffcdd2
    style M fill:#ffcdd2
```

## 10. Complete Transaction Lifecycle

```mermaid
gantt
    title Transaction Lifecycle Timeline
    dateFormat X
    axisFormat %S

    section Frontend
    Pump Selection    :done, pump, 0, 5
    Authorization     :done, auth, 5, 10
    Monitoring Start  :done, monitor, 10, 15
    UI Updates        :active, ui, 15, 45
    Completion UI     :milestone, complete, 45

    section Backend
    Validation        :done, valid, 8, 12
    Auth State        :done, state, 12, 15
    Command Send      :done, cmd, 15, 20
    Status Processing :active, status, 20, 40
    Auto-Complete     :crit, auto, 40, 45

    section Device
    Receive Command   :done, rcv, 18, 22
    Start Fueling     :done, fuel, 22, 35
    End Transaction   :milestone, end, 35
    Send Final Status :done, final, 35, 40

    section Database
    Store Auth        :done, dbauth, 14, 16
    Monitor Context   :done, dbmon, 16, 40
    Save Transaction  :crit, dbtrans, 42, 45
```

## Summary

These Mermaid diagrams provide a comprehensive visual representation of:

1. **Complete end-to-end flow** from user interaction to transaction completion
2. **Frontend component interactions** and state management
3. **Backend authorization and validation** processes
4. **Redis pub/sub communication** architecture
5. **Automatic transaction completion** logic
6. **Device connection types** and their capabilities
7. **Real-time updates** via SignalR
8. **Data flow and state management** across the system
9. **Error handling and fallback** mechanisms
10. **Complete transaction lifecycle** timeline

The diagrams illustrate how the system achieves **zero-touch transaction completion** while maintaining full visibility and control for operators through real-time monitoring and comprehensive state management.