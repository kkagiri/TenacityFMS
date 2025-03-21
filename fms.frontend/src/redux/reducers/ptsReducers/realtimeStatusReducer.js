import { RECEIVE_UPLOAD_STATUS_UPDATE } from "../../actions/types";

const initialState = {
  isLiveDataEnabled: true,
  updateFrequency: 30, // default 30 seconds
  uploadStatusUpdates: {}, // Store updates by device ID
  lastUpdated: null,
};

const realtimeStatusReducer = (state = initialState, action) => {
  switch (action.type) {
    case RECEIVE_UPLOAD_STATUS_UPDATE:
      const { deviceId, status } = action.payload;
      return {
        ...state,
        uploadStatusUpdates: {
          ...state.uploadStatusUpdates,
          [deviceId]: {
            ...status,
            receivedAt: new Date().toISOString(),
          },
        },
        lastUpdated: new Date().toISOString(),
      };

    case "TOGGLE_LIVE_DATA":
      return {
        ...state,
        isLiveDataEnabled: !state.isLiveDataEnabled,
      };

    case "SET_UPDATE_FREQUENCY":
      return {
        ...state,
        updateFrequency: action.payload,
      };

    default:
      return state;
  }
};

export default realtimeStatusReducer;
