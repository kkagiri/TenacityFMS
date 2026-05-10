/**
 * useBranding.js
 *
 * Hook exposing the current tenant's white-label branding to components.
 * Reads the tenantContext Redux slice that was hydrated by
 * fetchTenantBranding() at app bootstrap.
 *
 * Returns:
 *   - logoUrl       → use in <img src={logoUrl ?? defaultLogo} />
 *   - primaryColor  → already applied to --m365-primary; exposed here
 *                     for the rare component that needs the literal hex.
 *   - secondaryColor
 *   - hasBranding   → whether anything was returned by GET /tenant/branding
 *
 * Convention: Components SHOULD NOT inline `style={{color: primaryColor}}`.
 * Always reach for the M365 token (`color: 'var(--m365-primary)'`) so the
 * design system stays consistent and ThemeProvider/dark-mode can override.
 *
 * Last Modified: 2026-05-10
 */
import { useSelector } from 'react-redux';

export const useBranding = () => {
    const branding = useSelector((s) => s.tenantContext?.branding);
    const brandingLoaded = useSelector((s) => s.tenantContext?.brandingLoaded ?? false);

    const logoUrl = branding?.logoUrl || null;
    const primaryColor = branding?.primaryColor || null;
    const secondaryColor = branding?.secondaryColor || null;

    const hasBranding = Boolean(
        branding?.logoUrl || branding?.primaryColor || branding?.secondaryColor
    );

    return {
        logoUrl,
        primaryColor,
        secondaryColor,
        hasBranding,
        brandingLoaded,
    };
};

export default useBranding;
