# Unified Widget Data Envelope & Protocol Negotiation (Dashboard Hub Modernization)

## 1. Executive Summary
We are modernizing the dashboard data delivery layer by:

1. Replacing multiple per-widget REST/SignalR calls with a unified, versioned envelope protocol.
2. Introducing protocol negotiation so upgraded clients opt into the new model while legacy clients continue unaffected.
3. Normalizing streaming updates to the same envelope format (initial + incremental).
4. Introducing typed DTO envelopes and payload DTOs (removing anonymous JSON) while keeping legacy dual-send for safety.
5. Targeting legacy broadcasts via protocol groups, and planning phased removal of legacy events after measured adoption.

Outcome: lower latency first paint, reduced network chatter, consistent client parsing, cleaner backend code paths, and a controlled deprecation sequence.


## 2. Problem Statement

Current dashboard initialization triggers N widget requests (REST + SignalR) causing:

- High initial network burst and connection contention.
- Redundant hydration logic (initial vs streaming vs incremental differ).
- Difficulty evolving data contracts due to informal anonymous JSON.
- Increased memory & CPU load on hub due to duplicative serialization.
- Complicated client handler branching.

## 3. Goals

Functional:

- G1: Deliver all initial widget data via a single batch envelope (or minimal batches if size thresholds hit).
- G2: Use one canonical envelope schema for: initial, batch, streaming, and incremental update types.
- G3: Auto-detect client capabilities (protocolVersion negotiation).
- G4: Suppress legacy event sends when a client negotiates ≥ v2 (legacy events sent only to the legacy protocol group).
- G5: Support fallback (legacy path) with zero regression risk.
- G6: Provide telemetry on adoption (legacy vs v2 connections & envelope usage).
- G7: Allow structured error envelopes alongside data.
- G8: Provide typed payloads to improve contract safety and evolvability.

Non-Functional:

- N1: No increase in P95 dashboard time-to-interactive during rollout.
- N2: Reduce total initial dashboard payload message count by ≥60%.
- N3: Maintain backward compatibility until adoption ≥90% for 2 weeks.
- N4: Envelope serialization overhead ≤ existing per-widget aggregate baseline.
- N5: Extensible metadata field space (e.g., correlationId, schemaVersion in later phases).

## 4. Out of Scope

- Real-time diff/patch compression beyond existing incremental logic.
- Frontend state refactor to normalized entity store (post-phase enhancement).
- Cross-dashboard prefetching.
- Persistence of telemetry beyond in-memory counters (future observability phase).

## 5. Current State & Progress Summary

| Task / Phase | Branch | Status | Notes |
|--------------|--------|--------|-------|
| Envelope builder + dual-send (initial only) | feat/hub-envelope-initial | Completed | Backend sends both legacy + envelope. |
| Frontend hook consumes envelope if present | feat/frontend-envelope-optin | Completed | Adapter path added; non-breaking. |
| Protocol negotiation & suppress legacy when negotiated | feat/protocol-negotiation | Completed | AcceptProtocol + AcceptProtocolAdvanced implemented; telemetry counters added; protocol groups created (legacy vs v2). |
| Normalize streaming updates (envelope) | feat/streaming-envelope | Completed | Envelope-first broadcasts; legacy sends targeted only to Legacy group. Request handlers are envelope-first with legacy fallback. |
| DatePreset resolver refactor | refactor/date-preset | Planned | Service abstraction identified; not migrated yet. |
| DTO record + remove anonymous JSON | feat/dto-contract | In Progress | Typed envelope (`WidgetEnvelopeDto<T>`) + payload DTOs added. Backend migrated Ticker/Graph/Layout/Metrics to typed payloads; legacy still supported. |
| Cleanup: remove legacy events (final) | chore/remove-legacy-events | Not Started | Blocked on adoption threshold & safety window. |
| Frontend state normalization (single reducer on envelope) | (to create) | Not Started | Will simplify deprecation path. |
| Telemetry visualization UI | (to create) | Not Started | Dashboard diagnostics panel. |
| Add correlationId / schemaVersion | (future) | Partially Complete | schemaVersion and correlationId now included in envelope; server timestamp is exposed as timestampUtc. Further correlation/metrics optional. |

## 6. User Stories / Requirements

Core Stories:

- As a dashboard client, I receive all initial widget data in one envelope so I can render faster.
- As an upgraded client, I don’t receive redundant legacy events once I’ve negotiated v2 to save bandwidth.
- As an operator, I can view how many clients are using legacy vs v2 to decide deprecation timing.
- As a developer, I have a single shape for widget updates, reducing parsing complexity.

Acceptance Criteria (Selected):

- AC1: Batch initial call returns <= 2 messages for 95% of dashboards (edge: extremely large dashboards may chunk).
- AC2: After negotiation (acceptedVersion >= 2), no legacy InitialWidgetDataResponse or WidgetDataUpdate events are sent.
- AC3: Error conditions produce an error envelope with updateType = "error" and legacy suppression honors protocol version.
- AC4: Telemetry endpoint returns counts {legacyConnectionCount, v2ConnectionCount} updated per connection lifetime.
- AC5: Streaming envelope contains metadata.widgetType & widgetInstanceId for every update; no missing fields in >99.5% events (instrumented).
- AC6: Frontend gracefully falls back to legacy if negotiation request fails (network or server 4xx/5xx).

## 7. Envelope Schema (Current)

We now emit a typed, versioned envelope. Field names reflect the current implementation.

Example shape (keys are stable unless marked experimental):

```json
{
  "schemaVersion": 2,
  "correlationId": "string|null",
  "widgetInstanceId": 123,
  "widgetType": "string",
  "category": "string",
  "dataSource": "string",
  "mode": "string",
  "timeRange": "string",
  "aggregation": "string",
  "updateType": "initial|update|stream|incremental|datasource|metrics|error",
  "isInitialLoad": true,
  "timestampUtc": "2025-09-25T12:34:56Z",
  "metadata": {
    "displayName": "string",
    "unit": "string|null",
    "supportsLive": true,
    "supportsHistorical": true,
    "refreshIntervalSeconds": 30
  },
  "data": { /* typed payload (DTO) */ },
  "errors": ["..."] | null,
  "validation": ["..."] | null,
  "debug": { } | null
}
```

Notes:

- The typed payload varies per widget/update (e.g., TickerUpdateDto, GraphUpdateDto).
- For error envelopes, data is an empty object and errors/validation are populated.
- Legacy events are still emitted for non-v2 clients but are targeted to the Legacy protocol group only.

Forward-looking additions (phase 5.x):

- performance: { generationMs, sizeBytes }
- optional chunking metadata for batched responses

## 8. Architecture Overview

Flow (v2 client):

1. Connect SignalR.
2. Send AcceptProtocolAdvanced({ desiredVersion: 2, features: [...] }).
3. Hub sets Context.Items + increments v2 telemetry.
4. Client invokes GetInitialWidgetsData (batch).
5. Hub builds envelope(s), sends envelope batch; legacy suppressed.
6. Streaming updates use same envelope; incremental path normalized; legacy sends are suppressed for v2 connections.
7. Client state reducer consumes a single pipeline.

Legacy client path:

- No negotiation or AcceptProtocol returns 1.
- Client is added to the Legacy protocol group on connect; dual-send occurs (envelope + legacy) until deprecation.
- Targeted legacy broadcasts go only to the Legacy group; envelope is still sent to all.

Protocol groups:

- "protocol:legacy" – default group on connect; receives legacy events.
- "protocol:v2" – set on successful negotiation (version ≥ 2); legacy events suppressed.

## 9. Rollout & Migration Plan

Phases:

1. (DONE) Dual-send initial only; passive envelope observation.
2. (DONE) Frontend optional consumption (adapter).
3. (DONE) Protocol negotiation + legacy suppression for negotiated clients.
4. (DONE) Streaming normalization (full envelope).
5. (IN PROGRESS) DTO formalization + typed records (remove anonymous JSON).
6. (PLANNED) Frontend canonical reducer; drop legacy handler registration by default.
7. (PLANNED) Soft deprecation announcement (observability watch period).
8. (PLANNED) Remove legacy events (after ≥90% v2 adoption for 14 days).
9. (OPTIONAL) Add correlationId / metrics expansion / persistence.

Rollback Strategy:

- Keep negotiation opt-in; if envelope bug detected, client can force legacy via localStorage flag (already implemented).
- Server feature toggle (appsettings or env var) to hard-disable suppression if required.
- Add health probe emitting sample envelope to synthetic client for early detection.
- Server-side feature toggle can hard-disable suppression and force legacy-only if needed.

## 10. Dependencies

- SignalR Hub partial refactor (complete).
- DatePreset value resolution (pending refactor but not blocker).
- WidgetFactoryService stability (already integrated in initial + streaming).
- Frontend SignalR service modernization (negotiation added; reducer normalization pending).
- Logging & telemetry dashboards (in-memory only now).

## 11. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Envelope payload size inflation | Slower initial load | Measure sizeBytes; implement chunking threshold. |
| Partial adoption stalemate | Can't remove legacy | Add adoption reporting to ops dashboards; comms with app teams. |
| Silent client parse errors | Rendering regressions | Feature flag + forceLegacy override; error envelopes with explicit type. |
| Drift between initial/streaming schemas | Client branching persists | Enforce single builder methods (BuildInitial/BuildUpdate/BuildError) and typed DTOs. |
| Telemetry resets on restart | Misleading adoption metrics | Future: persist snapshot or push to metrics sink. |
| Over-suppression (legacy disabled prematurely) | Older clients break | Require negotiation handshake before suppression. |

## 12. Metrics & Success Criteria

Primary:

- M1: Avg number of initial widget messages per dashboard: Target ≤ 2 (from baseline N).
- M2: P95 dashboard render start (first meaningful paint): No regression; Target -10% improvement.
- M3: v2 adoption rate: ≥90% of active connections.
- M4: Envelope parse error rate: <0.5% of total envelope events.
- M5: Total serialized bytes initial load: -40% vs baseline combined legacy messages.
- M6: Server CPU time spent in per-widget initial retrieval: -25% (batch optimization).

Secondary:

- Time to add a new widget type: -30% developer effort (qualitative after 2 additions).
- Logged protocol negotiation failures: <1% of connection attempts.

## 13. Open Questions

1. Should schemaVersion be mandatory now (default = 2) to future-proof?
2. Do we need granular feature negotiation (features array) beyond protocolVersion for upcoming analytics widgets?
3. Where will telemetry persist (Prometheus? ELK? App Insights) before legacy removal?
4. Chunking strategy threshold—size or count based? (Proposed: if envelope batch > 750KB or > 50 widgets, split.)
5. Should error envelopes always include original request context (e.g., requestId)? Add soon?

## 14. Implementation Gaps (Next Actions)

- Add unified frontend reducer: canonicalEnvelopeReceived(envelope) mapping to normalized store.
- Refactor remaining ad-hoc legacy paths to envelope-first where applicable.
- Extend correlationId usage in hub flows and surface in logs/telemetry.
- Add simple diagnostics panel using `protocolTelemetry`.
- Draft deprecation comms (internal doc) + feature toggle entry.
- DatePreset resolver service extraction (phase 3.x).
- Complete DTO migration (KeyStatistics DTO) and add AutoMapper profiles for domain→DTO mapping.

## 15. Decommission Plan for Legacy Events

Trigger Conditions:

- v2 adoption ≥90% sustained for 14 consecutive days AND no critical envelope parse defects in logs.

Steps:

1. Announce freeze date (T0 + 7 days).
2. Add warn-level log when legacy path invoked (during freeze window).
3. Remove dual-send (envelope only).
4. Remove legacy handlers/server methods after one additional release cycle.
5. Clean unused frontend fallback code & localStorage forceLegacy flag (optional retention for test envs).

## 16. Appendix A: Task Mapping & Branch Strategy

| Phase | Branch Naming Convention | Merge Strategy |
|-------|--------------------------|----------------|
| Envelope initial dual-send | feat/hub-envelope-initial | Squash → integration branch |
| Frontend envelope opt-in | feat/frontend-envelope-optin | Rebase onto FIX/Refactor |
| Negotiation & suppression | feat/protocol-negotiation | Feature flag aware; merge after QA |
| Streaming normalization | feat/streaming-envelope | Progressive commits; partial merge allowed |
| DatePreset refactor | refactor/date-preset | Separate PR; ensure unit coverage |
| DTO contract formalization | feat/dto-contract | Big bang; requires coordinated FE branch |
| Legacy removal | chore/remove-legacy-events | Feature toggle present until cut |

## 17. Appendix B: Quality Gates

- Unit tests: Envelope builder variations (initial, error, streaming incremental).
- Contract snapshot: JSON schema test verifying required fields present.
- Load test: Compare baseline vs envelope path (initial message count & latency).
- Lint/Type: FE service ensures no unused legacy handler references post-normalization.
- Security: Confirm no leakage of internal entity IDs beyond widgetInstanceId.

## 18. Exit Criteria for Pilot

All of:

- ≥70% adoption for 1 week.
- No Sev2+ incidents tied to new protocol.
- All streaming updates emitted solely via envelope (legacy only when unsuppressed).
Then transition to Phase 5.x.
