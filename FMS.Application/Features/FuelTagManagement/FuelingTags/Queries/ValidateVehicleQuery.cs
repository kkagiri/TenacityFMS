using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Features.FuelTagManagement.FuelingRules.Services;
using FMS.Domain.Entities;
using FMS.Domain.Entities.Features.FuelRule;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FMS.Application.Features.FuelTagManagement.FuelingTags.Queries
{

    public class VehicleValidationResultDTO
    {
        public bool IsValid { get; set; }
        public string Message { get; set; }
        public VehicleFuelInfoDTO VehicleInfo { get; set; }

        // Indicates if no rules are configured (admin needs to set them)
        public bool HasNoRules { get; set; }
    }

    public class VehicleFuelInfoDTO
    {
        public int VehicleId { get; set; }
        public string HyoungNo { get; set; }
        public string NumberPlate { get; set; } // Vehicle number plate
        public bool IsCompanyVehicle { get; set; } // Company vehicle flag

        // Hard Limits (Physics-based)
        public decimal TankCapacity { get; set; }
        public decimal? CurrentFuelLevel { get; set; }  // From GPS sensor if available
        public decimal HardLimit { get; set; }  // Tank capacity - current fuel (or just tank capacity if no sensor)
        public bool HasGpsFuelSensor { get; set; }
        public string HardLimitSource { get; set; }  // "GPS Sensor" or "Tank Capacity"

        // Soft Limits (Rule-based)
        public decimal DailyUsed { get; set; }
        public decimal DailyLimit { get; set; }
        public decimal MonthlyUsed { get; set; }
        public decimal MonthlyLimit { get; set; }
        public decimal? PerTransactionLimit { get; set; }

        // Calculated values
        public decimal DailyRemaining => DailyLimit > 0 ? Math.Max(0, DailyLimit - DailyUsed) : 0;
        public decimal MonthlyRemaining => MonthlyLimit > 0 ? Math.Max(0, MonthlyLimit - MonthlyUsed) : 0;

        // Maximum allowed dose considering all limits
        public decimal MaxAllowedDose { get; set; }
        public string LimitingFactor { get; set; }  // What's limiting the dose ("DailyLimit", "MonthlyLimit", "HardLimit", etc.)

        // Time window rules
        public bool IsWithinTimeWindow { get; set; } = true;
        public string TimeWindowStart { get; set; }
        public string TimeWindowEnd { get; set; }

        // Refill count rules
        public int RefillsToday { get; set; }
        public int? MaxRefillsPerDay { get; set; }
        public int? RefillsRemaining => MaxRefillsPerDay.HasValue ? Math.Max(0, MaxRefillsPerDay.Value - RefillsToday) : null;
    }

    public record ValidateVehicleQuery(int VehicleId, int SiteId, double? RequestedDose = null) : IRequest<VehicleValidationResultDTO>;

    public class ValidateVehicleQueryHandler : IRequestHandler<ValidateVehicleQuery, VehicleValidationResultDTO>
    {
        private readonly IMediator _mediator;
        private readonly IFuelingRuleEvaluationService _ruleEvaluationService;
        private readonly GpsdataContext _context;

        public ValidateVehicleQueryHandler(
            IMediator mediator,
            IFuelingRuleEvaluationService ruleEvaluationService,
            GpsdataContext context)
        {
            _mediator = mediator;
            _ruleEvaluationService = ruleEvaluationService;
            _context = context;
        }

        public async Task<VehicleValidationResultDTO> Handle(ValidateVehicleQuery request, CancellationToken cancellationToken)
        {
            try
            {
                // Get vehicle with related data
                var vehicle = await _context.Vehicles
                    .Include(v => v.VehicleType)
                    .FirstOrDefaultAsync(v => v.VehicleId == request.VehicleId, cancellationToken);

                if (vehicle == null)
                {
                    return new VehicleValidationResultDTO
                    {
                        IsValid = false,
                        Message = $"Vehicle with ID {request.VehicleId} not found.",
                        VehicleInfo = null
                    };
                }

                // Build FuelingContext for rule evaluation
                var fuelingContext = new FuelingContext
                {
                    VehicleId = vehicle.VehicleId,
                    Vehicle = vehicle,
                    VehicleTypeId = vehicle.VehicleTypeId,
                    SiteId = request.SiteId,
                    TankCapacity = vehicle.FuelTankCapacity ?? 0,
                    CurrentFuelLevel = null, // No GPS fuel level data available on Vehicle entity
                    HasFuelSensor = false, // Default to false since Vehicle doesn't track this
                    FuelLevelTimestamp = null
                };

                // Calculate fuel allowance using the evaluation service
                var allowanceResult = await _ruleEvaluationService.CalculateFuelAllowanceAsync(fuelingContext, cancellationToken);

                // Build the VehicleFuelInfoDTO with all details
                var vehicleFuelInfo = new VehicleFuelInfoDTO
                {
                    VehicleId = vehicle.VehicleId,
                    HyoungNo = vehicle.HyoungNo,
                    NumberPlate = vehicle.NumberPlate,
                    IsCompanyVehicle = vehicle.IsCompanyVehicle.HasValue && vehicle.IsCompanyVehicle.Value == 1,

                    // Hard limits
                    TankCapacity = allowanceResult.TankCapacity,
                    CurrentFuelLevel = allowanceResult.CurrentFuelInTank,
                    HardLimit = allowanceResult.HardLimit,
                    HasGpsFuelSensor = fuelingContext.HasFuelSensor,
                    HardLimitSource = allowanceResult.HardLimitSource,

                    // Soft limits
                    DailyUsed = allowanceResult.FuelUsedToday,
                    DailyLimit = allowanceResult.DailyLimit ?? decimal.MaxValue,
                    MonthlyUsed = allowanceResult.FuelUsedThisMonth,
                    MonthlyLimit = allowanceResult.MonthlyLimit ?? decimal.MaxValue,
                    PerTransactionLimit = allowanceResult.PerTransactionLimit,

                    // Other limits
                    MaxAllowedDose = allowanceResult.MaxFuelAllowed,
                    LimitingFactor = allowanceResult.LimitingFactor ?? "None",

                    // Time window
                    IsWithinTimeWindow = allowanceResult.IsWithinTimeWindow,
                    TimeWindowStart = allowanceResult.TimeWindowStart?.ToString(@"hh\:mm"),
                    TimeWindowEnd = allowanceResult.TimeWindowEnd?.ToString(@"hh\:mm"),

                    // Refill counts
                    RefillsToday = allowanceResult.RefillsToday,
                    MaxRefillsPerDay = allowanceResult.MaxRefillsPerDay
                };

                // Check if vehicle has no rules configured
                bool hasNoRules = allowanceResult.AppliedRuleSets == null || !allowanceResult.AppliedRuleSets.Any();

                if (hasNoRules)
                {
                    return new VehicleValidationResultDTO
                    {
                        IsValid = false,
                        HasNoRules = true,
                        Message = "No fuel rules configured for this vehicle. Please contact administrator.",
                        VehicleInfo = vehicleFuelInfo
                    };
                }

                // Check if fueling is allowed
                if (!allowanceResult.IsAllowed)
                {
                    return new VehicleValidationResultDTO
                    {
                        IsValid = false,
                        Message = allowanceResult.BlockedReason ?? "Fueling not allowed at this time.",
                        VehicleInfo = vehicleFuelInfo
                    };
                }

                // Check if requested dose would exceed limits
                if (request.RequestedDose.HasValue && request.RequestedDose.Value > 0)
                {
                    var requestedDose = (decimal)request.RequestedDose.Value;
                    if (requestedDose > allowanceResult.MaxFuelAllowed)
                    {
                        return new VehicleValidationResultDTO
                        {
                            IsValid = false,
                            Message = $"Requested dose ({requestedDose:F2}L) exceeds maximum allowed ({allowanceResult.MaxFuelAllowed:F2}L). Limiting factor: {allowanceResult.LimitingFactor}",
                            VehicleInfo = vehicleFuelInfo
                        };
                    }
                }

                // Vehicle is valid and within limits
                return new VehicleValidationResultDTO
                {
                    IsValid = true,
                    Message = $"Vehicle valid. Maximum allowed: {allowanceResult.MaxFuelAllowed:F2}L",
                    VehicleInfo = vehicleFuelInfo
                };
            }
            catch (Exception ex)
            {
                return new VehicleValidationResultDTO
                {
                    IsValid = false,
                    Message = $"Validation error: {ex.Message}",
                    VehicleInfo = null
                };
            }
        }
    }
}