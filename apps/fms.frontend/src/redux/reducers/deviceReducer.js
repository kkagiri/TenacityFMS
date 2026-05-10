import { FETCH_ONLINE_DEVICES_SUCCESS, SET_LOADING } from "../actions/types";

const initialState = {
  deviceSummary: {
    webSocketConnections: [],
    httpConnections: [],
  },
  loading: false,
};

export default function deviceReducer(state = initialState, action) {
  switch (action.type) {
    case FETCH_ONLINE_DEVICES_SUCCESS:
      return {
        ...state,
        deviceSummary: action.payload,
        loading: false,
      };
    case SET_LOADING:
      return {
        ...state,
        loading: true,
      };
    default:
      return state;
  }
}
