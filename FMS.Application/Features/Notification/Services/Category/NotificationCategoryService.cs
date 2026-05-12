using System;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Features.Notification.Enums;
using FMS.Domain.Entities.Features.Notifications;
using FMS.Persistence.DataAccess;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.Notification.Services {
    public class NotificationCategoryService : INotificationCategoryService {
        private readonly GpsdataContext _context;
        private readonly IMemoryCache _cache;
        private readonly ILogger<NotificationCategoryService> _logger;

        public NotificationCategoryService (GpsdataContext context, IMemoryCache cache, ILogger<NotificationCategoryService> logger) {
            _context = context;
            _cache = cache;
            _logger = logger;
        }

        public async Task<NotificationCategory?> GetCategoryAsync (WellKnownCategories category, CancellationToken cancellationToken = default) {
            var categoryName = category.ToString ();
            return await GetCategoryByNameAsync (categoryName, cancellationToken);
        }

        public async Task<NotificationCategory?> GetCategoryByNameAsync (string categoryName, CancellationToken cancellationToken = default) {
            var cacheKey = $"notification_category_{categoryName}";

            if (_cache.TryGetValue (cacheKey, out NotificationCategory? cachedCategory)) {
                return cachedCategory;
            }

            var category = await _context.NotificationCategories
                .FirstOrDefaultAsync (c => c.Name == categoryName && c.IsActive, cancellationToken);

            if (category != null) {
                _cache.Set (cacheKey, category, TimeSpan.FromMinutes (30));
            }

            return category;
        }

        public async Task<int?> GetCategoryIdAsync (WellKnownCategories category, CancellationToken cancellationToken = default) {
            var categoryEntity = await GetCategoryAsync (category, cancellationToken);
            return categoryEntity?.Id;
        }

        public async Task<NotificationCategory?> GetCategoryByIdAsync (int categoryId, CancellationToken cancellationToken = default) {
            var cacheKey = $"notification_category_id_{categoryId}";

            if (_cache.TryGetValue (cacheKey, out NotificationCategory? cachedCategory)) {
                return cachedCategory;
            }

            var category = await _context.NotificationCategories
                .FirstOrDefaultAsync (c => c.Id == categoryId && c.IsActive, cancellationToken);

            if (category != null) {
                _cache.Set (cacheKey, category, TimeSpan.FromMinutes (30));
            }

            return category;
        }
    }
}