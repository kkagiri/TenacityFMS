/**
 * File: GetVehicleConsumptionRecordDetailQuery.cs
 * Purpose: Retrieves a single raw vehicle consumption row with vehicle and site context for drill-down details.
 * Dependencies: GpsdataContext, VehicleConsumptionRecordDetailDto, MediatR, EF Core
 * Last Modified: 2026-04-20
 */
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
    public record GetVehicleConsumptionRecordDetailQuery(int ConsumptionId) : IRequest<VehicleConsumptionRecordDetailDto?>;

    public class GetVehicleConsumptionRecordDetailQueryHandler
        : IRequestHandler<GetVehicleConsumptionRecordDetailQuery, VehicleConsumptionRecordDetailDto?>
    {
        private readonly GpsdataContext _context;
        private readonly ILogger<GetVehicleConsumptionRecordDetailQueryHandler> _logger;

        public GetVehicleConsumptionRecordDetailQueryHandler(
            GpsdataContext context,
            ILogger<GetVehicleConsumptionRecordDetailQueryHandler> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<VehicleConsumptionRecordDetailDto?> Handle(
            GetVehicleConsumptionRecordDetailQuery request,
            CancellationToken cancellationToken)
        {
            var record = await _context.Vehicleconsumptions
                .AsNoTracking()
                .Include(item => item.Site)
                .Include(item => item.Vehicle)
                    .ThenInclude(vehicle => vehicle.VehicleType)
                .Include(item => item.Vehicle)
                    .ThenInclude(vehicle => vehicle.VehicleManufacturer)
                .Include(item => item.Vehicle)
                    .ThenInclude(vehicle => vehicle.VehicleModel)
                .Include(item => item.Vehicle)
                    .ThenInclude(vehicle => vehicle.EmployeeVehicles)
                        .ThenInclude(employeeVehicle => employeeVehicle.Employee)
                .FirstOrDefaultAsync(item => item.Id == request.ConsumptionId, cancellationToken);

            if (record == null)
            {
                _logger.LogWarning("Vehicle consumption record {ConsumptionId} was not found", request.ConsumptionId);
                return null;
            }

            string assignedEmployeeName = string.Empty;

            if (record.Vehicle.DefaultEmployeeId.HasValue)
            {
                assignedEmployeeName = await _context.Employees
                    .AsNoTracking()
                    .Where(employee => employee.Id == record.Vehicle.DefaultEmployeeId.Value)
                    .Select(employee => employee.FullName)
                    .FirstOrDefaultAsync(cancellationToken) ?? string.Empty;
            }

            if (string.IsNullOrWhiteSpace(assignedEmployeeName))
            {
                assignedEmployeeName = record.Vehicle.EmployeeVehicles
                    .Where(employeeVehicle => employeeVehicle.Employee != null)
                    .Select(employeeVehicle => employeeVehicle.Employee)
                    .OrderBy(employee => employee!.FullName)
                    .Select(employee => employee!.FullName)
                    .FirstOrDefault() ?? string.Empty;
            }

            return new VehicleConsumptionRecordDetailDto
            {
                Id = record.Id,
                VehicleId = record.VehicleId,
                VehicleCode = record.Vehicle.VehicleCode ?? string.Empty,
                NumberPlate = record.Vehicle.NumberPlate ?? string.Empty,
                VehicleTypeName = record.Vehicle.VehicleType != null ? record.Vehicle.VehicleType.Name : "Unknown",
                VehicleModelName = record.Vehicle.VehicleModel != null ? record.Vehicle.VehicleModel.Name : string.Empty,
                ManufacturerName = record.Vehicle.VehicleManufacturer != null ? record.Vehicle.VehicleManufacturer.Name : string.Empty,
                SiteId = record.SiteId,
                SiteName = record.Site != null ? record.Site.Name : "Unknown",
                Date = record.Date,
                SourceDriverName = record.EmployeeName ?? string.Empty,
                AssignedEmployeeName = assignedEmployeeName,
                ExpectedAverage = record.ExpectedConsumption ?? 0m,
                ActualEfficiency = record.FuelEfficiency ?? 0m,
                TotalFuel = record.TotalFuel ?? 0m,
                FuelLost = record.FuelLost ?? 0m,
                TotalDistance = record.TotalDistance ?? 0m,
                EngineHours = record.EngHours ?? 0m,
                MaxSpeed = record.MaxSpeed ?? 0m,
                AvgSpeed = record.AvgSpeed ?? 0m,
                FlowMeterFuelUsed = record.FlowMeterFuelUsed ?? 0m,
                FlowMeterFuelLost = record.FlowMeterFuelLost ?? 0m,
                FlowMeterEfficiency = record.FlowMeterEffiency ?? 0m,
                FlowMeterEngineHours = record.FlowMeterEngineHrs ?? 0m,
                ReportReference = record.ReportId ?? string.Empty,
                Comments = record.Comments ?? string.Empty,
                IsKmPerLiter = record.IsKmperLiter == 1,
                IsModified = record.IsModified.HasValue && record.IsModified.Value != 0,
                ModifiedDate = record.ModifiedDate
            };
        }
    }
}