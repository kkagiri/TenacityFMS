export const createInitialState = () => ({
    data: [],
    changes: [],
    editRowKey: null,
    isLoading: false,
    error: null,
  });
  
  export const dataGridReducer = () => (state, action) => {
    switch (action.type) {
      case 'FETCH_DATA_START':
        return { ...state, isLoading: true };
      case 'FETCH_DATA_SUCCESS':
        return { ...state, isLoading: false, data: action.payload, error: null };
      case 'FETCH_DATA_FAILURE':
        return { ...state, isLoading: false, error: action.payload };
      case 'SET_CHANGES':
        return { ...state, changes: action.payload };
      case 'SET_EDIT_ROW_KEY':
        return { ...state, editRowKey: action.payload };
      default:
        return state;
    }
  };

   