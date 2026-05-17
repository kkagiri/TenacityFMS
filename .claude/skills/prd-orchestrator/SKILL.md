---
name: prd-orchestrator
description: Governance entry point for creating or reviewing new feature PRDs and TASKS in Tenacy FMS. Use when the request is to create a PRD, write a task list, register a new feature, review whether a draft is going off course, or ensure a normal agent's output stays aligned with the Super PRD, business goals, and UX direction.
---

# PRD Orchestrator

Use this skill as the hub whenever a feature definition is being created or reviewed. It exists so a normal agent can draft quickly without letting the program drift.

## What this skill owns

- Read the Super PRD first.
- Decide which governance spokes must review the work.
- Keep PRD, TASKS, tasklist registration, product alignment, and UX review connected.
- Treat new PRDs as provisional until the required reviews finish.

## Spoke model

- `project-manager`: registration, phase model, tasklist sync, artifact existence.
- `product-manager`: business-goal fit, user stories, acceptance criteria, roadmap, outcomes.
- `ux-architecture`: required when the feature changes pages, dashboards, workflows, navigation, or interaction contracts.

## Always start here

Before drafting or approving any PRD or TASKS package:

1. Read `Documentation/Architecture/ProjectManagemerPrograms/SUPER_PRD.md`.
2. Read `Documentation/Architecture/ProjectManagemerPrograms/super-tasklist.json`.
3. Read `Documentation/Architecture/ProjectManagemerPrograms/business-goals.json`.
4. Determine the target domain, audience, upstream dependencies, and applicable architecture pillars.

## Trigger phrases

Use this skill for requests like:

- `create a PRD`
- `write TASKS.md`
- `register feature`
- `new feature`
- `review this PRD`
- `is this going off course`
- `align this with the main project goals`
- `draft and validate`

## Standard creation flow

When the user asks for a new feature definition:

1. Classify the feature into the correct domain and folder path.
2. Check whether an existing feature already covers the same outcome.
3. Draft the PRD with:
   - problem statement
   - scope and non-goals
   - dependencies
   - architecture constraints from the Super PRD
   - user stories
   - outcomes or success measures
   - affected projects
4. Draft `TASKS.md` with phases and milestone-oriented execution slices.
5. Run `project-manager` rules:
   - register in `super-tasklist.json`
   - update the Super PRD index row
   - mark registration state
6. Run `product-manager` rules:
   - map the feature to business goals
   - mirror user stories into `business-goals.json`
   - add the roadmap entry
   - produce an alignment verdict
7. If the feature is UI-facing, run `ux-architecture` rules:
   - verify page intent
   - verify workflow continuity
   - verify shell and interaction consistency
8. Return one consolidated governance verdict.

## Review flow for a PRD drafted by a normal agent

When a PRD already exists and needs governance:

1. Treat it as provisional.
2. Compare it against the Super PRD, business goals, and tasklist structure.
3. Identify missing registration, missing stories, wrong domain fit, duplicate scope, or UX drift.
4. Apply the required sync steps when the user asked to `sync`, `apply`, or `update`.
5. Return a verdict:
   - `approved-for-program`
   - `approved-with-changes`
   - `misaligned-with-program`
   - `needs-goal-decision`

## Guardrails

1. Do not let a new PRD become implicitly authoritative just because it exists on disk.
2. Do not approve a feature that cannot be mapped to a product goal without calling out the gap.
3. Do not skip `ux-architecture` for UI-heavy features.
4. Do not change the Super PRD vision or architecture pillars without explicit approval.
5. Do not invent KPI numbers, milestone progress, or completion percentages.

## Output shape

End with:

```text
PRD Orchestrator Summary
- PRD status: drafted|reviewed|registered|synced
- Project-manager state: pending|done
- Product-manager state: pending|done
- UX review state: not-needed|pending|done
- Governance verdict: approved-for-program|approved-with-changes|misaligned-with-program|needs-goal-decision
```
