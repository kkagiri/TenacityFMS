import { FUELING_EVENT_TYPES } from "./types";

// Event type validation
const isValidEventType = (type) => {
  const validTypes = [
    "nozzle",
    "filling",
    "completed",
    "offline",
    "tag",
    "error",
  ];
  return validTypes.includes(type);
};

// Event data validation
const validateEventData = (type, data) => {
  switch (type) {
    case "nozzle":
      return data?.pumpId && data?.nozzleNumber;
    case "filling":
      return data?.pumpId && data?.transactionDetails;
    case "completed":
      return data?.pumpId && data?.transactionId;
    case "offline":
      return data?.pumpId;
    case "tag":
      return data?.pumpId && data?.tag;
    case "error":
      return data?.pumpId && data?.error;
    default:
      return false;
  }
};

export const addFuelingEvent = (eventData) => {
  if (!isValidEventType(eventData.type)) {
    console.error(`Invalid event type: ${eventData.type}`);
    return {
      type: FUELING_EVENT_TYPES.ERROR,
      payload: {
        error: `Invalid event type: ${eventData.type}`,
        timestamp: new Date().toISOString(),
      },
    };
  }

  if (!validateEventData(eventData.type, eventData.data)) {
    console.error(`Invalid event data for type: ${eventData.type}`);
    return {
      type: FUELING_EVENT_TYPES.ERROR,
      payload: {
        error: `Invalid event data for type: ${eventData.type}`,
        timestamp: new Date().toISOString(),
      },
    };
  }

  return {
    type: FUELING_EVENT_TYPES.ADD,
    payload: {
      ...eventData,
      timestamp: new Date().toISOString(),
      id: `${eventData.type}-${Date.now()}`,
    },
  };
};

export const clearFuelingEvents = () => ({
  type: FUELING_EVENT_TYPES.CLEAR,
});

// Helper function to create fueling events
export const createFuelingEvent = (type, deviceId, data) => {
  return addFuelingEvent({
    type,
    deviceId,
    data,
  });
};
