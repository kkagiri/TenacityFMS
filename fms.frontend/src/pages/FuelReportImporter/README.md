# Fuel Report Importer Module

A comprehensive fuel report import system supporting both single file and batch file imports with Excel parsing, validation, and real-time progress tracking.

## Table of Contents

- [Overview](#overview)
- [Folder Structure](#folder-structure)
- [Core Components](#core-components)
- [Hooks](#hooks)
- [Utilities](#utilities)
- [Usage](#usage)
- [Architecture](#architecture)

---

## Overview

The Fuel Report Importer module provides two import modes:

1. **Single File Import** - Upload and process one Excel file at a time with immediate preview and validation
2. **Batch Import** - Upload multiple Excel files with SignalR-based real-time progress tracking

### Supported Report Types

- **km/l** - Kilometer per liter efficiency reports (vehicles)
- **l/hr** - Liter per hour efficiency reports (equipment/machinery)

---

## Folder Structure

```
FuelReportImporter/
├── FuelReportImporter.js      # Main entry component (single file import)
├── FuelReportImporter.scss    # Main styles
├── index.js                   # Module exports
│
├── components/                # UI Components
│   ├── DataPreview.js         # Main data preview container (composition)
│   ├── DataPreviewHeader.js   # Header with badges & selection info
│   ├── DataPreviewActions.js  # Filter buttons & action controls
│   ├── ImportDataGrid.js      # DevExtreme DataGrid configuration
│   ├── gridCellRenderers.js   # Reusable cell renderer functions
│   ├── ImportResultDialog.js  # Import result popup dialog
│   ├── ImportCalendarPopup.js # Calendar/date selection popup
│   │
│   ├── single/                # Single file import components
│   │   ├── ImportForm.js      # File upload form
│   │   ├── ImportConfirmation.js
│   │   ├── ImportProgress.js
│   │   ├── SiteConfirmation.js
│   │   ├── SuccessAlert.js
│   │   └── ValidationAlerts.js
│   │
│   └── batch/                 # Batch import components
│       ├── BatchImportPage.js # Main batch import page
│       ├── BatchImportGrid.js # File list grid
│       ├── BatchFilePreviewPopup.js
│       ├── batchImportUtils.js
│       ├── processFileImport.js
│       ├── useBatchImportSignalR.js  # SignalR real-time connection
│       └── hooks/             # Batch-specific hooks
│           ├── useBatchImportState.js
│           ├── useBatchImportHandlers.js
│           └── useBatchImportEffects.js
│
├── hooks/                     # Shared custom hooks
│   ├── useImporterState.js    # Main state management
│   ├── useFileHandling.js     # File upload/processing
│   ├── useExcelParsing.js     # Excel file parsing
│   ├── useDataProcessing.js   # Data transformation
│   ├── useDataValidation.js   # Data validation logic
│   ├── useValidation.js       # Validation state & filtering
│   ├── useImportHandlers.js   # Event handlers
│   ├── useImportSubmission.js # API submission
│   ├── useImportEffects.js    # Side effects
│   └── useImportUtils.js      # Utility functions
│
└── utils/                     # Utility functions
    ├── formatting/            # Data formatting utilities
    ├── lookup/                # Lookup/reference data utilities
    └── parsing/               # Excel parsing utilities
```

---

## Core Components

### Main Entry Points

| Component               | Purpose                                            |
| ----------------------- | -------------------------------------------------- |
| `FuelReportImporter.js` | Single file import - main entry point (~550 lines) |
| `BatchImportPage.js`    | Batch file import - main entry point (~430 lines)  |

### DataPreview Components (Shared)

The DataPreview system uses a composition pattern for maintainability:

```
DataPreview.js (126 lines - composition)
├── DataPreviewHeader.js     # Title, badges, selection info
├── DataPreviewActions.js    # Filter & action buttons
└── ImportDataGrid.js        # DevExtreme DataGrid
    └── gridCellRenderers.js # Cell render functions
```

| Component               | Lines | Purpose                                                    |
| ----------------------- | ----- | ---------------------------------------------------------- |
| `DataPreview.js`        | ~130  | Container that composes sub-components                     |
| `DataPreviewHeader.js`  | ~100  | Row count, error badges, selection info with delete action |
| `DataPreviewActions.js` | ~160  | Filter toggle buttons, validation controls                 |
| `ImportDataGrid.js`     | ~320  | Full DataGrid with all columns                             |
| `gridCellRenderers.js`  | ~310  | Reusable cell renderers (Selection, Status, Night Shift)   |

### Single File Import Components

| Component               | Purpose                                         |
| ----------------------- | ----------------------------------------------- |
| `ImportForm.js`         | File upload dropzone with report type selection |
| `ImportConfirmation.js` | Confirmation dialog before import               |
| `ImportProgress.js`     | Progress indicator during import                |
| `SiteConfirmation.js`   | Site/location confirmation dialog               |
| `SuccessAlert.js`       | Success notification after import               |
| `ValidationAlerts.js`   | Validation error display                        |

### Batch Import Components

| Component                  | Purpose                                  |
| -------------------------- | ---------------------------------------- |
| `BatchImportPage.js`       | Main batch import orchestration          |
| `BatchImportGrid.js`       | File list with status indicators         |
| `BatchFilePreviewPopup.js` | Preview popup for individual files       |
| `batchImportUtils.js`      | Utility functions for batch processing   |
| `processFileImport.js`     | File processing logic                    |
| `useBatchImportSignalR.js` | SignalR connection for real-time updates |

---

## Hooks

### Shared Hooks (Single File Import)

| Hook                  | Purpose                                           |
| --------------------- | ------------------------------------------------- |
| `useImporterState`    | Central state management (files, data, UI states) |
| `useFileHandling`     | File upload, drag-drop, file type validation      |
| `useExcelParsing`     | Excel file parsing with XLSX library              |
| `useDataProcessing`   | Transform parsed data to import format            |
| `useDataValidation`   | Validate data against business rules              |
| `useValidation`       | Validation state, error filtering, fix tracking   |
| `useImportHandlers`   | UI event handlers (selection, editing)            |
| `useImportSubmission` | API calls for import submission                   |
| `useImportEffects`    | Side effects (auto-load, data refresh)            |
| `useImportUtils`      | Utility functions for import operations           |

### Batch-Specific Hooks

| Hook                     | Purpose                       |
| ------------------------ | ----------------------------- |
| `useBatchImportState`    | Batch import state management |
| `useBatchImportHandlers` | Batch operation handlers      |
| `useBatchImportEffects`  | Batch import side effects     |

---

## Utilities

### `utils/formatting/`

- Date formatting
- Number formatting
- Display text formatting

### `utils/lookup/`

- Vehicle lookup functions
- Site/location lookup
- Driver lookup

### `utils/parsing/`

- Excel column mapping
- Data type conversion
- Row normalization

---

## Usage

### Single File Import

```jsx
import FuelReportImporter from "./pages/FuelReportImporter";

// In your router or page
<FuelReportImporter />;
```

### Batch Import

```jsx
import { BatchImportPage } from "./pages/FuelReportImporter/components/batch";

// In your router or page
<BatchImportPage />;
```

### Using DataPreview Standalone

```jsx
import { DataPreview } from "./pages/FuelReportImporter/components";

<DataPreview
  parsedData={data}
  reportType="km/l"
  validationErrors={errors}
  vehicles={vehicleList}
  sites={siteList}
  // ... other props
/>;
```

---

## Architecture

### Data Flow

```
Excel File → useExcelParsing → useDataProcessing → useDataValidation
                                      ↓
                              DataPreview (grid display)
                                      ↓
                              useImportSubmission → API
```

### State Management Pattern

The module uses React hooks for state management with a clear separation:

1. **State Hooks** - Hold and update state (`useImporterState`, `useBatchImportState`)
2. **Handler Hooks** - Define event handlers (`useImportHandlers`, `useBatchImportHandlers`)
3. **Effect Hooks** - Manage side effects (`useImportEffects`, `useBatchImportEffects`)
4. **Utility Hooks** - Reusable logic (`useValidation`, `useExcelParsing`)

### Component Composition Pattern

Large components are broken down using composition:

```jsx
// Instead of one 1000+ line component:
const DataPreview = () => {
  return (
    <div>
      <DataPreviewHeader {...headerProps} />
      <DataPreviewActions {...actionProps} />
      <ImportDataGrid {...gridProps} />
    </div>
  );
};
```

### Styling Guidelines

- Use **Tailwind CSS** with `tw-` prefix (required to avoid DevExtreme conflicts)
- Use **SCSS** files for component-specific styles (not CSS)
- Use **FontAwesome** icons with `fa-light fa-*` pattern

```jsx
// ✅ Correct
<div className="tw-flex tw-items-center tw-gap-2">
  <i className="fa-light fa-check"></i>
</div>

// ❌ Wrong - missing tw- prefix
<div className="flex items-center gap-2">
```

---

## File Size Summary

| Category                 | Files   | Total Lines (approx) |
| ------------------------ | ------- | -------------------- |
| Main Components          | 2       | ~1,000               |
| DataPreview System       | 5       | ~1,000               |
| Single Import Components | 6       | ~600                 |
| Batch Import Components  | 6       | ~800                 |
| Hooks (shared)           | 10      | ~1,200               |
| Hooks (batch)            | 3       | ~400                 |
| Utilities                | 3+      | ~300                 |
| **Total**                | **~35** | **~5,300**           |

---

## Development Notes

### Adding New Validation Rules

1. Add validation logic in `useDataValidation.js`
2. Update error display in `gridCellRenderers.js` if needed
3. Add any new fix actions to the Status cell renderer

### Adding New Columns

1. Add column definition in `ImportDataGrid.js`
2. Add cell renderer in `gridCellRenderers.js` if custom rendering needed
3. Update Excel parsing in `utils/parsing/` if new data field

### Real-time Updates (Batch Import)

The batch import uses SignalR for real-time progress:

```jsx
// useBatchImportSignalR.js handles:
// - Connection management
// - Progress updates
// - Error handling
// - Reconnection logic
```

---

_Last Updated: December 2025_
