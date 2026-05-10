import {createSlice, createAsyncThunk} from '@reduxjs/toolkit';
import ApiService from '../../services/apiService';

export const validateTag = createAsyncThunk(
  'tag/validate',
  async (tagId, {rejectWithValue}) => {
    try {
      const response = await ApiService.validateTag(tagId);
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  tags: [],
  validatedTag: null,
  isValidating: false,
  error: null,
  lastScannedTag: null,
};

const tagSlice = createSlice({
  name: 'tag',
  initialState,
  reducers: {
    setLastScannedTag: (state, action) => {
      state.lastScannedTag = action.payload;
    },
    clearValidatedTag: (state) => {
      state.validatedTag = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(validateTag.pending, (state) => {
        state.isValidating = true;
        state.error = null;
      })
      .addCase(validateTag.fulfilled, (state, action) => {
        state.isValidating = false;
        state.validatedTag = action.payload;
      })
      .addCase(validateTag.rejected, (state, action) => {
        state.isValidating = false;
        state.error = action.payload;
      });
  },
});

export const {setLastScannedTag, clearValidatedTag, clearError} = tagSlice.actions;
export default tagSlice.reducer;