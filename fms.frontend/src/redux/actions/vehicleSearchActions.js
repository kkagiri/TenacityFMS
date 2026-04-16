import axiosInstance from "../../api/axiosInstance";

const normalizeSearchTerm = (value) => typeof value === "string" ? value.trim() : value;
const resolveSuccess = (result) => Boolean(result?.success ?? result?.Success ?? result?.isSuccess ?? result?.IsSuccess);
const resolveData = (result) => result?.data || result?.Data || [];
const resolveMessage = (result) => result?.message || result?.Message || '';

// Action types for vehicle search
export const SEARCH_VEHICLES_REQUEST = "SEARCH_VEHICLES_REQUEST";
export const SEARCH_VEHICLES_SUCCESS = "SEARCH_VEHICLES_SUCCESS";
export const SEARCH_VEHICLES_FAILURE = "SEARCH_VEHICLES_FAILURE";
export const CLEAR_SEARCH_RESULTS = "CLEAR_SEARCH_RESULTS";

// Search vehicles action
export const searchVehicles = (searchTerm, filters = {}) => async (dispatch) => {
  try {
    const normalizedSearchTerm = normalizeSearchTerm(searchTerm);
    dispatch({ type: SEARCH_VEHICLES_REQUEST });

    // Use the backend search endpoint
    const response = await axiosInstance.get('/vehicle/search', {
      params: {
        searchTerm: normalizedSearchTerm,
        ...filters
      }
    });

    const result = response.data;
    console.log('Search vehicles response:', result); // Debug log

    // Handle both camelCase and PascalCase properties
    const isSuccess = resolveSuccess(result);
    const data = resolveData(result);
    const message = resolveMessage(result);

    if (isSuccess) {
      dispatch({
        type: SEARCH_VEHICLES_SUCCESS,
        payload: data
      });

      return {
        success: true,
        data: data,
        message: message
      };
    } else {
      dispatch({
        type: SEARCH_VEHICLES_FAILURE,
        payload: message
      });

      return {
        success: false,
        data: [],
        message: message
      };
    }
  } catch (error) {
    console.error('Error searching vehicles:', error);
    console.error('Error response:', error.response?.data); // Additional debug info
    const errorMessage = error.response?.data?.message || error.response?.data?.Message || error.message || 'Failed to search vehicles';

    dispatch({
      type: SEARCH_VEHICLES_FAILURE,
      payload: errorMessage
    });

    return {
      success: false,
      data: [],
      message: errorMessage
    };
  }
};

// Clear search results action
export const clearSearchResults = () => ({
  type: CLEAR_SEARCH_RESULTS
});

// Advanced search with multiple criteria
export const advancedVehicleSearch = (criteria) => async (dispatch) => {
  try {
    dispatch({ type: SEARCH_VEHICLES_REQUEST });

    // Use the backend advanced search endpoint
    const response = await axiosInstance.get('/vehicle/search', {
      params: {
        searchTerm: criteria.searchTerm || '',
        vehicleType: criteria.vehicleType,
        manufacturer: criteria.manufacturer,
        status: criteria.status,
        model: criteria.model,
        isActive: criteria.isActive,
        limit: criteria.limit || 50
      }
    });

    const result = response.data;
    if (resolveSuccess(result)) {
      dispatch({
        type: SEARCH_VEHICLES_SUCCESS,
        payload: resolveData(result)
      });

      return {
        success: true,
        data: resolveData(result),
        message: resolveMessage(result)
      };
    } else {
      dispatch({
        type: SEARCH_VEHICLES_FAILURE,
        payload: resolveMessage(result)
      });

      return {
        success: false,
        data: [],
        message: resolveMessage(result)
      };
    }
  } catch (error) {
    console.error('Error in advanced vehicle search:', error);
    const errorMessage = error.response?.data?.message || error.message || 'Failed to perform advanced search';

    dispatch({
      type: SEARCH_VEHICLES_FAILURE,
      payload: errorMessage
    });

    return {
      success: false,
      data: [],
      message: errorMessage
    };
  }
};

// Quick search for vehicle suggestions (autocomplete)
export const quickSearchVehicles = async (searchTerm, limit = 10) => {
  try {
    if (!searchTerm || searchTerm.trim().length < 2) {
      return {
        success: true,
        data: []
      };
    }

    const response = await axiosInstance.get('/vehicle/quick-search', {
      params: {
        searchTerm: searchTerm.trim(),
        limit
      },
    });

    console.log('Quick search response:', response.data); // Debug log

    // Handle both camelCase (data) and PascalCase (Data) properties
    const responseData = resolveData(response.data);
    const isSuccess = resolveSuccess(response.data);

    if (isSuccess) {
      return {
        success: true,
        data: responseData
      };
    } else {
      return {
        success: false,
        data: [],
        error: resolveMessage(response.data) || 'Search failed'
      };
    }
  } catch (error) {
    console.error('Error in quick vehicle search:', error);
    console.error('Error response:', error.response?.data); // Additional debug info
    const errorMessage = error.response?.data?.message || error.response?.data?.Message || error.message || 'Quick search failed';

    return {
      success: false,
      error: errorMessage,
      data: []
    };
  }
};



// Search vehicles by plate number
export const searchVehiclesByPlate = (plateNumber) => async (dispatch) => {
  try {
    dispatch({ type: SEARCH_VEHICLES_REQUEST });

    const response = await axiosInstance.get('/vehicle/search-by-plate', {
      params: { plateNumber },
    });

    dispatch({
      type: SEARCH_VEHICLES_SUCCESS,
      payload: {
        results: response.data.data || [],
        searchTerm: plateNumber,
        totalCount: response.data.data?.length || 0
      },
    });

    return { success: true, data: response.data.data || [] };
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message || 'Plate search failed';

    dispatch({
      type: SEARCH_VEHICLES_FAILURE,
      payload: {
        error: errorMessage,
        searchTerm: plateNumber
      },
    });

    return { success: false, error: errorMessage };
  }
};

// Search vehicles by Hyoung number
export const searchVehiclesByHyoungNo = (hyoungNo) => async (dispatch) => {
  const normalizedHyoungNo = normalizeSearchTerm(hyoungNo);

  try {
    dispatch({ type: SEARCH_VEHICLES_REQUEST });

    const response = await axiosInstance.get('/vehicle/search-by-hyoung', {
      params: { hyoungNo: normalizedHyoungNo },
    });

    dispatch({
      type: SEARCH_VEHICLES_SUCCESS,
      payload: {
        results: response.data.data || [],
        searchTerm: normalizedHyoungNo,
        totalCount: response.data.data?.length || 0
      },
    });

    return { success: true, data: response.data.data || [] };
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message || 'Hyoung number search failed';

    dispatch({
      type: SEARCH_VEHICLES_FAILURE,
      payload: {
        error: errorMessage,
        searchTerm: normalizedHyoungNo
      },
    });

    return { success: false, error: errorMessage };
  }
};