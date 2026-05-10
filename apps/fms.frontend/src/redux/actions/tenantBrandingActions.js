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
import axiosInstance from '../../api/axiosInstance';
import { SET_TENANT_BRANDING } from './types';
import { applyBrandingToCssVars } from '../../utils/applyBranding';

export const fetchTenantBranding = () => async (dispatch) => {
    try {
        const response = await axiosInstance.get('/v1/tenant/branding');
        // Backend returns FMSResponse-like envelope OR direct DTO depending on
        // the controller. TenantBrandingController returns the DTO directly.
        const data = response?.data?.data || response?.data || {};

        const branding = {
            logoUrl: data.logoUrl || data.LogoUrl || null,
            primaryColor: data.primaryColor || data.PrimaryColor || null,
            secondaryColor: data.secondaryColor || data.SecondaryColor || null,
        };

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
