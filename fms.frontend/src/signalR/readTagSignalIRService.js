import { debounce } from "lodash";
import store from "../redux/store";
import { UPDATE_TAG_SUCCESS } from "../redux/actions/tagActions";
export const registerReadTagSignalIRService = (connection) => {
  const debouncedReadTagHandler = debounce(async (data) => {
    store.dispatch({
      type: UPDATE_TAG_SUCCESS,
      payload: data,
    });
  }, 500);

  connection.on("ReceiveRFIDTag", debouncedReadTagHandler);

  const debounceUploadStatusTagReadHandler = debounce(async (data) => {
    store.dispatch({
      type: UPDATE_TAG_SUCCESS,
      payload: data,
    });
  }, 500);

  connection.on("UploadstatusTagRead", debounceUploadStatusTagReadHandler);
};
