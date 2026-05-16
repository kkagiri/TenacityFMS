/**
 * tenantBrandingActions.js
 *
 * Fetches white-label branding (logo + colours) for the current tenant
 * and dispatches SET_TENANT_BRANDING. Called from App.js after the user
 * is loaded so the branding is in place before the layout renders.
 *
 * Companion: applyBrandingToCssVars() in utils/applyBranding.js writes the
 * resolved primary/secondary colours into M365 CSS custom properties.
 *
 * Last Modified: 2026-05-10
 */
import { SET_TENANT_BRANDING } from './types';
import { applyBrandingToCssVars } from '../../utils/applyBranding';
import axiosInstance from '../../api/axiosInstance';

const normalizeBranding = (data = {}) => ({
    logoUrl: data.logoUrl || data.LogoUrl || null,
    primaryColor: data.primaryColor || data.PrimaryColor || null,
    secondaryColor: data.secondaryColor || data.SecondaryColor || null,
});

export const fetchTenantBranding = () => async (dispatch) => {
    try {
        const response = await axiosInstance.get('/v1/tenant/branding');
        const payload = response?.data || {};
        const isEnvelope = payload && typeof payload === 'object' && (
            'success' in payload ||
            'Success' in payload ||
            'isSuccess' in payload ||
            'IsSuccess' in payload
        );

        if (isEnvelope) {
            const isSuccess = payload.isSuccess ?? payload.IsSuccess ?? payload.success ?? payload.Success ?? false;
            if (!isSuccess) {
                throw new Error(payload.message || payload.Message || 'Tenant branding request failed');
            }
        }

        const branding = normalizeBranding(payload.data || payload.Data || payload);

        dispatch({ type: SET_TENANT_BRANDING, payload: branding });

        // Push to CSS custom properties so the M365 design tokens pick up the
        // tenant's primary colour without any component-level subscriptions.
        applyBrandingToCssVars(branding);

        return { success: true, branding };
    } catch (error) {
        // Branding is non-critical — log but don't surface. Layout falls back
        // to the default M365 palette.
        console.warn('⚠️ Failed to fetch tenant branding:', error?.message || error);
        // Reset CSS vars so a stale colour from a prior tenant doesn't bleed.
        applyBrandingToCssVars({ primaryColor: null, secondaryColor: null });
        return { success: false };
    }
};
