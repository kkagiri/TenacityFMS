using System;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Features.Notification.Enums;
using FMS.Domain.Entities;

namespace FMS.Application.Features.Notification.Services {
    public interface INotificationCategoryService {
        Task<NotificationCategory?> GetCategoryAsync (WellKnownCategories category, CancellationToken cancellationToken = default);
        Task<NotificationCategory?> GetCategoryByNameAsync (string categoryName, CancellationToken cancellationToken = default);
        Task<int?> GetCategoryIdAsync (WellKnownCategories category, CancellationToken cancellationToken = default);
        Task<NotificationCategory?> GetCategoryByIdAsync (int categoryId, CancellationToken cancellationToken = default);
    }
}