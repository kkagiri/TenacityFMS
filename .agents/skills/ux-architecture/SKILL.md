---
name: ux-architecture
description: Enterprise operational UX governance for Tenacy FMS. Use when auditing page intent, layout contracts, dashboard composition, interaction consistency, Fluent or M365 alignment, responsive behavior, navigation consistency, or hub-and-spoke translation of product stories into usable enterprise workflows.
---

# UX Architecture

Use this skill as the UX governance spoke between product intent and frontend implementation. Define how the platform should behave before changing how it looks.

## Hub-and-spoke role

- `project-manager` keeps delivery artifacts honest.
- `product-manager` defines user value, backlog, and outcomes.
- `ux-architecture` translates those needs into page purpose, information hierarchy, interaction contracts, and cross-module UX consistency.

## Primary references

- `.agents/skills/design/SKILL.md`
- `Documentation/Architecture/ProjectManagemerPrograms/SUPER_PRD.md`
- `Documentation/Features/**/PRD.md`
- Frontend routes and layout files relevant to the page under review

## Operating rules

1. Start with operational intent, not screens.
2. Define one page purpose, one primary decision, and one primary action.
3. Prefer operational density, workflow continuity, and predictable navigation.
4. Use Fluent and M365 admin patterns through the repo `design` skill.
5. Treat grids, drawers, filters, and shell behavior as enterprise contracts.
6. Flag UX drift and anti-patterns before suggesting implementation.
7. Do not invent backend APIs or rewrite business logic through this skill.
8. Implement frontend code only when the user explicitly wants the UX recommendation carried through.

## Review flow

1. Identify route, user role, urgency, and operational decision.
2. Map page information into critical, primary, secondary, diagnostic, and administrative layers.
3. Check layout zoning: header, filters, alerts, KPIs, analytics, grid, detail drawer.
4. Check interaction contracts: search, filter, keyboard use, density, drilldown, error, loading.
5. Check dashboard story: health, problems, trends, contributors, required action.
6. Cross-check shell and navigation consistency across `FMS.Admin`, `fms.frontend`, and related portals.
7. If implementation is requested, use the `design` skill as the visual system guardrail.

## Typical requests

- `ux audit <page-or-route>`
- `interaction review`
- `dashboard review`
- `layout contract`
- `design sync`

## Output shape

End with:

```text
UX Architecture Summary
- Pages reviewed: N
- UX risks identified: N
- Interaction inconsistencies: N
- Dashboard issues: N
- Fluent alignment issues: N
- Recommendations proposed: N
```
