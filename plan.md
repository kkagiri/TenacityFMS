# Vehicle Consumption Module Plan

## Goal
Build a proper Vehicle Consumption module by extending the existing vehicle and reporting surfaces already in the repo, not by creating a parallel feature from scratch.

The next agent should turn the current `/vehicles/consumption` area into a complete module with:
- a usable dashboard/list view
- filters and drill-down details
- comparison/reporting support
- permission-aware navigation
- M365 Admin Center styling
- mobile-safe layouts

## Verified Starting Points

### Existing frontend surfaces
- `fms.frontend/src/pages/vehicles/VehicleMain.js`
  - already routes:
    - `/vehicles/consumption`
    - `/vehicles/consumption-comparison`
    - `/vehicles/:id/consumption/:consumptionId/details`
- `fms.frontend/src/pages/vehicles/consumption/VehicleConsumptionPage.js`
  - currently acts like an analytics dashboard fed by `/Consumption/gpsAnalytics`
- `fms.frontend/src/pages/vehicles/consumption/VehicleConsumptionDetails.js`
- `fms.frontend/src/pages/vehicles/consumption/comparison/VehicleConsumptionComparisonPage.js`
- `fms.frontend/src/pages/vehicles/details/components/VehicleConsumptionHistory.js`
- `fms.frontend/src/services/domain/VehicleService.js`
  - already has vehicle consumption history fetching helpers

### Existing backend surfaces
- `FMS.WebClient/Controllers/Reporting/ConsumptionController.cs`
  - existing endpoints include:
    - `GET /api/v1/Consumption/gpsFiltered`
    - `GET /api/v1/Consumption/gpsAnalytics`
    - `GET /api/v1/Consumption/manualRefillsFiltered`
    - `GET /api/v1/Consumption/gethistoryconsumptionbyvehicle`
- `FMS.Application/Queries/Database/FMSQuery/Consumption/GetVehicleConsumptionGpsQueryFiltered.cs`
  - existing filtered GPS query
- `FMS.Application/Common/Constants/PermissionConstants.cs`
  - existing read permission: `_Read_VehicleConsumptionReport`

### Existing application structure constraints
- `FMS.Application/Features/Vehicle/` exists and should be reused where practical.
- `FMS.Application/Features/VehicleConsumption/` does not exist.
- Do not create a brand-new top-level application domain folder unless the user explicitly approves it.
- Do not modify `FMS.Domain/` unless the user explicitly approves domain-layer changes.

## Implementation Direction

### Preferred architectural approach
Use the existing `Vehicle` feature area and the current `ConsumptionController` as the first extension points.

Do this first:
- extend `FMS.Application/Features/Vehicle/DTOs/` for new response contracts if needed
- add new read-side queries under an appropriate location that matches current repo conventions
- keep controller changes inside the existing `ConsumptionController.cs` unless there is a clear reason to split later
- reuse `vehicleconsumption` table data already used by warning letters and current reporting queries

Do not do this unless user approves:
- creating `FMS.Application/Features/VehicleConsumption/`
- moving existing legacy/reporting consumption code across domains
- changing `FMS.Domain` entities

### Product direction for the module
The module should feel like a real operations module, not a single chart page.

Target experience:
- summary cards for total fuel, distance, engine hours, average efficiency, fuel lost
- searchable/filterable records grid
- fast drill-down to record detail
- comparison page for GPS vs refill/manual patterns
- clear site, vehicle, vehicle type, date, and mode filters
- explicit distinction between km/L and L/hr vehicles

## Scope For Next Agent

### Phase 1: Stabilize the module shell
1. Audit the current `/vehicles/consumption` page and decide whether to refactor it in place or split it into subcomponents.
2. Keep the route path `/vehicles/consumption`.
3. Keep the existing comparison route `/vehicles/consumption-comparison`.
4. Keep the detail route `/vehicles/:id/consumption/:consumptionId/details`.
5. Ensure the module is linked in the vehicle navigation if it is missing or visually weak.

### Phase 2: Backend read model cleanup
1. Inventory the existing consumption endpoints in `ConsumptionController.cs`.
2. Reuse existing endpoints where response shapes are already sufficient.
3. Add focused new read endpoints only if the current ones cannot support the UI cleanly.
4. Prefer CQRS-style read handlers over adding controller-level query logic.
5. Use `GpsdataContext` and MySQL 5.5/5.6-safe query patterns only.

### Phase 3: Frontend module completion
1. Turn `VehicleConsumptionPage.js` into a real module landing page.
2. Add a filter bar with:
   - date range
   - site
   - vehicle
   - vehicle type
   - consumption mode (km/L vs L/hr)
3. Add a records grid beneath the summary cards.
4. Make the grid row click navigate to the detail page.
5. Make the comparison page share the same filter language and layout tone.

### Phase 4: Detail view
1. Ensure the detail page clearly shows:
   - violated/record date
   - vehicle and plate
   - driver name from source row
   - site
   - expected average
   - actual efficiency
   - total fuel
   - fuel lost
   - distance
   - engine hours
   - max/avg speed
   - report/import reference where available
2. Show raw-source values without silently reinterpreting dates or units.
3. Reuse existing detail/history components where possible rather than duplicating them.

## UI And Design Rules

The next agent must follow the repo instructions and the design skill, with repo rules taking priority.

### Non-negotiable styling rules
- Use Microsoft 365 Admin Center flat design language.
- Light mode only.
- Use `Segoe UI` style system typography.
- Use compact 34px controls.
- Use native `<select>`, `<input type="date">`, and native checkboxes for simple controls.
- Use `fa-light` icons.
- Use SCSS, not plain CSS.
- Use Tailwind only with the `tw-` prefix.

### Layout guidance for the module page
- compact page header with inline icon and actions
- flat filter bar inside a white card or panel
- summary cards with neutral surfaces and 1px borders
- main grid below summaries
- detail view should use section groups, not oversized cards
- if there are more than 3 adjacent actions, use a segmented button group

### UX requirements
- mobile and desktop responsive
- no dark mode work
- no purple-biased styling
- avoid generic analytics-dashboard gradients if they clash with Fluent Admin styling

## Backend Plan

### Step A: Inventory and classify existing endpoints
The next agent should first map which UI needs are already covered by:
- `gpsFiltered`
- `gpsAnalytics`
- `manualRefillsFiltered`
- `gethistoryconsumptionbyvehicle`

Expected result:
- determine which endpoint feeds the dashboard cards
- determine which endpoint feeds the main records grid
- determine whether detail view can reuse an existing query or needs one dedicated endpoint

### Step B: Add missing read contracts only where necessary
If current endpoints are insufficient, add read-side contracts in existing feature structure.

Recommended additions if needed:
- `GetVehicleConsumptionModuleSummaryQuery`
- `GetVehicleConsumptionGridQuery`
- `GetVehicleConsumptionRecordDetailQuery`
- `GetVehicleConsumptionFilterOptionsQuery`

Preferred placement:
- extend current query locations if they are already consumption-focused
- or add under `FMS.Application/Features/Vehicle/Queries/Consumption/` if the user approves that refinement inside the existing Vehicle domain

### Step C: DTOs
Prefer DTOs under existing vehicle feature structure if new ones are needed.

Likely DTOs:
- `VehicleConsumptionModuleSummaryDto`
- `VehicleConsumptionGridItemDto`
- `VehicleConsumptionRecordDetailDto`
- `VehicleConsumptionFilterOptionsDto`

### Step D: Permission boundary
Use the existing read permission first:
- `_Read_VehicleConsumptionReport`

If the module needs create/update/delete actions later, do not invent frontend-only permissions.
Stop and ask for approval before introducing new permission constants or DB-backed permissions.

## Frontend Plan

### Step A: Refactor page structure
Refactor `VehicleConsumptionPage.js` into smaller pieces if necessary.

Recommended structure:
- `VehicleConsumptionPage.js` as page shell
- `components/VehicleConsumptionFilterBar.js`
- `components/VehicleConsumptionSummaryCards.js`
- `components/VehicleConsumptionGrid.js`
- `components/VehicleConsumptionEmptyState.js`

Only create files that clearly improve structure. Avoid splitting tiny helpers into many files.

### Step B: Data service layer
Add or extend a dedicated service wrapper instead of placing raw axios calls all over page components.

Preferred options:
- extend `fms.frontend/src/services/domain/VehicleService.js` if that keeps consumption logic coherent
- or add a focused consumption service under the vehicle module if the current service is too broad

Service responsibilities:
- summary fetch
- grid fetch
- detail fetch
- filter-option fetch
- response normalization

### Step C: Grid behavior
Grid should support:
- search panel
- filter row
- header filters where useful
- date sorting descending by default
- clear unit display for actual value and fuel lost
- site and vehicle columns
- explicit date column that reflects source `vehicleconsumption.Date`

### Step D: Detail behavior
Detail page should:
- show the exact row values for the selected record
- preserve calendar dates without timezone shifting
- show source-driver text separately from default vehicle employee where relevant
- expose the report/import reference if available

## Navigation And Wiring

### Vehicle routes
Keep using `fms.frontend/src/pages/vehicles/VehicleMain.js`.

### Module navigation
The next agent should inspect existing vehicle navigation wiring before changing anything.
If the consumption module item is missing or weak in the left navigation, update the existing vehicle layout/navigation structure rather than inventing a second entry point.

### Report-area overlap
There is already reporting-related consumption functionality under the reporting controller and report viewers.
The new module should reuse that backend capability but present it as a vehicle operations module, not duplicate report designer logic.

## Risks To Handle Explicitly

1. Legacy consumption code exists in multiple places. The next agent must identify the live path before deleting or replacing anything.
2. Date handling has already shown timezone-related bugs nearby. Treat all date-only fields carefully and avoid `toISOString().slice(0, 10)` for local calendar display values.
3. Some consumption data is grouped, some is raw row-level. The module must clearly separate aggregated summaries from raw record details.
4. Driver names in `vehicleconsumption.EmployeeName` may differ from default assigned employee. Preserve both when useful.
5. `IsKmperLiter` changes how values should be interpreted. UI labels must not assume km/L for all vehicles.

## Stop Conditions For The Next Agent

The next agent should stop and ask before proceeding if any of these become necessary:
- creating a new `FMS.Application/Features/VehicleConsumption/` domain folder
- changing `FMS.Domain/`
- adding new permissions that require DB migration
- replacing the existing `/api/v1/Consumption` controller outright
- deleting older consumption components without first proving they are unused

## Suggested Implementation Order

1. Confirm the live frontend entry points and current navigation behavior.
2. Confirm which existing backend endpoints already satisfy dashboard, grid, detail, and comparison needs.
3. Build or refactor the service wrapper for consistent data normalization.
4. Refactor `/vehicles/consumption` into header + filters + summaries + grid.
5. Tighten the detail page around raw row data and date correctness.
6. Improve the comparison page to use the same filters and visual language.
7. Validate permission gating and route access.

## Expected Deliverables

At minimum, the next agent should leave behind:
- a production-usable `/vehicles/consumption` module page
- a stable detail page
- aligned comparison page
- reused backend queries/endpoints or minimal new read endpoints
- consistent M365-style UI
- no domain-layer changes

## Final Notes For The Next Agent

- Reuse before rewriting.
- Keep changes narrow and traceable.
- Prefer existing Vehicle feature structure over inventing a new domain.
- Preserve route paths already in use.
- Use design-skill styling, but follow repo instructions first where they conflict.
- Do not build automatically unless the user explicitly asks.
