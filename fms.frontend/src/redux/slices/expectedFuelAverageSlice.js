import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import expectedFuelAverageApi from '../../api/expectedFuelAverageApi';

// Async Thunks

// Templates
export const fetchTemplates = createAsyncThunk(
  'expectedFuelAverage/fetchTemplates',
  async ({ includeInactive = true } = {}, { rejectWithValue }) => {
    try {
      const response = await expectedFuelAverageApi.getTemplates({ includeInactive });
      if (response.isSuccess) {
        return response.data;
      }
      return rejectWithValue(response.message);
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch templates');
    }
  }
);

export const createTemplate = createAsyncThunk(
  'expectedFuelAverage/createTemplate',
  async (templateData, { rejectWithValue }) => {
    try {
      const response = await expectedFuelAverageApi.createTemplate(templateData);
      if (response.isSuccess) {
        return response.data;
      }
      return rejectWithValue(response.message);
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to create template');
    }
  }
);

export const updateTemplate = createAsyncThunk(
  'expectedFuelAverage/updateTemplate',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await expectedFuelAverageApi.updateTemplate(id, data);
      if (response.isSuccess) {
        return response.data;
      }
      return rejectWithValue(response.message);
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to update template');
    }
  }
);

export const deleteTemplate = createAsyncThunk(
  'expectedFuelAverage/deleteTemplate',
  async (id, { rejectWithValue }) => {
    try {
      const response = await expectedFuelAverageApi.deleteTemplate(id);
      if (response.isSuccess) {
        return id;
      }
      return rejectWithValue(response.message);
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to delete template');
    }
  }
);

// Vehicle Assignments
export const fetchVehicleAssignments = createAsyncThunk(
  'expectedFuelAverage/fetchVehicleAssignments',
  async (_, { rejectWithValue }) => {
    try {
      const response = await expectedFuelAverageApi.getAllVehicleAssignments();
      if (response.isSuccess) {
        return response.data;
      }
      return rejectWithValue(response.message);
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch vehicle assignments');
    }
  }
);

// Reference Data
export const fetchReferenceData = createAsyncThunk(
  'expectedFuelAverage/fetchReferenceData',
  async (_, { rejectWithValue }) => {
    try {
      const [routesRes, loadClassRes, intensityRes] = await Promise.all([
        expectedFuelAverageApi.getFuelRoutes(true),
        expectedFuelAverageApi.getLoadClassifications(true),
        expectedFuelAverageApi.getUsageIntensities(true)
      ]);

      const result = {
        routes: routesRes.isSuccess ? routesRes.data : [],
        loadClassifications: loadClassRes.isSuccess ? loadClassRes.data : [],
        usageIntensities: intensityRes.isSuccess ? intensityRes.data : []
      };

      return result;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch reference data');
    }
  }
);

const initialState = {
  templates: [],
  vehicleAssignments: [],
  routes: [],
  loadClassifications: [],
  usageIntensities: [],
  isLoading: false,
  error: null,
  successMessage: null
};

const expectedFuelAverageSlice = createSlice({
  name: 'expectedFuelAverage',
  initialState,
  reducers: {
    clearMessages: (state) => {
      state.error = null;
      state.successMessage = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Templates
      .addCase(fetchTemplates.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTemplates.fulfilled, (state, action) => {
        state.isLoading = false;
        state.templates = action.payload;
      })
      .addCase(fetchTemplates.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Create Template
      .addCase(createTemplate.fulfilled, (state, action) => {
        state.templates.push(action.payload);
        state.successMessage = 'Template created successfully';
      })

      // Update Template
      .addCase(updateTemplate.fulfilled, (state, action) => {
        const index = state.templates.findIndex(t => t.id === action.payload.id);
        if (index !== -1) {
          state.templates[index] = action.payload;
        }
        state.successMessage = 'Template updated successfully';
      })

      // Delete Template
      .addCase(deleteTemplate.fulfilled, (state, action) => {
        state.templates = state.templates.filter(t => t.id !== action.payload);
        state.successMessage = 'Template deleted successfully';
      })

      // Fetch Vehicle Assignments
      .addCase(fetchVehicleAssignments.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchVehicleAssignments.fulfilled, (state, action) => {
        state.isLoading = false;
        state.vehicleAssignments = action.payload;
      })
      .addCase(fetchVehicleAssignments.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Fetch Reference Data
      .addCase(fetchReferenceData.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchReferenceData.fulfilled, (state, action) => {
        state.isLoading = false;
        state.routes = action.payload.routes;
        state.loadClassifications = action.payload.loadClassifications;
        state.usageIntensities = action.payload.usageIntensities;
      })
      .addCase(fetchReferenceData.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  }
});

export const { clearMessages } = expectedFuelAverageSlice.actions;
export default expectedFuelAverageSlice.reducer;
