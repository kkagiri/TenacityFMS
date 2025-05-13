// Action types
export const TOGGLE_LIVE_DATA = "TOGGLE_LIVE_DATA";
export const SET_UPDATE_FREQUENCY = "SET_UPDATE_FREQUENCY";
export const RECEIVE_UPLOAD_STATUS_UPDATE = "RECEIVE_UPLOAD_STATUS_UPDATE";
export const PROBE_STATUS_UPDATE = "PROBE_STATUS_UPDATE";
export const READER_STATUS_UPDATE = "READER_STATUS_UPDATE";
export const UPDATE_DEVICE_WITH_REALTIME_DATA =
  "UPDATE_DEVICE_WITH_REALTIME_DATA";

// Action creators
export const toggleLiveData = () => ({
  type: TOGGLE_LIVE_DATA,
});

export const setUpdateFrequency = (frequency) => ({
  type: SET_UPDATE_FREQUENCY,
  payload: frequency,
});

/**
 * Action creator for receiving upload status updates from SignalR
 * This now only stores the raw data; parsing happens in the reducer.
 * @param {Object} data - Upload status data from SignalR
 * @param {string} data.deviceId - The device ID
 * @param {Object} data.status - The device status data containing pumps, probes, etc.
 */
export const receiveUploadStatusUpdate = (data) => ({
  type: RECEIVE_UPLOAD_STATUS_UPDATE,
  payload: data,
});

export const receiveProbeStatusUpdate = (data) => ({
  type: PROBE_STATUS_UPDATE,
  payload: data,
});

export const receiveReaderStatusUpdate = (data) => ({
  type: READER_STATUS_UPDATE,
  payload: data,
});

/**
 * Processes upload status data received from SignalR.
 * Dispatches action to store raw data (reducer handles parsing).
 * Optionally dispatches action to update general device info (battery, temp etc.).
 */
export const processUploadStatusUpdate = (data) => (dispatch, getState) => {
  if (!data || !data.deviceId || !data.status) {
    console.warn("[RealtimeStatus] Invalid upload status data received");
    return;
  }

  // Dispatch the raw upload status - Reducer will parse pump/probe/reader data

  dispatch(receiveUploadStatusUpdate(data));

  // Optionally, extract and update general system info if needed elsewhere
  // (e.g., for a device overview list, not the fueling process itself)
  // This part depends on whether another part of the app uses this general info.
  const systemInfo = {
    lastActivity: new Date().toISOString(),
    // Example: Extracting from the raw status payload if needed
    // batteryVoltage: data.status.batteryVoltage, // Direct access based on UploadStatus.cs
    // cpuTemperature: data.status.cpuTemperature,
    // ptsPowerDownDetected: data.status.ptsPowerDownDetected,
    // sdMounted: data.status.sdMounted,
    // ConfigurationId: data.status.configurationId,
    // DateTime: data.status.dateTime,
    // FirmwareDateTime: data.status.firmwareDateTime,
    // StartupSeconds: data.status.startupSeconds,
  };

  // Cursor: If you need to update a general device list with this info:
  // dispatch(updateDeviceWithRealtimeData(data.deviceId, systemInfo));

  // NO dispatch for UPDATE_DEVICE_UPLOAD_STATUS anymore
  // dispatch({
  //   type: UPDATE_DEVICE_UPLOAD_STATUS, // REMOVED
  //   payload: { /* ... */ },
  // });
};

// Thunk for updating the general device list with realtime data (battery, temp, etc.)
// Keep this if other parts of the app display this general info.
// If ONLY fueling process uses realtime data, this might be removable.
export const updateDeviceWithRealtimeData =
  (deviceId, realtimeData) => (dispatch, getState) => {
    const { realtimeStatus, ptsDevice } = getState(); // Ensure ptsDevice reducer exists and holds the list

    if (!realtimeStatus.isLiveDataEnabled) {
      return;
    }

    const deviceIndex = ptsDevice.ptsDeviceList.findIndex(
      (dev) => dev.ptsid === deviceId // Assuming ptsid is the key
    );

    if (deviceIndex > -1) {
      const device = ptsDevice.ptsDeviceList[deviceIndex];
      const updatedDevice = {
        ...device,
        lastActivity: realtimeData.lastActivity || device.lastActivity, // Update timestamp
        // Update other general fields from realtimeData if they exist
        ...(realtimeData.batteryVoltage !== undefined && {
          batteryVoltage: realtimeData.batteryVoltage,
        }),
        ...(realtimeData.cpuTemperature !== undefined && {
          cpuTemperature: realtimeData.cpuTemperature,
        }),
        ...(realtimeData.ptsPowerDownDetected !== undefined && {
          ptsPowerDownDetected: realtimeData.ptsPowerDownDetected,
        }),
        ...(realtimeData.sdMounted !== undefined && {
          sdMounted: realtimeData.sdMounted,
        }),
        // Add other fields from UploadStatus root level if needed
        ...(realtimeData.ConfigurationId !== undefined && {
          configurationId: realtimeData.ConfigurationId,
        }),
        ...(realtimeData.DateTime !== undefined && {
          dateTime: realtimeData.DateTime,
        }),
        ...(realtimeData.FirmwareDateTime !== undefined && {
          firmwareDateTime: realtimeData.FirmwareDateTime,
        }),
        ...(realtimeData.StartupSeconds !== undefined && {
          startupSeconds: realtimeData.StartupSeconds,
        }),
      };

      dispatch({
        type: UPDATE_DEVICE_WITH_REALTIME_DATA, // Ensure ptsDeviceReducer handles this type
        payload: updatedDevice,
      });
    } else {
      console.warn(
        `[RealtimeStatus] Device ${deviceId} not found in ptsDeviceList for general update.`
      );
    }
  };
