/**
 * File:          NotificationLinkBuilder.cs
 * Purpose:       Central source of truth for in-app deep links attached to notifications.
 *                Any notification creation site that wants the notification to be clickable
 *                should use one of these factory methods to populate CreateNotificationRequest.Link
 *                and CreateNotificationRequest.LinkLabel, instead of hardcoding route strings.
 * Dependencies:  None (pure string helper).
 * Last Modified: 2025-01-15
 *
 * Key Functions:
 * - ForTankStockEvent(): link to the tank / active events page for a tank-level event.
 * - ForWarningLetterSignature(): link to the warning letter preview page (signature request).
 * - ForWarningLetterView(): link to the warning letter view page (signed copy uploaded).
 * - ForIssue(): link to the issue tracker detail page.
 * - ForVehicleTrip(): link to a vehicle trip detail page.
 * - ForVehicleTransfer(): link to a vehicle transfer detail page.
 * - ForActiveEvent(): link to the active events dashboard filtered by event.
 */
namespace FMS.Application.Features.Notification.Services
{
    /// <summary>
    /// Produces normalized (link, label) pairs for notifications so the frontend can
    /// navigate the user directly to the page where they can respond to the notification.
    /// All paths returned are relative in-app paths that must start with "/".
    /// </summary>
    public static class NotificationLinkBuilder
    {
        public readonly struct NotificationLink
        {
            public NotificationLink(string link, string label)
            {
                Link = link;
                Label = label;
            }

            public string Link { get; }
            public string Label { get; }
        }

        public static NotificationLink ForTankStockEvent(int? siteId, int? tankId, string? eventType)
        {
            // Prefer a tank-scoped route when a tank is available, otherwise fall back to the
            // events dashboard so the user can still investigate.
            if (tankId.HasValue && tankId.Value > 0)
                return new NotificationLink($"/tanks/{tankId.Value}", "Open tank");
            if (siteId.HasValue && siteId.Value > 0)
                return new NotificationLink($"/active-events?siteId={siteId.Value}", "View events");
            return new NotificationLink("/active-events", "View events");
        }

        public static NotificationLink ForWarningLetterSignature(int warningLetterId)
            => new NotificationLink($"/warning-letters/{warningLetterId}/preview", "Review & sign");

        public static NotificationLink ForWarningLetterView(int warningLetterId)
            => new NotificationLink($"/reports/warning-letters/{warningLetterId}", "View warning letter");

        public static NotificationLink ForIssue(int issueTrackerId)
            => new NotificationLink($"/issues/{issueTrackerId}", "Open issue");

        // Vehicle trips do not currently have a per-trip detail route, so we link to the
        // trips list where the user can locate and respond to the trip.
        public static NotificationLink ForVehicleTrip(int? _tripId)
            => new NotificationLink("/vehicles/trips", "Open trips");

        public static NotificationLink ForVehicleTransfer(int transferId)
            => new NotificationLink($"/vehicles/transfers/{transferId}", "Open transfer");

        public static NotificationLink ForVehicleTransferReview(int transferId)
            => new NotificationLink($"/vehicles/transfers/{transferId}/review", "Review transfer");

        public static NotificationLink ForVehicleTransferReceive(int transferId)
            => new NotificationLink($"/vehicles/transfers/{transferId}/receive", "Receive transfer");

        public static NotificationLink ForActiveEvent(int? activeEventId)
        {
            if (activeEventId.HasValue && activeEventId.Value > 0)
                return new NotificationLink($"/active-events/{activeEventId.Value}", "View event");
            return new NotificationLink("/active-events", "View events");
        }
    }
}
