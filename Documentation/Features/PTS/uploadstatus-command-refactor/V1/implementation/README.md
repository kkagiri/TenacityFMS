# UploadStatus Command Refactor PRD And Tasklist

## Objective

Reduce the operational risk of `UploadStatusCommand.cs` by shrinking it below the review threshold and moving critical responsibilities into focused services without changing the observable packet-processing workflow.

## Problem Statement

The previous `UploadStatusCommand.cs` had accumulated multiple production-critical responsibilities in one place:

- Real-time SignalR broadcasting
- Redis persistence for live device state
- Pump authorization state transitions
- IdleStatus completion inference
- End-of-transaction correlation and completion triggering
- Forced completion fallback handling
- Deferred probe-processing dispatch

That concentration made the file difficult to reason about, difficult to review safely, and too risky to change under pressure.

## Goals

- Reduce `UploadStatusCommand.cs` to orchestration-only logic.
- Keep pump completion behavior intact for EOT, IdleStatus, and timeout fallback paths.
- Preserve existing Redis key contracts used by the rest of the system.
- Keep deferred probe processing delegated to the existing `UploadStatusProbeProcessingService`.
- Make each extracted responsibility independently reviewable and testable.

## Non-Goals

- No Domain layer changes.
- No protocol shape changes for incoming UploadStatus packets.
- No frontend contract changes for `UploadStatusUpdate` SignalR messages.
- No automatic build or publish in this task.

## Extracted Responsibilities

### 1. Realtime Broadcast

File: `FMS.Application/Features/PTS/Services/UploadStatusBroadcastService.cs`

Responsibilities:

- Build the real-time status payload
- Resolve active fueling context from cached transaction context
- Broadcast the enriched payload to SignalR clients

### 2. Redis Status Cache

File: `FMS.Application/Features/PTS/Services/UploadStatusRedisService.cs`

Responsibilities:

- Store the latest UploadStatus payload in Redis
- Maintain the last-update timestamp key

### 3. Pump State Processing

File: `FMS.Application/Features/PTS/Services/UploadStatusPumpStatusProcessingService.cs`

Responsibilities:

- Process Idle, Filling, EOT, and Offline state transitions
- Preserve authorization state when a pump is temporarily offline but still active
- Detect IdleStatus-based completions and trigger auto-completion

### 4. End Of Transaction Correlation

File: `FMS.Application/Features/PTS/Services/UploadStatusEndOfTransactionService.cs`

Responsibilities:

- Process EOT payloads
- Correlate EOT packets with stored transaction context
- Fallback to device transaction query when context is missing
- Trigger auto-completion with the richest available data

### 5. Forced Completion Fallback

File: `FMS.Application/Features/PTS/Services/UploadStatusForcedCompletionService.cs`

Responsibilities:

- Find active transaction contexts without valid EOT completion
- Evaluate timeout conditions
- Trigger synthetic completion and cleanup

## Safety Constraints

- Preserve Redis key formats already consumed by existing services.
- Preserve auto-completion entry point: `IAutoTransactionCompletionService.ProcessEndOfTransactionAsync(...)`.
- Preserve compatibility call to `ITransactionCompletionService.HandleEndOfTransactionAsync(...)`.
- Keep deferred probe processing in a fresh scope to avoid degraded DbContext reuse.
- Keep transaction-context usage aligned with `ITransactionContextService`.

## Tasklist

- [x] Identify duplicate logic already covered by `UploadStatusProbeProcessingService`.
- [x] Extract Redis UploadStatus persistence into a dedicated service.
- [x] Extract SignalR broadcast and fueling-context enrichment into a dedicated service.
- [x] Extract pump state transition handling into a dedicated service.
- [x] Extract EOT correlation and completion triggering into a dedicated service.
- [x] Extract forced completion fallback into a dedicated service.
- [x] Reduce `UploadStatusCommand.cs` to orchestration-only flow.
- [x] Register all extracted services in DI.
- [x] Keep deferred probe processing on the existing probe-processing service.
- [ ] Run full application build and packet-level regression validation.
- [ ] Execute live-device verification for EOT, IdleStatus completion, and timeout fallback.

## Review Checklist

- [x] Command file is now reviewable and no longer contains the full completion pipeline.
- [x] Probe-processing duplication is not reintroduced.
- [x] End-of-transaction processing still supports matched-context, device-query, and basic fallback paths.
- [x] Forced completion still cleans up transaction context and authorization state.
- [x] Redis status snapshot remains available to downstream flows.
- [x] SignalR `UploadStatusUpdate` payload structure remains intact.
- [x] No Domain layer files were modified.
- [x] DI registrations were updated for all new services.
- [ ] Full integration testing completed.

## Validation Plan

1. Send UploadStatus packets with FillingStatus and confirm SignalR payload still includes `fuelingContexts`.
2. Send UploadStatus with IdleStatus `LastTransaction` changes and confirm a single completion path is triggered.
3. Send UploadStatus with EndOfTransactionStatus and confirm correlated transaction completion still occurs.
4. Simulate missing EOT and verify forced completion triggers after timeout thresholds.
5. Confirm probe processing still runs in deferred scope and persists expected readings.

## Rollback Plan

If regression is detected, rollback should restore the previous command-level implementation and remove the new DI registrations as one deployment unit. Because the refactor preserved the existing Redis contracts and completion entry points, rollback scope is limited to the UploadStatus orchestration layer.