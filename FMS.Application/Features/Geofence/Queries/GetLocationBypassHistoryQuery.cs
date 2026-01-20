using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.Geofence.DTOs;
using FMS.Domain.Entities.Features.LocationValidation;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.Geofence.Queries;

/// <summary>
/// Query to get location bypass history (including expired and cancelled bypasses)
/// </summary>
public class GetLocationBypassHistoryQuery : IRequest<FMSResponse<LocationBypassHistoryResponseDTO>>
{
    /// <summary>
    /// Filter by bypass type: 'All', 'Vehicle', 'User' (null for all types)
    /// </summary>
    public string? BypassType { get; set; }

    /// <summary>
    /// Filter by specific vehicle ID
    /// </summary>
    public int? VehicleId { get; set; }

    /// <summary>
    /// Filter by specific user ID
    /// </summary>
    public string? UserId { get; set; }

    /// <summary>
    /// Filter by active status (null for all, true for active, false for inactive/expired/cancelled)
    /// </summary>
    public bool? IsActive { get; set; }

    /// <summary>
    /// Filter by start date (bypasses enabled on or after this date)
    /// </summary>
    public DateTime? StartDate { get; set; }

    /// <summary>
    /// Filter by end date (bypasses enabled on or before this date)
    /// </summary>
    public DateTime? EndDate { get; set; }

    /// <summary>
    /// Filter by enabled by (user who enabled the bypass)
    /// </summary>
    public string? EnabledBy { get; set; }

    /// <summary>
    /// Page number for pagination (1-based)
    /// </summary>
    public int PageNumber { get; set; } = 1;

    /// <summary>
    /// Page size for pagination
    /// </summary>
    public int PageSize { get; set; } = 50;
}

/// <summary>
/// Handler for GetLocationBypassHistoryQuery
/// </summary>
public class GetLocationBypassHistoryQueryHandler : IRequestHandler<GetLocationBypassHistoryQuery, FMSResponse<LocationBypassHistoryResponseDTO>>
{
    private readonly GpsdataContext _context;
    private readonly ILogger<GetLocationBypassHistoryQueryHandler> _logger;

    public GetLocationBypassHistoryQueryHandler(
        GpsdataContext context,
        ILogger<GetLocationBypassHistoryQueryHandler> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<FMSResponse<LocationBypassHistoryResponseDTO>> Handle(
        GetLocationBypassHistoryQuery request,
        CancellationToken cancellationToken)
    {
        try
        {
            var query = _context.LocationValidationBypasses
                .Include(b => b.Vehicle)
                .AsQueryable();

            // Apply filters
            if (!string.IsNullOrEmpty(request.BypassType))
            {
                query = query.Where(b => b.BypassType == request.BypassType);
            }

            if (request.VehicleId.HasValue)
            {
                query = query.Where(b => b.VehicleId == request.VehicleId.Value);
            }

            if (!string.IsNullOrEmpty(request.UserId))
            {
                query = query.Where(b => b.UserId == request.UserId);
            }

            if (request.IsActive.HasValue)
            {
                var now = DateTime.UtcNow;
                if (request.IsActive.Value)
                {
                    // Active: IsActive=true, not cancelled, and not expired
                    query = query.Where(b =>
                        b.IsActive &&
                        b.CancelledAt == null &&
                        (!b.ExpiresAt.HasValue || b.ExpiresAt > now));
                }
                else
                {
                    // Inactive: cancelled, expired, or IsActive=false
                    query = query.Where(b =>
                        !b.IsActive ||
                        b.CancelledAt != null ||
                        (b.ExpiresAt.HasValue && b.ExpiresAt <= now));
                }
            }

            if (request.StartDate.HasValue)
            {
                query = query.Where(b => b.EnabledAt >= request.StartDate.Value);
            }

            if (request.EndDate.HasValue)
            {
                query = query.Where(b => b.EnabledAt <= request.EndDate.Value);
            }

            if (!string.IsNullOrEmpty(request.EnabledBy))
            {
                query = query.Where(b => b.EnabledBy != null &&
                    b.EnabledBy.Contains(request.EnabledBy));
            }

            // Get total count before pagination
            var totalCount = await query.CountAsync(cancellationToken);

            // Order by most recent first and apply pagination
            var bypasses = await query
                .OrderByDescending(b => b.EnabledAt)
                .Skip((request.PageNumber - 1) * request.PageSize)
                .Take(request.PageSize)
                .ToListAsync(cancellationToken);

            // Map to DTOs
            var items = bypasses.Select(b => new LocationBypassHistoryDTO
            {
                Id = b.Id,
                BypassType = b.BypassType,
                VehicleId = b.VehicleId,
                VehicleName = b.Vehicle?.NumberPlate ?? b.Vehicle?.HyoungNo,
                VehicleHyoungNo = b.Vehicle?.HyoungNo,
                UserId = b.UserId,
                UserName = null, // User lookup would require join to users table
                IsActive = b.IsActive,
                ExpiresAt = b.ExpiresAt,
                Reason = b.Reason,
                EnabledBy = b.EnabledBy,
                EnabledAt = b.EnabledAt,
                CancelledBy = b.CancelledBy,
                CancelledAt = b.CancelledAt,
                Notes = b.Notes
            }).ToList();

            var response = new LocationBypassHistoryResponseDTO
            {
                Items = items,
                TotalCount = totalCount,
                PageNumber = request.PageNumber,
                PageSize = request.PageSize
            };

            return FMSResponse<LocationBypassHistoryResponseDTO>.Success(
                response,
                $"Retrieved {items.Count} of {totalCount} bypass records");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting location bypass history");
            return FMSResponse<LocationBypassHistoryResponseDTO>.Failed(
                $"Failed to get bypass history: {ex.Message}");
        }
    }
}
