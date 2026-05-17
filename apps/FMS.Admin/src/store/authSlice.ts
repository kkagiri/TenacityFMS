/**
 * File:          authSlice.ts
 * Purpose:       Platform operator authentication state for FMS.Admin.
 * Dependencies:  Redux Toolkit, apiClient, jwt utilities
 * Last Modified: 2026-05-10
 *
 * Key Functions:
 * - loginOperator(): Calls /v1/operator/login and stores operator JWT.
 * - initializeAuth(): Rehydrates auth state from localStorage.
 */

import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { apiClient, unwrapResponse } from "../api/apiClient";
import type {
  JwtTenantClaims,
  OperatorLoginResponse,
  OperatorUser,
} from "../types/auth";
import { getTenantClaims } from "../utils/jwt";

type AuthState = {
  token: string | null;
  refreshToken: string | null;
  user: OperatorUser | null;
  claims: JwtTenantClaims;
  loading: boolean;
  error: string | null;
};

const tokenStorageKey = "fms.admin.token";
const refreshTokenStorageKey = "fms.admin.refreshToken";
const userStorageKey = "fms.admin.user";

const defaultClaims: JwtTenantClaims = {
  tenantKind: "client",
  tenantId: null,
  isPlatformOperator: false,
};

const readStoredUser = (): OperatorUser | null => {
  try {
    const raw = localStorage.getItem(userStorageKey);
    return raw ? normalizeUser(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
};

const normalizeUser = (user: unknown): OperatorUser | null => {
  if (!user || typeof user !== "object") {
    return null;
  }

  const typedUser = user as {
    id?: string;
    Id?: string;
    userName?: string;
    UserName?: string;
    email?: string | null;
    Email?: string | null;
    roles?: string[];
    Roles?: string[];
  };

  const id = typedUser.id || typedUser.Id;
  const userName = typedUser.userName || typedUser.UserName;

  if (!id || !userName) {
    return null;
  }

  return {
    id,
    userName,
    email: typedUser.email ?? typedUser.Email ?? null,
    roles: Array.isArray(typedUser.roles)
      ? typedUser.roles
      : Array.isArray(typedUser.Roles)
        ? typedUser.Roles
        : [],
  };
};

const storedToken = localStorage.getItem(tokenStorageKey);

const initialState: AuthState = {
  token: storedToken,
  refreshToken: localStorage.getItem(refreshTokenStorageKey),
  user: readStoredUser(),
  claims: storedToken ? getTenantClaims(storedToken) : defaultClaims,
  loading: false,
  error: null,
};

export const loginOperator = createAsyncThunk(
  "auth/loginOperator",
  async (
    credentials: { username: string; password: string },
    { rejectWithValue },
  ) => {
    try {
      const response = await apiClient.post("/v1/User/Login", {
        ...credentials,
        requirePlatformOperator: true,
      });
      const payload = unwrapResponse<OperatorLoginResponse>(response.data);
      const user = normalizeUser(payload?.user);

      if (!payload?.token || !user) {
        throw new Error("Invalid login payload received from server.");
      }

      return {
        ...payload,
        user,
      };
    } catch (error: unknown) {
      const message =
        error && typeof error === "object" && "response" in error
          ? (error as {
              response?: { data?: { message?: string; Message?: string } };
            }).response?.data?.message ||
            (error as {
              response?: { data?: { message?: string; Message?: string } };
            }).response?.data?.Message
          : null;
      return rejectWithValue(message || "Operator login failed.");
    }
  },
);

const persistSession = (payload: OperatorLoginResponse) => {
  localStorage.setItem(tokenStorageKey, payload.token);
  localStorage.setItem(userStorageKey, JSON.stringify(payload.user));

  if (payload.refreshToken) {
    localStorage.setItem(refreshTokenStorageKey, payload.refreshToken);
  } else {
    localStorage.removeItem(refreshTokenStorageKey);
  }
};

const clearSession = () => {
  localStorage.removeItem(tokenStorageKey);
  localStorage.removeItem(refreshTokenStorageKey);
  localStorage.removeItem(userStorageKey);
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    initializeAuth(state) {
      const token = localStorage.getItem(tokenStorageKey);
      state.token = token;
      state.refreshToken = localStorage.getItem(refreshTokenStorageKey);
      state.user = readStoredUser();
      state.claims = token ? getTenantClaims(token) : defaultClaims;
    },
    logout(state) {
      clearSession();
      state.token = null;
      state.refreshToken = null;
      state.user = null;
      state.claims = defaultClaims;
      state.error = null;
      state.loading = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginOperator.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginOperator.fulfilled, (state, action) => {
        persistSession(action.payload);
        state.token = action.payload.token;
        state.refreshToken = action.payload.refreshToken || null;
        state.user = action.payload.user;
        state.claims = getTenantClaims(action.payload.token);
        state.loading = false;
        state.error = null;
      })
      .addCase(loginOperator.rejected, (state, action) => {
        state.loading = false;
        state.error =
          typeof action.payload === "string"
            ? action.payload
            : "Operator login failed.";
      });
  },
});

export const { initializeAuth, logout } = authSlice.actions;
export default authSlice.reducer;
