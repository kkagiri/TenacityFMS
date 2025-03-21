// Action types
export const TOGGLE_LIVE_DATA = "TOGGLE_LIVE_DATA";
export const SET_UPDATE_FREQUENCY = "SET_UPDATE_FREQUENCY";

// Action creators
export const toggleLiveData = () => ({
  type: TOGGLE_LIVE_DATA,
});

export const setUpdateFrequency = (frequency) => ({
  type: SET_UPDATE_FREQUENCY,
  payload: frequency,
});

// Thunk for updating the device with realtime data
export const updateDeviceWithRealtimeData =
  (deviceId, realtimeData) => (dispatch, getState) => {
    const { realtimeStatus, ptsDevice } = getState();

    // Only update if live data is enabled
    if (!realtimeStatus.isLiveDataEnabled) {
      return;
    }

    // Find the device in the list
    const device = ptsDevice.ptsDeviceList.find(
      (dev) => dev.id === deviceId || dev.ptsid === deviceId
    );

    if (device) {
      // Update the device with realtime data
      const updatedDevice = {
        ...device,
        lastActivity: new Date().toISOString(),
        batteryVoltage: realtimeData.batteryVoltage || device.batteryVoltage,
        cpuTemperature: realtimeData.cpuTemperature || device.cpuTemperature,
        ptsPowerDownDetected:
          realtimeData.ptsPowerDownDetected ?? device.ptsPowerDownDetected,
        sdMounted: realtimeData.sdMounted ?? device.sdMounted,
        // Add more fields as needed
      };

      // Dispatch an action to update the device in ptsDeviceList
      dispatch({
        type: "UPDATE_DEVICE_WITH_REALTIME_DATA",
        payload: updatedDevice,
      });
    }
  };
