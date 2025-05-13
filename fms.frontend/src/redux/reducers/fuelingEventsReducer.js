//Cursor
const initialState = {
  events: [],
};

const fuelingEventsReducer = (state = initialState, action) => {
  switch (action.type) {
    case "FUELING_EVENT_ADD":
      return {
        ...state,
        events: [action.payload, ...state.events].slice(0, 100), // Keep last 100 events
      };

    case "FUELING_EVENT_CLEAR":
      return {
        ...state,
        events: [],
      };

    default:
      return state;
  }
};

export default fuelingEventsReducer;
