/**
 * SignalR Redux Middleware
 * Prevents unnecessary Redux updates from SignalR by:
 * 1. Deep comparing previous and new data
 * 2. Batching multiple updates
 * 3. Throttling high-frequency updates
 */

import { isEqual } from 'lodash';

// Store previous payloads to detect actual changes
const previousPayloads = new Map();

// Batch queue for multiple rapid updates
let updateQueue = [];
let batchTimer = null;
const BATCH_DELAY = 100; // ms

/**
 * Check if the payload has actually changed
 */
const hasPayloadChanged = (actionType, payload) => {
  const previousPayload = previousPayloads.get(actionType);

  if (!previousPayload) {
    previousPayloads.set(actionType, payload);
    return true;
  }

  const hasChanged = !isEqual(previousPayload, payload);

  if (hasChanged) {
    previousPayloads.set(actionType, payload);
  }

  return hasChanged;
};

/**
 * SignalR-specific action types that should be filtered
 */
const SIGNALR_ACTION_TYPES = [
  'UPDATE_KEY_STATISTICS',
  'UPDATE_ENHANCED_WIDGET_DATA',
  'UPDATE_WIDGET_CONFIGURATION',
  'UPDATE_CATEGORY_WIDGETS',
  'UPDATE_WIDGET_VALIDATION',
  'UPDATE_WIDGET_DATA',
  'UPDATE_INITIAL_WIDGET_DATA',
  'UPDATE_DATA_SOURCE',
  'UPDATE_METRIC_DATA',
  'UPDATE_TICKER_DATA',
  'UPDATE_GRAPH_DATA',
  'UPDATE_DASHBOARD_LAYOUT',
  'FETCH_DASHBOARD_METRICS_SUCCESS',
  'INCREMENT_FUEL_DISPENSED',
  'ADD_NOTIFICATION',
  'UPDATE_ACTIVE_ALARM_SUMMARY',
  // Tank Stock related actions
  'UPDATE_TANK_STOCK_DATA',
  'UPDATE_TANK_LEVELS',
  'UPDATE_STOCK_SUMMARY',
  // Vehicle related actions
  'UPDATE_VEHICLE_DATA',
  'UPDATE_VEHICLE_STATUS',
  'UPDATE_VEHICLE_LOCATION',
  // PTS related actions
  'UPDATE_PTS_TRANSACTION',
  'UPDATE_FUELING_STATUS',
  'UPDATE_DISPENSER_STATUS'
];

/**
 * Actions that should never be batched (critical updates)
 */
const CRITICAL_ACTIONS = [
  'UPDATE_WIDGET_CONFIGURATION',
  'UPDATE_DASHBOARD_LAYOUT',
  'ADD_NOTIFICATION',
  'UPDATE_WIDGET_VALIDATION'
];

/**
 * Actions that should be throttled more aggressively
 */
const HIGH_FREQUENCY_ACTIONS = [
  'UPDATE_KEY_STATISTICS',
  'UPDATE_METRIC_DATA',
  'UPDATE_TICKER_DATA',
  'INCREMENT_FUEL_DISPENSED',
  'UPDATE_TANK_LEVELS',
  'UPDATE_VEHICLE_LOCATION',
  'UPDATE_DISPENSER_STATUS'
];

const signalRReduxMiddleware = (store) => (next) => (action) => {
  // Only process SignalR actions
  if (!SIGNALR_ACTION_TYPES.includes(action.type)) {
    return next(action);
  }

  // Check if payload has actually changed
  const hasChanged = hasPayloadChanged(action.type, action.payload);

  if (!hasChanged) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[SignalR Middleware] Skipping duplicate action: ${action.type}`);
    }
    return; // Don't dispatch if nothing changed
  }

  // Critical actions bypass batching
  if (CRITICAL_ACTIONS.includes(action.type)) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[SignalR Middleware] Critical action dispatched immediately: ${action.type}`);
    }
    return next(action);
  }

  // For high-frequency actions, add to batch queue
  if (HIGH_FREQUENCY_ACTIONS.includes(action.type)) {
    updateQueue.push(action);

    // Clear existing timer
    if (batchTimer) {
      clearTimeout(batchTimer);
    }

    // Set new timer to process batch
    batchTimer = setTimeout(() => {
      if (updateQueue.length > 0) {
        if (process.env.NODE_ENV === 'development') {
          console.log(`[SignalR Middleware] Processing batch of ${updateQueue.length} actions`);
        }

        // Group actions by type and only keep the latest of each
        const latestActions = new Map();
        updateQueue.forEach(action => {
          latestActions.set(action.type, action);
        });

        // Dispatch all unique actions
        latestActions.forEach(action => {
          next(action);
        });

        updateQueue = [];
      }
      batchTimer = null;
    }, BATCH_DELAY);

    return;
  }

  // Default: dispatch action normally
  return next(action);
};

/**
 * Clear cached payloads (useful for testing or manual refresh)
 */
export const clearSignalRCache = () => {
  previousPayloads.clear();
  if (process.env.NODE_ENV === 'development') {
    console.log('[SignalR Middleware] Cache cleared');
  }
};

/**
 * Force flush pending batched updates
 */
export const flushSignalRUpdates = (store) => {
  if (batchTimer) {
    clearTimeout(batchTimer);
    batchTimer = null;
  }

  if (updateQueue.length > 0) {
    console.log(`[SignalR Middleware] Force flushing ${updateQueue.length} updates`);

    const latestActions = new Map();
    updateQueue.forEach(action => {
      latestActions.set(action.type, action);
    });

    latestActions.forEach(action => {
      store.dispatch(action);
    });

    updateQueue = [];
  }
};

export default signalRReduxMiddleware;
