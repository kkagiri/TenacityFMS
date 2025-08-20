import axiosInstance from './../../api/axiosInstance';

export const FETCH_EMPLOYEES_REQUEST = 'FETCH_EMPLOYEES_REQUEST';
export const FETCH_EMPLOYEES_SUCCESS = 'FETCH_EMPLOYEES_SUCCESS';
export const FETCH_EMPLOYEES_FAILURE = 'FETCH_EMPLOYEES_FAILURE';
export const FETCH_EMPLOYEE_REQUEST = 'FETCH_EMPLOYEE_REQUEST';
export const FETCH_EMPLOYEE_SUCCESS = 'FETCH_EMPLOYEE_SUCCESS';
export const FETCH_EMPLOYEE_FAILURE = 'FETCH_EMPLOYEE_FAILURE';
export const CREATE_EMPLOYEE_REQUEST = 'CREATE_EMPLOYEE_REQUEST';
export const CREATE_EMPLOYEE_SUCCESS = 'CREATE_EMPLOYEE_SUCCESS';
export const CREATE_EMPLOYEE_FAILURE = 'CREATE_EMPLOYEE_FAILURE';
export const UPDATE_EMPLOYEE_REQUEST = 'UPDATE_EMPLOYEE_REQUEST';
export const UPDATE_EMPLOYEE_SUCCESS = 'UPDATE_EMPLOYEE_SUCCESS';
export const UPDATE_EMPLOYEE_FAILURE = 'UPDATE_EMPLOYEE_FAILURE';
export const DELETE_EMPLOYEE_REQUEST = 'DELETE_EMPLOYEE_REQUEST';
export const DELETE_EMPLOYEE_SUCCESS = 'DELETE_EMPLOYEE_SUCCESS';
export const DELETE_EMPLOYEE_FAILURE = 'DELETE_EMPLOYEE_FAILURE';
export const SEARCH_EMPLOYEES_REQUEST = 'SEARCH_EMPLOYEES_REQUEST';
export const SEARCH_EMPLOYEES_SUCCESS = 'SEARCH_EMPLOYEES_SUCCESS';
export const SEARCH_EMPLOYEES_FAILURE = 'SEARCH_EMPLOYEES_FAILURE';

// Action Creators
export const fetchEmployees = (active = true) => async (dispatch) => {
  dispatch({ type: FETCH_EMPLOYEES_REQUEST });
  try {
    const response = await axiosInstance.get(`/employee?active=${active}`);
    dispatch({ type: FETCH_EMPLOYEES_SUCCESS, payload: response.data });
    return { success: true, data: response.data };
  } catch (error) {
    dispatch({ type: FETCH_EMPLOYEES_FAILURE, payload: error.message });
    return { success: false, message: error.message };
  }
};

export const fetchEmployee = (id) => async (dispatch) => {
  dispatch({ type: FETCH_EMPLOYEE_REQUEST });
  try {
    const response = await axiosInstance.get(`/employee/${id}`);
    dispatch({ type: FETCH_EMPLOYEE_SUCCESS, payload: response.data });
  } catch (error) {
    dispatch({ type: FETCH_EMPLOYEE_FAILURE, payload: error.message });
  }
};

export const createEmployee = (employeeData) => async (dispatch) => {
  dispatch({ type: CREATE_EMPLOYEE_REQUEST });
  try {
    const newValues = {
      ...employeeData,
      employeestatus: "Active",
      vehicles: employeeData.vehicles || [] // Directly use the array of vehicle IDs
    };

    if (newValues.siteId == 0) {
      delete newValues.siteId;
    }

    const response = await axiosInstance.post('/employee', newValues);

    dispatch({ type: CREATE_EMPLOYEE_SUCCESS, payload: response.data });
    return response.data;
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message;
    dispatch({ type: CREATE_EMPLOYEE_FAILURE, payload: errorMessage });
  }
};

export const updateEmployee = (key, employeeData) => async (dispatch) => {

  dispatch({ type: UPDATE_EMPLOYEE_REQUEST });
  try {
    const updatedData = {
      ...employeeData,
      id: key,
      vehicles: employeeData.vehicles || [] // Directly use the array of vehicle IDs
    };

    if (updatedData.siteId === 0) {
      delete updatedData.siteId;
    }

    const response = await axiosInstance.put(`/employee/${key}`, updatedData);
    dispatch({ type: UPDATE_EMPLOYEE_SUCCESS, payload: response.data });
    return response.data;
  } catch (error) {
    dispatch({ type: UPDATE_EMPLOYEE_FAILURE, payload: error.message });
  }
};

export const deleteEmployee = (id) => async (dispatch) => {
  dispatch({ type: DELETE_EMPLOYEE_REQUEST });
  try {
    await axiosInstance.delete(`/employee/${id}`);
    dispatch({ type: DELETE_EMPLOYEE_SUCCESS, payload: id });
  } catch (error) {
    dispatch({ type: DELETE_EMPLOYEE_FAILURE, payload: error.message });
  }
};

// Quick search for employees (for autocomplete)
export const quickSearchEmployees = async (searchTerm, limit = 10) => {
  try {
    const response = await axiosInstance.get(`/employee/quick-search?searchTerm=${encodeURIComponent(searchTerm)}&limit=${limit}&active=true`);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Quick employee search error:', error);
    return { success: false, message: error.message, data: [] };
  }
};

// Search employees with filters
export const searchEmployees = (searchTerm, filters = {}) => async (dispatch) => {
  dispatch({ type: SEARCH_EMPLOYEES_REQUEST });
  try {
    const params = new URLSearchParams({
      searchTerm: searchTerm || '',
      limit: filters.limit || 50,
      active: filters.active !== undefined ? filters.active : true
    });

    if (filters.siteId) {
      params.append('siteId', filters.siteId);
    }

    const response = await axiosInstance.get(`/employee/search?${params.toString()}`);
    dispatch({ type: SEARCH_EMPLOYEES_SUCCESS, payload: response.data });
    return { success: true, data: response.data };
  } catch (error) {
    dispatch({ type: SEARCH_EMPLOYEES_FAILURE, payload: error.message });
    return { success: false, message: error.message };
  }
};