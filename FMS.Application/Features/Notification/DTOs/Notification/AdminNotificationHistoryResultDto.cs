/**
 * File: AdminNotificationHistoryResultDto.cs
 * Purpose: Paginated result DTO for admin notification history queries.
 * Dependencies: System.Collections.Generic
 * Last Modified: 2026-03-05
 *
 * Key Types:
 * - AdminNotificationHistoryResultDto: Wraps items, totalCount, skip, take for grid pagination.
 */
using System.Collections.Generic;

namespace FMS.Application.Features.Notification.DTOs
{
    public class AdminNotificationHistoryResultDto
    {
        public List<AdminNotificationHistoryDto> Items { get; set; } = new();
        public int TotalCount { get; set; }
        public int Skip { get; set; }
        public int Take { get; set; }
    }
}
