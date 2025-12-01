import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import fuelAuditApi from '../../api/fuelAuditApi';

// ============================================================
// ASYNC THUNKS - GPS DATA
// ============================================================

/**
 * Get vehicle fuel position from GPS
 */
export const fetchVehicleFuelPosition = createAsyncThunk(
  'fuelAudit/fetchVehicleFuelPosition',
  async (vehicleId, { rejectWithValue }) => {
    try {
      const response = await fuelAuditApi.getVehicleFuelPosition(vehicleId);
      return response;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

/**
 * Get fleet fuel positions
 */
export const fetchFleetFuelPositions = createAsyncThunk(
  'fuelAudit/fetchFleetFuelPositions',
  async (vehicleIds, { rejectWithValue }) => {
    try {
      const response = await fuelAuditApi.getFleetFuelPositions(vehicleIds);
      return response;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

/**
 * Get vehicle fuel consumption for period
 */
export const fetchVehicleFuelConsumption = createAsyncThunk(
  'fuelAudit/fetchVehicleFuelConsumption',
  async ({ vehicleId, startDate, endDate }, { rejectWithValue }) => {
    try {
      const response = await fuelAuditApi.getVehicleFuelConsumption(vehicleId, startDate, endDate);
      return response;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

/**
 * Get vehicle refuel events
 */
export const fetchVehicleRefuelEvents = createAsyncThunk(
  'fuelAudit/fetchVehicleRefuelEvents',
  async ({ vehicleId, startDate, endDate }, { rejectWithValue }) => {
    try {
      const response = await fuelAuditApi.getVehicleRefuelEvents(vehicleId, startDate, endDate);
      return response;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

/**
 * Refresh vehicle fuel data
 */
export const refreshVehicleData = createAsyncThunk(
  'fuelAudit/refreshVehicleData',
  async (vehicleId, { rejectWithValue }) => {
    try {
      const response = await fuelAuditApi.refreshVehicleFuelData(vehicleId);
      return response;
    } catch (error) {
      return rejectWithValue(error);
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
  'fuelAudit/fetchTanksForSite',
  async (siteId, { rejectWithValue }) => {
    try {
      const response = await fuelAuditApi.getTanksForSite(siteId);
      return response;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

/**
 * Fetch tank volume history preview (wizard step 3)
 */
export const fetchTankVolumePreview = createAsyncThunk(
  'fuelAudit/fetchTankVolumePreview',
  async ({ tankIds, startDate, endDate, siteId }, { rejectWithValue }) => {
    try {
      const response = await fuelAuditApi.getTankVolumeHistoryPreview({
        tankIds,
        startDate,
        endDate,
        siteId
      });
      return response;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

/**
 * Fetch vehicles for a site (wizard step 4)
 */
export const fetchVehiclesForSite = createAsyncThunk(
  'fuelAudit/fetchVehiclesForSite',
  async (siteId, { rejectWithValue }) => {
    try {
      const response = await fuelAuditApi.getVehiclesForSite(siteId);
      return response;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

/**
 * Fetch fuel refills from selected tanks for a period (wizard step 4)
 * Shows vehicles that were fueled from the selected tanks
 */
export const fetchTankRefillsPreview = createAsyncThunk(
  'fuelAudit/fetchTankRefillsPreview',
  async ({ tankIds, startDate, endDate, siteId }, { rejectWithValue }) => {
    try {
      const response = await fuelAuditApi.getTankRefillsPreview({
        tankIds,
        startDate,
        endDate,
        siteId
      });
      return response;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

/**
 * Fetch GPS fleet fuel positions for audit period (wizard step 5)
 */
export const fetchFleetAuditPeriodFuel = createAsyncThunk(
  'fuelAudit/fetchFleetAuditPeriodFuel',
  async ({ vehicleIds, startDate, endDate, categoryId }, { rejectWithValue }) => {
    try {
      const response = await fuelAuditApi.getFleetFuelPositionsForAuditPeriod({
        vehicleIds,
        auditPeriodStart: startDate,
        auditPeriodEnd: endDate,
        categoryId // Pass category to backend to determine REST vs SOAP
      });
      return { ...response, categoryId };
    } catch (error) {
      return rejectWithValue(error);
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
  'fuelAudit/fetchCategoryAuditData',
  async ({ vehicles, startDate, endDate, auditSiteId }, { rejectWithValue }) => {
    try {
      // Transform vehicle data to match backend DTO
      const vehicleDtos = vehicles.map(v => ({
        vehicleId: v.vehicleId,
        vehicleName: v.vehicleNo,
        category: v.vehicleCategory || 5,
        hasGPS: v.hasGPS || false,
        isFullTankPolicy: v.isFullTankPolicy || false,
        fuelTankCapacity: v.fuelTankCapacity,
        averageEfficiency: v.efficiency,
        isKmL: v.isKmL !== false, // Default to km/L
        totalFuelRefilled: v.totalFuelAmount || 0,
        refillCount: v.refillCount || 0
      }));

      const response = await fuelAuditApi.getCategoryAuditFuel({
        vehicles: vehicleDtos,
        startDate,
        endDate,
        auditSiteId
      });

      return response;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

/**
 * Fetch GPS data for a specific vehicle category
 * Categories 1 & 4 support GPS data (REST & SOAP respectively)
 */
export const fetchCategoryGpsData = createAsyncThunk(
  'fuelAudit/fetchCategoryGpsData',
  async ({ vehicleIds, startDate, endDate, categoryId, siteId }, { rejectWithValue }) => {
    try {
      const response = await fuelAuditApi.getFleetFuelPositionsForAuditPeriod({
        vehicleIds,
        auditPeriodStart: startDate,
        auditPeriodEnd: endDate,
        categoryId,
        siteId
      });
      return { data: response.data, categoryId, isSuccess: response.isSuccess };
    } catch (error) {
      return rejectWithValue({ error, categoryId });
    }
  }
);

/**
 * Check if a vehicle has fuel sensor
 */
export const checkVehicleFuelSensor = createAsyncThunk(
  'fuelAudit/checkVehicleFuelSensor',
  async (vehicleId, { rejectWithValue }) => {
    try {
      const response = await fuelAuditApi.checkVehicleFuelSensor(vehicleId);
      return { vehicleId, ...response };
    } catch (error) {
      return rejectWithValue(error);
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
  'fuelAudit/fetchFuelAudits',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await fuelAuditApi.getFuelAudits(params);
      return response;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

/**
 * Fetch single audit by ID
 */
export const fetchFuelAuditById = createAsyncThunk(
  'fuelAudit/fetchFuelAuditById',
  async ({ auditId, options = {} }, { rejectWithValue }) => {
    try {
      const response = await fuelAuditApi.getFuelAuditById(auditId, options);
      return response;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

/**
 * Create a new fuel audit
 */
export const createNewAudit = createAsyncThunk(
  'fuelAudit/createNewAudit',
  async (auditData, { rejectWithValue }) => {
    try {
      const response = await fuelAuditApi.createFuelAudit(auditData);
      return response;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

/**
 * Calculate audit variances
 */
export const calculateAuditVariances = createAsyncThunk(
  'fuelAudit/calculateAuditVariances',
  async ({ auditId, recalculate = false }, { rejectWithValue }) => {
    try {
      const response = await fuelAuditApi.calculateAudit(auditId, recalculate);
      return response;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

/**
 * Submit tank reading
 */
export const submitReading = createAsyncThunk(
  'fuelAudit/submitReading',
  async ({ auditId, readingData }, { rejectWithValue }) => {
    try {
      const response = await fuelAuditApi.submitTankerReading(auditId, readingData);
      return response;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

/**
 * Finalize audit
 */
export const finalizeAuditAction = createAsyncThunk(
  'fuelAudit/finalizeAudit',
  async (auditId, { rejectWithValue }) => {
    try {
      const response = await fuelAuditApi.finalizeAudit(auditId);
      return response;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

/**
 * Cancel audit
 */
export const cancelAuditAction = createAsyncThunk(
  'fuelAudit/cancelAudit',
  async ({ auditId, reason }, { rejectWithValue }) => {
    try {
      const response = await fuelAuditApi.cancelAudit(auditId, reason);
      return response;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

/**
 * Resolve flag
 */
export const resolveFlagAction = createAsyncThunk(
  'fuelAudit/resolveFlag',
  async ({ flagId, resolution }, { rejectWithValue }) => {
    try {
      const response = await fuelAuditApi.resolveFlag(flagId, resolution);
      return response;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

/**
 * Fetch audit thresholds
 */
export const fetchAuditThresholds = createAsyncThunk(
  'fuelAudit/fetchAuditThresholds',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fuelAuditApi.getAuditThresholds();
      return response;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

// ============================================================
// INITIAL STATE
// ============================================================

const initialState = {
  // Audit list
  audits: [],
  auditsPagination: {
    pageNumber: 1,
    pageSize: 20,
    totalCount: 0,
    totalPages: 0
  },

  // Current audit detail
  currentAudit: null,

  // GPS data
  fleetPositions: null,
  vehiclePosition: null,
  vehicleConsumption: null,
  refuelEvents: [],

  // Thresholds
  thresholds: [],

  // Wizard data (for 6-step wizard)
  wizard: {
    step: 1,
    // Step 1 data
    siteId: null,
    periodStart: null,
    periodEnd: null,
    auditType: 'Weekly',
    // Step 2 data - tanks
    tanks: [],
    selectedTankIds: [],
    // Step 3 data - tank preview
    tankPreview: null,
    // Step 4 data - vehicles/refills from tanks
    tankRefills: [],  // Vehicle refill summaries from selected tanks
    selectedVehicleIds: [],
    includeGpsFleet: true,
    includePickups: true,
    // Step 5 data - GPS preview
    gpsPreview: null,
    // Step 6 data
    notes: '',
    autoPopulateTankReadings: true,
    // Validation
    validation: {
      step1: { valid: false, errors: [] },
      step2: { valid: false, errors: [] },
      step3: { valid: false, errors: [], warnings: [] },
      step4: { valid: false, errors: [] },
      step5: { valid: false, errors: [], warnings: [] },
      step6: { valid: true, errors: [] }
    }
  },

  // Loading states
  loading: {
    audits: false,
    currentAudit: false,
    create: false,
    calculate: false,
    submitReading: false,
    finalize: false,
    cancel: false,
    resolveFlag: false,
    fleetPositions: false,
    vehiclePosition: false,
    consumption: false,
    refuelEvents: false,
    thresholds: false,
    // Wizard loading states
    tanks: false,
    tankRefills: false,
    tankPreview: false,
    gpsPreview: false,
    refreshVehicle: false
  },

  // Error states
  error: {
    audits: null,
    currentAudit: null,
    create: null,
    calculate: null,
    submitReading: null,
    finalize: null,
    cancel: null,
    resolveFlag: null,
    fleetPositions: null,
    vehiclePosition: null,
    consumption: null,
    refuelEvents: null,
    thresholds: null,
    // Wizard error states
    tanks: null,
    tankRefills: null,
    tankPreview: null,
    gpsPreview: null
  },

  // UI state
  activeTab: 0,
  filterStatus: 'all',
  filterSiteId: null,
  filterDateRange: {
    from: null,
    to: null
  }
};

// ============================================================
// SLICE
// ============================================================

const fuelAuditSlice = createSlice({
  name: 'fuelAudit',
  initialState,
  reducers: {
    // Clear states
    clearCurrentAudit: (state) => {
      state.currentAudit = null;
      state.error.currentAudit = null;
    },
    clearFleetPositions: (state) => {
      state.fleetPositions = null;
      state.error.fleetPositions = null;
    },
    clearErrors: (state) => {
      state.error = initialState.error;
    },

    // UI actions
    setActiveTab: (state, action) => {
      state.activeTab = action.payload;
    },
    setFilterStatus: (state, action) => {
      state.filterStatus = action.payload;
    },
    setFilterSiteId: (state, action) => {
      state.filterSiteId = action.payload;
    },
    setFilterDateRange: (state, action) => {
      state.filterDateRange = action.payload;
    },

    // ========================================
    // WIZARD ACTIONS (6-step wizard)
    // ========================================
    setWizardStep: (state, action) => {
      state.wizard.step = action.payload;
    },

    // Step 1: Site & Period
    setWizardSiteAndPeriod: (state, action) => {
      const { siteId, periodStart, periodEnd, auditType } = action.payload;
      state.wizard.siteId = siteId;
      state.wizard.periodStart = periodStart;
      state.wizard.periodEnd = periodEnd;
      state.wizard.auditType = auditType || 'Weekly';
      // Clear downstream data when period changes
      state.wizard.tanks = [];
      state.wizard.selectedTankIds = [];
      state.wizard.tankPreview = null;
      state.wizard.vehicles = [];
      state.wizard.selectedVehicleIds = [];
      state.wizard.gpsPreview = null;
    },

    // Step 2: Select Tanks
    setSelectedTanks: (state, action) => {
      state.wizard.selectedTankIds = action.payload;
      // Clear preview when selection changes
      state.wizard.tankPreview = null;
    },

    // Step 4: Select Vehicles
    setSelectedVehicles: (state, action) => {
      state.wizard.selectedVehicleIds = action.payload;
      // Clear GPS preview when selection changes
      state.wizard.gpsPreview = null;
    },

    setVehicleOptions: (state, action) => {
      const { includeGpsFleet, includePickups } = action.payload;
      if (includeGpsFleet !== undefined) state.wizard.includeGpsFleet = includeGpsFleet;
      if (includePickups !== undefined) state.wizard.includePickups = includePickups;
    },

    // Step 6: Notes
    setWizardNotes: (state, action) => {
      state.wizard.notes = action.payload;
    },

    // Validation
    setStepValidation: (state, action) => {
      const { step, valid, errors, warnings } = action.payload;
      state.wizard.validation[`step${step}`] = {
        valid,
        errors: errors || [],
        warnings: warnings || []
      };
    },

    // Reset wizard
    resetWizard: (state) => {
      state.wizard = initialState.wizard;
      state.error.tanks = null;
      state.error.vehicles = null;
      state.error.tankPreview = null;
      state.error.gpsPreview = null;
    },

    // Optimistic update for flag resolution
    updateFlagStatus: (state, action) => {
      const { flagId, status, resolution } = action.payload;
      if (state.currentAudit?.flags) {
        const flag = state.currentAudit.flags.find(f => f.id === flagId);
        if (flag) {
          flag.status = status;
          flag.resolution = resolution;
          flag.resolvedAt = new Date().toISOString();
        }
      }
    }
  },
  extraReducers: (builder) => {
    // Fetch audits
    builder
      .addCase(fetchFuelAudits.pending, (state) => {
        state.loading.audits = true;
        state.error.audits = null;
      })
      .addCase(fetchFuelAudits.fulfilled, (state, action) => {
        state.loading.audits = false;
        if (action.payload.isSuccess) {
          state.audits = action.payload.data?.items || action.payload.data || [];
          if (action.payload.data?.pageNumber) {
            state.auditsPagination = {
              pageNumber: action.payload.data.pageNumber,
              pageSize: action.payload.data.pageSize,
              totalCount: action.payload.data.totalCount,
              totalPages: action.payload.data.totalPages
            };
          }
        }
      })
      .addCase(fetchFuelAudits.rejected, (state, action) => {
        state.loading.audits = false;
        state.error.audits = action.payload;
      });

    // Fetch audit by ID
    builder
      .addCase(fetchFuelAuditById.pending, (state) => {
        state.loading.currentAudit = true;
        state.error.currentAudit = null;
      })
      .addCase(fetchFuelAuditById.fulfilled, (state, action) => {
        state.loading.currentAudit = false;
        if (action.payload.isSuccess) {
          state.currentAudit = action.payload.data;
        }
      })
      .addCase(fetchFuelAuditById.rejected, (state, action) => {
        state.loading.currentAudit = false;
        state.error.currentAudit = action.payload;
      });

    // Create audit
    builder
      .addCase(createNewAudit.pending, (state) => {
        state.loading.create = true;
        state.error.create = null;
      })
      .addCase(createNewAudit.fulfilled, (state, action) => {
        state.loading.create = false;
        if (action.payload.isSuccess) {
          state.currentAudit = action.payload.data;
          // Add to list
          state.audits.unshift(action.payload.data);
        }
      })
      .addCase(createNewAudit.rejected, (state, action) => {
        state.loading.create = false;
        state.error.create = action.payload;
      });

    // Calculate audit
    builder
      .addCase(calculateAuditVariances.pending, (state) => {
        state.loading.calculate = true;
        state.error.calculate = null;
      })
      .addCase(calculateAuditVariances.fulfilled, (state, action) => {
        state.loading.calculate = false;
        if (action.payload.isSuccess) {
          // Update current audit with calculation results
          if (state.currentAudit) {
            state.currentAudit = {
              ...state.currentAudit,
              ...action.payload.data,
              status: 'Calculated'
            };
          }
        }
      })
      .addCase(calculateAuditVariances.rejected, (state, action) => {
        state.loading.calculate = false;
        state.error.calculate = action.payload;
      });

    // Submit reading
    builder
      .addCase(submitReading.pending, (state) => {
        state.loading.submitReading = true;
        state.error.submitReading = null;
      })
      .addCase(submitReading.fulfilled, (state, action) => {
        state.loading.submitReading = false;
        if (action.payload.isSuccess && state.currentAudit) {
          const newReading = action.payload.data;
          const existingIndex = state.currentAudit.tankerReadings?.findIndex(
            r => r.tankId === newReading.tankId && r.readingType === newReading.readingType
          );
          if (existingIndex >= 0) {
            state.currentAudit.tankerReadings[existingIndex] = newReading;
          } else {
            state.currentAudit.tankerReadings = [
              ...(state.currentAudit.tankerReadings || []),
              newReading
            ];
          }
        }
      })
      .addCase(submitReading.rejected, (state, action) => {
        state.loading.submitReading = false;
        state.error.submitReading = action.payload;
      });

    // Finalize audit
    builder
      .addCase(finalizeAuditAction.pending, (state) => {
        state.loading.finalize = true;
        state.error.finalize = null;
      })
      .addCase(finalizeAuditAction.fulfilled, (state, action) => {
        state.loading.finalize = false;
        if (action.payload.isSuccess) {
          state.currentAudit = action.payload.data;
          // Update in list
          const index = state.audits.findIndex(a => a.id === action.payload.data.id);
          if (index >= 0) {
            state.audits[index] = action.payload.data;
          }
        }
      })
      .addCase(finalizeAuditAction.rejected, (state, action) => {
        state.loading.finalize = false;
        state.error.finalize = action.payload;
      });

    // Cancel audit
    builder
      .addCase(cancelAuditAction.pending, (state) => {
        state.loading.cancel = true;
        state.error.cancel = null;
      })
      .addCase(cancelAuditAction.fulfilled, (state, action) => {
        state.loading.cancel = false;
        if (action.payload.isSuccess) {
          state.currentAudit = action.payload.data;
          const index = state.audits.findIndex(a => a.id === action.payload.data.id);
          if (index >= 0) {
            state.audits[index] = action.payload.data;
          }
        }
      })
      .addCase(cancelAuditAction.rejected, (state, action) => {
        state.loading.cancel = false;
        state.error.cancel = action.payload;
      });

    // Resolve flag
    builder
      .addCase(resolveFlagAction.pending, (state) => {
        state.loading.resolveFlag = true;
        state.error.resolveFlag = null;
      })
      .addCase(resolveFlagAction.fulfilled, (state, action) => {
        state.loading.resolveFlag = false;
        if (action.payload.isSuccess && state.currentAudit?.flags) {
          const updatedFlag = action.payload.data;
          const index = state.currentAudit.flags.findIndex(f => f.id === updatedFlag.id);
          if (index >= 0) {
            state.currentAudit.flags[index] = updatedFlag;
          }
        }
      })
      .addCase(resolveFlagAction.rejected, (state, action) => {
        state.loading.resolveFlag = false;
        state.error.resolveFlag = action.payload;
      });

    // Fleet positions
    builder
      .addCase(fetchFleetFuelPositions.pending, (state) => {
        state.loading.fleetPositions = true;
        state.error.fleetPositions = null;
      })
      .addCase(fetchFleetFuelPositions.fulfilled, (state, action) => {
        state.loading.fleetPositions = false;
        if (action.payload.isSuccess) {
          state.fleetPositions = action.payload.data;
        }
      })
      .addCase(fetchFleetFuelPositions.rejected, (state, action) => {
        state.loading.fleetPositions = false;
        state.error.fleetPositions = action.payload;
      });

    // Vehicle position
    builder
      .addCase(fetchVehicleFuelPosition.pending, (state) => {
        state.loading.vehiclePosition = true;
        state.error.vehiclePosition = null;
      })
      .addCase(fetchVehicleFuelPosition.fulfilled, (state, action) => {
        state.loading.vehiclePosition = false;
        if (action.payload.isSuccess) {
          state.vehiclePosition = action.payload.data;
        }
      })
      .addCase(fetchVehicleFuelPosition.rejected, (state, action) => {
        state.loading.vehiclePosition = false;
        state.error.vehiclePosition = action.payload;
      });

    // Vehicle consumption
    builder
      .addCase(fetchVehicleFuelConsumption.pending, (state) => {
        state.loading.consumption = true;
        state.error.consumption = null;
      })
      .addCase(fetchVehicleFuelConsumption.fulfilled, (state, action) => {
        state.loading.consumption = false;
        if (action.payload.isSuccess) {
          state.vehicleConsumption = action.payload.data;
        }
      })
      .addCase(fetchVehicleFuelConsumption.rejected, (state, action) => {
        state.loading.consumption = false;
        state.error.consumption = action.payload;
      });

    // Refuel events
    builder
      .addCase(fetchVehicleRefuelEvents.pending, (state) => {
        state.loading.refuelEvents = true;
        state.error.refuelEvents = null;
      })
      .addCase(fetchVehicleRefuelEvents.fulfilled, (state, action) => {
        state.loading.refuelEvents = false;
        if (action.payload.isSuccess) {
          state.refuelEvents = action.payload.data || [];
        }
      })
      .addCase(fetchVehicleRefuelEvents.rejected, (state, action) => {
        state.loading.refuelEvents = false;
        state.error.refuelEvents = action.payload;
      });

    // Thresholds
    builder
      .addCase(fetchAuditThresholds.pending, (state) => {
        state.loading.thresholds = true;
        state.error.thresholds = null;
      })
      .addCase(fetchAuditThresholds.fulfilled, (state, action) => {
        state.loading.thresholds = false;
        if (action.payload.isSuccess) {
          state.thresholds = action.payload.data || [];
        }
      })
      .addCase(fetchAuditThresholds.rejected, (state, action) => {
        state.loading.thresholds = false;
        state.error.thresholds = action.payload;
      });

    // ========================================
    // WIZARD DATA THUNKS
    // ========================================

    // Fetch tanks for site (wizard step 2)
    builder
      .addCase(fetchTanksForSite.pending, (state) => {
        state.loading.tanks = true;
        state.error.tanks = null;
      })
      .addCase(fetchTanksForSite.fulfilled, (state, action) => {
        state.loading.tanks = false;
        if (action.payload.isSuccess) {
          state.wizard.tanks = action.payload.data || [];
        }
      })
      .addCase(fetchTanksForSite.rejected, (state, action) => {
        state.loading.tanks = false;
        state.error.tanks = action.payload;
      });

    // Fetch tank volume preview (wizard step 3)
    builder
      .addCase(fetchTankVolumePreview.pending, (state) => {
        state.loading.tankPreview = true;
        state.error.tankPreview = null;
      })
      .addCase(fetchTankVolumePreview.fulfilled, (state, action) => {
        state.loading.tankPreview = false;
        if (action.payload.isSuccess) {
          state.wizard.tankPreview = action.payload.data || [];
        }
      })
      .addCase(fetchTankVolumePreview.rejected, (state, action) => {
        state.loading.tankPreview = false;
        state.error.tankPreview = action.payload;
      });

    // Fetch tank refills preview (wizard step 4 - vehicles that were fueled)
    builder
      .addCase(fetchTankRefillsPreview.pending, (state) => {
        state.loading.tankRefills = true;
        state.error.tankRefills = null;
      })
      .addCase(fetchTankRefillsPreview.fulfilled, (state, action) => {
        state.loading.tankRefills = false;
        if (action.payload.isSuccess) {
          state.wizard.tankRefills = action.payload.data || [];
        }
      })
      .addCase(fetchTankRefillsPreview.rejected, (state, action) => {
        state.loading.tankRefills = false;
        state.error.tankRefills = action.payload;
      });

    // Fetch GPS preview for audit period (wizard step 5)
    builder
      .addCase(fetchFleetAuditPeriodFuel.pending, (state) => {
        state.loading.gpsPreview = true;
        state.error.gpsPreview = null;
      })
      .addCase(fetchFleetAuditPeriodFuel.fulfilled, (state, action) => {
        state.loading.gpsPreview = false;
        if (action.payload.isSuccess) {
          // Merge category data into tankRefills for display
          const categoryId = action.payload.categoryId;
          const gpsVehicles = action.payload.data?.vehicles || [];

          if (categoryId && state.wizard.tankRefills?.length > 0) {
            // Update tankRefills with GPS data for this category
            gpsVehicles.forEach(gpsData => {
              const idx = state.wizard.tankRefills.findIndex(
                v => v.vehicleId === gpsData.vehicleId
              );
              if (idx >= 0) {
                state.wizard.tankRefills[idx] = {
                  ...state.wizard.tankRefills[idx],
                  openingFuel: gpsData.openingFuel,
                  closingFuel: gpsData.closingFuel,
                  consumption: gpsData.consumption,
                  distance: gpsData.distance,
                  gpsDataLoaded: true
                };
              }
            });
          }

          state.wizard.gpsPreview = action.payload.data;
        }
      })
      .addCase(fetchFleetAuditPeriodFuel.rejected, (state, action) => {
        state.loading.gpsPreview = false;
        state.error.gpsPreview = action.payload;
      });

    // Fetch category-aware audit data (new endpoint)
    builder
      .addCase(fetchCategoryAuditData.pending, (state) => {
        state.loading.gpsPreview = true;
        state.error.gpsPreview = null;
      })
      .addCase(fetchCategoryAuditData.fulfilled, (state, action) => {
        state.loading.gpsPreview = false;
        if (action.payload.isSuccess && action.payload.data) {
          const categoryResults = action.payload.data.categoryResults || [];

          // Merge category data into tankRefills for display
          categoryResults.forEach(catResult => {
            const vehicles = catResult.vehicles || [];
            vehicles.forEach(vehicle => {
              const idx = state.wizard.tankRefills?.findIndex(
                v => v.vehicleId === vehicle.vehicleId
              );
              if (idx >= 0 && state.wizard.tankRefills) {
                state.wizard.tankRefills[idx] = {
                  ...state.wizard.tankRefills[idx],
                  openingFuel: vehicle.openingFuelLevel,
                  closingFuel: vehicle.closingFuelLevel,
                  consumption: vehicle.calculatedConsumption,
                  dataSourcePrimary: vehicle.dataSource,
                  dataConfidence: vehicle.confidence,
                  isAuditable: vehicle.isAuditable,
                  openingDataQuality: vehicle.openingDataQuality,
                  closingDataQuality: vehicle.closingDataQuality,
                  gpsDataLoaded: true
                };
              }
            });
          });

          // Store full category response for summary display
          state.wizard.categoryAuditResult = action.payload.data;
        }
      })
      .addCase(fetchCategoryAuditData.rejected, (state, action) => {
        state.loading.gpsPreview = false;
        state.error.gpsPreview = action.payload;
      });

    // Fetch category-specific GPS data (for parallel loading)
    builder
      .addCase(fetchCategoryGpsData.pending, (state, action) => {
        // Track loading per category
        if (!state.loading.categoryGps) {
          state.loading.categoryGps = {};
        }
        const categoryId = action.meta.arg.categoryId;
        state.loading.categoryGps[categoryId] = true;
      })
      .addCase(fetchCategoryGpsData.fulfilled, (state, action) => {
        const { categoryId, data, isSuccess } = action.payload;
        if (state.loading.categoryGps) {
          state.loading.categoryGps[categoryId] = false;
        }

        if (isSuccess && data?.vehicles) {
          // Merge GPS data into tankRefills
          data.vehicles.forEach(gpsData => {
            const idx = state.wizard.tankRefills.findIndex(
              v => v.vehicleId === gpsData.vehicleId
            );
            if (idx >= 0) {
              state.wizard.tankRefills[idx] = {
                ...state.wizard.tankRefills[idx],
                openingFuel: gpsData.openingFuel,
                closingFuel: gpsData.closingFuel,
                consumption: gpsData.consumption,
                distance: gpsData.distance,
                gpsDataLoaded: true,
                dataSourcePrimary: categoryId === 1 ? 'GPS_REST' : 'GPS_SOAP'
              };
            }
          });
        }
      })
      .addCase(fetchCategoryGpsData.rejected, (state, action) => {
        const categoryId = action.payload?.categoryId;
        if (categoryId && state.loading.categoryGps) {
          state.loading.categoryGps[categoryId] = false;
        }
      });

    // Refresh vehicle data
    builder
      .addCase(refreshVehicleData.pending, (state) => {
        state.loading.refreshVehicle = true;
      })
      .addCase(refreshVehicleData.fulfilled, (state, action) => {
        state.loading.refreshVehicle = false;
        // Update the vehicle in gpsPreview if it exists
        if (action.payload.isSuccess && state.wizard.gpsPreview?.vehicles) {
          const updatedVehicle = action.payload.data;
          const index = state.wizard.gpsPreview.vehicles.findIndex(
            v => v.vehicleId === updatedVehicle.vehicleId
          );
          if (index >= 0) {
            state.wizard.gpsPreview.vehicles[index] = updatedVehicle;
          }
        }
      })
      .addCase(refreshVehicleData.rejected, (state) => {
        state.loading.refreshVehicle = false;
      });
  }
});

// ============================================================
// EXPORTS
// ============================================================

// Actions
export const {
  clearCurrentAudit,
  clearFleetPositions,
  clearErrors,
  setActiveTab,
  setFilterStatus,
  setFilterSiteId,
  setFilterDateRange,
  // Wizard actions
  setWizardStep,
  setWizardSiteAndPeriod,
  setSelectedTanks,
  setSelectedVehicles,
  setVehicleOptions,
  setWizardNotes,
  setStepValidation,
  resetWizard,
  updateFlagStatus
} = fuelAuditSlice.actions;

// Selectors
export const selectAudits = (state) => state.fuelAudit.audits;
export const selectAuditsPagination = (state) => state.fuelAudit.auditsPagination;
export const selectCurrentAudit = (state) => state.fuelAudit.currentAudit;
export const selectFleetPositions = (state) => state.fuelAudit.fleetPositions;
export const selectVehiclePosition = (state) => state.fuelAudit.vehiclePosition;
export const selectVehicleConsumption = (state) => state.fuelAudit.vehicleConsumption;
export const selectRefuelEvents = (state) => state.fuelAudit.refuelEvents;
export const selectThresholds = (state) => state.fuelAudit.thresholds;
export const selectWizard = (state) => state.fuelAudit.wizard;
export const selectWizardTanks = (state) => state.fuelAudit.wizard.tanks;
export const selectWizardTankRefills = (state) => state.fuelAudit.wizard.tankRefills;
export const selectWizardTankPreview = (state) => state.fuelAudit.wizard.tankPreview;
export const selectWizardGpsPreview = (state) => state.fuelAudit.wizard.gpsPreview;
export const selectLoading = (state) => state.fuelAudit.loading;
export const selectError = (state) => state.fuelAudit.error;
export const selectActiveTab = (state) => state.fuelAudit.activeTab;
export const selectFilters = (state) => ({
  status: state.fuelAudit.filterStatus,
  siteId: state.fuelAudit.filterSiteId,
  dateRange: state.fuelAudit.filterDateRange
});

// Reducer
export default fuelAuditSlice.reducer;
