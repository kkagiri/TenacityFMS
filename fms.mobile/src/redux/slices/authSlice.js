import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import AsyncStorage from "@react-native-async-storage/async-storage";
import ApiService from "../../services/apiService";

// Async thunk for login
export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await ApiService.login(credentials);
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk for logout
export const logoutUser = createAsyncThunk(
  "auth/logoutUser",
  async (_, { rejectWithValue }) => {
    try {
      await ApiService.logout();
      return {};
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk for checking authentication status
export const checkAuthStatus = createAsyncThunk(
  "auth/checkAuthStatus",
  async (_, { rejectWithValue }) => {
    try {
      const token = await AsyncStorage.getItem("auth_token");
      const refreshToken = await AsyncStorage.getItem("refresh_token");
      const userData = await AsyncStorage.getItem("user_data");

      if (token && userData) {
        return {
          token,
          refreshToken,
          user: JSON.parse(userData),
          isAuthenticated: true,
        };
      }
      return {
        token: null,
        refreshToken: null,
        user: null,
        isAuthenticated: false,
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  masterTag: null,
  preferences: {
    rememberLogin: false,
    biometricEnabled: false,
    notifications: true,
  },
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setMasterTag: (state, action) => {
      state.masterTag = action.payload;
    },
    updatePreferences: (state, action) => {
      state.preferences = {
        ...state.preferences,
        ...action.payload,
      };
    },
    resetAuthState: (state) => {
      return initialState;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login cases
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.refreshToken = action.payload.refreshToken;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.refreshToken = null;
        state.error = action.payload;
      })
      // Logout cases
      .addCase(logoutUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        return initialState;
      })
      .addCase(logoutUser.rejected, (state, action) => {
        // Even if logout fails, clear local state
        state.isLoading = false;
        state.error = action.payload;
        // Still reset auth state
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.refreshToken = null;
      })
      // Check auth status cases
      .addCase(checkAuthStatus.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(checkAuthStatus.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = action.payload.isAuthenticated;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.refreshToken = action.payload.refreshToken;
      })
      .addCase(checkAuthStatus.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.refreshToken = null;
      });
  },
});

export const { clearError, setMasterTag, updatePreferences, resetAuthState } =
  authSlice.actions;

export default authSlice.reducer;
