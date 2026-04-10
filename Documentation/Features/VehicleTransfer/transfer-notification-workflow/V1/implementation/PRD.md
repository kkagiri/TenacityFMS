# Vehicle Transfer Notification Workflow: As-Is Implementation Review

**Version:** 1.1
**Date:** 2026-04-09
**Status:** Implemented with Gaps
**Domain:** Vehicle Transfer

---

## 1. Purpose

This document no longer describes a proposed workflow. It records the current implementation that exists in the codebase today, highlights what is already working, and calls out the gaps that still need follow-up.

Primary implementation areas reviewed:

- `FMS.Application/Features/VehicleTransfer/*`
- `FMS.WebClient/Controllers/VehicleManagement/VehicleTransferController.cs`
- `FMS.BackgroundServices/TransferReminderBackgroundService.cs`
- `fms.frontend/src/pages/vehicles/transfers/*`

---

## 2. Current Status Summary

### Implemented

1. The vehicle transfer lifecycle supports `Draft`, `PendingApproval`, `Approved`, `InTransit`, `Completed`, and `Cancelled`.
2. Vehicle transfer notifications are integrated with the existing notification stack through `IVehicleTransferNotificationService`.
3. Receiver and approver user linkage fields exist in the transfer DTO and are used by the workflow.
4. Dispatch and receipt confirmation commands exist and trigger the expected lifecycle notifications.
5. Daily in-transit reminders are implemented through a background service.
6. Frontend transfer pages expose receiver selection and workflow actions for submit, approve, reject, dispatch, and confirm receipt.

### Not Fully Implemented

1. Dispatch does not yet accept the signed-copy attachment payload described in the original PRD.
2. Receipt confirmation is not limited to the designated `ReceiverUserId`; it currently relies on general vehicle edit permission.
3. The frontend dispatch and receipt actions still use lightweight confirm/prompt flows instead of a richer workflow form.
4. Approval submission still supports legacy direct-email behavior alongside role-based approver notification.

---

## 3. Verified Lifecycle

### 3.1 Status Flow

```text
Draft -> PendingApproval -> Approved -> InTransit -> Completed
                  |
                  -> Draft (rejected)

Any non-terminal status -> Cancelled
```

### 3.2 Transition Coverage

| Transition | Backend Support | Frontend Support | Notes |
|---|---|---|---|
| Draft -> PendingApproval | Yes | Yes | Submit endpoint exists and sends approver notifications |
| PendingApproval -> Approved | Yes | Yes | Approver notification to creator is implemented |
| PendingApproval -> Draft | Yes | Yes | Reject path includes rejection reason |
| Approved -> InTransit | Yes | Yes | Dispatch command exists; no attachment payload yet |
| InTransit -> Completed | Yes | Yes | Receipt confirmation updates vehicle working site and GPSGate tags |
| Any active -> Cancelled | Yes | Partial | Notification support exists; UX depends on page and status |

---

## 4. Notification Matrix

| # | Trigger | Recipients | Delivery Methods | Status |
|---|---|---|---|---|
| N1 | Submit for approval | Approvers resolved by explicit approver, `Workshop Manager`, or `Workshop` role at source site | System + Email | Implemented |
| N2 | Approval | Creator/sender | System + Email | Implemented |
| N3 | Rejection | Creator/sender | System + Email | Implemented |
| N4 | Dispatch | `ReceiverUserId` | System + Email + Push | Implemented |
| N5 | In-transit reminder | `ReceiverUserId` | System + Push | Implemented |
| N6 | Receipt confirmed | Creator/sender | System + Email | Implemented |
| N7 | Cancellation | Creator, approver, receiver | System + Email | Implemented in notification service |

### Reminder Behavior

1. `TransferReminderBackgroundService` runs every 6 hours.
2. The notification service enforces a 24-hour per-transfer cooldown using `LastReminderSentAt`.
3. Successful reminders increment `ReminderCount` and update `LastReminderSentAt`.

---

## 5. Data Model and DTO State

### Implemented Notification Workflow Fields

The transfer workflow currently uses these fields in the application layer:

| Field | Present | Usage |
|---|---|---|
| `ReceiverUserId` | Yes | Targeted receiver notifications |
| `ApproverUserId` | Yes | Explicit approver targeting |
| `DispatchedAt` | Yes | Set on dispatch |
| `ReceivedAt` | Yes | Set on receipt confirmation |
| `LastReminderSentAt` | Yes | Reminder cooldown tracking |
| `ReminderCount` | Yes | Reminder count tracking |

### DTO Coverage

`CreateVehicleTransferDTO` and `SaveTransferDraftDTO` include:

- `ReceiverUserId`
- `ApproverUserId`
- `DocumentFile`

`VehicleTransferDTO` includes:

- `ReceiverUserId`
- `ReceiverUserName`
- `ApproverUserId`
- `ApproverUserName`
- `DispatchedAt`
- `ReceivedAt`
- `ReminderCount`

---

## 6. Current API Surface

### Implemented Endpoints

| Method | Route | Purpose |
|---|---|---|
| `POST` | `/api/v1/vehicletransfers/{id}/submit-approval` | Moves draft transfer to pending approval |
| `POST` | `/api/v1/vehicletransfers/{id}/approve` | Approves pending transfer |
| `POST` | `/api/v1/vehicletransfers/{id}/reject` | Rejects pending transfer |
| `POST` | `/api/v1/vehicletransfers/{id}/dispatch` | Dispatches approved transfer |
| `POST` | `/api/v1/vehicletransfers/{id}/confirm-receipt` | Confirms receipt and completes transfer |
| `PUT` | `/api/v1/vehicletransfers/{id}/status` | General legacy status update path |

### Current Request Shape

#### Submit for Approval

Current backend behavior supports these optional fields:

```json
{
   "workshopManagerEmail": "optional@example.com",
   "workshopManagerName": "Optional Approver Name",
   "approvalBaseUrl": "https://host"
}
```

Notes:

1. Approver notifications are resolved from the transfer and site roles even when no email is provided.
2. If `workshopManagerEmail` is provided, the legacy approval email is still sent.

#### Dispatch

Current endpoint is parameterless:

```json
{}
```

Notes:

1. The command sets `Status = InTransit` and `DispatchedAt = UtcNow`.
2. No document upload or dispatch notes payload is currently accepted by the endpoint.

#### Confirm Receipt

Current request model:

```json
{
   "remarks": "Optional receipt remarks"
}
```

Notes:

1. `ReceivedAt` and `ArrivalTime` are both set server-side.
2. The endpoint does not currently accept a client-supplied arrival timestamp.

---

## 7. Frontend State

### Already Present

1. The transfer form includes a receiver user selector.
2. The transfer form includes an approver selector labelled as workshop manager.
3. The transfer list and details pages expose workflow actions based on status.
4. Transfer details pages display dispatch and receipt timestamps.

### Current UX Limitations

1. Dispatch in the list page uses `window.confirm` and then calls the dispatch endpoint without extra data.
2. Receipt confirmation in the list page uses `window.prompt` to capture remarks.
3. The details page dispatch and confirm-receipt actions are also thin workflow actions without attachment support.
4. The richer dispatch package described in the original PRD is not present in the current UI.

---

## 8. Permission and Security Notes

### Current Permission Model in Use

| Permission | Current Use |
|---|---|
| `_Read_VehicleTransfer` | Controller access and list/read workflows |
| `_Approve_VehicleTransfer` | Notification resolution and approval intent |
| `Permissions.Vehicle.Edit` | Dispatch and confirm receipt endpoints |

### Gap

The designated receiver is not yet enforced as the only user allowed to confirm receipt. Backend authorization currently checks vehicle edit permission, not `ReceiverUserId` ownership.

---

## 9. Implementation Gaps to Fix Next

### High Priority

1. Add multipart dispatch support so sender-uploaded signed documents can be stored and referenced.
2. Restrict receipt confirmation so the assigned receiver, or an approved override role, performs the completion step.
3. Replace prompt/confirm-based workflow steps in the frontend with explicit M365-style forms and validation.

### Medium Priority

1. Remove the remaining legacy email-centric assumptions from the controller and request models.
2. Expose reminder count and reminder history more clearly in the frontend.
3. Verify notification-bell and toast behavior for all transfer events end to end.

---

## 10. Conclusion

The notification workflow is materially implemented. The main backend lifecycle and notification chain already exist and are in use. The remaining work is mostly around tightening authorization, replacing legacy email-first assumptions, and completing the richer dispatch and receipt UX that the original PRD described.
