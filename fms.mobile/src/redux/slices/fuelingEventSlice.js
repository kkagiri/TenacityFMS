import {createSlice} from '@reduxjs/toolkit';

const initialState = {
  events: [],
  activeEvents: [],
  recentEvents: [],
  eventHistory: [],
};

const fuelingEventSlice = createSlice({
  name: 'fuelingEvent',
  initialState,
  reducers: {
    addEvent: (state, action) => {
      const event = {
        ...action.payload,
        id: Date.now(),
        timestamp: new Date().toISOString(),
      };
      state.events.unshift(event);
      state.recentEvents.unshift(event);

      // Keep only last 50 events
      if (state.events.length > 50) {
        state.events = state.events.slice(0, 50);
      }

      // Keep only last 10 recent events
      if (state.recentEvents.length > 10) {
        state.recentEvents = state.recentEvents.slice(0, 10);
      }
    },

    addActiveEvent: (state, action) => {
      const existingIndex = state.activeEvents.findIndex(
        e => e.transactionId === action.payload.transactionId
      );

      if (existingIndex >= 0) {
        state.activeEvents[existingIndex] = action.payload;
      } else {
        state.activeEvents.push(action.payload);
      }
    },

    removeActiveEvent: (state, action) => {
      state.activeEvents = state.activeEvents.filter(
        e => e.transactionId !== action.payload
      );
    },

    updateActiveEvent: (state, action) => {
      const index = state.activeEvents.findIndex(
        e => e.transactionId === action.payload.transactionId
      );

      if (index >= 0) {
        state.activeEvents[index] = {
          ...state.activeEvents[index],
          ...action.payload,
        };
      }
    },

    clearEvents: (state) => {
      state.events = [];
      state.recentEvents = [];
    },

    clearActiveEvents: (state) => {
      state.activeEvents = [];
    },
  },
});

export const {
  addEvent,
  addActiveEvent,
  removeActiveEvent,
  updateActiveEvent,
  clearEvents,
  clearActiveEvents,
} = fuelingEventSlice.actions;

export default fuelingEventSlice.reducer;