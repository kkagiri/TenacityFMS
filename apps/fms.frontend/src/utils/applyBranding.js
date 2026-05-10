/**
 * applyBranding.js
 *
 * Bridges tenant branding (Tenant.PrimaryColor / SecondaryColor) into the
 * M365 / Insignia design tokens used by all components.
 *
 * The design system defines the FMS palette via CSS custom properties:
 *   --brand-primary          (tenant primary accent alias)
 *   --brand-secondary        (tenant secondary accent alias)
 *   --m365-primary           (default #0078d4 — Fluent blue)
 *   --m365-primary-hover     (default #106ebe)
 *   --m365-primary-pressed   (default #005a9e)
 *   --m365-secondary         (default #605e5c — neutral grey)
 *
 * White-labeling rule: the Client tenant overrides ONLY the primary accent
 * (and a derived hover/pressed). The neutral M365 chrome (text, borders,
 * surface, tints) stays constant — this matches the design-system promise
 * that branding is "logo + accent" only, not a full theme rewrite.
 *
 * Calling with all-null clears overrides → site reverts to M365 defaults.
 *
 * Last Modified: 2026-05-10
 */

/**
 * Lighten/darken a hex colour by a percentage. -0.10 = 10% darker.
 * Used to derive hover/pressed shades from the primary brand colour.
 * @param {string} hex - "#RRGGBB" or "#RGB"
 * @param {number} amount - -1.0 .. 1.0 (negative = darker)
 * @returns {string|null}
 */
const adjustColor = (hex, amount) => {
    if (!hex || typeof hex !== 'string') return null;
    let h = hex.trim().replace('#', '');
    if (h.length === 3) {
        h = h.split('').map((c) => c + c).join('');
    }
    if (h.length !== 6 || /[^0-9a-fA-F]/.test(h)) return null;

    const num = parseInt(h, 16);
    const clamp = (v) => Math.max(0, Math.min(255, v));
    const r = clamp((num >> 16) + Math.round(255 * amount));
    const g = clamp(((num >> 8) & 0xff) + Math.round(255 * amount));
    const b = clamp((num & 0xff) + Math.round(255 * amount));
    return `#${[r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('')}`;
};

/**
 * Validates a hex colour string. Accepts "#RGB" and "#RRGGBB". Anything
 * else returns false — the controller already validates server-side, this
 * is defence in depth.
 */
const isValidHex = (value) =>
    typeof value === 'string' &&
    /^#([0-9a-fA-F]{3}){1,2}$/.test(value.trim());

/**
 * Applies tenant branding to the CSS custom properties consumed by the
 * M365 design system. Pass { primaryColor: null, secondaryColor: null }
 * to clear (revert to M365 defaults).
 *
 * @param {{primaryColor: string|null, secondaryColor: string|null, logoUrl?: string|null}} branding
 */
export const applyBrandingToCssVars = (branding) => {
    if (typeof document === 'undefined') return; // SSR / tests

    const root = document.documentElement;

    // Primary accent — overrides --m365-primary plus derived hover/pressed.
    if (isValidHex(branding?.primaryColor)) {
        const primary = branding.primaryColor.trim();
        root.style.setProperty('--brand-primary', primary);
        root.style.setProperty('--m365-primary', primary);

        const hover = adjustColor(primary, -0.06);
        if (hover) root.style.setProperty('--m365-primary-hover', hover);

        const pressed = adjustColor(primary, -0.12);
        if (pressed) root.style.setProperty('--m365-primary-pressed', pressed);
    } else {
        root.style.removeProperty('--brand-primary');
        root.style.removeProperty('--m365-primary');
        root.style.removeProperty('--m365-primary-hover');
        root.style.removeProperty('--m365-primary-pressed');
    }

    // Secondary — used for badges/icons accents that need a second brand colour.
    if (isValidHex(branding?.secondaryColor)) {
        const secondary = branding.secondaryColor.trim();
        root.style.setProperty('--brand-secondary', secondary);
        root.style.setProperty('--m365-secondary', secondary);
    } else {
        root.style.removeProperty('--brand-secondary');
        root.style.removeProperty('--m365-secondary');
    }
};
