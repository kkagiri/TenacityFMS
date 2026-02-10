# Deprecated Report Components

These files were part of the **DevExtreme Reporting** integration which has been
replaced by the JSReport-first architecture.

## Files

| File | Replacement |
|------|-------------|
| `DevExtremeReportViewer.js` | `engine/ReportEngine.js` + `engine/ReportOutputViewer.js` |
| `DevExtremeReportDesigner.js` | `templates/TemplateDesigner.js` |
| `analytics-core-setup.js` | No longer needed — JSReport does not require this |
| `devextreme-global-setup.js` | No longer needed — JSReport does not require this |
| `ReportDesignerRedirect.js` | `templates/TemplateDesigner.js` |

## Removal Plan

These files will be deleted in the next major release once all consumers have
been verified to reference the new modules instead.
