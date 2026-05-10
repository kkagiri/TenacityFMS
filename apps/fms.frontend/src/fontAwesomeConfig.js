/**
 * File: fontAwesomeConfig.js
 * Purpose: Configure Font Awesome runtime behavior for React compatibility.
 * Dependencies: window (browser runtime).
 * Last Modified: 2026-02-04
 *
 * Key Functions:
 * - Sets FontAwesomeConfig to disable DOM mutation-based SVG replacement.
 */

if (typeof window !== "undefined") {
  window.FontAwesomeConfig = {
    ...window.FontAwesomeConfig,
    autoReplaceSvg: false,
    observeMutations: false,
  };
}

