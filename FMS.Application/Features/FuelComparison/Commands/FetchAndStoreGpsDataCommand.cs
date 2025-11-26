using MediatR;
using FMS.Application.Common;
using System;
using System.Collections.Generic;

namespace FMS.Application.Features.FuelComparison.Commands;

/// <summary>
/// Command to fetch GPS data from GPSGate Report 212 and store in gpsgate_report_entries.
/// This orchestrates the entire workflow: login, generate report, poll status, process, save.
/// </summary>
public record FetchAndStoreGpsDataCommand(
    DateTime StartDate,
    DateTime EndDate,
    string JobId
) : IRequest<FMSResponse<GpsFetchResultDto>>;

/// <summary>
/// Result DTO containing summary of GPS fetch operation.
/// </summary>
public class GpsFetchResultDto
{
    public int TotalRecordsFetched { get; set; }
    public int NewRecordsSaved { get; set; }
    public int RecordsUpdated { get; set; }
    public int DuplicatesSkipped { get; set; }
    public int UnmappedVehiclesCount { get; set; }
    public DateTime FetchStartTime { get; set; }
    public DateTime FetchEndTime { get; set; }
    public string? ReportHandleId { get; set; }

    /// <summary>
    /// List of GPSGate vehicle names that have no mapping in vehicle_provider_mappings table.
    /// User should go to Admin/Provider Configuration to create mappings for these vehicles.
    /// </summary>
    public List<string> UnmappedVehicles { get; set; } = new();
}
