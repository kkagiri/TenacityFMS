/**
 * File: GetVehicleConsumptionModuleGridQuery.cs
 * Purpose: Retrieves raw vehicle consumption rows for the vehicle consumption module grid.
 * Dependencies: GpsdataContext, VehicleConsumptionGridItemDto, MediatR, EF Core
 * Last Modified: 2026-04-20
 */
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Features.Vehicle.DTOs;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Queries.Database.FMSQuery.Consumption
{
    public record GetVehicleConsumptionModuleGridQuery(
        DateTime StartDate,
        DateTime EndDate,
        int? VehicleTypeId = null,
        int? VehicleId = null,
        int? SiteId = null,
        List<int>? SiteIds = null,
        bool? AverageKmL = null
    ) : IRequest<List<VehicleConsumptionGridItemDto>>;

    public class GetVehicleConsumptionModuleGridQueryHandler
        : IRequestHandler<GetVehicleConsumptionModuleGridQuery, List<VehicleConsumptionGridItemDto>>
    {
        private readonly GpsdataContext _context;
        private readonly ILogger<GetVehicleConsumptionModuleGridQueryHandler> _logger;

        public GetVehicleConsumptionModuleGridQueryHandler(
            GpsdataContext context,
            ILogger<GetVehicleConsumptionModuleGridQueryHandler> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<List<VehicleConsumptionGridItemDto>> Handle(
            GetVehicleConsumptionModuleGridQuery request,
            CancellationToken cancellationToken)
        {
            var adjustedEndDate = request.EndDate.Date.AddDays(1).AddTicks(-1);

            var query = _context.Vehicleconsumptions
                .AsNoTracking()
                .Include(record => record.Site)
                .Include(record => record.Vehicle)
                    .ThenInclude(vehicle => vehicle.VehicleType)
                .Where(record => record.Date >= request.StartDate.Date && record.Date <= adjustedEndDate)
                .AsQueryable();

            var siteIds = (request.SiteIds ?? new List<int>())
                .Where(id => id > 0)
                .Distinct()
                .ToList();

            if (request.SiteId.HasValue && request.SiteId.Value > 0 && !siteIds.Contains(request.SiteId.Value))
            {
                siteIds.Add(request.SiteId.Value);
            }

            if (siteIds.Count > 0)
            {
                query = query.Where(record => siteIds.Contains(record.SiteId));
            }

            if (request.VehicleTypeId.HasValue && request.VehicleTypeId.Value > 0)
            {
                query = query.Where(record => record.Vehicle.VehicleTypeId == request.VehicleTypeId.Value);
            }

            if (request.VehicleId.HasValue && request.VehicleId.Value > 0)
            {
                query = query.Where(record => record.VehicleId == request.VehicleId.Value);
            }

            if (request.AverageKmL.HasValue)
            {
                var isKmPerLiterValue = request.AverageKmL.Value ? (ulong)1 : (ulong)0;
                query = query.Where(record => record.IsKmperLiter == isKmPerLiterValue);
            }

            var results = await query
                .OrderByDescending(record => record.Date)
                .ThenBy(record => record.Vehicle.VehicleCode)
                .Select(record => new VehicleConsumptionGridItemDto
                {
                    Id = record.Id,
                    VehicleId = record.VehicleId,
                    VehicleCode = record.Vehicle.VehicleCode ?? string.Empty,
                    NumberPlate = record.Vehicle.NumberPlate ?? string.Empty,
                    VehicleTypeId = record.Vehicle.VehicleTypeId ?? 0,
                    VehicleTypeName = record.Vehicle.VehicleType != null ? record.Vehicle.VehicleType.Name : "Unknown",
                    SiteId = record.SiteId,
                    SiteName = record.Site != null ? record.Site.Name : "Unknown",
                    Date = record.Date,
                    EmployeeName = record.EmployeeName ?? string.Empty,
                    ExpectedAverage = record.ExpectedConsumption ?? 0m,
                    ActualEfficiency = record.FuelEfficiency ?? 0m,
                    TotalFuel = record.TotalFuel ?? 0m,
                    FuelLost = record.FuelLost ?? 0m,
                    TotalDistance = record.TotalDistance ?? 0m,
                    EngineHours = record.EngHours ?? 0m,
                    MaxSpeed = record.MaxSpeed ?? 0m,
                    AvgSpeed = record.AvgSpeed ?? 0m,
                    ReportReference = record.ReportId ?? string.Empty,
                    Comments = record.Comments ?? string.Empty,
                    IsKmPerLiter = record.IsKmperLiter == 1
                })
                .ToListAsync(cancellationToken);

            _logger.LogInformation(
                "Vehicle consumption module grid query returned {Count} records for {StartDate} to {EndDate}",
                results.Count,
                request.StartDate,
                request.EndDate);

            return results;
        }
    }
}