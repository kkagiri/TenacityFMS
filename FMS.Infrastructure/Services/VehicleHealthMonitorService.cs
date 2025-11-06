using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.Vehicle.DTOs;
using FMS.Application.Features.Vehicle.Services;
using FMS.Domain.Entities.VehicleTracking;
using FMS.Persistence.DataAccess;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Infrastructure.Services
{
    public class VehicleHealthMonitorService : IVehicleHealthMonitorService
    {
        private readonly GpsdataContext _context;
        private readonly ILogger<VehicleHealthMonitorService> _logger;

        public VehicleHealthMonitorService(
            GpsdataContext context,
            ILogger<VehicleHealthMonitorService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<FMSResponse<VehicleHealthMonitorDTO>> RecordHealthCheckAsync(
            int vehicleId, bool isOnline, decimal? latitude = null, decimal? longitude = null, string? address = null)
        {
            try
            {
                var vehicle = await _context.Vehicles.FindAsync(vehicleId);
                if (vehicle == null)
                    return FMSResponse<VehicleHealthMonitorDTO>.Failed("Vehicle not found");

                // Get latest health record
                var latestHealth = await _context.VehicleHealthMonitors
                    .Where(h => h.VehicleId == vehicleId)
                    .OrderByDescending(h => h.CheckedAt)
                    .FirstOrDefaultAsync();

                var now = DateTime.UtcNow;
                var healthRecord = new VehicleHealthMonitorEntity
                {
                    VehicleId = vehicleId,
                    CheckedAt = now,
                    IsOnline = isOnline,
                    LastKnownLatitude = latitude,
                    LastKnownLongitude = longitude,
                    LastKnownAddress = address,
                    CreatedAt = now
                };

                if (isOnline)
                {
                    healthRecord.LastOnlineAt = now;
                    healthRecord.OfflineDuration = latestHealth?.LastOfflineAt.HasValue == true
                        ? now - latestHealth.LastOfflineAt.Value
                        : null;
                }
                else
                {
                    healthRecord.LastOfflineAt = now;
                    healthRecord.LastOnlineAt = latestHealth?.LastOnlineAt;

                    // Calculate offline duration
                    if (latestHealth?.LastOnlineAt.HasValue == true)
                        healthRecord.OfflineDuration = now - latestHealth.LastOnlineAt.Value;

                    // Preserve offline reason and location if previously set
                    if (latestHealth != null && !latestHealth.IsOnline)
                    {
                        healthRecord.OfflineReason = latestHealth.OfflineReason;
                        healthRecord.PermanentLocation = latestHealth.PermanentLocation;
                        healthRecord.WorkingSiteId = latestHealth.WorkingSiteId;
                        healthRecord.IssueTrackingId = latestHealth.IssueTrackingId;
                    }
                }

                _context.VehicleHealthMonitors.Add(healthRecord);
                await _context.SaveChangesAsync();

                return FMSResponse<VehicleHealthMonitorDTO>.Success(MapToDTO(healthRecord, vehicle));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error recording health check for vehicle {VehicleId}", vehicleId);
                return FMSResponse<VehicleHealthMonitorDTO>.Failed($"Error recording health check: {ex.Message}");
            }
        }

        public async Task<FMSResponse<VehicleHealthMonitorDTO>> UpdateOfflineStatusAsync(
            UpdateVehicleOfflineStatusRequest request, string updatedBy)
        {
            try
            {
                var vehicle = await _context.Vehicles.FindAsync(request.VehicleId);
                if (vehicle == null)
                    return FMSResponse<VehicleHealthMonitorDTO>.Failed("Vehicle not found");

                // Get latest health record
                var latestHealth = await _context.VehicleHealthMonitors
                    .Where(h => h.VehicleId == request.VehicleId)
                    .OrderByDescending(h => h.CheckedAt)
                    .FirstOrDefaultAsync();

                if (latestHealth == null)
                    return FMSResponse<VehicleHealthMonitorDTO>.Failed("No health record found for vehicle");

                // Update offline status
                latestHealth.OfflineReason = request.OfflineReason;
                latestHealth.PermanentLocation = request.PermanentLocation;
                latestHealth.WorkingSiteId = request.WorkingSiteId;
                latestHealth.Notes = request.Notes;
                latestHealth.IssueTrackingId = request.IssueTrackingId;
                latestHealth.UpdatedBy = updatedBy;
                latestHealth.UpdatedAt = DateTime.UtcNow;

                // Update vehicle.WorkingSite if provided
                if (request.WorkingSiteId.HasValue)
                {
                    vehicle.WorkingSite = request.WorkingSiteId.Value;
                }

                await _context.SaveChangesAsync();

                return FMSResponse<VehicleHealthMonitorDTO>.Success(MapToDTO(latestHealth, vehicle));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating offline status for vehicle {VehicleId}", request.VehicleId);
                return FMSResponse<VehicleHealthMonitorDTO>.Failed($"Error updating offline status: {ex.Message}");
            }
        }

        public async Task<FMSResponse<VehicleHealthMonitorDTO>> GetLatestHealthStatusAsync(int vehicleId)
        {
            try
            {
                var health = await _context.VehicleHealthMonitors
                    .Where(h => h.VehicleId == vehicleId)
                    .OrderByDescending(h => h.CheckedAt)
                    .FirstOrDefaultAsync();

                if (health == null)
                    return FMSResponse<VehicleHealthMonitorDTO>.Failed("No health record found");

                var vehicle = await _context.Vehicles.FindAsync(vehicleId);

                return FMSResponse<VehicleHealthMonitorDTO>.Success(MapToDTO(health, vehicle!));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting latest health status for vehicle {VehicleId}", vehicleId);
                return FMSResponse<VehicleHealthMonitorDTO>.Failed($"Error: {ex.Message}");
            }
        }

        public async Task<FMSResponse<List<VehicleHealthMonitorDTO>>> GetHealthHistoryAsync(
            int vehicleId, DateTime from, DateTime to)
        {
            try
            {
                var vehicle = await _context.Vehicles.FindAsync(vehicleId);
                if (vehicle == null)
                    return FMSResponse<List<VehicleHealthMonitorDTO>>.Failed("Vehicle not found");

                var history = await _context.VehicleHealthMonitors
                    .Where(h => h.VehicleId == vehicleId && h.CheckedAt >= from && h.CheckedAt <= to)
                    .OrderByDescending(h => h.CheckedAt)
                    .ToListAsync();

                var dtos = history.Select(h => MapToDTO(h, vehicle)).ToList();

                return FMSResponse<List<VehicleHealthMonitorDTO>>.Success(dtos);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting health history for vehicle {VehicleId}", vehicleId);
                return FMSResponse<List<VehicleHealthMonitorDTO>>.Failed($"Error: {ex.Message}");
            }
        }

        public async Task<FMSResponse<List<VehicleHealthMonitorDTO>>> GetOfflineVehiclesAsync()
        {
            try
            {
                // Get latest health record for each vehicle
                var latestHealthRecords = await _context.VehicleHealthMonitors
                    .GroupBy(h => h.VehicleId)
                    .Select(g => g.OrderByDescending(h => h.CheckedAt).FirstOrDefault())
                    .Where(h => h != null && !h.IsOnline)
                    .ToListAsync();

                var vehicleIds = latestHealthRecords.Select(h => h!.VehicleId).ToList();
                var vehicles = await _context.Vehicles
                    .Where(v => vehicleIds.Contains(v.VehicleId))
                    .ToDictionaryAsync(v => v.VehicleId);

                var dtos = latestHealthRecords
                    .Where(h => vehicles.ContainsKey(h!.VehicleId))
                    .Select(h => MapToDTO(h!, vehicles[h!.VehicleId]))
                    .ToList();

                return FMSResponse<List<VehicleHealthMonitorDTO>>.Success(dtos);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting offline vehicles");
                return FMSResponse<List<VehicleHealthMonitorDTO>>.Failed($"Error: {ex.Message}");
            }
        }

        public async Task<FMSResponse<List<VehicleHealthMonitorDTO>>> GetLongTermOfflineVehiclesAsync(int hoursThreshold = 24)
        {
            try
            {
                var threshold = DateTime.UtcNow.AddHours(-hoursThreshold);

                var latestHealthRecords = await _context.VehicleHealthMonitors
                    .GroupBy(h => h.VehicleId)
                    .Select(g => g.OrderByDescending(h => h.CheckedAt).FirstOrDefault())
                    .Where(h => h != null && !h.IsOnline && h.LastOfflineAt <= threshold)
                    .ToListAsync();

                var vehicleIds = latestHealthRecords.Select(h => h!.VehicleId).ToList();
                var vehicles = await _context.Vehicles
                    .Where(v => vehicleIds.Contains(v.VehicleId))
                    .ToDictionaryAsync(v => v.VehicleId);

                var dtos = latestHealthRecords
                    .Where(h => vehicles.ContainsKey(h!.VehicleId))
                    .Select(h => MapToDTO(h!, vehicles[h!.VehicleId]))
                    .ToList();

                return FMSResponse<List<VehicleHealthMonitorDTO>>.Success(dtos);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting long-term offline vehicles");
                return FMSResponse<List<VehicleHealthMonitorDTO>>.Failed($"Error: {ex.Message}");
            }
        }

        public async Task<FMSResponse<List<VehicleHealthMonitorDTO>>> GetVehiclesByOfflineReasonAsync(string offlineReason)
        {
            try
            {
                var latestHealthRecords = await _context.VehicleHealthMonitors
                    .GroupBy(h => h.VehicleId)
                    .Select(g => g.OrderByDescending(h => h.CheckedAt).FirstOrDefault())
                    .Where(h => h != null && !h.IsOnline && h.OfflineReason == offlineReason)
                    .ToListAsync();

                var vehicleIds = latestHealthRecords.Select(h => h!.VehicleId).ToList();
                var vehicles = await _context.Vehicles
                    .Where(v => vehicleIds.Contains(v.VehicleId))
                    .ToDictionaryAsync(v => v.VehicleId);

                var dtos = latestHealthRecords
                    .Where(h => vehicles.ContainsKey(h!.VehicleId))
                    .Select(h => MapToDTO(h!, vehicles[h!.VehicleId]))
                    .ToList();

                return FMSResponse<List<VehicleHealthMonitorDTO>>.Success(dtos);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting vehicles by offline reason");
                return FMSResponse<List<VehicleHealthMonitorDTO>>.Failed($"Error: {ex.Message}");
            }
        }

        public async Task<FMSResponse<bool>> UpdatePermanentLocationAsync(
            int vehicleId, string location, int? workingSiteId, string updatedBy)
        {
            try
            {
                var latestHealth = await _context.VehicleHealthMonitors
                    .Where(h => h.VehicleId == vehicleId)
                    .OrderByDescending(h => h.CheckedAt)
                    .FirstOrDefaultAsync();

                if (latestHealth == null)
                    return FMSResponse<bool>.Failed("No health record found");

                latestHealth.PermanentLocation = location;
                latestHealth.WorkingSiteId = workingSiteId;
                latestHealth.UpdatedBy = updatedBy;
                latestHealth.UpdatedAt = DateTime.UtcNow;

                // Update vehicle.WorkingSite
                if (workingSiteId.HasValue)
                {
                    var vehicle = await _context.Vehicles.FindAsync(vehicleId);
                    if (vehicle != null)
                    {
                        vehicle.WorkingSite = workingSiteId.Value;
                    }
                }

                await _context.SaveChangesAsync();

                return FMSResponse<bool>.Success(true);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating permanent location for vehicle {VehicleId}", vehicleId);
                return FMSResponse<bool>.Failed($"Error: {ex.Message}");
            }
        }

        public async Task<FMSResponse<bool>> LinkToIssueTrackingAsync(int vehicleId, int issueTrackingId, string updatedBy)
        {
            try
            {
                var latestHealth = await _context.VehicleHealthMonitors
                    .Where(h => h.VehicleId == vehicleId)
                    .OrderByDescending(h => h.CheckedAt)
                    .FirstOrDefaultAsync();

                if (latestHealth == null)
                    return FMSResponse<bool>.Failed("No health record found");

                latestHealth.IssueTrackingId = issueTrackingId;
                latestHealth.UpdatedBy = updatedBy;
                latestHealth.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                return FMSResponse<bool>.Success(true);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error linking to issue tracking for vehicle {VehicleId}", vehicleId);
                return FMSResponse<bool>.Failed($"Error: {ex.Message}");
            }
        }

        #region Helper Methods

        private VehicleHealthMonitorDTO MapToDTO(VehicleHealthMonitorEntity entity, Domain.Entities.Vehicle vehicle)
        {
            return new VehicleHealthMonitorDTO
            {
                Id = entity.Id,
                VehicleId = entity.VehicleId,
                VehicleName = vehicle.HyoungNo ?? string.Empty,
                NumberPlate = vehicle.NumberPlate ?? string.Empty,
                IsOnline = entity.IsOnline,
                LastOnlineAt = entity.LastOnlineAt,
                LastOfflineAt = entity.LastOfflineAt,
                OfflineDuration = entity.OfflineDuration,
                OfflineReason = entity.OfflineReason,
                PermanentLocation = entity.PermanentLocation,
                WorkingSiteId = entity.WorkingSiteId,
                LastKnownLatitude = entity.LastKnownLatitude,
                LastKnownLongitude = entity.LastKnownLongitude,
                LastKnownAddress = entity.LastKnownAddress,
                IssueTrackingId = entity.IssueTrackingId,
                Notes = entity.Notes,
                CheckedAt = entity.CheckedAt
            };
        }

        #endregion
    }
}
