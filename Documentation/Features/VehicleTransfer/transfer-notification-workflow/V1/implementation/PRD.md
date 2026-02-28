# PRD: Vehicle Transfer Notification & Approval Workflow

**Version:** 1.0
**Date:** 2026-02-27
**Status:** In Progress
**Domain:** Vehicle Transfer

---

## 1. Problem Statement

The current vehicle transfer system uses **email-only notifications** and lacks real-time in-app notifications. Key stakeholders (workshop managers, senders, receivers) have no visibility into transfer lifecycle events unless they check their email. There is no concept of a **Receiver as a system user** — receiver info is stored as free-text name/function strings, so no targeted notifications can be sent. Daily reminders for pending receipt confirmation do not exist.

---

## 2. Goals

1. Integrate the existing `INotificationService` (SignalR + Email + Push) into the vehicle transfer workflow
2. Add **Receiver as a User** (`ReceiverUserId` FK) so the system can send targeted notifications
3. Add **Approver as a User** linked to users with approval rights or Workshop role
4. Implement the complete notification chain across all transfer lifecycle states
5. Add daily reminder notifications for receivers until they confirm vehicle receipt

---

## 3. Transfer Lifecycle & Notification Matrix

### 3.1 State Machine (Unchanged)

```
Draft → PendingApproval → Approved → InTransit → Completed
                ↓
              Draft (rejection)
Any non-terminal → Cancelled
```

### 3.2 Notification Flow

| # | Trigger Event | From Status | To Status | Notification Recipients | Delivery Methods | Priority |
|---|--------------|-------------|-----------|------------------------|-----------------|----------|
| N1 | User creates transfer & submits for approval | Draft | PendingApproval | **Workshop Manager / Approver** (users with `_Approve_VehicleTransfer` permission or Workshop role at the from-site) | System + Email | High |
| N2 | Approver approves the transfer | PendingApproval | Approved | **Creator** (sender) — transfer has been approved, release the vehicle | System + Email | High |
| N3 | Approver rejects the transfer | PendingApproval | Draft | **Creator** (sender) — transfer rejected with reason | System + Email | Medium |
| N4 | Sender dispatches the vehicle (Approved → InTransit) | Approved | InTransit | **Receiver** (`ReceiverUserId`) — vehicle has been dispatched and is in transit. Includes signed copy & system printout attached by sender. | System + Email + Push | High |
| N5 | Daily reminder while InTransit | InTransit | InTransit | **Receiver** (`ReceiverUserId`) — daily reminder: "Vehicle XYZ is in transit. Please confirm receipt." | System + Push | Medium |
| N6 | Receiver confirms receipt (InTransit → Completed) | InTransit | Completed | **Creator/Sender** — vehicle received at destination site. System updates vehicle working site. | System + Email | High |
| N7 | Transfer cancelled | Any | Cancelled | **All stakeholders** (Creator, Approver, Receiver if assigned) | System + Email | Medium |

### 3.3 Detailed Flow Narrative

```
1. CREATOR fills out the transfer form (vehicle, from/to site, inspection, receiver user, etc.)
2. CREATOR clicks "Submit for Approval"
   → Status: Draft → PendingApproval
   → [N1] Notification to Workshop Manager / users with approval rights at from-site

3. APPROVER reviews and approves
   → Status: PendingApproval → Approved
   → [N2] Notification to CREATOR: "Your transfer has been approved. Please release the vehicle."

   OR APPROVER rejects
   → Status: PendingApproval → Draft
   → [N3] Notification to CREATOR: "Transfer rejected. Reason: ..."

4. SENDER (creator) prepares vehicle, attaches signed copy + system printout, clicks "Dispatch"
   → Status: Approved → InTransit
   → [N4] Notification to RECEIVER: "Vehicle XYZ has been dispatched from Site A to Site B. ETA: ..."
   → Sender attaches signed document copy and system-generated report to the transfer

5. While InTransit:
   → [N5] DAILY reminder to RECEIVER until they confirm receipt

6. RECEIVER clicks "Confirm Receipt"
   → Status: InTransit → Completed
   → [N6] Notification to SENDER: "Vehicle XYZ received at Site B"
   → System updates Vehicle.WorkingSiteId to ToSiteId
   → System updates GPSGate tags
```

---

## 4. Data Model Changes

### 4.1 Entity: `VehicleTransfer` — New Fields

| Property | Type | DB Column | Purpose |
|----------|------|-----------|---------|
| `ReceiverUserId` | `string?` | `receiver_user_id` VARCHAR(450) | FK to AspNetUsers — the system user designated as receiver |
| `ApproverUserId` | `string?` | `approver_user_id` VARCHAR(450) | FK to AspNetUsers — the user who approved (distinct from `ApprovedBy` name string) |
| `DispatchedAt` | `DateTime?` | `dispatched_at` DATETIME | Timestamp when vehicle was dispatched (InTransit) |
| `ReceivedAt` | `DateTime?` | `received_at` DATETIME | Timestamp when receiver confirmed receipt |
| `LastReminderSentAt` | `DateTime?` | `last_reminder_sent_at` DATETIME | Track last daily reminder to avoid duplicates |
| `ReminderCount` | `int` | `reminder_count` INT DEFAULT 0 | Number of reminders sent |

### 4.2 Notification Category (DB Insert)

```sql
INSERT INTO notificationcategories (Id, Name, Description, IsActive)
VALUES (18, 'VehicleTransfer', 'Vehicle transfer lifecycle notifications', 1);
```

### 4.3 Enum: `WellKnownCategories`

```csharp
VehicleTransfer = 18,  // Vehicle transfer lifecycle notifications
```

---

## 5. Backend Implementation Plan

### Phase 1: Foundation (Current Sprint)

#### 5.1 Domain Changes (Requires Approval)
- Add `ReceiverUserId`, `ApproverUserId`, `DispatchedAt`, `ReceivedAt`, `LastReminderSentAt`, `ReminderCount` to `VehicleTransfer` entity

#### 5.2 Notification Service Integration
- Create `IVehicleTransferNotificationService` — encapsulates all transfer notification logic
- Create `VehicleTransferNotificationService` — implementation using `INotificationService`
- Add `WellKnownCategories.VehicleTransfer = 18`
- Register in DI

#### 5.3 Command Handler Updates
- **SubmitForApprovalCommandHandler**: Add `IVehicleTransferNotificationService` call to notify approvers
- **ApproveTransferCommandHandler**: Add notification to creator
- **RejectTransferCommandHandler**: Add notification to creator
- **UpdateVehicleTransferStatusCommand** (InTransit): Add notification to receiver
- **UpdateVehicleTransferStatusCommand** (Completed): Add notification to sender/creator

#### 5.4 New Commands
- **DispatchTransferCommand**: Approved → InTransit with document attachment + receiver notification
- **ConfirmReceiptCommand**: InTransit → Completed by receiver user

#### 5.5 Background Service
- **TransferReminderBackgroundService**: Daily job that finds InTransit transfers and sends reminder notifications to receivers

### Phase 2: Frontend (Next Sprint)
- Add Receiver user selector to transfer form
- Add dispatch action (attach signed copy, system printout)
- Add receiver confirmation action
- Real-time notification toasts via SignalR
- Notification bell integration

---

## 6. API Changes

### New Endpoints

| Method | Route | Purpose |
|--------|-------|---------|
| POST | `/api/v1/vehicletransfers/{id}/dispatch` | Sender dispatches vehicle (Approved → InTransit) |
| POST | `/api/v1/vehicletransfers/{id}/confirm-receipt` | Receiver confirms receipt (InTransit → Completed) |

### Modified Request Models

**SubmitForApprovalRequest** — remove `WorkshopManagerEmail` (system will find approvers by role/permission):
```json
{
  "approverUserId": "optional-specific-approver-id"
}
```

**DispatchTransferRequest**:
```json
{
  "notes": "Vehicle dispatched with all documents",
  "documentFile": "(multipart file - signed copy)"
}
```

**ConfirmReceiptRequest**:
```json
{
  "notes": "Vehicle received in good condition",
  "arrivalTime": "2026-02-27T14:30:00Z"
}
```

### Modified DTOs

**CreateVehicleTransferDTO** — add:
- `ReceiverUserId` (string?) — the designated receiver user
- `ApproverUserId` (string?) — optional specific approver

**VehicleTransferDTO** — add:
- `ReceiverUserId`, `ReceiverUserName` (resolved)
- `ApproverUserId`, `ApproverUserName` (resolved)
- `DispatchedAt`, `ReceivedAt`
- `ReminderCount`

---

## 7. Permission Model

| Permission | Purpose |
|-----------|---------|
| `_Read_VehicleTransfer` | View transfers (existing) |
| `_Create_VehicleTransfer` | Create transfers (existing) |
| `_Approve_VehicleTransfer` | Approve/reject transfers (NEW) |
| `_Manage_VehicleTransfer` | Full admin (existing) |

Approvers are resolved by:
1. Explicit `ApproverUserId` if provided in the request
2. Users with `_Approve_VehicleTransfer` permission at the from-site
3. Users with "Workshop Manager" role at the from-site

---

## 8. Success Metrics

- All transfer state transitions trigger in-app notifications within 2 seconds (SignalR)
- Email notifications sent within 30 seconds of state change
- Daily reminders sent for all InTransit transfers older than 24 hours
- Receiver can confirm receipt from notification link
- Zero dropped notifications (logged and retried)

---

## 9. Out of Scope (V1)

- Mobile push notification deep links
- SMS notifications
- Notification preferences per user for transfer events
- Escalation chains (if approver doesn't respond in X days)
- Batch transfer operations

---

## 10. Technical Dependencies

| Component | Status |
|-----------|--------|
| `INotificationService` | Exists — 2293-line service with SignalR + Email + SMS + Push |
| `ISignalRNotificationService` | Exists — real-time delivery |
| `INotificationRecipientResolver` | Exists — can resolve users by role/permission |
| `CreateNotificationRequest` DTO | Exists — supports VehicleId, SiteId, Recipients, Data |
| `WellKnownCategories` enum | Exists — needs VehicleTransfer = 18 added |
| `VehicleTransfer` entity | Exists — needs ReceiverUserId, ApproverUserId, etc. |
| Background service infrastructure | Exists — `FMS.BackgroundServices` project |
