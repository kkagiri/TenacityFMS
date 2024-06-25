import {
    FETCH_EMPLOYEES_SUCCESS,
    FETCH_EMPLOYEES_FAILURE,
  } from '../actions/employeeActions';
  
  const initialState = {
    employees: [],
    loading: true,
    error: null,
  };
  
  const employeeReducer = (state = initialState, action) => {
    switch (action.type) {
      case FETCH_EMPLOYEES_SUCCESS:
        return {
          ...state,
          employees: action.payload,
          loading: false,
          error: null,
        };
      case FETCH_EMPLOYEES_FAILURE:
        return {
          ...state,
          loading: false,
          error: action.payload,
        };
      default:
        return state;
    }
  };
  
  export default employeeReducer;
  