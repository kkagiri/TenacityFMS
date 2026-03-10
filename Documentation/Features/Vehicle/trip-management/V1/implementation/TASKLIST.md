# Task List: Vehicle Trip Management

## 1. Discovery and Design
- [ ] Confirm final trip table and trip group table schema
- [ ] Confirm `MovementProfile` enum values and default behavior
- [ ] Confirm global default thresholds for stop speed, stop duration, and cluster radius
- [ ] Confirm permissions for trip view and trip recompute
- [ ] Confirm whether historical backfill is needed for go-live
- [ ] Confirm future project-planning integration boundary
- [ ] Confirm how sections, borrow pits, dump points, and haul corridors will be geo-defined
- [ ] Confirm what constitutes `productive` vs `non-productive` movement
- [ ] Confirm whether production will use payload, standard cycle quantity, or manual capture

## 2. Domain and Persistence
- [ ] Add vehicle `movement profile` field
- [ ] Add trip leg entity
- [ ] Add trip group entity
- [ ] Add optional cluster snapshot entity if required for auditability
- [ ] Add nullable planning-link fields for project/zone matching
- [ ] Add out-of-bounds event entity or equivalent model
- [ ] Update EF configurations
- [ ] Update `GpsdataContext`
- [ ] Prepare migration script and verify MySQL compatibility

## 3. Application Feature Setup
- [ ] Create `FMS.Application/Features/VehicleTrips/Commands`
- [ ] Create `FMS.Application/Features/VehicleTrips/Queries`
- [ ] Create `FMS.Application/Features/VehicleTrips/DTOs`
- [ ] Create `FMS.Application/Features/VehicleTrips/Services`
- [ ] Create `FMS.Application/Features/VehicleTrips/Validators`
- [ ] Add request/response DTOs for trip list, trip detail, trip group, and recompute results

## 4. Vehicle Configuration Integration
- [ ] Extend vehicle DTOs with `movement profile`
- [ ] Update vehicle mapping profile
- [ ] Update vehicle create command flow
- [ ] Update vehicle update command flow
- [ ] Update vehicle read/query flow
- [ ] Update vehicle controller endpoints

## 5. Shared Trip Orchestration
- [ ] Implement trip orchestration service
- [ ] Implement per-vehicle/day processing pipeline
- [ ] Implement idempotent persistence strategy
- [ ] Implement confidence scoring model
- [ ] Implement anomaly flagging model
- [ ] Add hooks for future project-plan matching and productive-trip classification

## 6. Geofence Detection Engine
- [ ] Read active site geofence assignments
- [ ] Detect site entry/exit transitions
- [ ] Build site-to-site trip legs
- [ ] Build round-trip groups
- [ ] Handle overlap using closest centroid
- [ ] Handle off-site idle and unauthorized stops
- [ ] Mark low-confidence trips for GPS gaps
- [ ] Capture boundary-exit events for future out-of-bounds reporting

## 7. Cluster Detection Engine
- [ ] Extract stops from GPS history
- [ ] Implement configurable threshold evaluation
- [ ] Cluster stops by centroid radius
- [ ] Classify clusters into load/dump/other
- [ ] Replace cluster labels with known site labels when applicable
- [ ] Build trip legs from cluster transitions
- [ ] Build load-cycle groups
- [ ] Handle multi-drop/multi-cluster day patterns
- [ ] Support matching cluster centroids to future planning zones such as sections and borrow pits

## 8. Fuel Enrichment
- [ ] Integrate fuel audit GPS readings
- [ ] Resolve fuel at departure and arrival
- [ ] Calculate per-leg fuel consumption
- [ ] Calculate per-group fuel consumption
- [ ] Flag suspicious loaded vs empty leg anomalies
- [ ] Lower confidence when fuel data is missing or weak
- [ ] Support future actual-vs-expected fuel variance by planning zone and route benchmark

## 9. Processing Modes
- [ ] Implement realtime trip progress updates
- [ ] Implement daily reconciliation job/service
- [ ] Implement manual recompute command for vehicle/day
- [ ] Implement manual recompute command for vehicle/date range
- [ ] Ensure reruns do not create duplicates

## 10. API Layer
- [ ] Add trip list endpoint
- [ ] Add trip detail endpoint
- [ ] Add trip group endpoint
- [ ] Add recompute endpoint(s)
- [ ] Add filtering by vehicle, site, date range, mode, status, confidence
- [ ] Include out-of-bounds and productive/non-productive fields in API contracts
- [ ] Design future filters for project, section, borrow pit, and dump point
- [ ] Ensure all APIs return `FMSResponse<T>`

## 11. Dashboard and Reporting Integration
- [ ] Replace dashboard trip placeholders with persisted trip data
- [ ] Populate average trip duration and trip count metrics
- [ ] Connect route analysis/reporting views to trip APIs
- [ ] Add anomaly and low-confidence reporting output
- [ ] Add productive vs out-of-bounds movement reporting
- [ ] Add future section/borrow-pit/dump-point reporting model
- [ ] Define how production is calculated or clearly mark it unavailable when payload data is absent

## 12. Project Planning Integration Preparation
- [ ] Define future planning entities: project, work day, work zone, planned haul route, vehicle assignment
- [ ] Define geo-zone types: section, borrow pit, dump point, corridor
- [ ] Define trip-to-plan matching rules
- [ ] Define out-of-bounds thresholds by time and/or distance
- [ ] Define whether non-productive trips are excluded from production reports

## 13. Frontend: Vehicle Configuration
- [ ] Add `movement profile` field to vehicle edit form
- [ ] Add `movement profile` to create flow
- [ ] Update Redux actions/state if needed
- [ ] Validate display and save behavior

## 14. Frontend: Tracking and History
- [ ] Add trip panel/timeline to tracking page
- [ ] Add recompute action on tracking page
- [ ] Add trip history to vehicle details page
- [ ] Add trip details popup/panel
- [ ] Add confidence/anomaly badges
- [ ] Keep new UI split into smaller components where needed
- [ ] Reserve UX space for future plan match and out-of-bounds indicators

## 15. Frontend: Reports
- [ ] Replace static route analysis placeholder
- [ ] Add trip count and cycle count summaries
- [ ] Add trip distance, duration, and fuel metrics
- [ ] Add filter controls for date, vehicle, site, and detection mode
- [ ] Add future filter groups for section, borrow pit, dump point, and project
- [ ] Add out-of-bounds summary cards/tables

## 16. Testing and Verification
- [ ] Validate vehicle movement profile CRUD
- [ ] Validate site-to-site trip generation
- [ ] Validate shuttle/tipper cycle generation
- [ ] Validate hybrid site labeling for cluster centroids inside geofences
- [ ] Validate low-confidence handling on GPS gaps
- [ ] Validate duplicate-safe recompute
- [ ] Validate fuel enrichment and anomaly flags
- [ ] Validate dashboard/report consumers
- [ ] Validate out-of-bounds event generation and reporting
- [ ] Validate future plan-match readiness in the persisted model

## 17. Rollout Readiness
- [ ] Confirm seed/default configuration values
- [ ] Confirm permissions and navigation exposure
- [ ] Confirm backfill/go-live plan
- [ ] Confirm operational monitoring for reconciliation/recompute failures
- [ ] Prepare release notes if required
