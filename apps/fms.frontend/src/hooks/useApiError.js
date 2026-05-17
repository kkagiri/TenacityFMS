/**
 * File:          useApiError.js
 * Purpose:       Normalize axios/fetch errors into a friendly UI-ready shape
 *                and provide a stateful hook for pages. PRD §7.1 L3.
 * Dependencies:  React
 * Last Modified: 2026-05-16
 *
 * Usage:
 *   const { apiError, handleError, reset } = useApiError();
 *
 *   try {
 *     const res = await axiosInstance.get("/vehicles");
 *     setVehicles(res.data);
 *   } catch (err) {
 *     handleError(err);
 *   }
 *
 *   if (apiError?.status === 403) return <ForbiddenState />;
 *   if (apiError) return <EmptyState title={apiError.title} message={apiError.message} />;
 */

import { useCallback, useState } from "react";

/** @type {Record<number,{ title: string, message: string }>} */
const STATUS_TEXT = Object.freeze({
  400: {
    title: "We couldn't process that request",
    message: "Some of the information sent to the server was invalid. Try refreshing the page and submitting again.",
  },
  401: {
    title: "Your session has ended",
    message: "Sign in again to continue.",
  },
  403: {
    title: "You don't have access to this resource",
    message: "Your role doesn't include the required permission. Contact an administrator to request access.",
  },
  404: {
    title: "We couldn't find that",
    message: "The page or record you're looking for may have moved or been deleted.",
  },
  409: {
    title: "That change conflicts with the current state",
    message: "Someone else may have already updated this record. Refresh and try again.",
  },
  422: {
    title: "Some details are invalid",
    message: "Check the highlighted fields and try again.",
  },
  429: {
    title: "Too many requests",
    message: "Wait a moment, then try again.",
  },
  500: {
    title: "Something went wrong on our end",
    message: "We've logged the issue. Try again in a moment.",
  },
  502: {
    title: "The service is temporarily unreachable",
    message: "We couldn't reach the server. Try again shortly.",
  },
  503: {
    title: "The service is busy",
    message: "We're experiencing high demand. Try again shortly.",
  },
});

const FALLBACK_NETWORK = {
  status: 0,
  title: "We can't reach the server",
  message: "Check your connection and try again.",
};

const FALLBACK_UNKNOWN = {
  status: null,
  title: "Something went wrong",
  message: "An unexpected error occurred. Try again.",
};

/**
 * Pure helper — convert any error-shaped value into an ApiError. Safe to call
 * outside React (e.g. from redux thunks, service-layer code).
 */
export function parseApiError(error) {
  if (!error) return null;

  // Axios error shape: error.response && error.response.status
  const response = error.response;
  if (response?.status) {
    const status = response.status;
    const fromMap = STATUS_TEXT[status];
    const serverMessage =
      typeof response.data === "string"
        ? response.data
        : response.data?.message || response.data?.error || null;
    return {
      status,
      title: fromMap?.title || "Request failed",
      message: serverMessage || fromMap?.message || FALLBACK_UNKNOWN.message,
      isAxios: true,
      isNetwork: false,
      isForbidden: status === 403,
      isUnauthorized: status === 401,
      original: error,
    };
  }

  // Axios network failure (no response received)
  if (error.request) {
    return {
      ...FALLBACK_NETWORK,
      isAxios: true,
      isNetwork: true,
      isForbidden: false,
      isUnauthorized: false,
      original: error,
    };
  }

  // Plain Error or other thrown value
  return {
    ...FALLBACK_UNKNOWN,
    message: error.message || FALLBACK_UNKNOWN.message,
    isAxios: false,
    isNetwork: false,
    isForbidden: false,
    isUnauthorized: false,
    original: error,
  };
}

/**
 * React hook — keeps the last API error in state for inline rendering.
 *
 * Returns:
 *  - apiError: ApiError | null
 *  - handleError(err): pass any error to this; null/undefined clears
 *  - reset(): clear the current error
 */
export default function useApiError() {
  const [apiError, setApiError] = useState(null);

  const handleError = useCallback((error) => {
    if (!error) {
      setApiError(null);
      return null;
    }
    const parsed = parseApiError(error);
    setApiError(parsed);
    return parsed;
  }, []);

  const reset = useCallback(() => setApiError(null), []);

  return { apiError, handleError, reset };
}
