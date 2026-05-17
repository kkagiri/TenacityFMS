/**
 * File:          useLayoutAttributes.ts
 * Purpose:       TS mirror of fms.frontend useLayoutAttributes — applies the
 *                canonical Inspinia layout attributes to <html>.
 * Dependencies:  React
 * Last Modified: 2026-05-16
 *
 * Used by:       OperatorLayout. Must stay in lock-step with
 *                apps/fms.frontend/src/hooks/useLayoutAttributes.js. PRD §4.3.
 */

import { useEffect } from "react";

export type SidenavSize = "default" | "condensed" | "offcanvas" | "hidden";

export const BASE_ATTRIBUTES: Readonly<Record<string, string>> = Object.freeze({
  "data-layout": "basic-left",
  "data-menu-color": "dark",
  "data-topbar-color": "light",
  "data-layout-position": "fixed",
  "data-layout-width": "fluid",
  "data-footer-position": "scrollable",
});

export interface UseLayoutAttributesOptions {
  /**
   * Dynamic sidenav size — written as data-sidenav-size when defined. Leave
   * unset to skip the attribute entirely.
   */
  sidenavSize?: SidenavSize;
}

/**
 * Apply the shared Inspinia layout attributes to <html> for the lifetime of
 * the calling component. Removes them on unmount so leaving the shell
 * (e.g. logout, fullscreen view) restores a clean DOM.
 */
export default function useLayoutAttributes(
  opts: UseLayoutAttributesOptions = {},
): void {
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
