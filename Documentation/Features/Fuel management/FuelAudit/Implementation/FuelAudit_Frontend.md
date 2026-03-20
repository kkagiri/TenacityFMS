# Fuel Audit Frontend Implementation

**Version:** 1.0
**Last Updated:** November 28, 2025
**Status:** ✅ Implemented
**Branch:** `feature/fuel-audit-gps-service`

---

## Overview

The Fuel Audit frontend provides a comprehensive React-based interface for creating and managing fuel audits. The core component is a 6-step wizard that guides users through the audit creation process.

---

## Component Architecture

```
fms.frontend/src/pages/tankStock/fuelAudit/
├── components/
│   ├── CreateAuditWizard.js       # 6-step audit creation wizard
│   ├── CreateAuditWizard.scss     # Wizard-specific styling
│   ├── AuditDashboard.js          # Main dashboard view
│   ├── AuditDetail.js             # Individual audit detail view
│   └── ... (other components)
├── FuelAuditMain.js               # Module routing
└── index.js                       # Module exports
```

---

## Create Audit Wizard (6-Step)

### Step Flow

```
┌─────────────┐   ┌─────────────┐   ┌─────────────┐
│   Step 1    │──▶│   Step 2    │──▶│   Step 3    │
│ Site/Period │   │ Select Tanks│   │Tank Preview │
└─────────────┘   └─────────────┘   └─────────────┘
                                           │
                                           ▼
┌─────────────┐   ┌─────────────┐   ┌─────────────┐
│   Step 6    │◀──│   Step 5    │◀──│   Step 4    │
│Review/Create│   │ Vehicle Preview │   │Select Vehicles│
└─────────────┘   └─────────────┘   └─────────────┘
```

### Step Details

#### Step 1: Site & Period Selection
- **Site**: Dropdown of available sites
- **Audit Type**: Weekly, Monthly, Quarterly, Yearly, Custom
- **Period Start/End**: DateTime pickers

**Validation:**
- Site is required
- Both dates are required
- End date must be after start date

#### Step 2: Select Tanks
- **DataGrid**: Multi-select grid of tanks at the selected site
- **Columns**: Tank #, Tank Name, Fuel Type, Capacity, Current Stock

**Validation:**
- At least one tank must be selected

**Data Source:** `fetchTanksForSite(siteId)` thunk

#### Step 3: Tank Preview
- **Summary Cards**:
  - Opening Stock (blue)
  - Closing Stock (green)
  - Total Deliveries (purple)
  - Total Dispensed (orange)
- **DataGrid**: Tank-by-tank breakdown with totals

**Data Source:** `fetchTankVolumePreview()` thunk

#### Step 4: Select Vehicles
- **Options**:
  - Include GPS Fleet Vehicles (checkbox)
  - Include Pickup Deliveries (checkbox)
- **DataGrid**: Multi-select grid of vehicles

**Validation:**
- At least one vehicle must be selected

**Data Source:** `fetchVehiclesForSite(siteId, options)` thunk

#### Step 5: Vehicle Preview
- **Summary Cards**:
  - Vehicle Count
  - Transaction Count
  - Total Fueled
- **DataGrid**: Vehicle-by-vehicle fueling breakdown

**Data Source:** `fetchFleetAuditPeriodFuel()` thunk

#### Step 6: Review & Create
- **Summary Sections**:
  - Site & Period summary
  - Tank summary with stock figures
  - Vehicle summary with options
  - Notes input
- **Preliminary Variance Calculation**:
  - Book Usage = Opening + Deliveries - Closing
  - Meter Dispensed
  - GPS Consumed
  - Estimated Variance

---

## Redux Integration

### Slice: `fuelAuditSlice.js`

#### Wizard State Structure
```javascript
wizard: {
  step: 1,                     // Current step (1-6)
  // Step 1
  siteId: null,
  periodStart: null,
  periodEnd: null,
  auditType: 'Weekly',
  // Step 2
  tanks: [],
  selectedTankIds: [],
  // Step 3
  tankPreview: null,
  // Step 4
  vehicles: [],
  selectedVehicleIds: [],
  includeGpsFleet: true,
  includePickups: true,
  // Step 5
  gpsPreview: null,
  // Step 6
  notes: '',
  autoPopulateTankReadings: true,
  // Validation
  validation: {
    step1: { valid: false, errors: [] },
    step2: { valid: false, errors: [] },
    step3: { valid: false, errors: [], warnings: [] },
    step4: { valid: false, errors: [] },
    step5: { valid: false, errors: [], warnings: [] },
    step6: { valid: true, errors: [] }
  }
}
```

#### Actions (Synchronous)
| Action | Description |
|--------|-------------|
| `setWizardStep(step)` | Set current wizard step |
| `setWizardSiteAndPeriod(payload)` | Update site, period, audit type |
| `setSelectedTanks(tankIds)` | Update selected tank IDs |
| `setSelectedVehicles(vehicleIds)` | Update selected vehicle IDs |
| `setVehicleOptions(options)` | Update GPS fleet/pickup options |
| `setWizardNotes(notes)` | Update audit notes |
| `setStepValidation(payload)` | Update step validation state |
| `resetWizard()` | Reset wizard to initial state |

#### Thunks (Asynchronous)
| Thunk | Purpose | API Endpoint |
|-------|---------|--------------|
| `fetchTanksForSite(siteId)` | Get tanks for site | `GET tanks/site/{siteId}` |
| `fetchVehiclesForSite(params)` | Get vehicles for site | `GET vehicles/site/{siteId}` |
| `fetchTankVolumePreview(params)` | Preview tank stock data | `POST fuelaudit/preview/tanks` |
| `fetchFleetAuditPeriodFuel(params)` | Preview GPS fleet data | `POST fleet/audit-period` |
| `createNewAudit(auditData)` | Create the audit | `POST fuelaudit` |

#### Selectors
```javascript
selectWizard          // Full wizard state
selectWizardTanks     // Wizard tanks array
selectWizardVehicles  // Wizard vehicles array
selectWizardTankPreview   // Tank preview data
selectWizardGpsPreview    // GPS preview data
```

---

## API Integration

### API Client: `fuelAuditApi.js`

```javascript
// Base URLs
const BASE_URL = 'fuelaudit';
const GPS_BASE_URL = 'fuelauditgps';
const TANK_BASE_URL = 'tanks';
const VEHICLE_BASE_URL = 'vehicles';

// Tank endpoints
getSiteTanks(siteId)           // GET tanks/site/{siteId}
previewTankData(params)        // POST fuelaudit/preview/tanks

// Vehicle endpoints
getSiteVehicles(siteId, params) // GET vehicles/site/{siteId}
previewGpsData(params)          // POST fuelauditgps/fleet/audit-period

// Audit CRUD
createAudit(data)              // POST fuelaudit
getAuditById(id)               // GET fuelaudit/{id}
getAudits(filters)             // GET fuelaudit
```

---

## Styling Guidelines

### Tailwind CSS (MANDATORY tw- prefix)
```jsx
// ✅ CORRECT
<div className="tw-flex tw-items-center tw-gap-4">
  <span className="tw-font-semibold tw-text-gray-800">Title</span>
</div>

// ❌ WRONG
<div className="flex items-center gap-4">
```

### FontAwesome Icons
```jsx
// ✅ CORRECT - Use fa-light
<i className="fa-light fa-building"></i>
<i className="fa-light fa-database"></i>
<i className="fa-light fa-truck"></i>
```

### Color Scheme
| Element | Background | Text |
|---------|------------|------|
| Opening Stock | `tw-bg-blue-50` | `tw-text-blue-600` |
| Closing Stock | `tw-bg-green-50` | `tw-text-green-600` |
| Deliveries | `tw-bg-purple-50` | `tw-text-purple-600` |
| Dispensed | `tw-bg-orange-50` | `tw-text-orange-600` |
| Warnings | `tw-bg-yellow-50` | `tw-text-yellow-800` |
| Errors | `tw-bg-red-50` | `tw-text-red-600` |

---

## DevExtreme Components Used

| Component | Purpose |
|-----------|---------|
| `SelectBox` | Site and audit type dropdowns |
| `DateBox` | Period start/end datetime pickers |
| `DataGrid` | Tank and vehicle selection grids |
| `CheckBox` | GPS fleet and pickup options |
| `TextArea` | Notes input |
| `Button` | Navigation and actions |
| `LoadIndicator` | Loading states |

### DataGrid Configuration
```jsx
<DataGrid
  dataSource={data}
  keyExpr="id"
  showBorders={true}
  height={400}
  selectedRowKeys={selectedKeys}
  onSelectionChanged={(e) => handleSelection(e.selectedRowKeys)}
>
  <Selection mode="multiple" showCheckBoxesMode="always" />
  <Scrolling mode="virtual" />
  <Paging enabled={false} />
  <Column dataField="field" caption="Label" />
  <Summary>
    <TotalItem column="total" summaryType="sum" />
  </Summary>
</DataGrid>
```

---

## Usage Example

```jsx
import CreateAuditWizard from './components/CreateAuditWizard';

const FuelAuditDashboard = () => {
  const [showWizard, setShowWizard] = useState(false);

  return (
    <div>
      <Button
        text="Create Audit"
        icon="plus"
        onClick={() => setShowWizard(true)}
      />

      {showWizard && (
        <Popup visible={showWizard} onHiding={() => setShowWizard(false)}>
          <CreateAuditWizard onClose={() => setShowWizard(false)} />
        </Popup>
      )}
    </div>
  );
};
```

---

## Navigation

After successful audit creation, the wizard navigates to:
```
/tankstock/fuel-audit/detail/{auditId}
```

---

## Error Handling

### Validation Errors
- Displayed below form fields with red text
- Step indicator shows validation status
- Cannot proceed to next step with errors

### API Errors
- Toast notifications for user feedback
- Error state in Redux for component handling
- Retry mechanisms for transient failures

---

## Mobile Responsiveness

- Step indicator collapses icons on small screens
- Grid layouts switch to single column
- Touch-friendly button sizes
- Scrollable content areas

---

## Related Files

| File | Purpose |
|------|---------|
| `CreateAuditWizard.js` | Main wizard component |
| `CreateAuditWizard.scss` | Wizard styles |
| `fuelAuditSlice.js` | Redux state management |
| `fuelAuditApi.js` | API client |
| `siteActions.js` | Site fetching action |

---

## Testing

### Manual Testing Checklist
- [ ] Step 1: Site selection and date validation
- [ ] Step 2: Tank grid loads and selection works
- [ ] Step 3: Tank preview displays correct data
- [ ] Step 4: Vehicle grid with options works
- [ ] Step 5: GPS preview displays correct data
- [ ] Step 6: Review shows all selections, notes input works
- [ ] Navigation: Back/Next buttons work correctly
- [ ] Creation: Audit creates and navigates to detail

### Unit Tests
Located in: `FMS.Testing/FuelAudit/`
- GPS service integration tests
- Calculation service tests

---

## Future Enhancements

1. **Draft Saving** - Save wizard progress for later completion
2. **Templates** - Quick-create from saved configurations
3. **Bulk Selection** - Select all tanks/vehicles options
4. **Historical Comparison** - Show previous audit data
5. **Variance Alerts** - Real-time threshold warnings
