/**
 * File: IIssueActivityService.cs
 * Purpose: Interface for issue activity logging service
 * Dependencies: FMS.Application.Features.IssueTracker.DTOs
 * Last Modified: 2026-02-05
 */
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Features.IssueTracker.DTOs;

namespace FMS.Application.Features.IssueTracker.Services
{
    /// <summary>
    /// Service interface for tracking and logging issue activities
    /// </summary>
    public interface IIssueActivityService
    {
        /// <summary>
        /// Logs a generic activity for an issue
        /// </summary>
        Task LogActivityAsync(
            int issueId,
            string activityType,
            string description,
            string performedByUserId,
            string? performedByUserName = null,
            string? fieldName = null,
            string? oldValue = null,
            string? newValue = null,
            string? metadata = null,
            CancellationToken cancellationToken = default);

        /// <summary>
        /// Logs issue creation
        /// </summary>
        Task LogIssueCreatedAsync(
            int issueId,
            string performedByUserId,
            string performedByUserName,
            CancellationToken cancellationToken = default);

        /// <summary>
        /// Logs a field change on an issue
        /// </summary>
        Task LogFieldChangeAsync(
            int issueId,
            string fieldName,
            string? oldValue,
            string? newValue,
            string performedByUserId,
            string performedByUserName,
            CancellationToken cancellationToken = default);

        /// <summary>
        /// Logs status change
        /// </summary>
        Task LogStatusChangeAsync(
            int issueId,
            string? oldStatus,
            string? newStatus,
            string performedByUserId,
            string performedByUserName,
            CancellationToken cancellationToken = default);

        /// <summary>
        /// Logs priority change
        /// </summary>
        Task LogPriorityChangeAsync(
            int issueId,
            string? oldPriority,
            string? newPriority,
            string performedByUserId,
            string performedByUserName,
            CancellationToken cancellationToken = default);

        /// <summary>
        /// Logs assignment change
        /// </summary>
        Task LogAssignmentChangeAsync(
            int issueId,
            string? oldAssignee,
            string? newAssignee,
            string performedByUserId,
            string performedByUserName,
            CancellationToken cancellationToken = default);

        /// <summary>
        /// Logs reminder set
        /// </summary>
        Task LogReminderSetAsync(
            int issueId,
            string reminderType,
            string performedByUserId,
            string performedByUserName,
            CancellationToken cancellationToken = default);

        /// <summary>
        /// Logs tags update
        /// </summary>
        Task LogTagsUpdateAsync(
            int issueId,
            string? oldTags,
            string? newTags,
            string performedByUserId,
            string performedByUserName,
            CancellationToken cancellationToken = default);

        /// <summary>
        /// Gets all activities for an issue
        /// </summary>
        Task<List<IssueActivityLogDTO>> GetActivitiesForIssueAsync(
            int issueId,
            CancellationToken cancellationToken = default);

        /// <summary>
        /// Gets recent activities for an issue (limited count)
        /// </summary>
        Task<List<IssueActivityLogDTO>> GetRecentActivitiesAsync(
            int issueId,
            int count = 10,
            CancellationToken cancellationToken = default);
    }
}
