import axiosInstance from "../../api/axiosInstance";
import {
  FETCH_ATG_DASHBOARD_START,
  FETCH_ATG_DASHBOARD_SUCCESS,
  FETCH_ATG_DASHBOARD_ERROR,
  FETCH_PTS_DEVICE_START,
  FETCH_PTS_DEVICE_SUCCESS,
  FETCH_PTS_DEVICE_ERROR,
  START_FUELING_TRANSACTION,
  START_FUELING_TRANSACTION_SUCCESS,
  START_FUELING_TRANSACTION_ERROR,
  COMPLETE_FUELING_TRANSACTION,
  COMPLETE_FUELING_TRANSACTION_SUCCESS,
  COMPLETE_FUELING_TRANSACTION_ERROR,
} from "../types/atgTypes";

// Fetch Dashboard Data
export const fetchATGDashboard = () => async (dispatch) => {
  dispatch({ type: FETCH_ATG_DASHBOARD_START });

  try {
    // In a real implementation, this would be:
    // const response = await axiosInstance.get('/api/atg/dashboard');
    // const data = response.data;

    // For demo purposes, we'll simulate the API response
    const data = {
      summary: {
        fuelDispensed: { value: "12,450", unit: "L", change: "+2.5%" },
        tankLevels: { value: "45,000", unit: "L", change: "-1.2%" },
        fuelPrice: { value: "1.85", unit: "$/L", change: "+0.3%" },
        onlinePumps: { value: "24", unit: "Active", change: "96%" },
      },
      ptsDevices: [
        {
          id: 1,
          name: "Main Site PTS",
          deviceId: "PTS001",
          status: "online",
          lastSync: "2 mins ago",
          tanks: 4,
          pumps: 8,
          tankLevel: 75,
        },
        {
          id: 2,
          name: "North Station",
          deviceId: "PTS002",
          status: "online",
          lastSync: "5 mins ago",
          tanks: 2,
          pumps: 4,
          tankLevel: 60,
        },
        {
          id: 3,
          name: "South Terminal",
          deviceId: "PTS003",
          status: "offline",
          lastSync: "1 hour ago",
          tanks: 3,
          pumps: 6,
          tankLevel: 45,
        },
      ],
    };

    setTimeout(() => {
      dispatch({
        type: FETCH_ATG_DASHBOARD_SUCCESS,
        payload: data,
      });
    }, 1000);
  } catch (error) {
    dispatch({
      type: FETCH_ATG_DASHBOARD_ERROR,
      payload: error.message,
    });
  }
};

// Fetch PTS Device Details
export const fetchPTSDeviceById = (ptsId) => async (dispatch) => {
  dispatch({ type: FETCH_PTS_DEVICE_START });

  try {
    // In a real implementation, this would be:
    // const response = await axiosInstance.get(`/api/pts/${ptsId}`);
    // const data = response.data;

    // For demo purposes, we'll simulate the API response
    const data = {
      device: {
        id: ptsId,
        name: `PTS Device ${ptsId}`,
        deviceId: `PTS00${ptsId}`,
        status: "online",
        lastSync: "2 mins ago",
        tanks: 4,
        pumps: 8,
        tankLevel: 75,
      },
      pumps: [
        { id: 1, name: "Pump 1", status: "idle", fuelType: "Diesel" },
        { id: 2, name: "Pump 2", status: "busy", fuelType: "Petrol" },
        { id: 3, name: "Pump 3", status: "idle", fuelType: "Diesel" },
        { id: 4, name: "Pump 4", status: "maintenance", fuelType: "Petrol" },
      ],
      nozzles: [
        { id: 1, name: "Nozzle 1", status: "idle" },
        { id: 2, name: "Nozzle 2", status: "idle" },
      ],
    };

    setTimeout(() => {
      dispatch({
        type: FETCH_PTS_DEVICE_SUCCESS,
        payload: data,
      });
    }, 1000);
  } catch (error) {
    dispatch({
      type: FETCH_PTS_DEVICE_ERROR,
      payload: error.message,
    });
  }
};

// Start Fueling Transaction
export const startFuelingTransaction =
  (transactionData) => async (dispatch) => {
    dispatch({ type: START_FUELING_TRANSACTION });

    try {
      // In a real implementation, this would be:
      // const response = await axiosInstance.post('/api/fueling/start', transactionData);
      // const data = response.data;

      // For demo purposes, we'll simulate the API response
      const data = {
        transactionId: Math.floor(Math.random() * 10000),
        ptsId: transactionData.ptsId,
        pumpId: transactionData.pumpId,
        nozzleId: transactionData.nozzleId,
        vehicleReg: transactionData.vehicleReg,
        startTime: new Date().toISOString(),
        status: "in_progress",
      };

      setTimeout(() => {
        dispatch({
          type: START_FUELING_TRANSACTION_SUCCESS,
          payload: data,
        });
      }, 500);
    } catch (error) {
      dispatch({
        type: START_FUELING_TRANSACTION_ERROR,
        payload: error.message,
      });
    }
  };

// Complete Fueling Transaction
export const completeFuelingTransaction =
  (transactionData) => async (dispatch) => {
    dispatch({ type: COMPLETE_FUELING_TRANSACTION });

    try {
      // In a real implementation, this would be:
      // const response = await axiosInstance.post('/api/fueling/complete', transactionData);
      // const data = response.data;

      // For demo purposes, we'll simulate the API response
      const data = {
        success: true,
        message: "Transaction completed successfully",
      };

      setTimeout(() => {
        dispatch({
          type: COMPLETE_FUELING_TRANSACTION_SUCCESS,
          payload: data,
        });
      }, 500);
    } catch (error) {
      dispatch({
        type: COMPLETE_FUELING_TRANSACTION_ERROR,
        payload: error.message,
      });
    }
  };
