/**
 * tenantContextReducer.js
 *
 * Redux slice that captures the tenant-context claims emitted by
 * JwtTokenGenerator at login: tenant_id, tenant_kind, parent_tenant_id,
 * is_platform_operator. Drives:
 *   - ViewMode router branch (Client vs Customer) in App.js
 *   - White-label branding bootstrap (logo + theme colours)
 *   - Sub-customer management feature gating
 *
 * Hydrated from JWT in authReducer LOGIN_SUCCESS / USER_LOADED via
 * SET_TENANT_CONTEXT, then enriched with branding from
 * GET /api/v1/tenant/branding via SET_TENANT_BRANDING.
 *
 * Last Modified: 2026-05-10
 */
import {
    SET_TENANT_CONTEXT,
    SET_TENANT_BRANDING,
    CLEAR_TENANT_CONTEXT,
} from '../actions/types';

/**
 * @typedef {'client' | 'customer' | 'system'} TenantKind
 */

const initialState = {
    /** @type {string | null} */
    tenantId: null,
    /** @type {TenantKind} */
    tenantKind: 'client', // safe default for legacy tokens lacking the claim
    /** @type {string | null} parent tenant id, only present for Customer kind */
    parentTenantId: null,
    /** @type {boolean} only true when JWT carries is_platform_operator */
    isPlatformOperator: false,
    /** @type {{logoUrl: string|null, primaryColor: string|null, secondaryColor: string|null}} */
    branding: {
        logoUrl: null,
        primaryColor: null,
        secondaryColor: null,
    },
    brandingLoaded: false,
};

const tenantContextReducer = (state = initialState, action) => {
    const { type, payload } = action;

    switch (type) {
        case SET_TENANT_CONTEXT:
            return {
                ...state,
                tenantId: payload?.tenantId ?? null,
                tenantKind: payload?.tenantKind ?? 'client',
                parentTenantId: payload?.parentTenantId ?? null,
                isPlatformOperator: !!payload?.isPlatformOperator,
            };

        case SET_TENANT_BRANDING:
            return {
                ...state,
                branding: {
                    logoUrl: payload?.logoUrl ?? null,
                    primaryColor: payload?.primaryColor ?? null,
                    secondaryColor: payload?.secondaryColor ?? null,
                },
                brandingLoaded: true,
            };

        case CLEAR_TENANT_CONTEXT:
            return { ...initialState };

        default:
            return state;
    }
};

export default tenantContextReducer;
