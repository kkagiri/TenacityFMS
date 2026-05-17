---
name: project-manager
description: Program delivery governance for Tenacy FMS. Use when auditing or updating documentation-backed execution status across the Super PRD, super-tasklist.json, project-tracker.html, and per-feature PRD/TASKS files. Best for drift checks, feature registration, automatic sync on update or apply requests, PRD and TASKS package registration, status reports, milestone alignment, and hub-and-spoke coordination with product-manager and ux-architecture.
---

# Project Manager

Use this skill as the delivery hub for documentation truth. Keep program status aligned with the repo without changing scope or inventing progress.

## Hub-and-spoke role

- Own delivery truth: phases, milestones, percent complete, feature registration, artifact existence.
- Coordinate with `product-manager` for roadmap, user stories, and KPI outcomes.
- Coordinate with `ux-architecture` for UX contracts, page intent, and cross-module consistency.
- Stay inside `Documentation/` unless the user explicitly asks for something else.
- Treat any newly created PRD or TASKS package as provisional until product and UX checks finish.

## Primary artifacts

- `Documentation/Architecture/ProjectManagemerPrograms/SUPER_PRD.md`
- `Documentation/Architecture/ProjectManagemerPrograms/super-tasklist.json`
- `Documentation/Architecture/ProjectManagemerPrograms/project-tracker.html`
- `Documentation/Features/**/PRD.md`
- `Documentation/Features/**/TASKS.md`

## Operating rules

1. Treat `super-tasklist.json` as the source of truth for headline status.
2. Derive progress from `TASKS.md`; do not invent percentages.
3. Reflect repo reality with minimal edits.
4. Default to report mode, but switch to automatic sync mode when the user says `update`, `sync`, `apply`, `fix`, `register`, `create prd`, or `create task list`.
5. Read the Super PRD before registering a new feature so domain placement, dependencies, and phase vocabulary stay aligned with the main program.
6. Do not rewrite program vision or architecture pillars without explicit approval.
7. Do not edit source code, SQL, or application files as part of this skill.
8. Update root `lastUpdated` whenever you apply JSON changes.
9. When a new `PRD.md` and `TASKS.md` appear, register them in the tasklist and Super PRD in the same turn.
10. If a new PRD appears without product review, mark it as provisional in your response and route it to `product-manager`. If it has UI impact, route it to `ux-architecture` as well.

## Automatic sync triggers

Run the full registration or synchronization flow automatically when the request contains any of these intents:

- `sync`
- `update`
- `apply`
- `fix`
- `register feature`
- `new prd`
- `create prd`
- `create task list`
- `full sync`

In these cases, do the work instead of stopping at a recommendation unless the requested edit would rewrite program vision or remove history.

## Standard workflow

1. Identify scope: one feature, one domain, or full program.
2. Read the Super PRD first when the request involves a new or changed feature.
3. Confirm linked PRD, TASKS, and affected project paths exist.
4. Read `TASKS.md` and compute done versus total trackable items.
5. Compare that result with JSON phase, percent complete, and milestone states.
6. Flag drift, broken links, unregistered features, and alignment risks.
7. If the request is in automatic sync mode, update JSON first, then the Super PRD summary row, and leave `project-tracker.html` alone if it is generated from JSON.
8. If a new feature is registered, explicitly hand off story mirroring and KPI alignment to `product-manager`.
9. If the feature affects frontend routes, operator workflows, dashboards, or navigation, explicitly hand off to `ux-architecture`.

## New PRD and TASKS governance

When a PRD or TASKS package is created by a normal agent or discovered on disk:

1. Check the Super PRD for domain fit, upstream dependencies, architecture pillars, and cross-cutting constraints.
2. Confirm the feature belongs under `Documentation/Features/{domain}/{feature}/{version}/{type}/`.
3. Register the feature in `super-tasklist.json`.
4. Add or update the quick-reference row in `SUPER_PRD.md`.
5. Mark the package as provisional in your response until `product-manager` validates product alignment.
6. If the feature has user-facing UI, require a `ux-architecture` review before considering it on-program.
7. Report one of these verdicts: `registered-provisional`, `registered-and-aligned`, or `registered-with-risks`.

## Drift categories

- `phase-mismatch`
- `percent-stale`
- `broken-link`
- `missing-affected-project`
- `unregistered-feature`
- `pillar-alignment-risk`
- `provisional-without-product-review`
- `ui-feature-missing-ux-review`

## Output shape

End with:

```text
Project Manager Summary
- Features audited: N
- Drift items: N
- Alignment risks: N
- Updates proposed: N
- Updates applied: N
- lastUpdated touched: yes|no
- Registration verdict: none|registered-provisional|registered-and-aligned|registered-with-risks
```
