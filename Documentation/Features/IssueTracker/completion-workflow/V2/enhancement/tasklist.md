# Task List — Issue Tracking Completion Workflow V2

> **Scope:** see [PRD.md](PRD.md). All transient UI in this feature **MUST** use `SlidePanel` — no DevExtreme `Popup`, no centered modals.
> **Build policy:** per [.github/copilot-instructions.md §1.3](../../../../../../.github/copilot-instructions.md), after a phase is implemented, do NOT auto-build — hand off to user for verification.

Legend: `[ ]` todo · `[~]` in progress · `[x]` done · `🛑` blocked (awaiting approval)

---

## Phase 0 — Approvals & pre-flight

- [x] **0.1 Domain change approval** — user explicitly approved extending `IssueTemplateAction` with `StageId`, `PositionX`, `PositionY` + marking `Requires*` `[Obsolete]`. Additive, non-breaking. (§1.6)
- [x] **0.2** Confirm stage-color policy — fixed to 8 M365 accent tints, with `Diagnose`/`Repair`/`Verify` defaulting to blue/orange/green respectively
- [x] **0.3** Confirm "custom action" remains unscoped to any stage — runtime-only technician action remains outside persisted template workflow stages
- [x] **0.4** Add feature flag `IssueTrackerWorkflowsV2` row to `systemconfigurations` (bool, default `0` in prod, `1` in dev) — per §9

---

## Phase 1 — Domain & Persistence

### Entities
- [x] **1.1** Create `FMS.Domain/Entities/Features/IssueTrackerManagement/IssueTemplateWorkflow.cs` — `Id`, `IssueTemplateId` (unique), `Name`, `IsActive`, `RowVersion`, `CreatedAt`, `UpdatedAt`, nav `Stages`
- [x] **1.2** Create `FMS.Domain/Entities/Features/IssueTrackerManagement/IssueTemplateWorkflowStage.cs` — `Id`, `WorkflowId`, `Name`, `Description`, `Color`, `SortOrder`, `IsActive`, timestamps, nav `Workflow`, `Actions`
- [x] **1.3** Extend `FMS.Domain/Entities/Features/IssueTrackerManagement/IssueTemplateAction.cs`: add `StageId` (int?), `PositionX` (double?), `PositionY` (double?), `Stage` nav. Mark `RequiresDeviceDetails/SourceVehicle/CameraDetails` `[Obsolete("Use ActionType")]`

### Persistence
- [x] **1.4** Entity configs in `FMS.Persistence/Configurations/...IssueTracker.../IssueTemplateWorkflowConfiguration.cs` — unique index on `IssueTemplateId`, `RowVersion` concurrency token
- [x] **1.5** Entity config `IssueTemplateWorkflowStageConfiguration.cs` — composite index `(WorkflowId, SortOrder)`, cascade delete from workflow
- [x] **1.6** Update `IssueTemplateActionConfiguration.cs` — `StageId` FK `ON DELETE SET NULL`
- [x] **1.7** Register `DbSet<IssueTemplateWorkflow>` and `DbSet<IssueTemplateWorkflowStage>` in `GPSDataContext`

### SQL migration
- [x] **1.8** Create `Documentation/Database/2026-04-issue-workflow.sql` — CREATE TABLE (both), ALTER TABLE `issuetemplateaction`, backfill loop (one workflow + "Default" stage per template, repoint actions). Must be idempotent and MySQL 5.5/5.6-safe (no `CURRENT_TIMESTAMP` defaults, no `JSON`)
- [x] **1.9** Replace workspace-root `seed_template_actions.sql` with `seed_template_workflows.sql` — seeds 3 stages (Diagnose/Repair/Verify) for each of the 8 templates and re-maps the 29 seed actions; uses `INSERT ... ON DUPLICATE KEY UPDATE`

---

## Phase 2 — Application layer (CQRS)

> Per [.github/copilot-instructions.md §1.9](../../../../../../.github/copilot-instructions.md) — keep each command+handler in a single file; same for queries; same for small validators.

### DTOs
- [x] **2.1** Create `FMS.Application/Features/IssueTracker/DTOs/V2/WorkflowDTOs.cs` — `WorkflowDto`, `StageDto`, `ActionNodeDto`, `SaveWorkflowRequestDTO`, `SaveStageDTO`, `SaveActionDTO`
- [x] **2.2** Update `FMS.Application/Features/IssueTracker/DTOs/V2/IssueCompletionRecordDTOs.cs` — remove `SimpleNotes` from `CompleteIssueWithActionsRequestDTO`

### Queries
- [x] **2.3** Create `FMS.Application/Features/IssueTracker/Queries/V2/Workflows/GetWorkflowByTemplateQuery.cs` (query + handler in one file) — returns full admin graph including `RowVersion`
- [x] **2.4** Create `FMS.Application/Features/IssueTracker/Queries/V2/Workflows/GetWorkflowForCompletionQuery.cs` (query + handler) — filters `IsActive = true` at stage + action level

### Commands
- [x] **2.5** Create `FMS.Application/Features/IssueTracker/Commands/V2/Workflows/SaveWorkflowCommand.cs` (command + handler + small validator in one file):
  - Checks `RowVersion` → 409 `FMSResponse` on mismatch
  - Wraps all writes in `_context.Database.CreateExecutionStrategy().ExecuteAsync(...)`
  - Diffs stages (insert/update/delete by `Id`) and actions (insert/update/delete with `StageId` relink)
  - Recomputes `SortOrder` from incoming order index
- [x] **2.6** Create `FMS.Application/Features/IssueTracker/Commands/V2/Workflows/ReorderStagesCommand.cs` — lightweight reorder endpoint (command + handler one file)
- [x] **2.7** Update `FMS.Application/Features/IssueTracker/Commands/V2/Issues/CompleteIssueWithActionsCommandHandler.cs` — drop `SimpleNotes` branch, stricter validation (each submitted action belongs to an active stage of the issue's template)

### Auto-migration helper
- [x] **2.8** One-shot `IWorkflowBackfillService` invoked on app start if `issue_template_workflow` empty but `issuetemplate` has rows. Idempotent; logs via `ILogger<WorkflowBackfillService>`. *(Alternative to pure-SQL migration — gate behind feature flag.)*

---

## Phase 3 — Controllers & permissions

- [x] **3.1** Create `FMS.WebClient/Controllers/V2/IssueTemplateWorkflowsController.cs`:
  - `GET /api/v1/issuetracker/templates/{templateId}/workflow` → `Permissions.Admin.Issues`
  - `PUT /api/v1/issuetracker/templates/{templateId}/workflow` → `Permissions.Admin.Issues` (409 on `RowVersion` mismatch)
  - `GET /api/v1/issuetracker/templates/{templateId}/workflow/for-completion` → `Permissions.IssueTracker.Edit`
- [x] **3.2** Mark `IssueTemplateActionsController` endpoints `[Obsolete]`, keep active for mobile
- [x] **3.3** Add `"IssueTemplateWorkflow"` to the `issues/` sourceContext matchers in `FMS.WebClient/Extensions/FmsLoggingConfiguration.cs`

---

## Phase 4 — Frontend: Admin workflow editor

### Dependencies
- [x] **4.1** Add `@xyflow/react` to `fms.frontend/package.json` (`npm i @xyflow/react`)
- [x] **4.2** `React.lazy`-load the workflow editor chunk so it's only fetched when admin opens the panel

### API service
- [~] **4.3** Extend `fms.frontend/src/services/issueTrackerV2Service.js`:
  - `getWorkflow(templateId)`
  - `saveWorkflow(templateId, payload)` (handles 409)
  - `getWorkflowForCompletion(templateId)`
  - Mark `getTemplateActionsForCompletion` deprecated
  - **Progress:** workflow GET/PUT service methods are in place and both legacy action getters are explicitly marked deprecated.

### Components (all use `SlidePanel` — no `Popup`)
- [x] **4.4** Create `fms.frontend/src/pages/issueTracker/settings/IssueTemplateWorkflowPanel.js` — real staged workflow-side panel entry point hosted by `SlidePanel`; local-state React Flow canvas now replaces the transitional wrapper
- [x] **4.5** Create `workflow/StageList.js` — left rail with add/rename/color/delete; delete confirmation opens a **nested** `SlidePanel width=420`
- [x] **4.6** Create `workflow/WorkflowCanvas.js` — React Flow wrapper with swimlanes per stage; custom `ActionNode` colored by `ActionType` using M365 accent tints
- [x] **4.7** Create `workflow/ActionInspectorPanel.js` — **nested** `SlidePanel width=420` opened on node click; fields: Name, Type (native `<select>` of `General`/`DeviceChange`/`CameraInstall`), Description (`<textarea>`), Stage (`<select>`), Active (native checkbox). **Zero `Requires*` checkboxes.**
- [x] **4.8** Create `workflow/useWorkflowEditor.js` hook — in-memory graph state, dirty tracking (shallow diff vs. lastSaved), `beforeunload` guard
- [x] **4.9** Create `workflow/DiscardConfirmPanel.js` — **nested** `SlidePanel width=420` for dirty-close confirmation
- [x] **4.10** Create `IssueTemplateWorkflowPanel.scss` using only M365 tokens; no `icp__` classes; native HTML checkboxes per §1.4
- [x] **4.11** Mobile guard — under 768 px show M365 info banner "Workflow editing requires desktop" + read-only stage list

### Settings page update
- [x] **4.12** Update `fms.frontend/src/pages/issueTracker/settings/IssueTemplatesSettingsPage.js`:
  - Replace "Actions [N]" button with "Workflow" button opening `IssueTemplateWorkflowPanel`
  - Remove `Promise.all` action-count loop (derive counts from a single `/workflow/summary` call or just drop the badge)
  - **Progress:** completion configuration now opens from a lazy-loaded `Workflow` button flow in `SlidePanel`; template grid popup edit mode removed; `Promise.all` action-count loop removed; dirty-close confirmation now routes through the staged workflow panel.

### Cleanup
- [x] **4.13** Delete `fms.frontend/src/pages/issueTracker/settings/TemplateActionsPanel.js`

---

## Phase 5 — Frontend: Technician completion redesign

### Components
- [x] **5.1** Rewrite `fms.frontend/src/pages/issueTracker/components/IssueCompletionPopup.js`:
  - Host in `SlidePanel` (`width=720` compact / `width=1000` stage-grouped)
  - Fetch via `getWorkflowForCompletion(templateId)`
  - Detect mode: compact if 1 stage AND no selected action has `ActionType in {DeviceChange, CameraInstall}`; else stage-grouped accordions
  - **Remove** 3-step wizard, Prev/Next, per-action paging, tab strip, "general completion notes" field
  - Keep per-action `notes` + `rootCause`
  - Validation: submit disabled until all checked `DeviceChange`/`CameraInstall` actions have required fields
  - Inline red M365 validation under offending field
  - Native HTML checkboxes for action selection (§1.4)
  - **Progress:** the completion panel now reads from `getWorkflowForCompletion(templateId)`, renders stage-grouped workflow sections in a single `SlidePanel` flow with compact/wide width switching, blocks submit until required root-cause/device/camera fields are filled with inline red validation messaging, and uses native HTML checkboxes for action selection.
- [x] **5.2** Rewrite `IssueCompletionPopup.scss` using only M365 tokens; delete all `icp__*` styles
- [x] **5.3** Update call sites (`IssueDetailPopups.js`, `IssueTrackerDetailPage.js`, any quick-action) — no API change expected beyond prop types
- [x] **5.4** Update completion payload — drop top-level `notes`/`simpleNotes`; only `actions: [...]`

---

## Current implementation delta

- [x] Settings-side completion-action management no longer uses DevExtreme `Popup`; outer management is now hosted in `SlidePanel`
- [x] Nested completion-action edit UI no longer uses DevExtreme popup form; it now opens in a nested `SlidePanel`
- [x] Action editor now derives legacy `Requires*` values from `ActionType` instead of exposing those checkboxes in the UI
- [x] Issue template grid no longer uses popup edit mode
- [x] Issue template settings no longer make per-template action-count API calls; the `Workflow` entry button is now static and avoids the N+1 fetch pattern
- [x] A dedicated `IssueTemplateWorkflowPanel` entry point now exists so the staged workflow builder can replace the transitional wrapper without changing the host page again
- [x] The dedicated `IssueTemplateWorkflowPanel` now hosts a real local-state staged React Flow canvas and persists linear action CRUD/order through the existing action endpoints
- [x] The dedicated `IssueTemplateWorkflowPanel` now loads and saves through the workflow endpoints, including persisted stage assignment and node positions
- [x] Technician completion panel is no longer a 3-step wizard; it is a single scrollable side panel
- [x] Technician completion panel width now adapts (`720` for general-only selection, `1000` when device/camera actions are selected) and is now driven by stage-grouped workflow data
- [x] Backend workflow model start is in place: additive domain entities/configuration, action staging/position fields, workflow DTOs, and synthesized read-only workflow endpoints for admin/completion
- [x] Legacy `icp__*` completion-panel markup/styles have been removed in favor of the `issue-completion-flow__*` namespace

---

## Phase 6 — Testing & verification

### Unit tests (`FMS.Testing/`)
- [ ] **6.1** `SaveWorkflowCommandHandler` — add stage, rename stage, delete stage (actions `SetNull`), move action between stages, reorder actions within stage, 409 on `RowVersion` mismatch
- [ ] **6.2** `GetWorkflowForCompletionQueryHandler` — only active stages and actions are returned
- [ ] **6.3** `CompleteIssueWithActionsCommandHandler` — reject action IDs that don't belong to issue template; reject submissions with zero actions
- [ ] **6.4** Migration idempotency — run `2026-04-issue-workflow.sql` twice against a throwaway MySQL 5.6 container; second run is a no-op

### Frontend smoke tests
- [ ] **6.5** Dirty-state guard — change then attempt close → nested confirmation panel appears
- [ ] **6.6** Drag-to-reorder — drag action across lanes → `StageId` updates; drag within lane → `SortOrder` updates
- [x] **6.7** Compact completion mode renders for a single-stage General-only template
- [x] **6.8** Stage-grouped completion mode renders for a DeviceChange-containing template; submit blocked until required fields filled

### Manual verification script
- [ ] **6.9** Create `Documentation/features/issuetracker/completion-workflow/V2/enhancement/verification.md` covering:
  - Admin: new template → open workflow → add 3 stages → drop 5 actions → Save → reload → layout preserved
  - Admin: concurrent edit simulation — two tabs, both dirty, second Save → 409 toast
  - Technician: complete issue using each template type
  - Post-migration: all 8 seeded templates show their actions in a "Default" stage; all 29 seed rows accounted for

### Handoff
- [ ] **6.10** Summarize changes, list modified files, highlight deprecations (mobile endpoint), ask user to run `dotnet build FMS.WebClient` + `npm run build` in `fms.frontend/`

---

## Phase 7 — Rollout

- [ ] **7.1** Stage deploy → run `2026-04-issue-workflow.sql` + backfill
- [ ] **7.2** Smoke test admin + technician flows in staging
- [ ] **7.3** Enable `IssueTrackerWorkflowsV2` flag in prod after staging sign-off
- [ ] **7.4** Monitor `C:\Logs\FMS.Webclient\issues\` and `errors\` for 48 h
- [ ] **7.5** Post-release — file V3 ticket: drop `Requires*` columns + obsolete endpoints

---

## Explicit "DO NOT" list

- ❌ Do **not** use DevExtreme `Popup` anywhere in this feature. Only `SlidePanel`.
- ❌ Do **not** use DevExtreme `dxCheckBox` — native HTML `<input type="checkbox">` only.
- ❌ Do **not** introduce new `icp__*` styling patterns — continue the migration toward neutral workflow/component naming and M365 tokens.
- ❌ Do **not** modify `IssueCompletionRecord` entity shape.
- ❌ Do **not** drop `Requires*` columns in V2 — obsolete only; drop in V3.
- ❌ Do **not** auto-run builds after each phase — hand off to user.
- ❌ Do **not** create additional markdown docs beyond PRD.md + tasklist.md + verification.md.
