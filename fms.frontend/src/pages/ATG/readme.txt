
fuelingprocess.js Component Documentation
1. Overview
The FuelingProcess component serves as the primary user interface for initiating, monitoring, and managing the fueling process for a specific PTS (Pump Terminal System) device identified by ptsId from the URL parameters. It orchestrates the user experience through several steps, interacts with the backend API for pump control, and leverages real-time device status updates received via SignalR to provide live feedback to the user.
2. Core Responsibilities
Device Identification: Retrieves the target ptsId using useParams.
Real-time Data Handling: Utilizes the useDeviceData custom hook to access processed, real-time status information (pump states, active fueling, nozzle availability, etc.) derived from SignalR updates stored in the Redux store (state.realtimeStatus).
Static Data Retrieval: Fetches and displays static information like PTS device details, site information, vehicle lists, and tag configurations using useSelector to access Redux state (state.ptsDevice, state.site, state.vehicle, state.tag, state.config).
User Flow Management: Manages the UI state (step) to guide the user through the stages of fueling:
Pump Selection
Nozzle Selection
Vehicle/Tag Identification (Manual Entry, Vehicle Lookup, or Tag Scan)
Fueling Preset Configuration (Amount, Volume, Full Tank)
Authorization & Monitoring
Completion
Pump Control: Dispatches actions (via pumpControlService, likely using actions from ptspumpActions.js) to interact with the backend API for:
Authorizing a pump (/pump/authorize)
Stopping an active fueling process (/pump/{deviceId}/{pumpId}/stop)
Closing/Completing a transaction (/pump/{deviceId}/{pumpId}/close - potentially optional depending on backend logic after EOT).
UI Rendering: Uses helper components (FuelingProcessRenderer, FuelingPopupRenderer, FuelingHeader, TagSelector, FuelingRulePopup) to render the UI for each step and display popups for fueling progress, completion, navigation warnings, and active process lists.
Event Logging: Detects significant transitions in pump status (e.g., idle -> nozzleUp, nozzleUp -> fueling, fueling -> endOfTransaction) based on changes in devicePumpStatus and dispatches createFuelingEvent actions to log these events in Redux (state.fuelingEvents).
State Management: Combines local state (useState) for UI flow control, user selections, and transient states (e.g., isLoading, isAuthorizing) with Redux state for shared application data and real-time updates.
Connection Status: Monitors and reacts to the device's connection status, disabling interactions if the device is disconnected.
3. Key Hooks and State Management
useParams(): Gets ptsId from the route.
useNavigate(): Used for programmatic navigation, integrated with checks for ongoing fueling processes.
useDispatch(): Used to dispatch Redux actions for:
Fetching data (fetchVehicleList, fetchSiteList, fetchTagsByVehicleId, fetchTagDetails, fetchMasterTagConfig, validateTag).
Sending pump commands (pumpControlService.authorizePump, .stopPump, .closeTransaction - which internally likely dispatch actions from ptspumpActions.js).
Logging events (createFuelingEvent).
useSelector(): Selects data from the Redux store:
state.ptsDevice: Static info about the current PTS device.
state.site: List of sites to find the current site name.
state.fuelingEvents: Fueling history for the list component (filtered by ptsId).
state.vehicle: List of vehicles for lookup.
state.tag: Tags associated with a selected vehicle, validation results.
state.realtimeStatus: Implicitly used by useDeviceData.
useDeviceData(ptsId): This is crucial. It abstracts the complexity of parsing the raw uploadStatus from state.realtimeStatus.devicePumpStatus[ptsId]. It provides:
devicePumpStatus: A structured object mapping pumpId to its parsed state (status, currentVolume, currentAmount, tag, transactionId, etc.).
availablePumps: A derived list of pump objects for the UI.
activeFuelingProcesses: A derived list of pumps currently in fueling or endOfTransaction state.
deviceLastUpdated: Timestamp of the last received status update.
isLiveDataEnabled: Flag indicating if live updates are active.
getPumpDetails(pumpId): Function to get the parsed details for a single pump.
getNozzlesForPump(pumpId): Function to derive nozzle information (status, fuel type) based on pump state and configuration (fuelGrades from rawUploadStatus).
rawUploadStatus: The raw status object (needed for things like fuelGrades).
fuelGrades: Parsed fuel grade information.
useState(): Manages local component state for UI control:
step: Tracks the current stage in the fueling workflow ('pump', 'nozzle', 'vehicle', 'reg', 'scan', 'details').
selectedPump, selectedNozzle: User's pump/nozzle selection.
vehicleReg, selectedVehicleId, selectedTag: Vehicle/tag identification inputs/selections.
tagDetails, vehicleInfo: Information obtained after tag validation/selection.
isAuthorizing, isScanning, isLoading: Loading/in-progress flags.
scanResult: Result of a tag scan attempt.
showFuelingPopup, fuelingComplete, showNavigationDialog, showAllFuelingPopup, showFuelingRulePopup: Control popup visibility.
activePumpForPopup, activeNozzleForPopup: Store the context of the pump/nozzle currently being monitored in the progress/completion popups.
currentTransactionId: Stores the transaction ID received during authorization or from status updates.
amount, volume, selectedType: User inputs for fueling presets.
deviceConnectionStatus, isDeviceDisconnected: Tracks connection state.
4. Real-time Data Flow and Effects
SignalR -> Redux: The SignalRService receives uploadStatus messages for various devices. It dispatches the receiveUploadStatusUpdate action (defined in realtimeStatusActions.js).
Redux Reducer: The realtimeStatusReducer handles RECEIVE_UPLOAD_STATUS_UPDATE. It stores the raw status object and, importantly, parses the pump/probe/reader data into structured states like devicePumpStatus: { [deviceId]: { [pumpId]: {...parsedPumpState} } }.
Redux -> Hook: The useDeviceData hook selects the relevant parsed state (devicePumpStatus[ptsId]) and raw status (uploadStatusByDevice[deviceId]) from the Redux store. It computes derived values (availablePumps, activeFuelingProcesses, etc.) using useMemo.
Hook -> Component: The FuelingProcess component receives the processed data and helper functions from useDeviceData.
useEffect Reactions: Several useEffect hooks react to changes in the data provided by useDeviceData:
Popup Management: A useEffect monitors devicePumpStatus specifically for the activePumpForPopup. If the status changes to fueling, it shows the progress popup (showFuelingPopup). If it changes to endOfTransaction, it hides the progress popup and shows the completion popup (fuelingComplete).
Event Dispatching: Another useEffect compares the current devicePumpStatus with the previous status (stored in useRef) to detect transitions (idle->nozzleUp, nozzleUp->fueling, etc.). When transitions are detected, it dispatches createFuelingEvent.
Connection Monitoring: An effect monitors deviceConnectionStatus to set isDeviceDisconnected and potentially show warnings.
5. Backend Interactions (ptspumpActions.js & pumpControlService)
Authorize (startFueling):
Checks connection status and pump availability (getPumpDetails).
Gathers parameters: pumpId, nozzleId, preset type, dose (amount/volume), price, fuelGradeId, tag.
Calls pumpControlService.authorizePump(ptsId, authParams).
This service likely calls the authorizePump action thunk from ptspumpActions.js.
The action dispatches AUTHORIZE_PUMP_REQUEST, makes a POST request to /pump/authorize with the command body.
On success, dispatches AUTHORIZE_PUMP_SUCCESS and returns data (including transactionId). The component stores the transactionId, sets activePump/NozzleForPopup, and notifies the user.
On failure, dispatches AUTHORIZE_PUMP_FAILURE, throws an error, and the component notifies the user.
Stop (stopFueling):
Checks connection status and if the activePumpForPopup is actually fueling (getPumpDetails).
Calls pumpControlService.stopPump(ptsId, activePumpForPopup.id).
This service likely calls the stopPump action thunk.
The action dispatches STOP_PUMP_REQUEST, makes a POST request to /pump/{deviceId}/{pumpId}/stop.
On success/failure, dispatches corresponding actions (STOP_PUMP_SUCCESS/FAILURE) and returns/throws. The component notifies the user. UI changes (popup hiding) are driven by the subsequent endOfTransaction status update via SignalR.
Complete/Close (completeFueling):
Checks if activePumpForPopup is in endOfTransaction state and has a transactionId.
Calls pumpControlService.closeTransaction(ptsId, activePumpForPopup.id, transactionIdToClose).
This service likely calls the closeTransaction action thunk.
The action dispatches CLOSE_TRANSACTION_REQUEST, makes a POST request to /pump/{deviceId}/{pumpId}/close with the transaction ID.
On success/failure, dispatches corresponding actions (CLOSE_TRANSACTION_SUCCESS/FAILURE) and returns/throws. The component notifies the user.
Crucially, it calls startNewFueling() to hide the completion popup and reset the entire UI state back to the pump selection step.

UploadStatus Processing Flow
Reception (SignalR): The SignalR client (SignalRService) receives the UploadStatus JSON message from the backend. Let's assume the deviceId associated with the sample data is "PTS001".
Apply to customrulefr...
Action Dispatch (realtimeStatusActions.js):
SignalRService calls processUploadStatusUpdate(messageData).
processUploadStatusUpdate dispatches receiveUploadStatusUpdate({ deviceId: "PTS001", status: messageData.Data }).
Reducer Processing (realtimeStatusReducer - Inferred Logic):
The reducer handles the RECEIVE_UPLOAD_STATUS_UPDATE action.
It stores the raw status object: state.realtimeStatus.uploadStatusByDevice["PTS001"].status = messageData.Data.
It sets the timestamp: state.realtimeStatus.uploadStatusByDevice["PTS001"].receivedAt = new Date().
Crucially, it parses the Pumps object to update devicePumpStatus:
Initialize an empty object for this device: newState.devicePumpStatus["PTS001"] = {}.
Process IdleStatus:
Iterate through Ids: [1, 3].
For Id: 1 (index 0): Create pump1Data = { id: 1, status: "idle", nozzleUp: IdleStatus.NozzlesUp[0] (1), lastTransaction: IdleStatus.LastTransactions[0], ... Tag: IdleStatus.Tags[0] (if exists) }. Store as newState.devicePumpStatus["PTS001"]["1"] = pump1Data.
For Id: 3 (index 1): Create pump3Data = { id: 3, status: "idle", nozzleUp: IdleStatus.NozzlesUp[1] (0), ... Tag: IdleStatus.Tags[1] (if exists) }. Store as newState.devicePumpStatus["PTS001"]["3"] = pump3Data.
Process FillingStatus:
Iterate through Ids: [2].
For Id: 2 (index 0): Create pump2Data = { id: 2, status: "fueling", activeNozzle: FillingStatus.Nozzles[0] (2), currentTransaction: FillingStatus.Transactions[0] (2996), currentVolume: FillingStatus.Volumes[0] (43.80), currentAmount: FillingStatus.Amounts[0] (45.99), currentPrice: FillingStatus.Prices[0] (1.05), ... Tag: FillingStatus.Tags[0] (if exists) }. Store as newState.devicePumpStatus["PTS001"]["2"] = pump2Data.
Process EndOfTransactionStatus: (Empty in sample, nothing to process).
Process OfflineStatus:
Iterate through Ids: [4].
For Id: 4: Create pump4Data = { id: 4, status: "offline" }. Store as newState.devicePumpStatus["PTS001"]["4"] = pump4Data.
The resulting state.realtimeStatus would contain:
Apply to customrulefr...
Hook Consumption (useDeviceData):
When fuelingprocess.js calls useDeviceData("PTS001"):
The hook selects state.realtimeStatus.devicePumpStatus["PTS001"] (the parsed object above).
It selects state.realtimeStatus.uploadStatusByDevice["PTS001"].status (the raw status object).
It calculates availablePumps: [{ id: 1, name: "Pump 1", status: "idle", ... }, { id: 2, name: "Pump 2", status: "fueling", ... }, { id: 3, name: "Pump 3", status: "idle", ... }, { id: 4, name: "Pump 4", status: "offline", ... }] (sorted by ID).
It calculates activeFuelingProcesses: [{ pumpId: 2, pumpName: "Pump 2", nozzleId: 2, volume: 43.80, amount: 45.99, status: "fueling", transactionId: 2996, ... }].
The getPumpDetails(2) function would return the object: { id: 2, status: "fueling", activeNozzle: 2, ... }.
The getNozzlesForPump(1) function would return nozzles for pump 1, potentially marking nozzle 1 as lifted based on the nozzleUp: 1 status in the parsed data. It would get fuel types/prices by looking at the FuelGrades array within the raw status object.
The fuelGrades property of the hook would return the parsed FuelGrades array from the raw status: [{ id: 1, name: "Petrol", price: 27.50 }, { id: 2, name: "Diesel", price: 23.99 }].
UI Update (fuelingprocess.js):
The component receives the processed data from useDeviceData.
useEffect hooks trigger based on changes in devicePumpStatus["PTS001"].
If the component was monitoring Pump 2 in a popup (activePumpForPopup.id === 2), the progress popup would be shown/updated using the currentVolume: 43.80, currentAmount: 45.99 values obtained via getPumpDetails(2) or helper functions.
If Pump 1's status changed from idle with nozzleUp: 0 to idle with nozzleUp: 1 in this update, the event dispatching useEffect would detect this change and dispatch createFuelingEvent("nozzle", "PTS001", { pumpId: 1, nozzleNumber: 1, ... }).
The UI rendered by FuelingProcessRenderer would show:
Pump 1 tile: Status "Idle", potentially indicating nozzle 1 is lifted.
Pump 2 tile: Status "Fueling".
Pump 3 tile: Status "Idle".
Pump 4 tile: Status "Offline".
If the user selected Pump 2 in the "All Fueling Processes" popup, the details shown would reflect the fueling status and metrics (43.80L, $45.99).
This detailed flow shows how the raw UploadStatus data is systematically received, parsed by the reducer into a structured state, consumed and further processed by the useDeviceData hook, and finally used to drive the UI updates and event logging within the FuelingProcess component. The parser logic in the reducer is crucial for translating the parallel arrays from the raw status into a more usable per-pump state object.



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


b) UI State Machine Diagram (Simplified)
stateDiagram-v2
    [*] --> PumpSelection : Component Mount / Reset
    PumpSelection --> NozzleSelection : Pump Selected & Available
    NozzleSelection --> VehicleChoice : Nozzle Selected
    VehicleChoice --> ManualVehicleEntry : Choose Manual
    VehicleChoice --> TagScan : Choose Scan
    ManualVehicleEntry --> FuelingDetails : Vehicle Lookup/Entry & Tag Select Complete
    TagScan --> Scanning : Start Scan
    Scanning --> ValidatingTag : Tag Detected (via Status Update)
    Scanning --> VehicleChoice : Scan Cancelled / Timeout
    ValidatingTag --> FuelingDetails : Tag Valid & Accepted
    ValidatingTag --> Scanning : Validation Failed (Retry?)
    ValidatingTag --> VehicleChoice : Validation Failed (Cancel?)

    FuelingDetails --> Authorizing : Authorize Clicked
    Authorizing --> WaitingForNozzleLift : Authorize API Success
    Authorizing --> FuelingDetails : Authorize API Fail / Back
    WaitingForNozzleLift --> FuelingInProgress : Status Update: nozzleUp -> fueling
    FuelingInProgress --> FuelingComplete : Status Update: fueling -> endOfTransaction
    FuelingInProgress --> StoppingFueling : Stop Clicked
    StoppingFueling --> FuelingComplete : Stop API Success & Status Update: fueling -> endOfTransaction
    StoppingFueling --> FuelingInProgress : Stop API Fail
    FuelingComplete --> ClosingTransaction : Done Clicked
    ClosingTransaction --> PumpSelection : Close API Success / UI Reset
    ClosingTransaction --> FuelingComplete : Close API Fail (Stay on popup?)

    state FuelingInProgress {
        note right of FuelingInProgress : UI Shows Progress Popup (updated by status)
    }
    state FuelingComplete {
         note right of FuelingComplete : UI Shows Completion Popup
    }

    state "Any State" as S {
      S --> NavigationCheck : User tries to navigate away
    }
    NavigationCheck --> S : Fueling NOT in progress OR Cancel Navigation
    NavigationCheck --> [*] : Fueling IS in progress AND Confirm Navigation
    NavigationCheck -[dashed]-> FuelingInProgress : Check if fueling