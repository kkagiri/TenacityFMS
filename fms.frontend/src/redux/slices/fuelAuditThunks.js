import { createAsyncThunk } from "@reduxjs/toolkit";
import fuelAuditApi from "../../api/fuelAuditApi";

const serializeAxiosError = (error) => {
  const status = error?.response?.status;
  const statusText = error?.response?.statusText;
  const url = error?.config?.url;
  const method = error?.config?.method;
  const baseURL = error?.config?.baseURL;

  let responseData;
  try {
    responseData = error?.response?.data;
    if (responseData !== undefined) {
      JSON.stringify(responseData);
    }
  } catch {
    responseData = undefined;
  }

  return {
    message: error?.message || "Request failed",
    code: error?.code,
    status,
    statusText,
    url,
    method,
    baseURL,
    data: responseData,
  };
};

// ============================================================
// ASYNC THUNKS - GPS DATA
// ============================================================

/**
 * Get vehicle fuel position from GPS
 */
export const fetchVehicleFuelPosition = createAsyncThunk(
  "fuelAudit/fetchVehicleFuelPosition",
  async (vehicleId, { rejectWithValue }) => {
    try {
      const response = await fuelAuditApi.getVehicleFuelPosition(vehicleId);
      return response;
    } catch (error) {
      return rejectWithValue(serializeAxiosError(error));
    }
  }
);

/**
 * Get fleet fuel positions
 */
export const fetchFleetFuelPositions = createAsyncThunk(
  "fuelAudit/fetchFleetFuelPositions",
  async (vehicleIds, { rejectWithValue }) => {
    try {
      const response = await fuelAuditApi.getFleetFuelPositions(vehicleIds);
      return response;
    } catch (error) {
      return rejectWithValue(serializeAxiosError(error));
    }
  }
);

/**
 * Get vehicle fuel consumption for period
 */
export const fetchVehicleFuelConsumption = createAsyncThunk(
  "fuelAudit/fetchVehicleFuelConsumption",
  async ({ vehicleId, startDate, endDate }, { rejectWithValue }) => {
    try {
      const response = await fuelAuditApi.getVehicleFuelConsumption(
        vehicleId,
        startDate,
        endDate
      );
      return response;
    } catch (error) {
      return rejectWithValue(serializeAxiosError(error));
    }
  }
);

/**
 * Get vehicle refuel events
 */
export const fetchVehicleRefuelEvents = createAsyncThunk(
  "fuelAudit/fetchVehicleRefuelEvents",
  async ({ vehicleId, startDate, endDate }, { rejectWithValue }) => {
    try {
      const response = await fuelAuditApi.getVehicleRefuelEvents(
        vehicleId,
        startDate,
        endDate
      );
      return response;
    } catch (error) {
      return rejectWithValue(serializeAxiosError(error));
    }
  }
);

/**
 * Refresh vehicle fuel data
 */
export const refreshVehicleData = createAsyncThunk(
  "fuelAudit/refreshVehicleData",
  async (vehicleId, { rejectWithValue }) => {
    try {
      const response = await fuelAuditApi.refreshVehicleFuelData(vehicleId);
      return response;
    } catch (error) {
      return rejectWithValue(serializeAxiosError(error));
    }
  }
);

// ============================================================
// ASYNC THUNKS - WIZARD DATA (Tanks & Vehicles)
// ============================================================

/**
 * Fetch tanks for a site (wizard step 2)
 */
export const fetchTanksForSite = createAsyncThunk(
  "fuelAudit/fetchTanksForSite",
  async (siteId, { rejectWithValue }) => {
    try {
      const response = await fuelAuditApi.getTanksForSite(siteId);
      return response;
    } catch (error) {
      return rejectWithValue(serializeAxiosError(error));
    }
  }
);

/**
 * Fetch tank volume history preview (wizard step 3)
 */
export const fetchTankVolumePreview = createAsyncThunk(
  "fuelAudit/fetchTankVolumePreview",
  async ({ tankIds, startDate, endDate, siteId }, { rejectWithValue }) => {
    try {
      const response = await fuelAuditApi.getTankVolumeHistoryPreview({
        tankIds,
        startDate,
        endDate,
        siteId,
      });
      return response;
    } catch (error) {
      return rejectWithValue(serializeAxiosError(error));
    }
  }
);

/**
 * Fetch vehicles for a site (wizard step 4)
 */
export const fetchVehiclesForSite = createAsyncThunk(
  "fuelAudit/fetchVehiclesForSite",
  async (siteId, { rejectWithValue }) => {
    try {
      const response = await fuelAuditApi.getVehiclesForSite(siteId);
      return response;
    } catch (error) {
      return rejectWithValue(serializeAxiosError(error));
    }
  }
);

/**
 * Fetch fuel refills from selected tanks for a period (wizard step 4)
 * Shows vehicles that were fueled from the selected tanks
 * Supports multi-site audits via siteIds array
 */
export const fetchTankRefillsPreview = createAsyncThunk(
  "fuelAudit/fetchTankRefillsPreview",
  async ({ tankIds, startDate, endDate, siteIds }, { rejectWithValue }) => {
    try {
      const response = await fuelAuditApi.getTankRefillsPreview({
        tankIds,
        startDate,
        endDate,
        siteIds: Array.isArray(siteIds) ? siteIds : siteIds ? [siteIds] : [],
      });
      return response;
    } catch (error) {
      return rejectWithValue(serializeAxiosError(error));
    }
  }
);

/**
 * Fetch GPS fleet fuel positions for audit period (wizard step 5)
 */
export const fetchFleetAuditPeriodFuel = createAsyncThunk(
  "fuelAudit/fetchFleetAuditPeriodFuel",
  async (
    { vehicleIds, startDate, endDate, categoryId },
    { rejectWithValue }
  ) => {
    try {
      const response = await fuelAuditApi.getFleetFuelPositionsForAuditPeriod({
        vehicleIds,
        auditPeriodStart: startDate,
        auditPeriodEnd: endDate,
        categoryId, // Pass category to backend to determine REST vs SOAP
      });
      return { ...response, categoryId };
    } catch (error) {
      return rejectWithValue(serializeAxiosError(error));
    }
  }
);

/**
 * Fetch category-aware GPS data for fuel audit wizard Step 5.
 * Routes to appropriate data sources based on vehicle category.
 * @param {object} params
 * @param {object[]} params.vehicles - Array of vehicle objects with category info from Step 4
 * @param {string} params.startDate - Audit period start
 * @param {string} params.endDate - Audit period end
 * @param {number} [params.auditSiteId] - Site ID for audit context
 */
export const fetchCategoryAuditData = createAsyncThunk(
  "fuelAudit/fetchCategoryAuditData",
  async (
    { vehicles, startDate, endDate, auditSiteId },
    { rejectWithValue }
  ) => {
    try {
      // Transform vehicle data to match backend DTO
      const vehicleDtos = vehicles.map((v) => ({
        vehicleId: v.vehicleId,
        vehicleName: v.vehicleNo,
        category: v.vehicleCategory || 5,
        hasGPS: v.hasGPS || false,
        isFullTankPolicy: v.isFullTankPolicy || false,
        fuelTankCapacity: v.fuelTankCapacity,
        averageEfficiency: v.efficiency,
        isKmL: v.isKmL !== false, // Default to km/L
        totalFuelRefilled: v.totalFuelAmount || 0,
        refillCount: v.refillCount || 0,
      }));

      const response = await fuelAuditApi.getCategoryAuditFuel({
        vehicles: vehicleDtos,
        startDate,
        endDate,
        auditSiteId,
      });

      return response;
    } catch (error) {
      return rejectWithValue(serializeAxiosError(error));
    }
  }
);

/**
 * Start async GPS data fetch with SignalR progress updates.
 * Returns immediately with a job ID - listen for SignalR events for progress.
 * @param {object} params
 * @param {object[]} params.vehicles - Array of vehicle objects with category info from Step 4
 * @param {string} params.startDate - Audit period start
 * @param {string} params.endDate - Audit period end
 * @param {number} [params.auditSiteId] - Site ID for audit context
 * @param {number[]} [params.auditSiteIds] - Site IDs for multi-site audit
 * @param {number[]} [params.auditTankIds] - Tank IDs to match GPS events with manual refills
 */
export const startCategoryAuditAsync = createAsyncThunk(
  "fuelAudit/startCategoryAuditAsync",
  async (
    { vehicles, startDate, endDate, auditSiteId, auditSiteIds, auditTankIds },
    { rejectWithValue }
  ) => {
    try {
      // Transform vehicle data to match backend DTO
      const vehicleDtos = vehicles.map((v) => ({
        vehicleId: v.vehicleId,
        vehicleName: v.vehicleNo,
        category: v.vehicleCategory || 5,
        hasGPS: v.hasGPS || false,
        isFullTankPolicy: v.isFullTankPolicy || false,
        fuelTankCapacity: v.fuelTankCapacity,
        averageEfficiency: v.efficiency,
        isKmL: v.isKmL !== false, // Default to km/L
        totalFuelRefilled: v.totalFuelAmount || 0,
        refillCount: v.refillCount || 0,
      }));

      const response = await fuelAuditApi.startCategoryAuditAsync({
        vehicles: vehicleDtos,
        startDate,
        endDate,
        auditSiteId,
        auditSiteIds,
        auditTankIds, // Pass tank IDs for GPS-to-manual refill matching
      });

      return response;
    } catch (error) {
      return rejectWithValue(serializeAxiosError(error));
    }
  }
);

/**
 * Cancel an active GPS fetch job.
 * @param {string} jobId - Job ID to cancel
 */
export const cancelCategoryAuditJob = createAsyncThunk(
  "fuelAudit/cancelCategoryAuditJob",
  async (jobId, { rejectWithValue }) => {
    try {
      const response = await fuelAuditApi.cancelCategoryAuditJob(jobId);
      return response;
    } catch (error) {
      return rejectWithValue(serializeAxiosError(error));
    }
  }
);

/**
 * Fetch GPS data for a specific vehicle category
 * Categories 1 & 4 support GPS data (REST & SOAP respectively)
 */
export const fetchCategoryGpsData = createAsyncThunk(
  "fuelAudit/fetchCategoryGpsData",
  async (
    { vehicleIds, startDate, endDate, categoryId, siteId },
    { rejectWithValue }
  ) => {
    try {
      const response = await fuelAuditApi.getFleetFuelPositionsForAuditPeriod({
        vehicleIds,
        auditPeriodStart: startDate,
        auditPeriodEnd: endDate,
        categoryId,
        siteId,
      });
      return { data: response.data, categoryId, isSuccess: response.isSuccess };
    } catch (error) {
      return rejectWithValue({ categoryId, error: serializeAxiosError(error) });
    }
  }
);

/**
 * Check if a vehicle has fuel sensor
 */
export const checkVehicleFuelSensor = createAsyncThunk(
  "fuelAudit/checkVehicleFuelSensor",
  async (vehicleId, { rejectWithValue }) => {
    try {
      const response = await fuelAuditApi.checkVehicleFuelSensor(vehicleId);
      return { vehicleId, ...response };
    } catch (error) {
      return rejectWithValue(serializeAxiosError(error));
    }
  }
);

// ============================================================
// ASYNC THUNKS - AUDIT MANAGEMENT
// ============================================================

/**
 * Fetch list of fuel audits
 */
export const fetchFuelAudits = createAsyncThunk(
  "fuelAudit/fetchFuelAudits",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await fuelAuditApi.getFuelAudits(params);
      return response;
    } catch (error) {
      return rejectWithValue(serializeAxiosError(error));
    }
  }
);

/**
 * Fetch single audit by ID
 */
export const fetchFuelAuditById = createAsyncThunk(
  "fuelAudit/fetchFuelAuditById",
  async ({ auditId, options = {} }, { rejectWithValue }) => {
    try {
      const response = await fuelAuditApi.getFuelAuditById(auditId, options);
      return response;
    } catch (error) {
      return rejectWithValue(serializeAxiosError(error));
    }
  }
);

/**
 * Create a new fuel audit
 */
export const createNewAudit = createAsyncThunk(
  "fuelAudit/createNewAudit",
  async (auditData, { rejectWithValue }) => {
    try {
      const response = await fuelAuditApi.createFuelAudit(auditData);
      return response;
    } catch (error) {
      return rejectWithValue(serializeAxiosError(error));
    }
  }
);

/**
 * Save draft audit from wizard at any step.
 * Creates a new draft on Step 1, updates on subsequent steps.
 * @param {object} data - Wizard step data
 */
export const saveDraftAudit = createAsyncThunk(
  "fuelAudit/saveDraftAudit",
  async (data, { rejectWithValue }) => {
    try {
      const response = await fuelAuditApi.saveDraftAudit(data);
      return response;
    } catch (error) {
      return rejectWithValue(serializeAxiosError(error));
    }
  }
);

/**
 * Calculate audit variances
 */
export const calculateAuditVariances = createAsyncThunk(
  "fuelAudit/calculateAuditVariances",
  async ({ auditId, recalculate = false }, { rejectWithValue }) => {
    try {
      const response = await fuelAuditApi.calculateAudit(auditId, recalculate);
      return response;
    } catch (error) {
      return rejectWithValue(serializeAxiosError(error));
    }
  }
);

/**
 * Submit tank reading
 */
export const submitReading = createAsyncThunk(
  "fuelAudit/submitReading",
  async ({ auditId, readingData }, { rejectWithValue }) => {
    try {
      const response = await fuelAuditApi.submitTankerReading(
        auditId,
        readingData
      );
      return response;
    } catch (error) {
      return rejectWithValue(serializeAxiosError(error));
    }
  }
);

/**
 * Finalize audit
 * @param {object} params - Finalization params
 * @param {number} params.auditId - Audit ID
 * @param {string} [params.notes] - Finalization notes
 * @param {boolean} [params.sendReport] - Send report via email
 * @param {string[]} [params.recipientEmails] - Email recipients
 */
export const finalizeAuditAction = createAsyncThunk(
  "fuelAudit/finalizeAudit",
  async (
    { auditId, notes, sendReport, recipientEmails },
    { rejectWithValue }
  ) => {
    try {
      const response = await fuelAuditApi.finalizeAudit(auditId, {
        notes,
        sendReport,
        recipientEmails,
      });
      return response;
    } catch (error) {
      return rejectWithValue(serializeAxiosError(error));
    }
  }
);

/**
 * Cancel audit
 */
export const cancelAuditAction = createAsyncThunk(
  "fuelAudit/cancelAudit",
  async ({ auditId, reason }, { rejectWithValue }) => {
    try {
      const response = await fuelAuditApi.cancelAudit(auditId, reason);
      return response;
    } catch (error) {
      return rejectWithValue(serializeAxiosError(error));
    }
  }
);

/**
 * Resolve flag
 */
export const resolveFlagAction = createAsyncThunk(
  "fuelAudit/resolveFlag",
  async ({ flagId, resolution }, { rejectWithValue }) => {
    try {
      const response = await fuelAuditApi.resolveFlag(flagId, resolution);
      return response;
    } catch (error) {
      return rejectWithValue(serializeAxiosError(error));
    }
  }
);

/**
 * Fetch audit thresholds
 */
export const fetchAuditThresholds = createAsyncThunk(
  "fuelAudit/fetchAuditThresholds",
  async (_, { rejectWithValue }) => {
    try {
      const response = await fuelAuditApi.getAuditThresholds();
      return response;
    } catch (error) {
      return rejectWithValue(serializeAxiosError(error));
    }
  }
);
