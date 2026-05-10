/**
 * File:          apiClient.ts
 * Purpose:       Axios client for FMS.Admin operator APIs.
 * Dependencies:  axios
 * Last Modified: 2026-05-10
 *
 * Key Functions:
 * - apiClient: Axios instance with operator JWT wiring.
 * - unwrapResponse(): Normalizes FMSResponse envelopes and direct DTO payloads.
 */

import axios from 'axios';

const normalizeBaseUrl = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return '/api/';
  return trimmed.endsWith('/') ? trimmed : `${trimmed}/`;
};

const apiBaseUrl = normalizeBaseUrl(import.meta.env.VITE_FMS_API_URL || '/api');

export const apiClient = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'API-Version': 'v1',
  },
  withCredentials: true,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('fms.admin.token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export const unwrapResponse = <T>(payload: unknown): T => {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return (payload as { data: T }).data;
  }

  if (payload && typeof payload === 'object' && 'Data' in payload) {
    return (payload as { Data: T }).Data;
  }

  return payload as T;
};