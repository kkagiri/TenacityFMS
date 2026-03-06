/**
 * File: GetAdminNotificationHistoryQuery.cs
 * Purpose: Query and handler to retrieve admin notification history with filtering and pagination.
 * Dependencies: MediatR, GpsdataContext, FMS.Application DTOs
 * Last Modified: 2026-03-05
 *
 * Key Types:
 * - GetAdminNotificationHistoryQuery: Encapsulates filter parameters for admin history retrieval.
 * - GetAdminNotificationHistoryQueryHandler: Queries notifications with filters and returns paginated results.
 */
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.Notification.DTOs;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FMS.Application.Features.Notification.Queries
{
    public class GetAdminNotificationHistoryQuery : IRequest<FMSResponse<AdminNotificationHistoryResultDto>>
    {
        public string? Type { get; set; }
        public string? Status { get; set; }
        public string? Category { get; set; }
        public string? Priority { get; set; }
        public int? SiteId { get; set; }
        public DateTime? FromDate { get; set; }
        public DateTime? ToDate { get; set; }
        public string? Search { get; set; }
        public int Skip { get; set; }
        public int Take { get; set; } = 100;
    }

    public class GetAdminNotificationHistoryQueryHandler
        : IRequestHandler<GetAdminNotificationHistoryQuery, FMSResponse<AdminNotificationHistoryResultDto>>
    {
        private readonly GpsdataContext _context;

        public GetAdminNotificationHistoryQueryHandler(GpsdataContext context)
        {
            _context = context;
        }

        public async Task<FMSResponse<AdminNotificationHistoryResultDto>> Handle(
            GetAdminNotificationHistoryQuery request,
            CancellationToken cancellationToken)
        {
            var safeTake = Math.Max(1, Math.Min(request.Take, 500));
            var safeSkip = Math.Max(0, request.Skip);

            var query = _context.Notifications
                .Include(n => n.Recipients)
                    .ThenInclude(r => r.User)
                .Include(n => n.Site)
                .Include(n => n.Tank)
                .Include(n => n.Vehicle)
                .Include(n => n.PtsDevice)
                .Include(n => n.NotificationPolicy)
                .Include(n => n.NotificationCategory)
                .AsQueryable();

            if (!string.IsNullOrEmpty(request.Type))
                query = query.Where(n => n.Type == request.Type);

            if (!string.IsNullOrEmpty(request.Status))
                query = query.Where(n => n.Status == request.Status);

            if (!string.IsNullOrEmpty(request.Category))
                query = query.Where(n => n.Category == request.Category);

            if (!string.IsNullOrEmpty(request.Priority))
                query = query.Where(n => n.Priority == request.Priority);

            if (request.SiteId.HasValue)
                query = query.Where(n => n.SiteId == request.SiteId.Value);

            if (request.FromDate.HasValue)
                query = query.Where(n => n.CreatedAt >= request.FromDate.Value);

            if (request.ToDate.HasValue)
                query = query.Where(n => n.CreatedAt <= request.ToDate.Value);

            if (!string.IsNullOrEmpty(request.Search))
                query = query.Where(n =>
                    n.Title.Contains(request.Search) ||
                    n.Message.Contains(request.Search) ||
                    n.NotificationId.Contains(request.Search));

            var totalCount = await query.CountAsync(cancellationToken);

            var notifications = await query
                .OrderByDescending(n => n.CreatedAt)
                .Skip(safeSkip)
                .Take(safeTake)
                .Select(n => new AdminNotificationHistoryDto
                {
                    Id = n.Id,
                    NotificationId = n.NotificationId,
                    Type = n.Type,
                    Category = n.Category,
                    Priority = n.Priority,
                    Title = n.Title,
                    Message = n.Message,
                    HtmlBody = null,
                    Data = n.Data,
                    Status = n.Status,
                    TriggerSource = n.TriggerSource,
                    TriggeredBy = n.TriggeredBy,
                    CreatedAt = n.CreatedAt,
                    SentAt = n.SentAt,
                    SendAttempts = n.SendAttempts,
                    ErrorMessage = n.ErrorMessage,
                    SiteName = n.Site != null ? n.Site.Name : null,
                    TankName = n.Tank != null ? n.Tank.Name : null,
                    VehicleName = n.Vehicle != null ? n.Vehicle.HyoungNo : null,
                    PtsDeviceName = n.PtsDevice != null ? n.PtsDevice.Ptsid : null,
                    PolicyName = n.NotificationPolicy != null ? n.NotificationPolicy.Name : null,
                    CategoryName = n.NotificationCategory != null ? n.NotificationCategory.Name : null,
                    RecipientCount = n.Recipients.Count,
                    DeliveredCount = n.Recipients.Count(r => r.DeliveryStatus == "Delivered" || r.DeliveryStatus == "Sent"),
                    FailedCount = n.Recipients.Count(r => r.DeliveryStatus == "Failed"),
                    Recipients = n.Recipients.Select(r => new AdminNotificationRecipientDto
                    {
                        UserId = r.UserId,
                        UserName = r.User != null ? r.User.UserName : null,
                        Email = r.User != null ? r.User.Email : r.UserId,
                        DeliveryMethod = r.DeliveryMethod,
                        DeliveryStatus = r.DeliveryStatus,
                        IsRead = r.IsRead,
                        IsAcknowledged = r.IsAcknowledged,
                        ReadAt = r.ReadAt,
                        DeliveredAt = r.DeliveredAt
                    }).ToList()
                })
                .ToListAsync(cancellationToken);

            var result = new AdminNotificationHistoryResultDto
            {
                Items = notifications,
                TotalCount = totalCount,
                Skip = safeSkip,
                Take = safeTake
            };

            return FMSResponse<AdminNotificationHistoryResultDto>.Success(
                result,
                $"Retrieved {notifications.Count} of {totalCount} notifications");
        }
    }
}
