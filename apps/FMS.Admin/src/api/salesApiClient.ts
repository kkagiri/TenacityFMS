/**
 * File:          salesApiClient.ts
 * Purpose:       Axios client for the separately-deployed FMS.Sales API
 *                (Subscriptions, Invoices). Uses the same operator JWT as
 *                apiClient. Base URL is configurable via VITE_FMS_SALES_API_URL.
 *                In dev, the default proxies through /sales-api.
 * Last Modified: 2026-05-14
 */

import axios from 'axios';

const normalizeBaseUrl = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return '/sales-api/';
  return trimmed.endsWith('/') ? trimmed : `${trimmed}/`;
};

const salesApiBaseUrl = normalizeBaseUrl(
  import.meta.env.VITE_FMS_SALES_API_URL || '/sales-api'
);

export const salesApiClient = axios.create({
  baseURL: salesApiBaseUrl,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
  withCredentials: false,
});

salesApiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('fms.admin.token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
