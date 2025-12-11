# Expected Fuel Average Management System

## Overview

The Expected Fuel Average Management System provides a comprehensive solution for managing fuel consumption benchmarks for different vehicle types, routes, and operating conditions. This system supports two measurement types:

1. **km/L (Kilometers per Liter)** - For vehicles that travel routes (Prime Movers, Trucks, Tippers on routes)
2. **L/hr (Liters per Hour)** - For stationary or site-based equipment (Generators, Excavators, Loaders)

## Business Logic

### Vehicle Types and Measurement

#### km/L Based Vehicles
These are vehicles that travel on defined routes where fuel efficiency is measured by distance traveled:

- **Prime Movers (PM)**: Long-haul trucks with expected averages varying by:
  - Route direction (downhill vs uphill)
  - Load weight (Empty, 20-30t, Full Load)
  - Specific manufacturer/model combinations

- **Tippers (TP)**: Site-based trucks with averages varying by:
  - Working section/area within the site
  - Typically consistent load (same load on all trips)

**Example Scenarios:**
```
PM12 (Mercedes 3310, 2016):
- Nairobi → Naivasha, 20-30t load: 2.0 km/L
- Naivasha → Nairobi, 20-30t load: 1.5 km/L (uphill return)

PM15 (Sino SN400, 2018):
- Same route, same load: 1.8 km/L (downhill), 1.4 km/L (uphill)

TP22 (Sino SN300):
- Site A, Section 1: 2.4 km/L
- Site A, Section 2: 3.0 km/L
```

#### L/hr Based Vehicles
These are stationary equipment where fuel efficiency is measured by operating hours:

- **Generators (GEN)**: Expected consumption varies by:
  - Usage intensity (Heavy, Mid, Low)
  - Size/capacity of generator

- **Heavy Equipment**: Excavators, Loaders with consumption based on:
  - Operating intensity
  - Job type

**Example Scenarios:**
```
GEN01 (CAT 3500):
- Heavy usage: 15.0 L/hr
- Mid usage: 10.0 L/hr
- Low usage: 5.0 L/hr

EXC01 (Komatsu PC200):
- Heavy usage: 25.0 L/hr
- Mid usage: 18.0 L/hr
```

## Data Model

### Entity Relationships

```
┌─────────────────────┐     ┌──────────────────────────────┐
│   VehicleType       │────►│  ExpectedFuelAverageTemplate │
├─────────────────────┤     ├──────────────────────────────┤
│   PM, TP, GEN, etc  │     │  - VehicleTypeId (required)  │
└─────────────────────┘     │  - ManufacturerId (optional) │
                            │  - ModelId (optional)        │
┌─────────────────────┐     │  - SiteId (optional)         │
│ VehicleManufacturer │────►│  - RouteId (for km/L)        │
├─────────────────────┤     │  - LoadClassId (for km/L)    │
│  Mercedes, Sino,CAT │     │  - IntensityId (for L/hr)    │
└─────────────────────┘     │  - ExpectedValue             │
                            │  - Thresholds & Tolerance    │
┌─────────────────────┐     └──────────────────────────────┘
│   VehicleModel      │────►          │
├─────────────────────┤              │
│  3310, SN300, etc   │              │
└─────────────────────┘              ▼
                            ┌──────────────────────────────┐
┌─────────────────────┐     │  VehicleExpectedAvgAssignment│
│     FuelRoute       │────►├──────────────────────────────┤
├─────────────────────┤     │  - VehicleId                 │
│  NAI-NVS, NVS-NAI   │     │  - TemplateId                │
└─────────────────────┘     │  - IsDefault                 │
                            │  - OverrideValue (optional)  │
┌─────────────────────┐     └──────────────────────────────┘
│ LoadClassification  │────►          │
├─────────────────────┤              │
│ Empty, 20-30t, Full │              ▼
└─────────────────────┘     ┌──────────────────────────────┐
                            │        Vehicle               │
┌─────────────────────┐     ├──────────────────────────────┤
│  UsageIntensity     │────►│  PM12, TP22, GEN01           │
├─────────────────────┤     └──────────────────────────────┘
│ Heavy, Mid, Low     │
└─────────────────────┘
```

### Template Matching Logic

When a vehicle needs an expected average, the system finds the best matching template using:

1. **Mandatory Match**: Vehicle Type must match
2. **Progressive Specificity**: More specific templates have higher priority
   - Model + Manufacturer + Route + Load = Most specific
   - Type only = Least specific (fallback)
3. **Priority Field**: For manual priority override

## API Endpoints

### Base URL: `/api/v1/ExpectedFuelAverageManagement`

### Reference Data Management

#### Fuel Routes (for km/L vehicles)
```
GET    /routes                    - List all routes
GET    /routes/by-site/{siteId}   - Routes for specific site
POST   /routes                    - Create route
PUT    /routes/{id}               - Update route
DELETE /routes/{id}               - Delete/deactivate route
```

#### Load Classifications
```
GET    /load-classifications      - List all load classifications
POST   /load-classifications      - Create classification
PUT    /load-classifications/{id} - Update classification
DELETE /load-classifications/{id} - Delete/deactivate classification
```

#### Usage Intensities (for L/hr vehicles)
```
GET    /usage-intensities         - List all intensities
POST   /usage-intensities         - Create intensity
PUT    /usage-intensities/{id}    - Update intensity
DELETE /usage-intensities/{id}    - Delete/deactivate intensity
```

### Template Management

```
GET    /templates                              - List templates (with filters)
GET    /templates/{id}                         - Get specific template
GET    /templates/for-vehicle/{vehicleId}      - Get matching templates for vehicle
POST   /templates                              - Create template
PUT    /templates/{id}                         - Update template
DELETE /templates/{id}                         - Delete/deactivate template
```

### Vehicle Assignment

```
GET    /vehicle/{vehicleId}/assignments        - Get vehicle's assignments
GET    /vehicles                               - List all vehicles with assignments
POST   /vehicle/assign                         - Assign template to vehicle
PUT    /vehicle/{vehicleId}/default/{assignId} - Set default assignment
DELETE /vehicle/assignment/{assignmentId}      - Remove assignment
```

## Frontend Components

### Admin Section (`/admin/expected-averages`)

**Access Path:** Navigate to Admin → Expected Averages in the left sidebar

The admin page provides three main tabs:

1. **Templates Tab**
   - DataGrid showing all expected fuel average templates
   - Create/Edit/Delete templates via popup form
   - Filter by vehicle type, manufacturer, site
   - Export to Excel functionality
   - Search across all template fields

2. **Vehicle Assignments Tab**
   - Overview of all vehicles and their current assignments
   - Shows default template per vehicle
   - Filter by vehicles without assignments
   - Quick navigation to vehicle details

3. **Reference Data Tab**
   - Sub-tabs for:
     - **Fuel Routes**: Manage routes for km/L vehicles (From/To locations)
     - **Load Classifications**: Manage weight categories (Empty, 20-30t, Full)
     - **Usage Intensities**: Manage intensity levels for L/hr equipment (Heavy, Mid, Low)
   - Each sub-tab has its own DataGrid and Create/Edit forms

### Vehicle Details Integration (`/vehicles/{id}`)

The `VehicleDetails.js` component now includes an enhanced "Expected Average" popup:

**Features:**
- **Assign Template Tab**
  - Filter templates by route/load (km/L) or usage intensity (L/hr)
  - Select from matching templates
  - Optionally override the expected value for this specific vehicle
  - Set as default expected average

- **Current Assignments Tab**
  - View all templates assigned to this vehicle
  - See which is the default assignment
  - Remove individual assignments

**Usage:**
1. Navigate to Vehicle Details page
2. Click "Expected Average" button in header
3. In the popup, select a matching template
4. Optionally enable override and set vehicle-specific value
5. Check "Set as default" if this should be the primary expected average
6. Click "Save Assignment"

## Usage Workflow

### 1. Initial Setup (Admin)

1. **Create Reference Data**
   - Define routes (for km/L vehicles)
   - Define load classifications
   - Define usage intensities (for L/hr vehicles)

2. **Create Templates**
   - Start with broad templates (Type only)
   - Add specific templates as needed (Type + Manufacturer + Model + Route + Load)

### 2. Vehicle Assignment

#### Option A: Direct Assignment
1. Go to Vehicle Details
2. Click "Expected Average"
3. Select from matching templates
4. Optionally override value
5. Set as default if needed

#### Option B: Bulk Assignment (Admin)
1. Go to Admin > Expected Averages
2. Filter vehicles (e.g., all PM Mercedes without assignment)
3. Select vehicles
4. Bulk assign to template

### 3. Monitoring & Alerts

Templates include thresholds for:
- **MinThreshold**: Values below this are suspicious (data issue?)
- **MaxThreshold**: Values above this trigger alerts (overconsumption)
- **TolerancePercent**: Acceptable variance from expected

## Code Structure

```
FMS.Domain/
└── Entities/Features/FuelBusinessOperation/
    ├── FuelRoute.cs
    ├── LoadClassification.cs
    ├── UsageIntensity.cs
    ├── ExpectedFuelAverageTemplate.cs
    └── VehicleExpectedAverageAssignment.cs

FMS.Persistence/
└── EntityConfigurations/
    ├── FuelRouteConfiguration.cs
    ├── LoadClassificationConfiguration.cs
    ├── UsageIntensityConfiguration.cs
    ├── ExpectedFuelAverageTemplateConfiguration.cs
    └── VehicleExpectedAverageAssignmentConfiguration.cs

FMS.Application/
└── Features/ExpectedFuelAverage/
    ├── DTOs/
    │   └── ExpectedFuelAverageDTOs.cs
    ├── Commands/
    │   ├── ReferenceDataCommands.cs
    │   └── ExpectedFuelAverageCommands.cs
    ├── Queries/
    │   └── ExpectedFuelAverageQueries.cs
    └── ExpectedFuelAverageMappingProfile.cs

FMS.WebClient/
└── Controllers/FuelManagement/
    └── ExpectedFuelAverageManagementController.cs

fms.frontend/src/
├── api/
│   └── expectedFuelAverageApi.js       # API service with all endpoints
├── pages/
│   ├── admin/expectedaverages/
│   │   ├── index.js                     # Module exports
│   │   ├── ExpectedAverageManagementPage.js  # Main admin page
│   │   ├── ExpectedAverageManagement.scss    # Styles
│   │   └── components/
│   │       ├── TemplateForm.js          # Template create/edit form
│   │       └── ReferenceDataManagement.js    # Routes/Load/Intensity management
│   └── vehicles/component/vehicledetails/
│       └── EnhancedExpectedAverageForm.js    # Vehicle assignment popup
└── pages/admin/
    ├── AdminMain.js                     # Routes including /expected-averages
    ├── layout/AdminLayout.js            # Navigation sidebar item
    └── utils/navigationHelper.js        # Route definitions
```

## Database Tables

| Table | Description |
|-------|-------------|
| `fuelroutes` | Routes for km/L vehicles |
| `loadclassifications` | Load weight categories |
| `usageintensities` | Usage intensity for L/hr vehicles |
| `expectedfuelaveragetemplates` | Template definitions |
| `vehicleexpectedaverageassignments` | Vehicle-template links |

## Future Enhancements

1. **Automatic Template Suggestion**
   - Analyze historical consumption data
   - Suggest optimal expected values

2. **Seasonal Adjustments**
   - Temperature-based adjustments
   - Rainy season factors

3. **Real-time Monitoring**
   - Live comparison against expected
   - Instant alerts on variance

4. **Reporting**
   - Efficiency reports by vehicle/route
   - Cost savings analysis
