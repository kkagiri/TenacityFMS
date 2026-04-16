# Warning Letter Generator Documentation

This folder documents the current warning-letter implementation in FMS.

## Included Artifacts

- `PRD.md` - as-is implementation review of the live backend, API, frontend, workflow, configuration, and notification behavior.
- `database/011_warning_letter_human_resource_full_access.sql` - MySQL-compatible script that grants the Human Resource role the warning-letter access set currently expected by the feature.

## Primary Implementation Roots

- `FMS.Application/Features/WarningLetter/*`
- `FMS.WebClient/Controllers/WarningLettersController.cs`
- `fms.frontend/src/pages/vehicles/warningLetters/*`
- `fms.frontend/src/pages/reports/ReportsMain.js`
- `fms.frontend/src/pages/employees/details/components/EmployeeWarningLettersWorkspace.js`
- `fms.frontend/src/pages/notifications/recipients/RecipientManagement.js`

## Active Frontend Routes

- `/reports/warning-letters`
- `/reports/warning-letters/new`
- `/reports/warning-letters/:id/edit`
- `/reports/warning-letters/:id/preview`

## Notes

1. The folder name remains `WarningLetterGenerator`, but the implemented application feature is named `WarningLetter` in code.
2. The settings experience is now primarily exposed from the warning-letter list page as a slide panel.