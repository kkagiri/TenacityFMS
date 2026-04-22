# PRD — Issue Tracking Completion Workflow Redesign (V2)

| | |
|---|---|
| **Domain** | Issue Tracker |
| **Feature** | Completion Workflow (Template Actions → Stage Workflow) |
| **Version** | V2 |
| **Type** | Enhancement (breaks some V1 shapes; data auto-migrated) |
| **Status** | Draft — pending approval |
| **Last updated** | 2026-04-22 |

---

## 1. Summary

Redesign both ends of the issue-completion feature:

- **Admin side** — replace the flat "Template Actions" popup-grid editor with a **stage-based visual workflow builder** (React Flow swimlane canvas) opened in a **side panel** (not a popup dialog).
- **Technician side** — replace the forced 3-step wizard with an **adaptive stage-grouped completion form** rendered in a **side panel**.
- **Backend** — introduce `issue_template_workflow` + `issue_template_workflow_stage` tables; extend `issuetemplateaction` with `StageId` + canvas `PositionX/Y`; retire the three `Requires*` boolean flags in the UI (columns kept nullable/obsolete for one release); auto-migrate existing templates into a "Default" stage.
- **Styling** — apply the M365 Fluent Design language end-to-end per [.agents/skills/design/SKILL.md](../../../../../../.agents/skills/design/SKILL.md).

## 2. Problem statement

The current completion flow has seven measurable UX problems identified during codebase review:

1. **Double source of truth** — `ActionType` (General / DeviceChange / CameraInstall) and three `RequiresDeviceDetails / RequiresSourceVehicle / RequiresCameraDetails` booleans both control field visibility. Misconfiguration is common.
2. **Forced 3-step wizard** on the technician side even when one trivial "General" action is picked — minimum 4 clicks to complete.
3. **Per-action paging** inside step 2 (Prev/Next + tab strip) hides unfilled actions; validation only requires "at least one action OR notes".
4. **Two notes fields** — per-action `notes` + top-level "General completion notes" — with overlapping purpose.
5. **Inconsistent admin UI** — Templates grid uses native checkboxes but the Actions editor uses DevExtreme `dxCheckBox`, violating [.github/copilot-instructions.md §1.4](../../../../../../.github/copilot-instructions.md).
6. **No visual ordering** — admins set `sortOrder` numerically; no drag-to-reorder, no preview of what technicians will see.
7. **N+1 request on settings page** — `Promise.all` over every template just to render action-count badges.

The UI also ignores the **M365 Fluent tokens** defined in the design skill and uses custom `icp__*` classes plus DevExtreme `Popup` (dialog, not side panel).

## 3. Goals & non-goals

### Goals
- **G1** — A single "Workflow" side panel where admins visually build ordered stages with action nodes, drag-to-reorder, and explicit Save (dirty-state tracked).
- **G2** — Adaptive technician completion side panel: one compact screen when possible; stage-grouped accordions only when device/camera fields are genuinely required.
- **G3** — One source of truth for field visibility: `ActionType`.
- **G4** — All dialogs/popovers in the new UI are **side panels** using the existing [SlidePanel](../../../../../../fms.frontend/src/components/ui/SlidePanel.js) component. Zero DevExtreme `Popup` dialogs.
- **G5** — 100% M365 Fluent tokens (colors, typography, spacing) — no custom `icp__*` or legacy style clones.
- **G6** — Auto-migration of existing 8 seeded templates + production data into a "Default" stage with order preserved.
- **G7** — MySQL 5.5/5.6-safe schema changes; no breaking Domain-layer changes beyond approved additive fields.

### Non-goals
- Conditional branching with predicates ("if X then Y") — stages are linear.
- Redesign of issue creation, reassignment, or auto-close flows.
- Mobile app parity (`fms.mobile`) — deferred; old `GET /actions` endpoint kept obsolete-but-alive for one release.
- Replacing `IssueCompletionRecord` — only the authoring + capture UX changes; stored shape is unchanged.

## 4. Personas & primary user stories

| Persona | Story |
|---|---|
| **Admin / Workshop Supervisor** | "As an admin I want to visually arrange the steps a technician must complete for each issue template, grouped into stages (Diagnose → Repair → Verify), so I can communicate the intended workflow without writing docs." |
| **Admin** | "As an admin I want to rearrange actions with drag-and-drop and see my changes reflected before saving, with a clear warning if I try to close the editor with unsaved work." |
| **Technician** | "As a technician closing an issue, I want a single focused side panel — not a 3-step wizard — where I tick off the actions I performed, fill details only where required, and submit." |
| **Technician** | "As a technician I want the form to adapt: if my template has one simple stage of General actions, don't force me through stages; if it has device replacements, group by stage and show only the relevant device fields." |

## 5. Success metrics

| Metric | Baseline (V1) | Target (V2) |
|---|---|---|
| Clicks to complete a single-General-action issue | ≥ 4 | **1** (tick + Submit) |
| Median completion-popup duration (technician) | — | **−40%** |
| Admin misconfiguration rate (ActionType vs. Requires* mismatch) | non-zero | **0** (flags removed from UI) |
| Template settings page initial payload requests | O(N templates) | **1** |
| Lighthouse mobile score on technician side panel | — | **≥ 90** |

## 6. Scope

### 6.1 In scope

**Backend**
- New domain entities: `IssueTemplateWorkflow`, `IssueTemplateWorkflowStage`
- Extend `IssueTemplateAction` with `StageId` (nullable FK), `PositionX`, `PositionY`; mark `RequiresDeviceDetails/SourceVehicle/CameraDetails` `[Obsolete]`
- Entity configs + `GPSDataContext` DbSets
- Migration SQL + data backfill (every existing template gets one "Default" stage, all its actions repoint)
- CQRS (per [.github/copilot-instructions.md §1.9](../../../../../../.github/copilot-instructions.md) — command + handler in one file):
  - `SaveWorkflowCommand` (full-graph save in one `ExecuteAsync` execution strategy transaction)
  - `ReorderStagesCommand`
  - `GetWorkflowByTemplateQuery` (admin)
  - `GetWorkflowForCompletionQuery` (technician — only active)
- New DTOs: `WorkflowDto`, `StageDto`, `SaveWorkflowRequestDTO`
- Remove `SimpleNotes` from `CompleteIssueWithActionsRequestDTO`
- New controller `IssueTemplateWorkflowsController` (`GET/PUT /api/v1/issuetracker/templates/{id}/workflow`, `GET …/workflow/for-completion`)
- Keep `GET …/actions` as `[Obsolete]` for mobile

**Frontend**
- Add `@xyflow/react` dependency
- Replace [TemplateActionsPanel.js](../../../../../../fms.frontend/src/pages/issueTracker/settings/TemplateActionsPanel.js) with `IssueTemplateWorkflowPanel.js` — hosted inside `SlidePanel` (width 1200, desktop only)
- Update [IssueTemplatesSettingsPage.js](../../../../../../fms.frontend/src/pages/issueTracker/settings/IssueTemplatesSettingsPage.js) — "Actions [N]" → "Workflow" button opening the side panel
- Rewrite [IssueCompletionPopup.js](../../../../../../fms.frontend/src/pages/issueTracker/components/IssueCompletionPopup.js) — hosted in `SlidePanel` (width 720/1000 adaptive)
- Extend [issueTrackerV2Service.js](../../../../../../fms.frontend/src/services/issueTrackerV2Service.js) with `getWorkflow`, `saveWorkflow`, `getWorkflowForCompletion`

### 6.2 Out of scope
- Conditional branching predicates
- Core entities (`Issuetracker`, `Issuetemplate`, `IssueCompletionRecord` shape)
- Background services / monitoring / auto-close
- `fms.mobile` parity

## 7. UX design

### 7.1 Strict rule — all popups are side panels

> **All transient UI in this feature MUST use the existing `SlidePanel` component at [fms.frontend/src/components/ui/SlidePanel.js](../../../../../../fms.frontend/src/components/ui/SlidePanel.js).**
>
> - ❌ No DevExtreme `Popup` / `PopupDialog`
> - ❌ No modal centered dialogs
> - ❌ No bootstrap `Modal`
> - ✅ `SlidePanel` for: workflow editor, action inspector, technician completion, confirmation dialogs (discard-changes, delete-stage, delete-action), and any validation error surface that needs its own container.

Widths:

| Surface | Width |
|---|---|
| Admin workflow editor | `1200` |
| Admin action inspector (nested) | `420` |
| Admin confirmations (discard, delete stage) | `420` |
| Technician completion — compact mode | `720` |
| Technician completion — stage-grouped mode | `1000` |

### 7.2 Admin workflow editor

```
┌────────────────────────────────────────────────────────────────────┐
│  Workflow for "No Ignition (GPS)"            [Discard] [ Save ▪ ]  │  ← side-panel header, dirty dot on Save
├──────────────┬─────────────────────────────────────────────────────┤
│ STAGES       │                                                     │
│ ─────────── │  ┌─ Diagnose ─────────────────────────────────────┐  │
│ + Diagnose  │  │  [ Check Power Supply ]  [ Reset GPS Device ]  │  │  ← swimlane
│ + Repair    │  │                                                │  │
│ + Verify    │  └────────────────────────────────────────────────┘  │
│ + Add stage │  ┌─ Repair ───────────────────────────────────────┐  │
│              │  │  [ Replace GPS Device 🔧 ]                     │  │
│              │  │                                                │  │
│              │  └────────────────────────────────────────────────┘  │
│              │  ┌─ Verify ───────────────────────────────────────┐  │
│              │  │  [ Verify Readings ]                           │  │
│              │  └────────────────────────────────────────────────┘  │
│              │  + Add action                                       │
├──────────────┴─────────────────────────────────────────────────────┤
│  Footer: [ Discard ]                               [ Save changes ]│
└────────────────────────────────────────────────────────────────────┘
```

- **Left rail** — stage list with add / rename / color / reorder / delete (delete shows count-of-actions warning in a nested `SlidePanel`).
- **Canvas** — React Flow with swimlanes. Custom `ActionNode` colored by `ActionType` (blue / orange / teal per M365 accent tints).
- **Right inspector** — opens as nested `SlidePanel` when a node is clicked. Fields: Name, Type (`<select>` General / DeviceChange / CameraInstall), Description (`<textarea>`), Active (native checkbox), Stage (`<select>`). **No `Requires*` checkboxes.**
- **Toolbar (side-panel header actions)** — `Discard`, `Save` (disabled unless dirty; shows blue dot when dirty).
- **Dirty guard** — closing the side panel while dirty triggers a nested "Discard unsaved changes?" confirmation `SlidePanel` (width 420).
- **Mobile (<768px)** — canvas unsupported; show M365 info banner "Workflow editing requires desktop" with a read-only summary list.

### 7.3 Technician completion side panel

**Compact mode** — single-stage workflow AND all selected actions are General/no device/camera fields:

```
┌──────────────────────────────────────────────────────┐
│  Complete issue #IT-1024                       [ × ] │
├──────────────────────────────────────────────────────┤
│  Actions performed                                   │
│  ☑ Check Power Supply                                │
│  ☑ Reset GPS Device                                  │
│  ☐ Replace GPS Device                                │
│  + Add a custom action                               │
│                                                      │
│  Root cause                                          │
│  [_____________________________________]             │
│                                                      │
│  Notes                                               │
│  [_____________________________________]             │
├──────────────────────────────────────────────────────┤
│                       [ Cancel ]   [ Mark complete ] │
└──────────────────────────────────────────────────────┘
```

**Stage-grouped mode** — multi-stage template OR any selected action requires device/camera fields:

```
┌─────────────────────────────────────────────────────────────┐
│  Complete issue #IT-1024                              [ × ] │
├─────────────────────────────────────────────────────────────┤
│  ▼ Diagnose                                                 │
│    ☑ Check Power Supply        Notes: [___________]         │
│    ☐ Reset GPS Device                                       │
│                                                             │
│  ▼ Repair                                                   │
│    ☑ Replace GPS Device                                     │
│        Old device IMEI:  [_______________]                  │
│        New device IMEI:  [_______________]                  │
│        Device phone #:   [_______________]                  │
│        Source vehicle:   [ Select ▾ ]                       │
│        Notes:            [_______________]                  │
│                                                             │
│  ▼ Verify                                                   │
│    ☐ Verify Readings                                        │
├─────────────────────────────────────────────────────────────┤
│                        [ Cancel ]   [ Mark complete ]       │
└─────────────────────────────────────────────────────────────┘
```

- **No wizard**, no Prev/Next, no per-action paging, no "general completion notes" field.
- Submit disabled until every checked `DeviceChange`/`CameraInstall` action has required fields filled.
- Inline red M365 validation under offending field on submit attempt.

## 8. Data model

### 8.1 New tables (MySQL 5.5/5.6 safe)

```sql
CREATE TABLE issue_template_workflow (
  Id              INT          NOT NULL AUTO_INCREMENT,
  IssueTemplateId INT          NOT NULL,
  Name            VARCHAR(150) NOT NULL DEFAULT 'Default workflow',
  IsActive        TINYINT(1)   NOT NULL DEFAULT 1,
  RowVersion      BIGINT       NOT NULL DEFAULT 1,
  CreatedAt       DATETIME     NULL,
  UpdatedAt       DATETIME     NULL,
  PRIMARY KEY (Id),
  UNIQUE KEY ux_itw_template (IssueTemplateId),
  CONSTRAINT fk_itw_template FOREIGN KEY (IssueTemplateId)
    REFERENCES issuetemplate(Id) ON DELETE CASCADE
);

CREATE TABLE issue_template_workflow_stage (
  Id          INT          NOT NULL AUTO_INCREMENT,
  WorkflowId  INT          NOT NULL,
  Name        VARCHAR(100) NOT NULL,
  Description VARCHAR(500) NULL,
  Color       VARCHAR(20)  NULL,        -- hex, e.g. #0078d4
  SortOrder   INT          NOT NULL DEFAULT 0,
  IsActive    TINYINT(1)   NOT NULL DEFAULT 1,
  CreatedAt   DATETIME     NULL,
  UpdatedAt   DATETIME     NULL,
  PRIMARY KEY (Id),
  KEY ix_itws_workflow (WorkflowId, SortOrder),
  CONSTRAINT fk_itws_workflow FOREIGN KEY (WorkflowId)
    REFERENCES issue_template_workflow(Id) ON DELETE CASCADE
);

ALTER TABLE issuetemplateaction
  ADD COLUMN StageId    INT    NULL,
  ADD COLUMN PositionX  DOUBLE NULL,
  ADD COLUMN PositionY  DOUBLE NULL,
  ADD CONSTRAINT fk_ita_stage FOREIGN KEY (StageId)
    REFERENCES issue_template_workflow_stage(Id) ON DELETE SET NULL;
```

### 8.2 Data migration (backfill)

For every existing `issuetemplate`:

1. Insert one `issue_template_workflow` row (`Name = 'Default workflow'`).
2. Insert one `issue_template_workflow_stage` row (`Name = 'Default'`, `SortOrder = 0`).
3. `UPDATE issuetemplateaction SET StageId = <new stage id> WHERE IssueTemplateId = <template id>`.
4. Leave `RequiresDeviceDetails / RequiresSourceVehicle / RequiresCameraDetails` untouched; UI no longer reads them.

### 8.3 Legacy columns

`RequiresDeviceDetails`, `RequiresSourceVehicle`, `RequiresCameraDetails` → marked `[Obsolete]` on the entity, not returned by the new query handlers, not editable in new UI. Scheduled for drop in V3 (one release later).

## 9. API contract

### 9.1 New endpoints

| Method | Path | Permission | Purpose |
|---|---|---|---|
| `GET` | `/api/v1/issuetracker/templates/{templateId}/workflow` | `Permissions.Admin.Issues` | Return full admin graph (stages + actions + positions + `RowVersion`) |
| `PUT` | `/api/v1/issuetracker/templates/{templateId}/workflow` | `Permissions.Admin.Issues` | Save full graph. Body includes `RowVersion`; 409 if mismatched |
| `GET` | `/api/v1/issuetracker/templates/{templateId}/workflow/for-completion` | `Permissions.IssueTracker.Edit` | Technician — only active stages/actions grouped for the completion side panel |

### 9.2 Payloads (abbreviated)

```jsonc
// PUT body
{
  "rowVersion": 42,
  "stages": [
    { "id": 1, "name": "Diagnose", "color": "#0078d4", "sortOrder": 0, "isActive": true,
      "actions": [
        { "id": 101, "name": "Check Power", "actionType": "General",
          "description": "…", "sortOrder": 0, "isActive": true,
          "positionX": 120.0, "positionY": 60.0 }
      ] },
    { "id": null, "name": "Repair", "color": "#ca5010", "sortOrder": 1, "isActive": true, "actions": [...] }
  ]
}
```

### 9.3 Deprecated

- `GET /api/v1/issuetracker/templates/{templateId}/actions` — marked `[Obsolete("Use /workflow")]`, kept alive one release for `fms.mobile`.
- `POST /api/v1/issuetracker/templates/{templateId}/actions` & friends — kept alive as thin wrappers around the new save command.

## 10. Technical considerations

### 10.1 Canvas library
Add `@xyflow/react` (MIT). Desktop-only. No IE11 concerns (FMS dropped IE11).

### 10.2 Concurrency
`RowVersion` on `issue_template_workflow`. On `PUT`, compare; if mismatched return 409 with current server state; frontend shows a nested `SlidePanel` "Workflow changed elsewhere — reload?".

### 10.3 Transactions
`SaveWorkflowCommandHandler` wraps all writes in `_context.Database.CreateExecutionStrategy().ExecuteAsync(...)` per [.github/copilot-instructions.md §1.2](../../../../../../.github/copilot-instructions.md).

### 10.4 Logging
Use `ILogger<T>`. New category match string for WebClient Serilog: add `"IssueTemplateWorkflow"` keyword to the existing `issues/` category logger in [FmsLoggingConfiguration.cs](../../../../../../FMS.WebClient/Extensions/FmsLoggingConfiguration.cs).

### 10.5 System configuration
No new config keys required. Existing issue-tracker keys in `systemconfigurations` remain valid.

### 10.6 Dependencies / impact
- Mobile: continues to work via obsolete endpoint until parity ships.
- Background services: unchanged — they don't read `Requires*` columns.
- Reports: `IssueCompletionRecord` shape unchanged → existing reports unaffected.

## 11. Rollout

1. Merge schema + migration → run in staging DB.
2. Ship backend endpoints (keep legacy) → smoke test via Postman.
3. Ship frontend behind a feature flag `IssueTrackerWorkflowsV2` (system config, default `true` in dev, `false` in prod).
4. Flip flag to `true` in prod → monitor `issues/` logs for 48 h.
5. After one release with zero regressions: remove obsolete endpoints + `Requires*` columns (V3).

## 12. Risks & mitigations

| Risk | Mitigation |
|---|---|
| React Flow bundle size (~100 KB gz) | Lazy-load workflow editor chunk (`React.lazy`) — only loaded when admin opens the panel |
| Admins with custom per-template sortOrder expect no visual change | Auto-migration preserves order inside single "Default" stage; admins opt-in to multi-stage when ready |
| Mobile calls old endpoint after rollout | Endpoint kept alive with `[Obsolete]` for one release |
| Concurrent admin edits | `RowVersion` + 409 handling (§10.2) |
| Technicians confused by layout change | Release note + 15-second onboarding tooltip on first open |

## 13. Open questions

1. **Domain approval (§1.6)** — Extending `IssueTemplateAction` with `StageId`/`PositionX`/`PositionY` requires user sign-off.
2. Should "custom action" (technician free-text) also be scoped to a stage, or remain unattached?
3. Stage colors — should admins pick freely or be restricted to the 8 M365 accent tints?

## 14. References

- [.agents/skills/design/SKILL.md](../../../../../../.agents/skills/design/SKILL.md) — M365 Fluent design system
- [.github/copilot-instructions.md](../../../../../../.github/copilot-instructions.md) — FMS coding standards
- [SlidePanel.js](../../../../../../fms.frontend/src/components/ui/SlidePanel.js) — the only panel primitive allowed
- [seed_template_actions.sql](../../../../../../seed_template_actions.sql) — legacy seed, to be replaced
- Session plan: `/memories/session/plan.md`
