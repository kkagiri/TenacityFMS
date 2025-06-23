import {createSlice, createAsyncThunk} from '@reduxjs/toolkit';
import ApiService from '../../services/apiService';

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
        state.sites = action.payload;
        if (action.payload.length > 0 && !state.currentSite) {
          state.currentSite = action.payload[0];
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