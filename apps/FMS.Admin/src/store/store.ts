/**
 * File:          store.ts
 * Purpose:       Redux Toolkit store for FMS.Admin.
 * Dependencies:  @reduxjs/toolkit, authSlice
 * Last Modified: 2026-05-10
 *
 * Key Functions:
 * - store: Configured application store.
 */

import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
  },
  devTools: import.meta.env.MODE !== 'production',
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;