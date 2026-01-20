/**
 * DevExtreme Global Setup
 * This file must be imported FIRST before any DevExpress Reporting modules.
 * It exposes DevExtreme and Analytics Core to the global window object which
 * is required by the bundled devexpress-reporting scripts.
 */
import * as DevExpress from "devextreme/bundles/dx.all";

// Expose DevExpress globally for the reporting bundle
if (typeof window !== "undefined") {
  window.DevExpress = DevExpress;
}


