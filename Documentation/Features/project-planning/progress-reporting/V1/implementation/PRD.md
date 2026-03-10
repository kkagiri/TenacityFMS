# Product Requirements Document: PM Daily Progress Reporting Design

## 1. Executive Summary

The PM Daily Progress Reporting module is a future project-planning and reporting capability that will consolidate:
- manual engineering progress updates
- next-day work program
- auto-generated haul/trip activity
- material movement summaries
- equipment utilization
- breakdown status
- progress photos

This module is intentionally designed as a separate business module from Vehicle Trip Management.

Vehicle Trips will provide the `actual movement facts` needed for haul analytics, while PM Daily Progress Reporting will provide the `project-management reporting layer` that combines manual and automated operational information into a daily report.

## 2. Problem Statement

Project managers prepare daily progress reports that contain multiple kinds of information:
- civil works progress narrative
- location-specific construction activities by chainage
- next-day planned activities
- plant and equipment engagement
- material movement totals
- breakdown records
- photos and captions

A trip engine alone cannot produce the full report because much of the report is not inferred from GPS data.

Examples that remain manual or semi-manual:
- culvert casting
- reinforcement fixing
- drainage opening
- tomorrow work program
- narrative descriptions
- photo captions

Therefore, the daily progress report must be a separate module that consumes trip facts where applicable but is not modeled as a trip-only feature.

## 3. Strategic Position in the Architecture

The solution should separate responsibilities into distinct layers:

### 3.1 Vehicle Trips
Answers:
- what movement actually happened
- how many cycles/trips were completed
- where vehicles moved
- what fuel was consumed
- which movement was out-of-bounds

### 3.2 Project Planning / Progress Reporting
Answers:
- what work was planned
- what engineering activity was completed
- which project section was active
- what should be reported to management today
- what is planned for tomorrow

### 3.3 Expected Average / Benchmarking
Answers:
- what fuel consumption was expected
- how actual haul performance compares to expected benchmarks

### 3.4 Maintenance / Breakdown
Answers:
- which equipment was unavailable
- what faults occurred
- how breakdowns affected productivity

## 4. Core Recommendation

The PM Daily Progress Reporting module should be implemented later as a separate module.

It should not be forced into the trip module.

However, the trip module should be designed now so that it can later feed this reporting module.

This means:
- yes, Trip Management is still needed now
- no, the PM report itself should not be treated as a trip feature
- the PM reporting module will consume trip outputs later

## 5. Business Goals

- Standardize daily progress reporting across projects
- Reduce manual repetition for equipment and haul reporting
- Link project progress to actual trip movement and consumption
- Support plan vs actual reporting
- Support section/chainage-based reporting for road works
- Combine narrative progress, trip data, breakdowns, and photos into one report

## 6. Scope

### In Scope
- PM daily report structure
- daily accomplished works section
- next-day program section
- plant and equipment engaged section
- material/trips/volume summary section
- breakdown section
- progress photo section
- integration points with trips, planning, and maintenance

### Out of Scope
- full trip-detection implementation
- full project planning implementation
- photo storage implementation details
- weighbridge integration
- mobile field reporting app in V1

## 7. Users

- Project managers
- Resident engineers
- Site engineers
- Planning engineers
- Operations managers
- Directors/management receiving the daily report

## 8. Report Structure

The PM Daily Progress Report should support the following sections.

### 8.1 Daily Accomplished Works
Narrative/manual engineering progress for the report date.

Examples:
- excavation and laying of rock fill
- casting of concrete
- fixing of steel reinforcement
- opening of drainage
- preparation of road diversion

Each entry should capture:
- project
- section
- date
- activity type
- location reference
- remarks
- status
- optional quantities
- optional attachments/photos

### 8.2 Next-Day Program
Planned work for the next day.

Each entry should capture:
- project
- target date
- planned activity
- location reference
- remarks
- dependency/constraint
- assigned crew/equipment if applicable

### 8.3 Plant and Equipment Engaged
Daily equipment involvement.

This section should combine:
- manual equipment remarks
- auto-derived trip activity from the trip engine

Example output:
- machine number
- work performed
- number of trips
- destination or route served
- notes

### 8.4 Material Movement Summary
System-generated or assisted summary of:
- material type
- trip count
- per-trip capacity
- total volume

Examples:
- fill
- spoil
- rock

### 8.5 Breakdown Summary
Pulled from maintenance/breakdown records.

Each entry should capture:
- machine/equipment number
- fault description
- broken part
- start/end time
- remarks
- breakdown date
- number of days under breakdown
- repair status

### 8.6 Progress Photos
Photo records with captions and metadata.

Each photo should capture:
- project
- date
- section
- location reference
- caption
- uploaded by
- timestamp

## 9. Location Model Requirements

The PM report requires more than site-based locations.

It must support three location styles:

### 9.1 Site/Zone Locations
Examples:
- site camp
- borrow pit
- disposal area
- dump point
- crusher

These can be represented with geofences.

### 9.2 Chainage-Based Linear Locations
Examples:
- Km 43+115 LHS
- Km 42+280 to 42+400 FW
- Km 57+925 RHS

These should be modeled with:
- road section
- start chainage
- end chainage
- side
- optional geo corridor/polygon

### 9.3 Haul Corridors
Examples:
- borrow pit -> Km 42 diversion
- spoil removal from Koru site camp
- fill material to site camp access

These should define productive movement corridors.

## 10. Functional Design

## 10.1 Manual Progress Entry
Users should be able to enter daily engineering progress manually because GPS cannot infer construction activities such as:
- concrete casting
- reinforcement fixing
- formwork installation/removal
- drainage works
- culvert works

## 10.2 Assisted Equipment/Trip Reporting
The system should automatically suggest or populate:
- trip counts by machine
- material movement totals
- productive routes served
- estimated volume moved
- fuel consumed
- out-of-bounds exceptions

## 10.3 Daily Report Assembly
The report generator should combine:
- manual project progress entries
- manual next-day program entries
- auto-generated trip/haul summaries
- maintenance breakdown data
- photo captions and attachments

## 11. Integration with Vehicle Trips

The PM report should consume, not replace, the trip module.

### Vehicle Trips Should Provide
- trip count
- cycle count
- origin/destination
- route/path compliance
- productive vs non-productive movement
- out-of-bounds events
- fuel usage
- distance and duration

### PM Reporting Should Add
- engineering progress narrative
- chainage work references
- tomorrow work plan
- manager-facing summary presentation
- photos and remarks

## 12. Integration with Project Planning

The PM reporting module should later connect to a project-planning module that defines:
- project
- work day / shift
- section
- borrow pit
- dump point
- active work zones
- assigned vehicles
- planned haul routes
- expected trip or production targets

This enables:
- planned vs actual comparison
- productive route validation
- section-based reporting
- work-area performance reporting

## 13. Integration with Expected Average

Expected Average should remain a benchmark source.

The PM reporting module should later use it for:
- actual vs expected fuel consumption
- route-based consumption variance
- section-based efficiency benchmarking

But it should not be used as the primary planning geo model.

## 14. Integration with Breakdown Management

Breakdown data should come from the maintenance/breakdown module.

The PM report should display:
- units under breakdown
- duration under breakdown
- repair remarks
- impact on productivity where relevant

## 15. Data Model Concepts

The future PM reporting module will likely require entities such as:
- `Project`
- `ProjectSection`
- `DailyProgressReport`
- `DailyProgressEntry`
- `NextDayProgramEntry`
- `WorkLocationReference`
- `RoadChainageSegment`
- `EquipmentEngagementRecord`
- `MaterialMovementSummary`
- `BreakdownReference`
- `ProgressPhoto`
- `ReportApprovalStatus`

## 16. Automation Opportunities

### Can Be Automated or Assisted
- trip counts by equipment
- material moved by route
- productive haul cycles
- total distance
- total fuel consumed
- out-of-bounds movement
- estimated volume from trip count × configured capacity

### Must Remain Manual or Semi-Manual
- narrative work descriptions
- culvert/drainage progress statements
- next-day work program
- photo captions
- interpretation of civil progress

## 17. Reporting Outputs

The module should support outputs such as:

### PM Daily Report
- narrative works done
- next-day program
- plant engaged
- material movement totals
- breakdowns
- photos

### Operations Summary
- trips by machine
- trips by route/section
- productive vs non-productive movement
- fuel used by work zone

### Production Summary
- trip count
- estimated moved volume
- section-wise output
- plan vs actual performance

## 18. Production Reporting Constraint

True production reporting may require additional data not available from GPS alone.

To report actual production confidently, the wider solution may need:
- payload per trip
- vehicle standard capacity
- standard cycle quantity
- loader bucket counts
- weighbridge data
- manual quantity entry

Until then, the module can still report:
- trip count
- estimated volume
- machine engagement
- fuel consumption
- movement activity

## 19. Non-Functional Requirements

- Daily report generation should support manual editing before finalization
- Auto-generated movement sections should be traceable to source trip data
- Reports should be printable/exportable
- Reports should preserve manual narrative formatting
- The module should support later approval workflow

## 20. Acceptance Criteria

- users can create a PM daily progress report for a date and project
- users can capture completed works and next-day program entries
- the report can include equipment engagement and material movement summaries
- the report can include linked breakdown information
- the report can include progress photos with captions
- trip-derived sections are clearly separated from manual narrative sections
- the architecture keeps PM reporting separate from the trip engine while still allowing integration

## 21. Recommended Delivery Approach

### Phase 1
- define report structure
- define data model
- implement manual daily progress entry
- implement next-day program entry

### Phase 2
- integrate trip-derived equipment and material movement summaries
- integrate breakdown summary
- integrate photo attachments

### Phase 3
- integrate project planning context
- add planned vs actual reporting
- add production benchmarking and approval workflow

## 22. Final Position

The PM Daily Progress Reporting module should be built later as a separate module.

Trip Management is still required now because it provides the operational movement data needed for automation.

But the PM report itself should not be implemented as a trip-only feature. It is a broader reporting and project-management layer that will consume trip, planning, expected-average, and maintenance data.
