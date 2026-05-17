/**
 * File:          useLayoutAttributes.js
 * Purpose:       Apply the canonical Inspinia layout attributes to <html>.
 * Dependencies:  React
 * Last Modified: 2026-05-16
 *
 * Used by:       SideNavOuterToolbar (fms.frontend) and mirrored as a TS
 *                version in apps/FMS.Admin/src/utils/useLayoutAttributes.ts.
 *                Both shells MUST resolve to identical <html> attributes —
 *                see PRD §4.3 and SHELL_AUDIT.md.
 */

import { useEffect } from "react";

const BASE_ATTRIBUTES = Object.freeze({
  "data-layout": "basic-left",
  "data-menu-color": "light",
  "data-topbar-color": "light",
  "data-layout-position": "fixed",
  "data-layout-width": "fluid",
  "data-footer-position": "scrollable",
});

/**
 * Apply the shared Inspinia layout attributes to <html> for the lifetime of
 * the calling component. Removes them on unmount so route changes that leave
 * the shell (e.g. fullscreen reports) restore a clean DOM.
 *
 * @param {Object} [opts]
 * @param {"default"|"condensed"|"offcanvas"|"hidden"} [opts.sidenavSize]
 *   Optional dynamic sidenav size — written as data-sidenav-size when set.
 *   Pass undefined to leave the attribute alone.
 */
export default function useLayoutAttributes(opts = {}) {
  const { sidenavSize } = opts;

  useEffect(() => {
    const root = document.documentElement;
    Object.entries(BASE_ATTRIBUTES).forEach(([attr, value]) => {
      root.setAttribute(attr, value);
    });
    return () => {
      Object.keys(BASE_ATTRIBUTES).forEach((attr) => {
        root.removeAttribute(attr);
      });
      root.removeAttribute("data-sidenav-size");
    };
  }, []);

  useEffect(() => {
    if (sidenavSize === undefined) return;
    document.documentElement.setAttribute("data-sidenav-size", sidenavSize);
  }, [sidenavSize]);
}

export { BASE_ATTRIBUTES };
