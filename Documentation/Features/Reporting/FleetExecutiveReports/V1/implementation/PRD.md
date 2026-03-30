# Fleet Executive Reports PRD

## Overview

This feature introduces two built-in executive PDF reports for fleet leadership review:

1. `Monthly Fleet Report`
2. `Weekly Fleet Report`

Both reports are designed for A4 landscape output through the existing jsreport plus Puppeteer PDF pipeline. They are intended for cross-functional operational review across fuel, distance, stock, loss, efficiency, and engine-hours data.

## Goals

- Provide a leadership-ready fleet performance pack directly from the FMS reporting engine.
- Preserve the supplied monthly report visual structure as closely as practical.
- Add a weekly-in-month variant that summarizes one selected month as week-by-week operational windows.
- Reuse the existing report engine, async job flow, template seeding, scheduling, and PDF delivery infrastructure.

## In Scope

- One built-in monthly source in the reports engine.
- One built-in weekly source in the reports engine.
- Embedded Handlebars templates for both reports.
- Landscape PDF rendering for both report IDs.
- Backend payload-builder scaffolding that returns template-ready structures.
- Documentation for rollout, open gaps, and implementation sequencing.

## Out of Scope

- Domain-layer changes.
- New frontend dashboards outside the reporting engine.
- Full historical forecasting beyond the report-specific quarter projection placeholders.
- A generic chart rendering framework for arbitrary executive decks.

## Users

- Operations leadership
- Fleet managers
- Fuel management teams
- Site managers
- Finance and audit reviewers

## Monthly Report Definition

### Purpose

Provide an executive fleet snapshot for a selected month with historical context across prior months and quarter-level comparison.

### Output Format

- PDF only for initial rollout
- A4 landscape
- Async generation path only

### Required Sections

1. Cover
2. Executive Summary
3. Stock Analysis
4. LV: Fuel Used vs Lost
5. LV: Efficiency
6. LV: Distance Analysis
7. HE: Dashboard
8. HE: Fuel Eff + Lost Matrix
9. HE: Engine Hours
10. HE: Fuel Eff vs Expected
11. Site Usage Matrix
12. Quarterly + Type Breakdown

### Primary Inputs

- `startDate`
- `endDate`
- `timeZone`

### Expected Behaviour

- The selected window should represent one report month.
- Historical monthly sections derive trailing monthly snapshots from the selected month.
- Quarter comparisons use the selected month as the anchor for Q1 actual vs Q2 projected placeholders.

## Weekly Report Definition

### Purpose

Provide a one-month executive review broken into weekly windows for the same overall fleet management audience.

### Output Format

- PDF only for initial rollout
- A4 landscape
- Async generation path only

### Required Sections

1. Cover
2. Executive Weekly Summary
3. Weekly Stock Analysis
4. Weekly LV Fuel Used vs Lost
5. Weekly LV Efficiency and Distance
6. Weekly HE Dashboard
7. Weekly HE Efficiency and Hours
8. Weekly Site Usage Matrix

### Primary Inputs

- `startDate`
- `endDate`
- `timeZone`

### Expected Behaviour

- The selected window should stay within one month.
- The backend splits the month into week buckets for reporting.
- Weekly views should still preserve all-site coverage and executive KPI framing.

## Functional Requirements

- The reports must appear as built-in sources in the reporting engine.
- Both reports must be available for async PDF generation.
- Both reports must render through the existing template seeding system.
- Both reports must force landscape orientation during PDF rendering.
- Both reports must support scheduling once payload integration is complete.
- Both reports must expose template-ready objects without requiring frontend post-processing for PDF generation.

## Non-Functional Requirements

- Reuse existing reporting infrastructure.
- Keep template logic shallow and move aggregation complexity to backend services.
- Maintain readable output in A4 landscape.
- Avoid synchronous preview for the initial rollout.

## Delivery Phases

### Phase 1

- Source registration
- Template registration
- Landscape routing
- Payload scaffolding
- Documentation

### Phase 2

- Real data aggregation for stock, LV, HE, and site usage sections
- Real chart series values
- Narrative generation rules
- Validation against business totals

### Phase 3

- Schedule enablement validation
- Optional HTML preview
- Template refinement and production hardening

## Risks

- Cross-domain aggregation requires multiple existing data sources that are not yet unified.
- The monthly executive layout is wide and chart-heavy, which increases PDF rendering cost.
- Weekly bucketing must remain stable across short and long months.

## Current Implementation Status

Phase 1 scaffolding starts with this change set. Templates, report IDs, source definitions, and backend payload entry points are introduced first so real aggregation logic can be layered in without reworking the report engine.