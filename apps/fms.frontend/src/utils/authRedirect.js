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
 * - redirectToLoginPreservingReturnUrl(): Redirects to login while preserving the current route.
 */

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

export const redirectToLoginPreservingReturnUrl = (returnUrl) => {
  if (typeof window === 'undefined') {
    return;
  }

  window.location.href = buildLoginRedirectUrl(returnUrl);
};
