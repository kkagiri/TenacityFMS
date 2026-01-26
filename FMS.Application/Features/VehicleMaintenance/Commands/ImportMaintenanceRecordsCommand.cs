/**
 * File: ImportMaintenanceRecordsCommand.cs
 * Purpose: Imports maintenance records and persists them with vehicle matching.
 * Dependencies: GpsdataContext, MediatR, EF Core, FMSResponse
 * Last Modified: 2026-01-26
 *
 * Key Classes:
 * - ImportMaintenanceRecordsCommand: Command payload for bulk import
 * - ImportMaintenanceRecordsCommandHandler: Handles validation and persistence
 */
using AutoMapper;
using FMS.Application.Common;
using FMS.Application.Features.VehicleMaintenance.DTOs;
using DomainVehicle = FMS.Domain.Entities.Vehicle;
using DomainVehicleMaintenance = FMS.Domain.Entities.Features.VehicleManagement.VehicleMaintenance;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace FMS.Application.Features.VehicleMaintenance.Commands;

public record ImportMaintenanceRecordsCommand(List<MaintenanceImportDTO> ImportRecords)
    : IRequest<FMSResponse<MaintenanceImportResultDTO>>;

public class ImportMaintenanceRecordsCommandHandler
    : IRequestHandler<ImportMaintenanceRecordsCommand, FMSResponse<MaintenanceImportResultDTO>>
{
    private readonly GpsdataContext _context;
    private readonly IMapper _mapper;
    private readonly ILogger<ImportMaintenanceRecordsCommandHandler> _logger;

    public ImportMaintenanceRecordsCommandHandler(
        GpsdataContext context,
        IMapper mapper,
        ILogger<ImportMaintenanceRecordsCommandHandler> logger)
    {
        _context = context;
        _mapper = mapper;
        _logger = logger;
    }

    public async Task<FMSResponse<MaintenanceImportResultDTO>> Handle(
        ImportMaintenanceRecordsCommand request,
        CancellationToken cancellationToken)
    {
        var result = new MaintenanceImportResultDTO();
        var validStatuses = new[] { "Scheduled", "In Progress", "Completed", "Cancelled" };

        try
        {
            _logger.LogInformation("Starting import of {Count} maintenance records", request.ImportRecords.Count);

            // Get all vehicles for matching by HyoungNo
            var vehicleNumbers = request.ImportRecords
                .Select(r => r.VehicleNumber.Trim().ToLower())
                .Distinct()
                .ToList();

            var vehicles = await _context.Vehicles
                .Where(v => vehicleNumbers.Contains(v.HyoungNo.ToLower()) ||
                           vehicleNumbers.Contains(v.NumberPlate.ToLower()))
                .ToDictionaryAsync(
                    v => v.HyoungNo.ToLower(),
                    v => v,
                    cancellationToken);

            // Also index by number plate
            var vehiclesByPlate = await _context.Vehicles
                .Where(v => vehicleNumbers.Contains(v.NumberPlate.ToLower()))
                .ToDictionaryAsync(
                    v => v.NumberPlate.ToLower(),
                    v => v,
                    cancellationToken);

            var maintenanceRecords = new List<DomainVehicleMaintenance>();

            foreach (var importRecord in request.ImportRecords)
            {
                try
                {
                    // Find vehicle by HyoungNo or NumberPlate
                    var vehicleKey = importRecord.VehicleNumber.Trim().ToLower();
                    DomainVehicle? vehicle = null;

                    if (vehicles.TryGetValue(vehicleKey, out var v1))
                    {
                        vehicle = v1;
                    }
                    else if (vehiclesByPlate.TryGetValue(vehicleKey, out var v2))
                    {
                        vehicle = v2;
                    }

                    if (vehicle == null)
                    {
                        result.Errors.Add(new MaintenanceImportErrorDTO
                        {
                            RowNumber = importRecord.RowNumber,
                            VehicleNumber = importRecord.VehicleNumber,
                            Message = $"Vehicle '{importRecord.VehicleNumber}' not found"
                        });
                        result.Failed++;
                        continue;
                    }

                    // Validate status
                    var status = validStatuses.FirstOrDefault(s =>
                        s.Equals(importRecord.Status, StringComparison.OrdinalIgnoreCase))
                        ?? "Scheduled";

                    // Validate priority
                    var priority = importRecord.Priority;
                    if (priority < 1 || priority > 5)
                    {
                        priority = 2; // Default to Normal
                    }

                    // Create maintenance record
                    var maintenance = new DomainVehicleMaintenance
                    {
                        VehicleId = vehicle.VehicleId,
                        MaintenanceType = string.IsNullOrWhiteSpace(importRecord.MaintenanceType)
                            ? "General Repair"
                            : importRecord.MaintenanceType,
                        Status = status,
                        ScheduledDate = importRecord.ScheduledDate,
                        Priority = priority,
                        Description = importRecord.Description,
                        Notes = importRecord.Notes,
                        DateCreated = DateTime.UtcNow,
                        DateModified = DateTime.UtcNow,
                        IsOverdue = false
                    };

                    maintenanceRecords.Add(maintenance);
                    result.Imported++;
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Error processing import record for row {RowNumber}", importRecord.RowNumber);
                    result.Errors.Add(new MaintenanceImportErrorDTO
                    {
                        RowNumber = importRecord.RowNumber,
                        VehicleNumber = importRecord.VehicleNumber,
                        Message = ex.Message
                    });
                    result.Failed++;
                }
            }

            // Bulk insert valid records
            if (maintenanceRecords.Count > 0)
            {
                await _context.Set<DomainVehicleMaintenance>()
                    .AddRangeAsync(maintenanceRecords, cancellationToken);
                await _context.SaveChangesAsync(cancellationToken);

                _logger.LogInformation("Successfully imported {Count} maintenance records", maintenanceRecords.Count);
            }

            var message = result.Failed > 0
                ? $"Imported {result.Imported} records with {result.Failed} failures"
                : $"Successfully imported {result.Imported} maintenance records";

            return FMSResponse<MaintenanceImportResultDTO>.Success(result, message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error importing maintenance records");
            return FMSResponse<MaintenanceImportResultDTO>.Failed($"Error importing maintenance records: {ex.Message}");
        }
    }
}
