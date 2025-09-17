using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Queries.Database.FMSQuery.VehicleQuery;
using FMS.Domain.Entities.Features.FuelRule;
using FMS.Domain.Entities.Features.FuelRule.Rules;
using MediatR;
using FMS.Application.Features.Vehicle.DTOs;
using FMS.Application.Features.Vehicle.Queries;

namespace FMS.Application.Features.FuelTagManagement.FuelingTags.Queries
{

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
        public decimal DailyRemaining => DailyLimit - DailyUsed;
        public decimal MonthlyRemaining => MonthlyLimit - MonthlyUsed;
        public decimal MaxAllowedDose => Math.Min (DailyRemaining, MonthlyRemaining);
    }

    public record ValidateVehicleQuery (int VehicleId, double? RequestedDose = null) : IRequest<VehicleValidationResultDTO>;

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

                //Cursor: Vehicle MUST have fuel rules to be allowed to fuel - administrator must set rules first
                if (fuelRules == null || !fuelRules.Any ()) {
                    return new VehicleValidationResultDTO {
                    IsValid = false,
                    Message = "Vehicle has no fuel rules configured. Administrator must set fuel rules before vehicle can be used for fueling.",
                    VehicleInfo = new VehicleFuelInfoDTO {
                    VehicleId = vehicle.VehicleId,
                    HyoungNo = vehicle.HyoungNo,
                    DailyUsed = dailyFuelIssued,
                    DailyLimit = 0,
                    MonthlyUsed = monthlyFuelIssued,
                    MonthlyLimit = 0
                    }
                    };
                }

                //Cursor: Get actual limits from fuel rules (no default values)
                decimal? dailyLimit = null;
                decimal? monthlyLimit = null;

                var dailyMonthlyRule = fuelRules?.OfType<DailyMonthlyLimitRule> ().FirstOrDefault ();
                if (dailyMonthlyRule != null) {
                    dailyLimit = dailyMonthlyRule.DailyLimitLiter;
                    monthlyLimit = dailyMonthlyRule.MonthlyLimitLiter;
                }

                //Cursor: Vehicle must have at least one limit configured
                if (!dailyLimit.HasValue && !monthlyLimit.HasValue) {
                    return new VehicleValidationResultDTO {
                        IsValid = false,
                            Message = "Vehicle fuel rules are configured but no daily or monthly limits are set. Administrator must configure proper limits.",
                            VehicleInfo = new VehicleFuelInfoDTO {
                                VehicleId = vehicle.VehicleId,
                                HyoungNo = vehicle.HyoungNo,
                                DailyUsed = dailyFuelIssued,
                                DailyLimit = 0,
                                MonthlyUsed = monthlyFuelIssued,
                                MonthlyLimit = 0
                                }
                    };
                }

                //Cursor: Use configured limits or max value if not set
                var effectiveDailyLimit = dailyLimit ?? decimal.MaxValue;
                var effectiveMonthlyLimit = monthlyLimit ?? decimal.MaxValue;

                bool isDailyLimitExceeded = dailyFuelIssued >= effectiveDailyLimit;
                bool isMonthlyLimitExceeded = monthlyFuelIssued >= effectiveMonthlyLimit;

                var vehicleFuelInfo = new VehicleFuelInfoDTO {
                    VehicleId = vehicle.VehicleId,
                    HyoungNo = vehicle.HyoungNo,
                    DailyUsed = dailyFuelIssued,
                    DailyLimit = effectiveDailyLimit,
                    MonthlyUsed = monthlyFuelIssued,
                    MonthlyLimit = effectiveMonthlyLimit
                };

                if (isDailyLimitExceeded) {
                    return new VehicleValidationResultDTO {
                        IsValid = false,
                            Message = $"Daily fuel limit exceeded. Used: {dailyFuelIssued:F2}L, Limit: {effectiveDailyLimit:F2}L",
                            VehicleInfo = vehicleFuelInfo
                    };
                }

                if (isMonthlyLimitExceeded) {
                    return new VehicleValidationResultDTO {
                        IsValid = false,
                            Message = $"Monthly fuel limit exceeded. Used: {monthlyFuelIssued:F2}L, Limit: {effectiveMonthlyLimit:F2}L",
                            VehicleInfo = vehicleFuelInfo
                    };
                }

                //Cursor: Check if requested dose would exceed remaining limits
                if (request.RequestedDose.HasValue && request.RequestedDose.Value > 0) {
                    var requestedDose = (decimal) request.RequestedDose.Value;
                    var dailyRemaining = effectiveDailyLimit - dailyFuelIssued;
                    var monthlyRemaining = effectiveMonthlyLimit - monthlyFuelIssued;
                    var maxAllowedDose = Math.Min (dailyRemaining, monthlyRemaining);

                    if (requestedDose > maxAllowedDose) {
                        return new VehicleValidationResultDTO {
                            IsValid = false,
                                Message = $"Requested dose ({requestedDose:F2}L) exceeds remaining limit. Maximum allowed: {maxAllowedDose:F2}L (Daily remaining: {dailyRemaining:F2}L, Monthly remaining: {monthlyRemaining:F2}L)",
                                VehicleInfo = vehicleFuelInfo
                        };
                    }
                }

                // Vehicle is valid and within limits
                return new VehicleValidationResultDTO {
                    IsValid = true,
                        Message = "Vehicle is valid.",
                        VehicleInfo = vehicleFuelInfo
                };
            } catch (Exception ex) {
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