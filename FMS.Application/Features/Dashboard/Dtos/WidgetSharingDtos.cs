using System;
using System.Collections.Generic;

namespace FMS.Application.Features.Dashboard
{
    /// <summary>
    /// Request to share a widget with other users
    /// </summary>
    public class ShareWidgetRequestDto
    {
        /// <summary>
        /// The widget instance ID to share
        /// </summary>
        public int WidgetInstanceId { get; set; }

        /// <summary>
        /// List of user IDs to share the widget with
        /// </summary>
        public List<string> TargetUserIds { get; set; } = new List<string>();

        /// <summary>
        /// Optional: Allow shared users to edit widget parameters
        /// Default: true (as per requirements)
        /// </summary>
        public bool AllowEdit { get; set; } = true;
    }

    /// <summary>
    /// Response after sharing a widget
    /// </summary>
    public class ShareWidgetResponseDto
    {
        /// <summary>
        /// Original widget instance ID
        /// </summary>
        public int OriginalWidgetId { get; set; }

        /// <summary>
        /// List of successfully shared instances
        /// </summary>
        public List<SharedWidgetInstanceDto> SharedInstances { get; set; } = new List<SharedWidgetInstanceDto>();

        /// <summary>
        /// List of failed shares
        /// </summary>
        public List<ShareFailureDto> Failures { get; set; } = new List<ShareFailureDto>();

        /// <summary>
        /// Total count of successful shares
        /// </summary>
        public int SuccessCount => SharedInstances.Count;

        /// <summary>
        /// Total count of failed shares
        /// </summary>
        public int FailureCount => Failures.Count;
    }

    /// <summary>
    /// Information about a shared widget instance
    /// </summary>
    public class SharedWidgetInstanceDto
    {
        /// <summary>
        /// New widget instance ID created for the shared user
        /// </summary>
        public int WidgetInstanceId { get; set; }

        /// <summary>
        /// User ID who received the shared widget
        /// </summary>
        public string UserId { get; set; } = null!;

        /// <summary>
        /// User's display name or email
        /// </summary>
        public string UserDisplayName { get; set; } = null!;

        /// <summary>
        /// When the widget was shared
        /// </summary>
        public DateTime SharedAt { get; set; }

        /// <summary>
        /// Can the shared user edit parameters
        /// </summary>
        public bool CanEdit { get; set; }

        /// <summary>
        /// Can the shared user delete (always false for shared widgets)
        /// </summary>
        public bool CanDelete { get; set; }
    }

    /// <summary>
    /// Information about a failed share attempt
    /// </summary>
    public class ShareFailureDto
    {
        /// <summary>
        /// User ID that the share failed for
        /// </summary>
        public string UserId { get; set; } = null!;

        /// <summary>
        /// Reason for failure
        /// </summary>
        public string Reason { get; set; } = null!;
    }

    /// <summary>
    /// Request to unshare (remove) a shared widget
    /// </summary>
    public class UnshareWidgetRequestDto
    {
        /// <summary>
        /// The shared widget instance ID to remove
        /// </summary>
        public int SharedWidgetInstanceId { get; set; }
    }

    /// <summary>
    /// Extended widget instance DTO with sharing information
    /// </summary>
    public class DashboardWidgetInstanceWithSharingDto : DashboardWidgetInstanceDto
    {
        /// <summary>
        /// Is this widget shared from another user
        /// </summary>
        public bool IsShared { get; set; }

        /// <summary>
        /// Original owner's user ID (if shared)
        /// </summary>
        public string? SharedFromUserId { get; set; }

        /// <summary>
        /// Original owner's display name (if shared)
        /// </summary>
        public string? SharedFromUserName { get; set; }

        /// <summary>
        /// Original widget instance ID (if shared)
        /// </summary>
        public int? SharedFromWidgetId { get; set; }

        /// <summary>
        /// Can edit widget parameters
        /// </summary>
        public bool CanEdit { get; set; }

        /// <summary>
        /// Can delete widget
        /// </summary>
        public bool CanDelete { get; set; }

        /// <summary>
        /// When this widget was shared (if shared)
        /// </summary>
        public DateTime? SharedAt { get; set; }

        /// <summary>
        /// List of users this widget has been shared with (if original owner)
        /// </summary>
        public List<SharedWithUserDto>? SharedWithUsers { get; set; }
    }

    /// <summary>
    /// Information about users a widget has been shared with
    /// </summary>
    public class SharedWithUserDto
    {
        /// <summary>
        /// User ID
        /// </summary>
        public string UserId { get; set; } = null!;

        /// <summary>
        /// User's display name or email
        /// </summary>
        public string UserDisplayName { get; set; } = null!;

        /// <summary>
        /// Shared widget instance ID
        /// </summary>
        public int SharedWidgetInstanceId { get; set; }

        /// <summary>
        /// When shared
        /// </summary>
        public DateTime SharedAt { get; set; }

        /// <summary>
        /// Can the user edit
        /// </summary>
        public bool CanEdit { get; set; }
    }
}
