import { debounce } from "lodash";
import store from "../store";
import {
  NOZZLE_STATE_CHANGE,
  UPLOADSTATUS_TAG_READ,
  FILLING_STATUS_UPDATE,
  PUMP_TRANSACTION_COMPLETED,
  PUMP_OFFLINE,
} from "../redux/actions/types";

export const registerPumpSignalIRService = (connection) => {
  const debounceNozzleStateChangeHandler = debounce(async (data) => {
    store.dispatch({
      type: NOZZLE_STATE_CHANGE,
      payload: data,
    });
  }, 500);

  connection.on("NozzleStateChange", debounceNozzleStateChangeHandler);

  const debouncePumpTransactionCompleted = debounce(async (data) => {
    store.dispatch({
      type: PUMP_TRANSACTION_COMPLETED,
      payload: data,
    });
  }, 500);

  connection.on("PumpTransactionCompleted", debouncePumpTransactionCompleted);

  const debounceFillingStatusHandler = debounce(async (data) => {
    store.dispatch({
      type: FILLING_STATUS_UPDATE,
      payload: data,
    });
  }, 500);

  connection.on("FillingStatus", debounceFillingStatusHandler);

  const debouncePumpOfflineHandler = debounce(async (data) => {
    store.dispatch({
      type: PUMP_OFFLINE,
      payload: data,
    });
  }, 500);

  connection.on("PumpOffline", debouncePumpOfflineHandler);
};
