# Task List

## Feature
Multi-Vendor Telematics Gateway

## Version
V1

## Document Type
Implementation Task List

## Date
2026-03-10

## Delivery Goal
Implement a vendor-neutral telematics subsystem for FMS with direct Teltonika support in phase 1 while preserving current provider-based tracking integrations.

---

## Phase 0 — Discovery and alignment
- [ ] Confirm implementation scope from PRD.
- [ ] Confirm approved first-wave vendors beyond Teltonika, if any.
- [ ] Confirm required Teltonika command set for phase 1.
- [ ] Confirm raw packet retention requirements.
- [ ] Confirm security and audit expectations for command workflows.
- [ ] Confirm whether new persistence entities are approved.

---

## Phase 1 — Architecture contracts
- [ ] Define vendor-neutral direct-ingestion architecture.
- [ ] Define separation between provider/API integrations and direct device ingestion.
- [ ] Define protocol abstraction interfaces.
- [ ] Define transport abstraction interfaces.
- [ ] Define session/authentication abstraction interfaces.
- [ ] Define acknowledgment strategy interfaces.
- [ ] Define telemetry normalization contracts.
- [ ] Define command/downlink contracts.
- [ ] Define error/result models for parser, transport, and command flows.
- [ ] Define correlation/idempotency strategy.

### Deliverables
- [ ] Architecture contract set approved.
- [ ] Folder/domain placement approved.

---

## Phase 2 — Persistence design
- [ ] Design device registry model.
- [ ] Design device-to-vehicle mapping model.
- [ ] Design session tracking model.
- [ ] Design raw packet storage model.
- [ ] Design decoded packet storage model.
- [ ] Design normalized telemetry model.
- [ ] Design command queue/history model.
- [ ] Design failure/diagnostic storage model.
- [ ] Design health metrics/history model.
- [ ] Define EF configurations for new models.
- [ ] Validate MySQL compatibility for all new tables.

### Deliverables
- [ ] Persistence design approved.
- [ ] Migration strategy defined.

---

## Phase 3 — Listener hosting foundation
- [ ] Implement TCP listener hosting service.
- [ ] Implement UDP listener hosting service.
- [ ] Implement shared listener lifecycle management.
- [ ] Implement connection/session registry.
- [ ] Implement socket buffer management strategy.
- [ ] Implement transport-level logging and diagnostics.
- [ ] Implement listener configuration binding.
- [ ] Implement health checks for listeners.
- [ ] Implement graceful shutdown/restart behavior.

### Verification
- [ ] Listener startup/shutdown tested.
- [ ] Concurrent session handling validated.

---

## Phase 4 — Device authentication and session workflow
- [ ] Implement IMEI extraction and validation.
- [ ] Implement IMEI accept/reject responses.
- [ ] Implement session correlation for direct devices.
- [ ] Implement duplicate session handling rules.
- [ ] Implement device identity mapping lookup.
- [ ] Implement reconnect handling rules.
- [ ] Implement session timeout handling.

### Verification
- [ ] Valid IMEI session accepted.
- [ ] Invalid IMEI session rejected.
- [ ] Reconnect scenarios handled safely.

---

## Phase 5 — Teltonika uplink protocol parsing

### Codec 8
- [ ] Implement packet framing.
- [ ] Implement CRC-16/IBM validation.
- [ ] Implement AVL record parsing.
- [ ] Implement IO parsing.
- [ ] Implement TCP ACK response count logic.
- [ ] Implement UDP encapsulated packet handling.
- [ ] Implement UDP ACK packet generation.

### Codec 8 Extended
- [ ] Implement extended IO parsing.
- [ ] Implement variable-length NX IO parsing.
- [ ] Implement validation and error reporting.

### Codec 16
- [ ] Implement generation type parsing.
- [ ] Implement 2-byte AVL ID parsing.
- [ ] Implement validation and error reporting.

### Verification
- [ ] Golden packet fixtures created for Codec 8.
- [ ] Golden packet fixtures created for Codec 8 Extended.
- [ ] Golden packet fixtures created for Codec 16.
- [ ] Successful parse/ACK tests completed for TCP.
- [ ] Successful parse/ACK tests completed for UDP.
- [ ] CRC failure tests completed.
- [ ] Record-count mismatch tests completed.

---

## Phase 6 — Normalization pipeline
- [ ] Map decoded packets to normalized telemetry records.
- [ ] Normalize core location fields.
- [ ] Normalize event identifiers and priority.
- [ ] Normalize common IO fields.
- [ ] Preserve vendor-specific IO payloads.
- [ ] Add correlation between raw packet, decoded packet, and normalized event.
- [ ] Add idempotent processing safeguards.

### Verification
- [ ] A single packet can be traced across all stages.
- [ ] Duplicate resend handling does not duplicate normalized telemetry.

---

## Phase 7 — Persistence implementation
- [ ] Persist raw packets.
- [ ] Persist decoded packets.
- [ ] Persist normalized telemetry.
- [ ] Persist session records.
- [ ] Persist parser and validation failures.
- [ ] Persist transport metrics snapshots.
- [ ] Persist command lifecycle records.
- [ ] Add cleanup/retention strategy hooks.

### Verification
- [ ] All packet lifecycle stages are stored correctly.
- [ ] Storage schema works with expected payload sizes.

---

## Phase 8 — Integration with existing FMS tracking services
- [ ] Connect normalized telemetry to existing vehicle tracking services.
- [ ] Feed live updates into current SignalR tracking path.
- [ ] Preserve current GPSGate provider behavior.
- [ ] Define coexistence rules between direct ingestion and provider integrations.
- [ ] Add APIs for device/session/health visibility if required.

### Verification
- [ ] Existing tracking UI receives direct-device updates.
- [ ] GPSGate flows still function.

---

## Phase 9 — Command/downlink support

### Command foundation
- [ ] Define generic command request model.
- [ ] Define generic command response model.
- [ ] Define command status lifecycle.
- [ ] Implement authorization/audit model for command initiation.

### Teltonika command support
- [ ] Implement Codec 12 command packet builder.
- [ ] Implement Codec 12 response parser.
- [ ] Implement Codec 14 command packet builder.
- [ ] Implement Codec 14 ACK/nACK parser.
- [ ] Implement command correlation and timeout handling.
- [ ] Implement retry handling rules.

### Verification
- [ ] Command send path tested.
- [ ] ACK response path tested.
- [ ] nACK response path tested.
- [ ] Timeout handling tested.

---

## Phase 10 — Observability and operations
- [ ] Add structured logs for transport events.
- [ ] Add structured logs for parser outcomes.
- [ ] Add raw packet diagnostic logging strategy.
- [ ] Add health/metrics collection for listeners.
- [ ] Add parser failure counters.
- [ ] Add CRC failure counters.
- [ ] Add command success/failure counters.
- [ ] Add active session visibility.
- [ ] Add alerting thresholds definition.

### Verification
- [ ] Operators can detect listener outages.
- [ ] Operators can identify device/protocol failures quickly.

---

## Phase 11 — Test harness and replay tooling
- [ ] Build binary fixture library for supported codecs.
- [ ] Build TCP replay test harness.
- [ ] Build UDP replay test harness.
- [ ] Build malformed-packet test cases.
- [ ] Build duplicate/retry test cases.
- [ ] Build command-response simulation cases.
- [ ] Add integration tests for end-to-end ingest.

### Verification
- [ ] Replay harness can reproduce production-like flows.
- [ ] End-to-end test suite passes.

---

## Phase 12 — Rollout hardening
- [ ] Add configuration templates for listener ports and feature flags.
- [ ] Add staged enablement strategy.
- [ ] Add safe fallback/disable switches.
- [ ] Add operational runbook inputs.
- [ ] Perform load and soak testing.
- [ ] Validate failure recovery scenarios.

---

## Final Acceptance Checklist
- [ ] Teltonika TCP handshake and AVL ingest working.
- [ ] Teltonika UDP ingest and ACK working.
- [ ] Codec 8 supported.
- [ ] Codec 8 Extended supported.
- [ ] Codec 16 supported.
- [ ] Codec 12 commands supported.
- [ ] Codec 14 commands supported.
- [ ] Full AVL/IO payloads persisted.
- [ ] Normalized telemetry available to FMS consumers.
- [ ] Existing provider integrations remain operational.
- [ ] Health and diagnostics available.
- [ ] Replay/test harness available.
