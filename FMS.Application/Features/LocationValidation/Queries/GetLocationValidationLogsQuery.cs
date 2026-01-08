using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.LocationValidation.DTOs;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.LocationValidation.Queries;

/// <summary>
/// Query to get paginated list of location validation logs
/// </summary>
public record GetLocationValidationLogsQuery(LocationValidationLogFilter Filter)
    : IRequest<FMSResponse<LocationValidationLogPagedResponse>>;

/// <summary>
/// Handler for GetLocationValidationLogsQuery
/// </summary>
public class GetLocationValidationLogsQueryHandler
    : IRequestHandler<GetLocationValidationLogsQuery, FMSResponse<LocationValidationLogPagedResponse>>
{
    private readonly GpsdataContext _context;
    private readonly ILogger<GetLocationValidationLogsQueryHandler> _logger;

    public GetLocationValidationLogsQueryHandler(
        GpsdataContext context,
        ILogger<GetLocationValidationLogsQueryHandler> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<FMSResponse<LocationValidationLogPagedResponse>> Handle(
        GetLocationValidationLogsQuery request,
        CancellationToken cancellationToken)
    {
        try
        {
            var filter = request.Filter;

            // Start with base query
            var query = _context.LocationValidationLogs.AsNoTracking();

            // Apply filters
            if (filter.StartDate.HasValue)
            {
                query = query.Where(l => l.ValidationTime >= filter.StartDate.Value);
            }

            if (filter.EndDate.HasValue)
            {
                query = query.Where(l => l.ValidationTime <= filter.EndDate.Value);
            }

            if (!string.IsNullOrEmpty(filter.PtsId))
            {
                query = query.Where(l => l.PtsId == filter.PtsId);
            }

            if (filter.TankId.HasValue)
            {
                query = query.Where(l => l.TankId == filter.TankId.Value);
            }

            if (filter.VehicleId.HasValue)
            {
                query = query.Where(l => l.VehicleId == filter.VehicleId.Value);
            }

            if (filter.IsValid.HasValue)
            {
                query = query.Where(l => l.IsValid == filter.IsValid.Value);
            }

            if (!string.IsNullOrEmpty(filter.ValidationResult))
            {
                query = query.Where(l => l.ValidationResult == filter.ValidationResult);
            }

            // Get total count before pagination
            var totalCount = await query.CountAsync(cancellationToken);

            // Apply ordering and pagination
            var logs = await query
                .OrderByDescending(l => l.ValidationTime)
                .Skip((filter.PageNumber - 1) * filter.PageSize)
                .Take(filter.PageSize)
                .ToListAsync(cancellationToken);

            // Get related entity names for display
            var tankIds = logs.Where(l => l.TankId > 0).Select(l => l.TankId).Distinct().ToList();
            var vehicleIds = logs.Where(l => l.VehicleId.HasValue).Select(l => l.VehicleId!.Value).Distinct().ToList();
            var userIds = logs.Where(l => !string.IsNullOrEmpty(l.UserId)).Select(l => l.UserId!).Distinct().ToList();

            var tanks = await _context.Tanks
                .Where(t => tankIds.Contains(t.Id))
                .Select(t => new { t.Id, t.Name })
                .ToDictionaryAsync(t => t.Id, t => t.Name, cancellationToken);

            var vehicles = await _context.Vehicles
                .Where(v => vehicleIds.Contains(v.VehicleId))
                .Select(v => new { v.VehicleId, v.HyoungNo })
                .ToDictionaryAsync(v => v.VehicleId, v => v.HyoungNo, cancellationToken);

            var users = await _context.Users
                .Where(u => userIds.Contains(u.Id))
                .Select(u => new { u.Id, u.UserName })
                .ToDictionaryAsync(u => u.Id, u => u.UserName, cancellationToken);

            // Map to DTOs
            var items = logs.Select(l => new LocationValidationLogDto
            {
                Id = l.Id,
                ValidationTime = l.ValidationTime,
                PtsId = l.PtsId,
                TankId = l.TankId,
                TankName = tanks.TryGetValue(l.TankId, out var tankName) ? tankName : null,
                VehicleId = l.VehicleId,
                VehicleName = l.VehicleId.HasValue && vehicles.TryGetValue(l.VehicleId.Value, out var vehicleName) ? vehicleName : null,
                TankType = l.TankType.ToString(),
                TankLatitude = l.TankLatitude,
                TankLongitude = l.TankLongitude,
                TankLocationSource = l.TankLocationSource,
                VehicleLatitude = l.VehicleLatitude,
                VehicleLongitude = l.VehicleLongitude,
                VehicleGPSAccuracy = l.VehicleGPSAccuracy,
                VehicleDistanceMeters = l.VehicleDistanceMeters,
                VehicleProximityRequired = l.VehicleProximityRequired,
                VehicleProximityValid = l.VehicleProximityValid,
                MobileLatitude = l.MobileLatitude,
                MobileLongitude = l.MobileLongitude,
                MobileAccuracy = l.MobileAccuracy,
                MobileDistanceMeters = l.MobileDistanceMeters,
                MobileProximityRequired = l.MobileProximityRequired,
                MobileProximityValid = l.MobileProximityValid,
                MinimumGPSAccuracyRequired = l.MinimumGPSAccuracyRequired,
                GPSAccuracyValid = l.GPSAccuracyValid,
                IsValid = l.IsValid,
                ValidationResult = l.ValidationResult,
                FailureReason = l.FailureReason,
                VehicleRadiusUsed = l.VehicleRadiusUsed,
                MobileRadiusUsed = l.MobileRadiusUsed,
                GracePeriodMetersUsed = l.GracePeriodMetersUsed,
                WasBypassedDueToGPSFailure = l.WasBypassedDueToGPSFailure,
                UserId = l.UserId,
                UserName = !string.IsNullOrEmpty(l.UserId) && users.TryGetValue(l.UserId, out var userName) ? userName : null,
                TransactionId = l.TransactionId
            }).ToList();

            var response = new LocationValidationLogPagedResponse
            {
                Items = items,
                TotalCount = totalCount,
                PageNumber = filter.PageNumber,
                PageSize = filter.PageSize
            };

            return FMSResponse<LocationValidationLogPagedResponse>.Success(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving location validation logs");
            return FMSResponse<LocationValidationLogPagedResponse>.Failed("Error retrieving location validation logs");
        }
    }
}

/// <summary>
/// Query to get a single location validation log by ID
/// </summary>
public record GetLocationValidationLogByIdQuery(int Id) : IRequest<FMSResponse<LocationValidationLogDto>>;

/// <summary>
/// Handler for GetLocationValidationLogByIdQuery
/// </summary>
public class GetLocationValidationLogByIdQueryHandler
    : IRequestHandler<GetLocationValidationLogByIdQuery, FMSResponse<LocationValidationLogDto>>
{
    private readonly GpsdataContext _context;
    private readonly ILogger<GetLocationValidationLogByIdQueryHandler> _logger;

    public GetLocationValidationLogByIdQueryHandler(
        GpsdataContext context,
        ILogger<GetLocationValidationLogByIdQueryHandler> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<FMSResponse<LocationValidationLogDto>> Handle(
        GetLocationValidationLogByIdQuery request,
        CancellationToken cancellationToken)
    {
        try
        {
            var log = await _context.LocationValidationLogs
                .AsNoTracking()
                .FirstOrDefaultAsync(l => l.Id == request.Id, cancellationToken);

            if (log == null)
            {
                return FMSResponse<LocationValidationLogDto>.NotFound($"Location validation log with ID {request.Id} not found");
            }

            // Get related entity names
            var tankName = await _context.Tanks
                .Where(t => t.Id == log.TankId)
                .Select(t => t.Name)
                .FirstOrDefaultAsync(cancellationToken);

            string? vehicleName = null;
            if (log.VehicleId.HasValue)
            {
                vehicleName = await _context.Vehicles
                    .Where(v => v.VehicleId == log.VehicleId.Value)
                    .Select(v => v.HyoungNo)
                    .FirstOrDefaultAsync(cancellationToken);
            }

            string? userName = null;
            if (!string.IsNullOrEmpty(log.UserId))
            {
                userName = await _context.Users
                    .Where(u => u.Id == log.UserId)
                    .Select(u => u.UserName)
                    .FirstOrDefaultAsync(cancellationToken);
            }

            var dto = new LocationValidationLogDto
            {
                Id = log.Id,
                ValidationTime = log.ValidationTime,
                PtsId = log.PtsId,
                TankId = log.TankId,
                TankName = tankName,
                VehicleId = log.VehicleId,
                VehicleName = vehicleName,
                TankType = log.TankType.ToString(),
                TankLatitude = log.TankLatitude,
                TankLongitude = log.TankLongitude,
                TankLocationSource = log.TankLocationSource,
                VehicleLatitude = log.VehicleLatitude,
                VehicleLongitude = log.VehicleLongitude,
                VehicleGPSAccuracy = log.VehicleGPSAccuracy,
                VehicleDistanceMeters = log.VehicleDistanceMeters,
                VehicleProximityRequired = log.VehicleProximityRequired,
                VehicleProximityValid = log.VehicleProximityValid,
                MobileLatitude = log.MobileLatitude,
                MobileLongitude = log.MobileLongitude,
                MobileAccuracy = log.MobileAccuracy,
                MobileDistanceMeters = log.MobileDistanceMeters,
                MobileProximityRequired = log.MobileProximityRequired,
                MobileProximityValid = log.MobileProximityValid,
                MinimumGPSAccuracyRequired = log.MinimumGPSAccuracyRequired,
                GPSAccuracyValid = log.GPSAccuracyValid,
                IsValid = log.IsValid,
                ValidationResult = log.ValidationResult,
                FailureReason = log.FailureReason,
                VehicleRadiusUsed = log.VehicleRadiusUsed,
                MobileRadiusUsed = log.MobileRadiusUsed,
                GracePeriodMetersUsed = log.GracePeriodMetersUsed,
                WasBypassedDueToGPSFailure = log.WasBypassedDueToGPSFailure,
                UserId = log.UserId,
                UserName = userName,
                TransactionId = log.TransactionId
            };

            return FMSResponse<LocationValidationLogDto>.Success(dto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving location validation log {Id}", request.Id);
            return FMSResponse<LocationValidationLogDto>.Failed("Error retrieving location validation log");
        }
    }
}
