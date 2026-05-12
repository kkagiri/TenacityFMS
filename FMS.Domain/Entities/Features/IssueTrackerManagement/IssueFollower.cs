/**
 * File: IssueFollower.cs
 * Purpose: Tracks users who follow specific issues to receive activity notifications
 * Dependencies: FMS.Domain.Entities
 * Last Modified: 2026-02-05
 *
 * Key Properties:
 * - IssueId: Reference to the issue being followed
 * - UserId: User who is following the issue
 * - FollowedDate: When the user started following
 */
using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace FMS.Domain.Entities;

/// <summary>
/// Tracks which users are following which issues for activity notifications
/// </summary>
public class IssueFollower
{
    public int Id { get; set; }

    /// <summary>
    /// Reference to the issue being followed
    /// </summary>
    public int IssueId { get; set; }

    /// <summary>
    /// User ID who is following the issue
    /// </summary>
    public string UserId { get; set; } = null!;

    /// <summary>
    /// Username of the follower (denormalized for display)
    /// </summary>
    public string? UserName { get; set; }

    /// <summary>
    /// When the user started following this issue
    /// </summary>
    public DateTime FollowedDate { get; set; }

    /// <summary>
    /// Whether to receive email notifications for this issue
    /// </summary>
    public bool NotifyByEmail { get; set; } = true;

    /// <summary>
    /// Whether to receive push notifications for this issue
    /// </summary>
    public bool NotifyByPush { get; set; } = true;

    // Navigation properties
    [NotMapped]
    public virtual Issuetracker Issue { get; set; } = null!;

    [NotMapped]
    public virtual User User { get; set; } = null!;
}
