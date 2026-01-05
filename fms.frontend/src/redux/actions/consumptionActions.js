import axiosInstance from "./../../api/axiosInstance";

// Action Types
export const FETCH_CONSUMPTION_REQUEST = "FETCH_CONSUMPTION_REQUEST";
export const FETCH_CONSUMPTION_SUCCESS = "FETCH_CONSUMPTION_SUCCESS";
export const FETCH_CONSUMPTION_FAILURE = "FETCH_CONSUMPTION_FAILURE";
export const FETCH_VEHICLE_REFILLS_REQUEST = "FETCH_VEHICLE_REFILLS_REQUEST";
export const FETCH_VEHICLE_REFILLS_SUCCESS = "FETCH_VEHICLE_REFILLS_SUCCESS";
export const FETCH_VEHICLE_REFILLS_FAILURE = "FETCH_VEHICLE_REFILLS_FAILURE";
export const FETCH_HISTORY_CONSUMPTION_REQUEST =
  "FETCH_HISTORY_CONSUMPTION_REQUEST";
export const FETCH_HISTORY_CONSUMPTION_SUCCESS =
  "FETCH_HISTORY_CONSUMPTION_SUCCESS";
export const FETCH_HISTORY_CONSUMPTION_FAILURE =
  "FETCH_HISTORY_CONSUMPTION_FAILURE";
export const FETCH_CONSUMPTION_BY_ID_REQUEST =
  "FETCH_CONSUMPTION_BY_ID_REQUEST";
export const FETCH_CONSUMPTION_BY_ID_SUCCESS =
  "FETCH_CONSUMPTION_BY_ID_SUCCESS";
export const FETCH_CONSUMPTION_BY_ID_FAILURE =
  "FETCH_CONSUMPTION_BY_ID_FAILURE";
export const CREATE_CONSUMPTION_REQUEST = "CREATE_CONSUMPTION_REQUEST";
export const CREATE_CONSUMPTION_SUCCESS = "CREATE_CONSUMPTION_SUCCESS";
export const CREATE_CONSUMPTION_FAILURE = "CREATE_CONSUMPTION_FAILURE";
export const FETCH_CONSUMPTION_LIST_REQUEST = "FETCH_CONSUMPTION_LIST_REQUEST";
export const FETCH_CONSUMPTION_LIST_SUCCESS = "FETCH_CONSUMPTION_LIST_SUCCESS";
export const FETCH_CONSUMPTION_LIST_FAILURE = "FETCH_CONSUMPTION_LIST_FAILURE";
export const UPDATE_CONSUMPTION_REQUEST = "UPDATE_CONSUMPTION_REQUEST";
export const UPDATE_CONSUMPTION_SUCCESS = "UPDATE_CONSUMPTION_SUCCESS";
export const UPDATE_CONSUMPTION_FAILURE = "UPDATE_CONSUMPTION_FAILURE";
export const IMPORT_FUEL_REPORT_REQUEST = "IMPORT_FUEL_REPORT_REQUEST";
export const IMPORT_FUEL_REPORT_SUCCESS = "IMPORT_FUEL_REPORT_SUCCESS";
export const IMPORT_FUEL_REPORT_FAILURE = "IMPORT_FUEL_REPORT_FAILURE";
export const FETCH_PUMP_TRANSACTIONS_REQUEST =
  "FETCH_PUMP_TRANSACTIONS_REQUEST";
export const FETCH_PUMP_TRANSACTIONS_SUCCESS =
  "FETCH_PUMP_TRANSACTIONS_SUCCESS";
export const FETCH_PUMP_TRANSACTIONS_FAILURE =
  "FETCH_PUMP_TRANSACTIONS_FAILURE";

const formatDate = (date) => {
  return date.toISOString().split("T")[0]; // This will return date in 'YYYY-MM-DD' format
};

// Existing actions
export const fetchConsumptionByDateRange =
  (startDate, endDate) => async (dispatch) => {
    dispatch({ type: FETCH_CONSUMPTION_REQUEST });

    try {
      const formattedStartDate = formatDate(startDate);
      const formattedEndDate = formatDate(endDate);

      // Create instance with longer timeout for consumption data
      const response = await axiosInstance.get(
        `/consumption/manualRefills?startDate=${formattedStartDate}&endDate=${formattedEndDate}`,
        {
          timeout: 120000, // 2 minutes timeout for large data
        }
      );
      dispatch({ type: FETCH_CONSUMPTION_SUCCESS, payload: response.data });
    } catch (error) {
      dispatch({ type: FETCH_CONSUMPTION_FAILURE, payload: error.message });
    }
  };

// New filtered consumption action
export const fetchConsumptionByDateRangeFiltered =
  (startDate, endDate, filters = {}) =>
  async (dispatch) => {
    dispatch({ type: FETCH_CONSUMPTION_REQUEST });

    try {
      const formattedStartDate = formatDate(startDate);
      const formattedEndDate = formatDate(endDate);

      // Build query parameters
      const params = new URLSearchParams({
        startDate: formattedStartDate,
        endDate: formattedEndDate,
      });

      // Add filter parameters if they have values
      if (filters.vehicleType) {
        params.append("vehicleType", filters.vehicleType);
      }
      if (filters.hyoungNo) {
        params.append("hyoungNo", filters.hyoungNo);
      }
      if (filters.vehicleNumber) {
        params.append("vehicleNumber", filters.vehicleNumber);
      }
      if (filters.siteId) {
        params.append("siteId", filters.siteId.toString());
      }
      if (filters.driverId) {
        params.append("driverId", filters.driverId.toString());
      }

      // Create instance with longer timeout for consumption data
      const response = await axiosInstance.get(
        `/consumption/manualRefillsFiltered?${params.toString()}`,
        {
          timeout: 120000, // 2 minutes timeout for large data
        }
      );
      dispatch({ type: FETCH_CONSUMPTION_SUCCESS, payload: response.data });
    } catch (error) {
      dispatch({ type: FETCH_CONSUMPTION_FAILURE, payload: error.message });
    }
  };

export const fetchConsumptionByDateRangebySitId =
  (startDate, endDate, siteId) => async (dispatch) => {
    dispatch({ type: FETCH_CONSUMPTION_REQUEST });

    try {
      const formattedStartDate = formatDate(startDate);
      const formattedEndDate = formatDate(endDate);

      // Create instance with longer timeout for consumption data
      const response = await axiosInstance.get(
        `/consumption/manualRefillsbySiteId?startDate=${formattedStartDate}&endDate=${formattedEndDate}&siteId=${siteId}`,
        {
          timeout: 120000, // 2 minutes timeout for large data
        }
      );
      dispatch({ type: FETCH_CONSUMPTION_SUCCESS, payload: response.data });
    } catch (error) {
      dispatch({ type: FETCH_CONSUMPTION_FAILURE, payload: error.message });
    }
  };

export const fetchConsumptionByDateRangeByVehicleID =
  (startDate, endDate, vehicleId) => async (dispatch) => {
    dispatch({ type: FETCH_VEHICLE_REFILLS_REQUEST });

    try {
      const formattedStartDate = formatDate(startDate);
      const formattedEndDate = formatDate(endDate);

      // Create instance with longer timeout for vehicle refill data
      const response = await axiosInstance.get(
        `/consumption/vehicleRefills?startDate=${formattedStartDate}&endDate=${formattedEndDate}&vehicleId=${vehicleId}`,
        {
          timeout: 120000, // 2 minutes timeout for large data
        }
      );
      return dispatch({
        type: FETCH_VEHICLE_REFILLS_SUCCESS,
        payload: response.data,
      });
    } catch (error) {
      return dispatch({
        type: FETCH_VEHICLE_REFILLS_FAILURE,
        payload: error.message,
      });
    }
  }; // New actions based on ConsumptionController endpoints

/**
 * Fetch historical consumption data by vehicle
 * @param {number} vehicleId - Vehicle ID
 * @param {Date} date - Date for historical data
 * @param {number} entry - Number of days (5-30)
 */
export const fetchHistoryConsumptionByVehicle =
  (vehicleId, date, entry) => async (dispatch) => {
    dispatch({ type: FETCH_HISTORY_CONSUMPTION_REQUEST });

    try {
      const formattedDate = formatDate(date);

      const response = await axiosInstance.get(
        `/consumption/gethistoryconsumptionbyvehicle?vehicleId=${vehicleId}&datestring=${formattedDate}&entry=${entry}`
      );

      dispatch({
        type: FETCH_HISTORY_CONSUMPTION_SUCCESS,
        payload: response.data,
      });

      return { success: true, data: response.data };
    } catch (error) {
      dispatch({
        type: FETCH_HISTORY_CONSUMPTION_FAILURE,
        payload: error.response?.data?.message || error.message,
      });

      return {
        success: false,
        message: error.response?.data?.message || error.message,
      };
    }
  };

/**
 * Fetch consumption by ID
 * @param {number} id - Consumption ID
 */
export const fetchConsumptionById = (id) => async (dispatch) => {
  dispatch({ type: FETCH_CONSUMPTION_BY_ID_REQUEST });

  try {
    const response = await axiosInstance.get(`/consumption/getbyid?id=${id}`);

    dispatch({
      type: FETCH_CONSUMPTION_BY_ID_SUCCESS,
      payload: response.data,
    });
  } catch (error) {
    dispatch({
      type: FETCH_CONSUMPTION_BY_ID_FAILURE,
      payload: error.response?.data?.message || error.message,
    });
  }
};

/**
 * Create new consumption record
 * @param {Object} consumptionData - Consumption data to create
 */
export const createConsumption = (consumptionData) => async (dispatch) => {
  dispatch({ type: CREATE_CONSUMPTION_REQUEST });

  try {
    const response = await axiosInstance.post(
      "/consumption/Create",
      consumptionData
    );

    dispatch({
      type: CREATE_CONSUMPTION_SUCCESS,
      payload: response.data,
    });

    return response.data;
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message;
    dispatch({
      type: CREATE_CONSUMPTION_FAILURE,
      payload: errorMessage,
    });
    throw error;
  }
};

/**
 * Fetch consumption list with pagination
 * @param {number} pagingNo - Number of records to fetch (max 5000)
 */
export const fetchConsumptionList =
  (pagingNo = 200) =>
  async (dispatch) => {
    dispatch({ type: FETCH_CONSUMPTION_LIST_REQUEST });

    try {
      const response = await axiosInstance.get(
        `/consumption/getlist?pagingNo=${pagingNo}`
      );

      dispatch({
        type: FETCH_CONSUMPTION_LIST_SUCCESS,
        payload: response.data,
      });
    } catch (error) {
      dispatch({
        type: FETCH_CONSUMPTION_LIST_FAILURE,
        payload: error.response?.data?.message || error.message,
      });
    }
  };

/**
 * Update consumption record
 * @param {number} id - Consumption ID
 * @param {Object} consumptionData - Updated consumption data
 */
export const updateConsumption = (id, consumptionData) => async (dispatch) => {
  dispatch({ type: UPDATE_CONSUMPTION_REQUEST });

  try {
    const response = await axiosInstance.put(
      `/consumption/Update/${id}`,
      consumptionData
    );

    dispatch({
      type: UPDATE_CONSUMPTION_SUCCESS,
      payload: { id, data: response.data },
    });

    return response.data;
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message;
    dispatch({
      type: UPDATE_CONSUMPTION_FAILURE,
      payload: errorMessage,
    });
    throw error;
  }
};

/**
 * Import fuel report with multiple consumption records
 * @param {Array} consumptions - Array of consumption records
 * @param {boolean} overwriteExisting - Whether to overwrite existing records
 * @param {boolean} skipDuplicates - Whether to skip duplicate records
 */
export const importFuelReport =
  (consumptions, overwriteExisting = false, skipDuplicates = false) =>
  async (dispatch) => {
    dispatch({ type: IMPORT_FUEL_REPORT_REQUEST });

    try {
      const requestData = {
        consumptions,
        overwriteExisting,
        skipDuplicates,
      };

      const response = await axiosInstance.post(
        "/consumption/import",
        requestData
      );

      dispatch({
        type: IMPORT_FUEL_REPORT_SUCCESS,
        payload: response.data,
      });

      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      const validationErrors = error.response?.data?.validationErrors || [];

      dispatch({
        type: IMPORT_FUEL_REPORT_FAILURE,
        payload: {
          message: errorMessage,
          validationErrors: validationErrors,
        },
      });
      throw error;
    }
  };

// Action creators for clearing states
export const clearConsumptionById = () => ({
  type: "CLEAR_CONSUMPTION_BY_ID",
});

export const clearHistoryConsumption = () => ({
  type: "CLEAR_HISTORY_CONSUMPTION",
});

export const clearImportResults = () => ({
  type: "CLEAR_IMPORT_RESULTS",
});

/**
 * Fetch pump transactions with comprehensive filtering
 * @param {Object} filters - Filter parameters object
 * @param {number} filters.vehicleId - Vehicle ID to filter by
 * @param {string} filters.ptsId - PTS device identifier
 * @param {number} filters.tankId - Tank ID to filter by
 * @param {Date} filters.startDate - Start date for filtering
 * @param {Date} filters.endDate - End date for filtering
 * @param {boolean} filters.processedOnly - Filter by processing status
 */
export const fetchPumpTransactions =
  (filters = {}) =>
  async (dispatch) => {
    // Convert Date objects to ISO strings for serializable state
    const serializableFilters = {
      ...filters,
      startDate: filters.startDate
        ? filters.startDate.toISOString()
        : undefined,
      endDate: filters.endDate ? filters.endDate.toISOString() : undefined,
    };

    dispatch({
      type: FETCH_PUMP_TRANSACTIONS_REQUEST,
      filters: serializableFilters,
    });

    try {
      // Build query parameters - handle both singular and array parameters
      const params = new URLSearchParams();

      // Handle single or array of vehicleIds
      if (filters.vehicleId) {
        params.append("vehicleId", filters.vehicleId);
      } else if (filters.vehicleIds && filters.vehicleIds.length > 0) {
        filters.vehicleIds.forEach((id) => params.append("vehicleId", id));
      }

      // Handle single or array of ptsIds
      if (filters.ptsId) {
        params.append("ptsId", filters.ptsId);
      } else if (filters.ptsIds && filters.ptsIds.length > 0) {
        filters.ptsIds.forEach((id) => params.append("ptsId", id));
      }

      // Handle single or array of tankIds
      if (filters.tankId) {
        params.append("tankId", filters.tankId);
      } else if (filters.tankIds && filters.tankIds.length > 0) {
        filters.tankIds.forEach((id) => params.append("tankId", id));
      }

      // Handle single or array of siteIds
      if (filters.siteId) {
        params.append("siteId", filters.siteId);
      } else if (filters.siteIds && filters.siteIds.length > 0) {
        filters.siteIds.forEach((id) => params.append("siteId", id));
      }

      if (filters.startDate)
        params.append("startDate", filters.startDate.toISOString());
      if (filters.endDate)
        params.append("endDate", filters.endDate.toISOString());
      if (filters.processedOnly !== undefined)
        params.append("processedOnly", filters.processedOnly);

      const queryString = params.toString();
      const url = `/consumption/pumptransactions${
        queryString ? `?${queryString}` : ""
      }`;

      const response = await axiosInstance.get(url);

      // Handle FMSResponse format
      if (response.data && response.data.isSuccess) {
        dispatch({
          type: FETCH_PUMP_TRANSACTIONS_SUCCESS,
          payload: response.data.data || response.data,
        });
        return { success: true, data: response.data.data || response.data };
      } else {
        const errorMessage =
          response.data.message || "Failed to fetch pump transactions";
        dispatch({
          type: FETCH_PUMP_TRANSACTIONS_FAILURE,
          payload: errorMessage,
        });
        return { success: false, message: errorMessage };
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      dispatch({
        type: FETCH_PUMP_TRANSACTIONS_FAILURE,
        payload: errorMessage,
      });
      return { success: false, message: errorMessage };
    }
  };

/**
 * Fetch pump transactions by vehicle ID with date range
 * @param {number} vehicleId - Vehicle ID
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 */
export const fetchPumpTransactionsByVehicle = (
  vehicleId,
  startDate,
  endDate
) => {
  return fetchPumpTransactions({
    vehicleId,
    startDate,
    endDate,
  });
};

/**
 * Fetch pump transactions by tank ID with date range
 * @param {number} tankId - Tank ID
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 */
export const fetchPumpTransactionsByTank = (tankId, startDate, endDate) => {
  return fetchPumpTransactions({
    tankId,
    startDate,
    endDate,
  });
};

/**
 * Fetch unprocessed pump transactions
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 */
export const fetchUnprocessedPumpTransactions = (startDate, endDate) => {
  return fetchPumpTransactions({
    startDate,
    endDate,
    processedOnly: false,
  });
};

/**
 * Clear pump transactions data
 */
export const clearPumpTransactions = () => ({
  type: "CLEAR_PUMP_TRANSACTIONS",
});
