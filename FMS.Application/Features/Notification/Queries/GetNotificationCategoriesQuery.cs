using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.Notification.DTOs;
using FMS.Persistence;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.Notification.Queries {
    /// <summary>
    /// Query to get all notification categories
    /// </summary>
    public class GetNotificationCategoriesQuery : IRequest<FMSResponse<List<NotificationCategoryDto>>> {
        public bool IncludeInactive { get; set; } = false;
    }

    public class GetNotificationCategoriesQueryHandler : IRequestHandler<GetNotificationCategoriesQuery, FMSResponse<List<NotificationCategoryDto>>> {
        private readonly GpsdataContext _context;
        private readonly ILogger<GetNotificationCategoriesQueryHandler> _logger;

        public GetNotificationCategoriesQueryHandler (
            GpsdataContext context,
            ILogger<GetNotificationCategoriesQueryHandler> logger) {
            _context = context;
            _logger = logger;
        }

        public async Task<FMSResponse<List<NotificationCategoryDto>>> Handle (GetNotificationCategoriesQuery query, CancellationToken cancellationToken) {
            try {
                var queryable = _context.NotificationCategories.AsQueryable ();

                if (!query.IncludeInactive) {
                    queryable = queryable.Where (c => c.IsActive);
                }

                var categories = await queryable
                    .OrderBy (c => c.DisplayOrder)
                    .ThenBy (c => c.Name)
                    .ToListAsync (cancellationToken);

                var result = categories.Select (c => new NotificationCategoryDto {
                    Id = c.Id,
                        Name = c.Name,
                        Description = c.Description,
                        DefaultPriority = c.DefaultPriority,
                        IsActive = c.IsActive,
                        DisplayOrder = c.DisplayOrder,
                        IconClass = c.IconClass,
                        DefaultRequireAcknowledgment = c.DefaultRequireAcknowledgment,
                        DefaultDeliveryMethods = c.DefaultDeliveryMethods.Split (',', StringSplitOptions.RemoveEmptyEntries).ToList ()
                }).ToList ();

                return FMSResponse<List<NotificationCategoryDto>>.Success (result,
                    $"Retrieved {result.Count} notification categories");
            } catch (Exception ex) {
                _logger.LogError (ex, "Error retrieving notification categories");
                return FMSResponse<List<NotificationCategoryDto>>.Failed ("Failed to retrieve notification categories");
            }
        }
    }
}