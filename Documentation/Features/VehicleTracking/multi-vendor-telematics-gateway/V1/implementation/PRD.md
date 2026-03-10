# Product Requirements Document

## Feature
Multi-Vendor Telematics Gateway

## Version
V1

## Document Type
Implementation PRD

## Date
2026-03-10

## 1. Purpose
Build a vendor-neutral telematics ingestion subsystem for FMS that can:
- accept direct device connections,
- support Teltonika as the first direct device vendor,
- continue supporting external tracking providers such as GPSGate,
- normalize telemetry into one internal model,
- support uplink telemetry and downlink commands.

## 2. Background
Current FMS tracking support is centered on provider integrations and live update distribution.

### Existing foundation already present
- Provider abstraction through vehicle tracking provider interfaces.
- GPSGate integration for API/provider-based tracking.
- Background live update consumer for GPSGate events.
- SignalR-based frontend live tracking updates.
- PTS connection/listener patterns that can inform direct device listener design.

### Current gap
FMS does not currently provide a production-ready direct tracker ingestion subsystem for binary device protocols such as Teltonika AVL over TCP/UDP.

## 3. Problem Statement
The system currently depends on external provider integrations for tracking data. This limits direct device onboarding, protocol flexibility, vendor independence, and control over device-level communication. FMS needs a unified telematics gateway that supports both:
- direct devices,
- external vendor platforms/APIs.

## 4. Product Goal
Enable FMS to operate as a unified telematics platform that can ingest, normalize, persist, and distribute telemetry from multiple vendor sources without coupling core business features to any single vendor protocol.

## 5. Objectives
1. Support direct device ingestion for Teltonika in phase 1.
2. Support both TCP and UDP transports.
3. Preserve compatibility with existing provider-based integrations.
4. Persist full AVL/IO payloads and normalized telemetry.
5. Support device command/downlink workflows in phase 1.
6. Provide extensibility for future vendors.
7. Provide operational visibility, diagnostics, and replay capability.

## 6. In Scope
### Phase 1 functional scope
- Direct tracker ingestion over TCP.
- Direct tracker ingestion over UDP.
- HTTP/webhook-ready adapter shape for provider/event integrations.
- Teltonika protocol support:
  - Codec 8
  - Codec 8 Extended
  - Codec 16
  - Codec 12 command channel
  - Codec 14 command channel
- IMEI/session handshake.
- Packet framing and validation.
- CRC-16/IBM validation.
- TCP acknowledgment record count responses.
- UDP packet acknowledgment responses.
- Raw packet capture and storage/logging.
- Decoded packet persistence.
- Normalized telemetry persistence.
- Device-to-vehicle mapping support.
- Device command submission, routing, response capture, timeout handling, and retry status.
- Health monitoring and diagnostics.
- Replay/simulation harness for protocol testing.

## 7. Out of Scope for Phase 1
- Full support for all Teltonika codecs beyond selected phase 1 codecs.
- OTA firmware workflows.
- Device configuration UI beyond minimum operational setup.
- Bulk vendor migration tooling.
- Geofence/business rule redesign unrelated to ingestion.
- Mobile app redesign.

## 8. Users / Stakeholders
- Fleet operations administrators
- System administrators
- Integration engineers
- Support/operations teams
- Reporting and analytics consumers
- Frontend live tracking consumers

## 9. Functional Requirements

### FR-1: Multi-source ingestion
The system shall support both:
- direct device protocol ingestion,
- provider/platform-based integrations.

### FR-2: Vendor-neutral architecture
The system shall separate:
- transport handling,
- protocol parsing,
- normalization,
- persistence,
- live distribution,
- command handling.

### FR-3: Teltonika TCP support
The system shall accept Teltonika TCP connections, process IMEI handshake, decode AVL packets, validate CRC, and reply with accepted record count.

### FR-4: Teltonika UDP support
The system shall accept Teltonika UDP packets, validate encapsulated AVL payloads, and respond with correct UDP acknowledgment packets.

### FR-5: Codec support
The system shall parse and process:
- Codec 8
- Codec 8 Extended
- Codec 16

### FR-6: Command channel support
The system shall support downlink command workflows for:
- Codec 12
- Codec 14

### FR-7: Full payload persistence
The system shall persist:
- raw payload,
- transport metadata,
- protocol metadata,
- decoded AVL records,
- IO elements,
- normalized telemetry projections.

### FR-8: Normalized telemetry model
The system shall normalize data into a common internal model including at minimum:
- device identifier,
- IMEI,
- vendor,
- protocol,
- timestamp,
- latitude,
- longitude,
- altitude,
- speed,
- heading/angle,
- satellite count,
- priority,
- ignition/event identifiers,
- vendor-specific IO payloads.

### FR-9: Existing provider compatibility
The system shall keep current GPSGate/provider-based functionality operational.

### FR-10: Live updates
The system shall publish normalized updates to existing live tracking consumers without requiring frontend redesign.

### FR-11: Device mapping
The system shall support mapping device identities to FMS vehicles.

### FR-12: Reliability controls
The system shall support duplicate detection, resend-safe handling, validation failure logging, and timeout/error tracking.

### FR-13: Observability
The system shall provide:
- listener health,
- active sessions,
- parse failures,
- CRC failures,
- ACK failures,
- command failures,
- throughput metrics.

### FR-14: Replay/test support
The system shall provide fixtures or a replay harness for binary packet testing.

## 10. Non-Functional Requirements

### NFR-1: Extensibility
Adding a new vendor shall require implementing vendor-specific transport/protocol adapters without redesigning core business services.

### NFR-2: Performance
The system shall support sustained concurrent device traffic for live fleet usage with bounded processing latency.

### NFR-3: Reliability
The system shall gracefully recover from socket interruption, parser error, malformed packet, and downstream persistence failure.

### NFR-4: Traceability
Every raw packet and normalized event shall be traceable through correlation identifiers and device/session context.

### NFR-5: Security
The system shall validate device identity, constrain exposed listener endpoints, and protect command workflows from unauthorized access.

### NFR-6: Maintainability
The implementation shall follow FMS CQRS and clean architecture conventions and preserve one-class-per-file structure.

## 11. High-Level Architecture Requirements
The solution shall contain the following logical layers:
1. Transport listeners
   - TCP listener
   - UDP listener
   - HTTP/webhook adapter
2. Session/authentication handling
3. Protocol parser layer
4. Acknowledgment strategy layer
5. Normalization layer
6. Persistence layer
7. Live event distribution layer
8. Command/downlink layer
9. Monitoring and diagnostics layer

## 12. Data Requirements
The platform shall persist data for:
- tracker device registry
- device-to-vehicle mapping
- session history
- raw inbound packets
- decoded protocol packets
- normalized telemetry
- command requests
- command responses
- parser/transport failures
- health metrics snapshots

## 13. Dependencies
- Existing vehicle tracking provider model
- Existing SignalR live tracking pipeline
- Existing persistence infrastructure and `GpsdataContext`
- Existing background service hosting patterns
- Logging/monitoring configuration
- New persistence entities/configurations if approved

## 14. Risks
- Domain/persistence changes may be required for full implementation.
- Binary protocol ingestion adds operational complexity.
- UDP support requires careful ACK and retry behavior.
- Command workflows increase security and audit requirements.
- Existing provider path and new direct-ingestion path must not diverge semantically.

## 15. Success Metrics
- Teltonika devices can connect directly over TCP and UDP.
- Valid packets are parsed and acknowledged successfully.
- Full AVL/IO payloads are stored and queryable.
- Normalized positions appear in existing live tracking flows.
- Commands can be sent and their responses tracked.
- GPSGate and provider-based integrations remain functional.
- New vendor onboarding requires only adapter/protocol implementation, not architecture redesign.

## 16. Acceptance Criteria
1. A Teltonika device can complete IMEI handshake and upload AVL packets over TCP.
2. A Teltonika device can send AVL data over UDP and receive valid acknowledgments.
3. Codec 8, 8 Extended, and 16 packets are parsed successfully.
4. Full AVL/IO details are stored.
5. Normalized vehicle location updates are available to existing live consumers.
6. Codec 12 and Codec 14 command workflows are supported end-to-end.
7. Transport, parse, validation, and command failures are observable.
8. The architecture supports future non-Teltonika vendors.

## 17. Open Questions
- Which non-Teltonika vendors should be prioritized after Teltonika?
- What retention period is required for raw packet storage?
- What command types must be supported in phase 1?
- Should decoded IO data be indexed for reporting, or only stored as payload?
- What operational thresholds define listener health alerts?

## 18. Recommended Delivery Phases
- Phase A: architecture foundation and contracts
- Phase B: listener/session infrastructure
- Phase C: Teltonika uplink codecs
- Phase D: normalization and persistence
- Phase E: command/downlink support
- Phase F: monitoring, replay, and rollout hardening
