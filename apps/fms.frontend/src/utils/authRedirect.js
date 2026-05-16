/**
 * File: authRedirect.js
 * Purpose: Centralizes safe login redirect URL generation and hard redirects for auth failures.
 * Dependencies: browser window location
 * Last Modified: 2026-04-13
 *
 * Key Functions:
 * - getCurrentRelativeUrl(): Returns the current in-app relative URL.
 * - getSafeInternalRedirect(): Validates redirect targets against open-redirect patterns.
 * - buildLoginRedirectUrl(): Builds the login URL with a safe redirect query.
 * - getOperatorPortalUrl(): Resolves the standalone FMS.Admin URL.
 * - redirectToLoginPreservingReturnUrl(): Redirects to login while preserving the current route.
 */

const normalizeExternalBaseUrl = (candidate) => {
  if (typeof candidate !== 'string') {
    return null;
  }

  const trimmed = candidate.trim();
  if (!trimmed) {
    return null;
  }

  return trimmed.replace(/\/+$/, '');
};

export const getCurrentRelativeUrl = () => {
  if (typeof window === 'undefined' || !window.location) {
    return '/';
  }

  const { pathname = '/', search = '', hash = '' } = window.location;
  return `${pathname}${search}${hash}`;
};

export const getSafeInternalRedirect = (candidate) => {
  if (typeof candidate !== 'string' || !candidate.startsWith('/') || candidate.startsWith('//')) {
    return null;
  }

  return candidate;
};

export const buildLoginRedirectUrl = (returnUrl = getCurrentRelativeUrl()) => {
  const safeReturnUrl = getSafeInternalRedirect(returnUrl);

  if (!safeReturnUrl || safeReturnUrl === '/login') {
    return '/login';
  }

  if (safeReturnUrl.startsWith('/login?')) {
    return safeReturnUrl;
  }

  return `/login?redirect=${encodeURIComponent(safeReturnUrl)}`;
};

export const getOperatorPortalUrl = () => {
  if (typeof window === 'undefined' || !window.location) {
    return null;
  }

  const configuredUrl = normalizeExternalBaseUrl(process.env.REACT_APP_FMS_ADMIN_URL);
  if (configuredUrl) {
    return configuredUrl;
  }

  const { hostname, protocol, port } = window.location;
  const isLocalHost = hostname === 'localhost' || hostname === '127.0.0.1';

  if (!isLocalHost) {
    return null;
  }

  if (port === '5181') {
    return `${protocol}//${hostname}:${port}`;
  }

  return 'http://localhost:5181';
};

export const redirectToLoginPreservingReturnUrl = (returnUrl) => {
  if (typeof window === 'undefined') {
    return;
  }

  window.location.href = buildLoginRedirectUrl(returnUrl);
};
