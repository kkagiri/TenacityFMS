/**
 * File:          jwt.ts
 * Purpose:       Lightweight JWT claim decoding for operator route guards.
 * Dependencies:  None
 * Last Modified: 2026-05-10
 *
 * Key Functions:
 * - getTenantClaims(): Reads tenant_kind, tenant_id, and is_platform_operator.
 */

import type { JwtTenantClaims } from '../types/auth';

const decodeJwtPayload = (token: string): Record<string, unknown> | null => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const normalized = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
    return JSON.parse(window.atob(padded)) as Record<string, unknown>;
  } catch {
    return null;
  }
};

export const getTenantClaims = (token: string | null): JwtTenantClaims => {
  const payload = token ? decodeJwtPayload(token) : null;
  const rawKind = String(payload?.tenant_kind || '').toLowerCase();

  return {
    tenantKind: rawKind === 'system' || rawKind === 'customer' ? rawKind : 'client',
    tenantId: typeof payload?.tenant_id === 'string' ? payload.tenant_id : null,
    isPlatformOperator: payload?.is_platform_operator === true || payload?.is_platform_operator === 'true',
  };
};