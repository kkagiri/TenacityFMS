/**
 * File:          useApiError.ts (FMS.Admin)
 * Purpose:       TS twin of apps/fms.frontend/src/hooks/useApiError.js. Maps
 *                HTTP status → friendly message and exposes a stateful hook
 *                for inline rendering. PRD §7.1 L3.
 */

import { useCallback, useState } from "react";

export interface ApiError {
  status: number | null;
  title: string;
  message: string;
  isAxios: boolean;
  isNetwork: boolean;
  isForbidden: boolean;
  isUnauthorized: boolean;
  original: unknown;
}

const STATUS_TEXT: Record<number, { title: string; message: string }> =
  Object.freeze({
    400: {
      title: "We couldn't process that request",
      message:
        "Some of the information sent to the server was invalid. Try refreshing the page and submitting again.",
    },
    401: {
      title: "Your session has ended",
      message: "Sign in again to continue.",
    },
    403: {
      title: "You don't have access to this resource",
      message:
        "Your role doesn't include the required permission. Contact an administrator to request access.",
    },
    404: {
      title: "We couldn't find that",
      message:
        "The page or record you're looking for may have moved or been deleted.",
    },
    409: {
      title: "That change conflicts with the current state",
      message:
        "Someone else may have already updated this record. Refresh and try again.",
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
} as const;

const FALLBACK_UNKNOWN = {
  status: null as number | null,
  title: "Something went wrong",
  message: "An unexpected error occurred. Try again.",
} as const;

interface AxiosLikeError {
  response?: { status?: number; data?: unknown };
  request?: unknown;
  message?: string;
}

export function parseApiError(error: unknown): ApiError | null {
  if (!error) return null;
  const e = error as AxiosLikeError;

  if (e.response?.status) {
    const status = e.response.status;
    const fromMap = STATUS_TEXT[status];
    const data = e.response.data;
    const serverMessage =
      typeof data === "string"
        ? data
        : ((data as { message?: string })?.message ??
            (data as { error?: string })?.error ??
            null);
    return {
      status,
      title: fromMap?.title || "Request failed",
      message:
        serverMessage || fromMap?.message || FALLBACK_UNKNOWN.message,
      isAxios: true,
      isNetwork: false,
      isForbidden: status === 403,
      isUnauthorized: status === 401,
      original: error,
    };
  }

  if (e.request) {
    return {
      ...FALLBACK_NETWORK,
      isAxios: true,
      isNetwork: true,
      isForbidden: false,
      isUnauthorized: false,
      original: error,
    };
  }

  return {
    ...FALLBACK_UNKNOWN,
    message: e.message || FALLBACK_UNKNOWN.message,
    isAxios: false,
    isNetwork: false,
    isForbidden: false,
    isUnauthorized: false,
    original: error,
  };
}

interface UseApiErrorReturn {
  apiError: ApiError | null;
  handleError: (error: unknown) => ApiError | null;
  reset: () => void;
}

export default function useApiError(): UseApiErrorReturn {
  const [apiError, setApiError] = useState<ApiError | null>(null);

  const handleError = useCallback((error: unknown): ApiError | null => {
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
