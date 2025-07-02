sequenceDiagram
    participant User
    participant FPUI as FuelingProcess.js (UI & Logic)
    participant Rend as FuelingProcessRenderer
    participant Pop as FuelingPopupRenderer
    participant DevData as useDeviceData Hook
    participant Redux as Redux Store
    participant SigR as SignalRService
    participant PumpAPI as Pump Control API (Backend)
    participant PumpAct as ptspumpActions.js
    participant RTAct as realtimeStatusActions.js

    %% Initialization %%
    FPUI->>Redux: dispatch(fetch*) (Vehicles, Sites, Config)
    Redux-->>FPUI: Update state (vehicles, sites)
    DevData->>Redux: Select realtimeStatus state
    Redux-->>DevData: Provide devicePumpStatus, rawUploadStatus
    DevData-->>FPUI: Provide processed data (pumps, activeProcs, etc.)
    FPUI->>Rend: Render Pump Selection (using data from DevData)

    %% User Selects Pump/Nozzle/Vehicle/Preset %%
    User->>FPUI: Select Pump, Nozzle, etc.
    FPUI->>FPUI: Update local state (selectedPump, step, etc.)
    FPUI->>Rend: Render current step UI

    %% Authorization %%
    User->>FPUI: Click Authorize
    FPUI->>PumpAPI: Call authorizePump(params) (via service -> PumpAct)
    PumpAct->>PumpAPI: POST /pump/authorize
    PumpAPI-->>PumpAct: Response (success, transactionId?)
    PumpAct-->>FPUI: Return response / dispatch SUCCESS/FAILURE
    alt Authorize Success
        FPUI->>FPUI: Set activePumpForPopup, notify user
        Note over FPUI: Waits for SignalR status update
    else Authorize Failure
        FPUI->>FPUI: Notify user (error)
    end

    %% Real-time Update Loop %%
    SigR->>Redux: receiveUploadStatusUpdate(data) (via RTAct)
    RTAct->>Redux: Dispatch RECEIVE_UPLOAD_STATUS_UPDATE
    Redux->>Redux: Reducer updates realtimeStatus state (parses pumps)
    DevData->>Redux: Re-select updated state
    Redux-->>DevData: Provide new devicePumpStatus
    DevData-->>FPUI: Provide updated processed data
    FPUI->>FPUI: useEffect detects changes in devicePumpStatus
    alt Status is 'fueling' for activePumpForPopup
        FPUI->>Pop: Render/Update Fueling Progress Popup
        FPUI->>Redux: dispatch(createFuelingEvent('filling'))
    else Status is 'endOfTransaction' for activePumpForPopup
        FPUI->>Pop: Hide Progress, Render Fueling Complete Popup
        FPUI->>Redux: dispatch(createFuelingEvent('completed'))
    else Other status changes (nozzleUp, offline, tag read)
        FPUI->>Redux: dispatch(createFuelingEvent(type))
    end

    %% Stop Action %%
    User->>Pop: Click Stop in Progress Popup
    Pop->>FPUI: Trigger stopFueling()
    FPUI->>PumpAPI: Call stopPump(pumpId) (via service -> PumpAct)
    PumpAct->>PumpAPI: POST /pump/{dev}/{pump}/stop
    PumpAPI-->>PumpAct: Response
    PumpAct-->>FPUI: Return response / dispatch SUCCESS/FAILURE
    FPUI->>FPUI: Notify user
    Note right of FPUI: UI change (popup close) driven by subsequent EOT status update from SignalR

    %% Completion Action %%
    User->>Pop: Click Done in Complete Popup
    Pop->>FPUI: Trigger completeFueling()
    FPUI->>PumpAPI: Call closeTransaction(pumpId, txnId) (via service -> PumpAct)
    PumpAct->>PumpAPI: POST /pump/{dev}/{pump}/close
    PumpAPI-->>PumpAct: Response
    PumpAct-->>FPUI: Return response / dispatch SUCCESS/FAILURE
    FPUI->>FPUI: Notify user, call startNewFueling() to reset UI state/step
    FPUI->>Pop: Hide Complete Popup
    FPUI->>Rend: Render Pump Selection
