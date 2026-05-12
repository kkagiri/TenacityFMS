/**
 * File: IssueFollowerDTO.cs
 * Purpose: DTOs for issue follower operations
 * Dependencies: None
 * Last Modified: 2026-02-05
 */
using System;
using System.Collections.Generic;

namespace FMS.Application.Features.IssueTracker.DTOs
{
    /// <summary>
    /// DTO for representing an issue follower
    /// </summary>
    public class IssueFollowerDTO
    {
        public int Id { get; set; }
        public int IssueId { get; set; }
        public string UserId { get; set; } = null!;
        public string? UserName { get; set; }
        public DateTime FollowedDate { get; set; }
        public bool NotifyByEmail { get; set; }
        public bool NotifyByPush { get; set; }
    }

    /// <summary>
    /// DTO for follow/unfollow request
    /// </summary>
    public class FollowIssueRequestDTO
    {
        public int IssueId { get; set; }
        public bool NotifyByEmail { get; set; } = true;
        public bool NotifyByPush { get; set; } = true;
    }

    /// <summary>
    /// DTO for checking if user is following an issue
    /// </summary>
    public class IsFollowingResponseDTO
    {
        public bool IsFollowing { get; set; }
        public int? FollowerId { get; set; }
        public DateTime? FollowedDate { get; set; }
    }

    /// <summary>
    /// DTO for followed issue summary (for dashboard ticker)
    /// </summary>
    public class FollowedIssueSummaryDTO
    {
        public int IssueId { get; set; }
        public string? IssueNumber { get; set; }
        public string? Title { get; set; }
        public string? Status { get; set; }
        public string? Priority { get; set; }
        public DateTime? DueDate { get; set; }
        public string? AssignedTo { get; set; }
        public int RecentActivityCount { get; set; }
        public DateTime? LastActivityDate { get; set; }
        public string? LastActivityDescription { get; set; }
    }
}
