## Notification System – Low Tank Level End-to-End PRD

### 1. Summary
Enable a configurable alarm workflow (Policy + Trigger + Evaluation) so an administrator can automatically notify recipients when a tank level drops below a defined percentage threshold.

### 2. Goals
* Site / tank scoped low-level alerts (percent threshold first)
* Leverage existing Policy + AlarmHandler domain
* Provide a reproducible manual test path (no mocks)
* Keep MVP lean while enabling future extensibility

### 3. Non‑Goals (Current Iteration)
* OR / nested / grouped rule logic
* Absolute volume–specific handler type
* Rich WYSIWYG template editor
* Role-based dynamic expansion (beyond groups)
* Escalation / issue auto-creation flows

### 4. Actors
* Notification Admin – configures policies & triggers
* System – ingests telemetry & evaluates
* Recipient Users – receive notifications via mapped groups

### 5. User Stories
1. Admin creates a notification policy for low tank level alerts
2. Admin adds a trigger (TankLevelBelowThreshold, threshold 10%) scoped to site or tank
3. System ingests tank measurement; percentage below threshold triggers notification respecting cooldown/daily cap
4. Admin verifies notification existence (UI/history/DB)
5. Admin adjusts threshold & re-tests

### 6. Functional Requirements
#### Policies
* Fields: name, notificationCategoryId, notificationType, priority, enableEmail|Sms|System, maxNotificationsPerHour, maxNotificationsPerDay, cooldownMinutes, titleTemplate, messageTemplate, requireAcknowledgment, isActive
* Must be active to emit notifications

#### Triggers (AlarmHandlers)
* alarmType: TankLevelBelowThreshold
* triggerConfig JSON: { "threshold": number, "hysteresis": number? }
* Optional scope: siteId, tankId (deviceId reserved)
* Overrides: cooldownMinutes, maxNotificationsPerDay

#### Evaluation Flow
1. Measurement ingested → compute percentageFull = ProductVolume / TankVolume * 100
2. Build AlarmEvaluationEvent if any active handlers of type exist
3. For each handler: scope match → cooldown → daily cap → condition (percentageFull <= threshold) → notification
4. Log execution (AlarmHandlerExecution)

#### Recipients
* Resolved via policy ↔ group mapping (must exist)
* If no recipients, notification still stored (future: surface warning)

#### Testing Harness
* Preferred: real ingestion path
* Optional: temporary evaluate-test endpoint for faster loop

### 7. Data Model (Delta Focus)
AlarmHandler fields used: Id, NotificationPolicyId, AlarmType, TriggerConditions (JSON), SiteId, TankId, CooldownMinutes, MaxNotificationsPerDay, Priority, TriggerCount, LastTriggeredAt

TriggerConditions schema (current): { "threshold": number, "hysteresis": number? }

### 8. APIs
* POST /api/notifications/policies
* POST /api/notifications/alarm-handlers
* GET  /api/notifications/alarm-handlers?policyId={id}
* DELETE /api/notifications/alarm-handlers/{id}
* GET  /api/notifications/alarm-handlers/types
* POST /api/notifications/policies/{policyId}/groups/{groupId}
* (Ingestion) Tank measurement command endpoint (already triggers evaluation)
* (Optional) POST /api/notifications/alarm-handlers/evaluate-test

### 9. Frontend Scope
PolicyCreate.js:
* Capture returned policyId and store in state
* Remove hard-coded policyId=1 usage
* Display triggers list (type, config, priority, cooldown, max/day)

TriggerCreate.js:
* Already dynamic – ensure receives real policyId
* Optional future: add “Test Trigger” button (evaluate-test)

### 10. Validation Rules
Policy: name (3–100), category required
Trigger: alarmType required, threshold > 0, hysteresis ≥ 0 (optional), cooldownMinutes ≥ 0, maxNotificationsPerDay ≥ 0

### 11. Edge Cases
* TankVolume = 0 → skip dynamic evaluation
* Null ProductVolume → skip percentage calculation
* Multiple overlapping triggers can all fire
* Rapid repeats suppressed by cooldown
* Daily cap stops further notifications after limit

### 12. Performance
* Daily cap count = query per evaluation (acceptable MVP)
* Future: cached counter or aggregated query

### 13. Observability
* Log matches & skips
* Warn on JSON parse errors (fail-open)
* Store executions for audit/debug

### 14. Security
* All CRUD endpoints auth-required except handler types (AllowAnonymous)

### 15. Rollout Plan
Phase 1: Policy + Trigger + real ingestion evaluation
Phase 2: Group mapping UI & remove test endpoint (if added)
Phase 3: Enhanced DSL (OR, sustained conditions, absolute volume)

### 16. Open Questions
| Question | Current Stance |
|----------|----------------|
| Execution history UI now? | Deferred |
| Policy vs handler cooldown precedence? | Handler overrides (explicit) |
| Missing recipients behavior? | Allow creation; warn later |

### 17. Risks & Mitigations
| Risk | Mitigation |
|------|------------|
| No recipients mapped | Add future UI warning |
| Hard-coded policyId persists | Replace during this iteration |
| Over-notification (no hysteresis state) | Use cooldown; future hysteresis logic |

### 18. Message Template Tokens (Current)
Available in notification building (may vary by alarm):
* {{AlarmType}}
* {{SiteId}}, {{TankId}}, {{PtsDeviceId}}
* {{telemetry.percentageFull}}
* {{telemetry.productVolume}}
* {{telemetry.tankVolume}}
Add more as required; unknown tokens remain un-replaced.

### 19. Acceptance Criteria (MVP)
1. Creating policy returns policyId and persists values
2. Creating trigger with threshold 10% stores TriggerConditions JSON
3. Ingesting measurement with % < threshold produces 1 notification + execution record
4. Second measurement within cooldown produces 0 new notifications
5. After cooldown, measurement below threshold produces new notification
6. Setting MaxNotificationsPerDay=2 prevents a 3rd notification same day
7. Trigger list UI shows newly created trigger without reload

### 20. Implementation Checklist
#### Backend
[] (Optional) Add evaluate-test endpoint
[] Confirm tank measurement ingestion path active
[] Ensure group → policy mapping endpoints working (for recipients)

#### Frontend
[] Capture and store policyId after create
[] Replace hard-coded policyId=1 in trigger CRUD calls
[] Conditionally render TriggerCreate only when policyId present
[] Show trigger metadata fields (priority, cooldown, max/day) in list
[] (Optional) Add test button if backend evaluate-test added

#### Testing
[] Create policy → capture ID
[] Map group to policy
[] Create trigger (threshold 10%)
[] Ingest measurement < 10% → expect notification
[] Re-ingest < 10% inside cooldown → no new notification
[] After cooldown ingest again → new notification
[] Hit daily cap and confirm suppression

#### Documentation
[] Add README “Low Tank Level End-to-End Test” section
[] Record example triggerConfig JSON

#### Deferred Enhancements
* Absolute volume handler type
* Sustained duration logic / hysteresis state
* OR / grouped rule syntax
* Execution history UI

---
Status: PRD updated for current sprint scope. Proceed to implement frontend policyId wiring & (optionally) backend evaluate-test endpoint.