import {createSlice, createAsyncThunk} from '@reduxjs/toolkit';
import ApiService from '../../services/apiService';

// Helper to normalize site data from API
const normalizeSite = (s) => ({
  id: s.SiteId || s.siteId || s.Id || s.id,
  name: s.SiteName || s.siteName || s.Name || s.name || "",
  code: s.SiteCode || s.siteCode || s.Code || s.code || "",
  address: s.Address || s.address || "",
  city: s.City || s.city || "",
  country: s.Country || s.country || "",
  isActive: s.IsActive ?? s.isActive ?? true,
});

export const fetchSiteList = createAsyncThunk(
  'site/fetchList',
  async (_, {rejectWithValue}) => {
    try {
      const response = await ApiService.getSiteList();
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  sites: [],
  currentSite: null,
  isLoading: false,
  error: null,
};

const siteSlice = createSlice({
  name: 'site',
  initialState,
  reducers: {
    setCurrentSite: (state, action) => {
      state.currentSite = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSiteList.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchSiteList.fulfilled, (state, action) => {
        state.isLoading = false;
        // Normalize site data to ensure consistent id field
        const rawSites = action.payload?.data || action.payload || [];
        state.sites = (Array.isArray(rawSites) ? rawSites : []).map(normalizeSite);
        if (state.sites.length > 0 && !state.currentSite) {
          state.currentSite = state.sites[0];
        }
      })
      .addCase(fetchSiteList.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const {setCurrentSite, clearError} = siteSlice.actions;
export default siteSlice.reducer;