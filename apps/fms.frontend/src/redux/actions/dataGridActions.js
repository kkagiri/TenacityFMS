export const setChanges = (dispatch, changes) => {
    dispatch({ type: 'SET_CHANGES', payload: changes });
  };
  
  export const setEditRowKey = (dispatch, editRowKey) => {
    dispatch({ type: 'SET_EDIT_ROW_KEY', payload: editRowKey });
  };
  
  export const fetchDataStart = (dispatch) => {
    dispatch({ type: 'FETCH_DATA_START' });
  };
  
  export const fetchDataSuccess = (dispatch, data) => {
    dispatch({ type: 'FETCH_DATA_SUCCESS', payload: data });
  };
  
  export const fetchDataFailure = (dispatch, error) => {
    dispatch({ type: 'FETCH_DATA_FAILURE', payload: error });
  };
  