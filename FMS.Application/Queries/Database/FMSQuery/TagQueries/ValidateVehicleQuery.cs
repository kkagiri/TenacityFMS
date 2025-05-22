using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.ModelsDTOs.FMS.Vehicle;
using FMS.Application.Queries.Database.FMSQuery.VehicleQuery;
using FMS.Application.Queries.Database.PTSQueries.TagQueries;
using FMS.Domain.Entities.Features.FuelRule.Rules;
using MediatR;

namespace FMS.Application.Queries.Database.FMSQuery.TagQueries {

    public class VehicleValidationResultDTO {
        public bool IsValid { get; set; }
        public string Message { get; set; }
        public VehicleFuelInfoDTO VehicleInfo { get; set; }
    }

    public class VehicleFuelInfoDTO {
        public int VehicleId { get; set; }

        public string HyoungNo { get; set; }
        public decimal DailyUsed { get; set; }
        public decimal DailyLimit { get; set; }
        public decimal MonthlyUsed { get; set; }
        public decimal MonthlyLimit { get; set; }
    }

    public record ValidateVehicleQuery (int VehicleId) : IRequest<VehicleValidationResultDTO>;

    public class ValidateVehicleQueryHandler : IRequestHandler<ValidateVehicleQuery, VehicleValidationResultDTO> {
        private readonly IMediator _mediator;

        public ValidateVehicleQueryHandler (IMediator mediator) {
            _mediator = mediator;
        }

        public async Task<VehicleValidationResultDTO> Handle (ValidateVehicleQuery request, CancellationToken cancellationToken) {
            try {
                var vehicle = await _mediator.Send (new GetVehicleByIDQuery (request.VehicleId), cancellationToken);
                if (vehicle == null) {
                    return new VehicleValidationResultDTO {
                    IsValid = false,
                    Message = $"Vehicle with ID {request.VehicleId} not found.",
                    VehicleInfo = null
                    };
                }

                // Check fuel limits by fetching rules associated with the vehicle
                var currentDate = DateTime.UtcNow;
                var dailyFuelIssued = await _mediator.Send (new GetDailyFuelIssuedForVehicleQuery (request.VehicleId, currentDate), cancellationToken);
                var monthlyFuelIssued = await _mediator.Send (new GetMonthlyFuelIssuedForVehicleQuery (request.VehicleId, currentDate), cancellationToken);

                // Fetch fuel rules for the vehicle
                var fuelRules = await _mediator.Send (new GetFuelRulesForVehicleQuery (request.VehicleId), cancellationToken);
                decimal dailyLimit = 50; // Default value
                decimal monthlyLimit = 500; // Default value

                var dailyMonthlyRule = fuelRules?.OfType<DailyMonthlyLimitRule> ().FirstOrDefault ();
                if (dailyMonthlyRule != null) {
                    dailyLimit = dailyMonthlyRule.DailyLimitLiter ?? dailyLimit;
                    monthlyLimit = dailyMonthlyRule.MonthlyLimitLiter ?? monthlyLimit;
                }

                bool isDailyLimitExceeded = dailyFuelIssued >= dailyLimit;
                bool isMonthlyLimitExceeded = monthlyFuelIssued >= monthlyLimit;

                var vehicleFuelInfo = new VehicleFuelInfoDTO {
                    VehicleId = vehicle.VehicleId,
                    HyoungNo = vehicle.HyoungNo,
                    DailyUsed = dailyFuelIssued,
                    DailyLimit = dailyLimit,
                    MonthlyUsed = monthlyFuelIssued,
                    MonthlyLimit = monthlyLimit
                };

                if (isDailyLimitExceeded) {
                    return new VehicleValidationResultDTO {
                        IsValid = false,
                            Message = "Daily fuel limit exceeded",
                            VehicleInfo = vehicleFuelInfo
                    };
                }

                if (isMonthlyLimitExceeded) {
                    return new VehicleValidationResultDTO {
                        IsValid = false,
                            Message = "Monthly fuel limit exceeded",
                            VehicleInfo = vehicleFuelInfo
                    };
                }

                // Vehicle is valid and within limits
                return new VehicleValidationResultDTO {
                    IsValid = true,
                        Message = "Vehicle is valid.",
                        VehicleInfo = vehicleFuelInfo
                };
            } catch (System.Exception ex) {
                // Consider more specific exception handling
                return new VehicleValidationResultDTO {
                    IsValid = false,
                        Message = $"An error occurred during validation: {ex.Message}",
                        VehicleInfo = null
                };
            }
        }
    }
}