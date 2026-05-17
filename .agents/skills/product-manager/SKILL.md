---
name: product-manager
description: Product outcomes governance for Tenacy FMS. Use when managing business-goals.json, business-goals.html, roadmap horizons, user stories, acceptance criteria, KPI reviews, feature outcome validation, or automatically verifying that new PRDs stay aligned with the main product goals. Works as the product-alignment spoke alongside project-manager and ux-architecture.
---

# Product Manager

Use this skill as the product outcomes spoke. Keep the roadmap, stories, and KPI evidence aligned with real user value rather than delivery theater.

## Hub-and-spoke role

- `project-manager` owns delivery status and feature registration.
- `product-manager` owns roadmap, backlog, acceptance criteria, KPIs, and outcome validation.
- `ux-architecture` turns stories into page intent, interaction contracts, and operational UX structure.
- Every new feature PRD must be checked here before it is considered aligned with the main product direction.

## Primary artifacts

- `Documentation/Architecture/ProjectManagemerPrograms/business-goals.json`
- `Documentation/Architecture/ProjectManagemerPrograms/business-goals.html`
- `Documentation/Architecture/ProjectManagemerPrograms/SUPER_PRD.md`
- `Documentation/Features/**/PRD.md`
- `Documentation/Architecture/ProjectManagemerPrograms/super-tasklist.json`

## Operating rules

1. Treat `business-goals.json` as the source of truth for KPIs, roadmap, stories, and outcomes.
2. Never invent KPI values. Use user-supplied, telemetry-backed, or billing-backed numbers only.
3. Keep story format canonical: `As a..., I want..., so that...`.
4. Require at least one explicit acceptance criterion before moving a story beyond `draft`.
5. Default to report mode, but switch to automatic mirror or verification mode when the user says `save`, `apply`, `update`, `sync`, `create prd`, `register stories`, or `review alignment`.
6. Read the Super PRD business goals and domain coverage before approving a new PRD.
7. If a PRD does not clearly support an existing goal, classify it as off-course or requiring goal expansion rather than silently approving it.
8. Do not change delivery phase, milestone status, or percent complete.
9. Do not edit source code or non-documentation files through this skill.
10. Update `lastUpdated` whenever JSON changes are applied.
11. When a new feature PRD is registered, mirror its user stories into `business-goals.json` and add a roadmap entry in the same turn.

## Standard workflow

1. Confirm the feature exists in `super-tasklist.json` if the request is feature-specific.
2. Read the Super PRD business goals, domain coverage, and architecture pillars relevant to the feature.
3. Read the PRD problem statement, personas, stories, and outcome sections.
4. Map the PRD to one or more existing product goals or explicitly flag the gap.
5. Validate existing roadmap horizon against the delivery phase.
6. Validate user story structure, status vocabulary, and acceptance-criteria coverage.
7. Validate KPIs and outcomes without inventing evidence.
8. If the request is in automatic mirror or verification mode, update `business-goals.json` and leave the HTML alone when it is a render target.
9. If delivery drift is blocking the product update, defer that part to `project-manager`.

## New PRD alignment review

When a PRD is created by a normal agent or discovered on disk:

1. Decide whether it advances an existing product goal in `business-goals.json`.
2. Confirm the personas, stories, and outcomes match the Super PRD domain map and business direction.
3. Mirror the user stories into `business-goals.json` when the user asked to apply or sync.
4. Add a roadmap entry with the correct horizon for the feature phase.
5. Return one of these verdicts:
   - `aligned`
   - `aligned-with-changes`
   - `off-course`
   - `needs-goal-decision`
6. If the feature is UI-heavy, require a `ux-architecture` review before calling it fully aligned.

## Typical requests

- `roadmap`
- `backlog`
- `story <feature-id>`
- `validate <feature-id>`
- `kpi report`
- `weekly outcome update`
- `register stories <feature-id-or-prd-path>`
- `review alignment <feature-id-or-prd-path>`

## Output shape

End with:

```text
Product Manager Summary
- KPIs reviewed: N
- Stories reviewed: N
- Roadmap items: now=N, next=N, later=N
- Outcomes recorded: N
- Unvalidated releases: N
- Updates proposed: N
- Updates applied: N
- lastUpdated touched: yes|no
- Alignment verdict: aligned|aligned-with-changes|off-course|needs-goal-decision|not-applicable
```
