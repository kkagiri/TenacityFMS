using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Features.Tag.Queries;
using FMS.Application.Queries;
using FMS.Domain.Entities.Features.FuelRule.Rules;
using FMS.Persistence.DataAccess;
using MediatR;

namespace FMS.Application.Queries.Database.FMSQuery.TagQueries {
    /// <summary>
    /// Get the details of a tag including daily and monthly fuel usage, and fueling limits
    /// </summary>
    /// <param name="TagName"></param>
    public record GetTagDetailsQuery (string TagName) : IRequest<TagDetailsDto>;

    public class TagDetailsDto {
        public string TagId { get; set; }
        public int? VehicleId { get; set; }
        public string HyoungNo { get; set; }
        public decimal DailyUsed { get; set; }
        public decimal DailyLimit { get; set; }
        public decimal MonthlyUsed { get; set; }
        public decimal MonthlyLimit { get; set; }
        public decimal FuelingLimit { get; set; }
        public bool IsEnabled { get; set; }
        public string VehicleType { get; set; }
    }

    public class GetTagDetailsQueryHandler : IRequestHandler<GetTagDetailsQuery, TagDetailsDto> {
        private readonly IMediator _mediator;
        private readonly GpsdataContext _context;

        public GetTagDetailsQueryHandler (IMediator mediator, GpsdataContext context) {
            _mediator = mediator;
            _context = context;
        }

        public async Task<TagDetailsDto> Handle (GetTagDetailsQuery request, CancellationToken cancellationToken) {
            // Get the tag from the database
            var tag = await _mediator.Send (new GetTagByNameQuery (request.TagName));
            if (tag == null)
                throw new KeyNotFoundException ("Tag not found");

            // Get daily and monthly fuel usage
            var today = DateTime.UtcNow;
            var dailyUsed = await _mediator.Send (new GetDailyFuelIssuedForTagQuery (tag, today));
            var monthlyUsed = await _mediator.Send (new GetMonthlyFuelIssuedForTagQuery (tag.Name, today));

            // Get fuel rule limits from FuelingRuleSet if available
            decimal dailyLimit = 50; // Default value
            decimal monthlyLimit = 500; // Default value
            decimal fuelingLimit = 100; // Default value per transaction

            if (tag.FuelRuleSet != null && tag.FuelRuleSet.Rules != null) {
                // Find DailyMonthlyLimitRule in the Rules collection
                var dailyMonthlyRule = tag.FuelRuleSet.Rules
                    .OfType<DailyMonthlyLimitRule> ()
                    .FirstOrDefault ();

                if (dailyMonthlyRule != null) {
                    // Set daily and monthly limits if rule is found
                    dailyLimit = dailyMonthlyRule.DailyLimitLiter ?? dailyLimit;
                    monthlyLimit = dailyMonthlyRule.MonthlyLimitLiter ?? monthlyLimit;
                }
            }

            // Get vehicle and vehicle type with null checks
            var vehicle = tag.VehicleId.HasValue ? await _context.Vehicles.FindAsync (tag.VehicleId.Value) : null;

            // Only attempt to get vehicle type if vehicle exists and has a vehicle type ID
            string vehicleTypeName = null;
            if (vehicle != null && vehicle.VehicleTypeId.HasValue) {
                var vehicleType = await _context.Vehicletypes.FindAsync (vehicle.VehicleTypeId.Value);
                vehicleTypeName = vehicleType?.Name;
            }

            // Create and return the DTO with safe null handling
            return new TagDetailsDto {
                TagId = request.TagName,
                    VehicleId = tag.VehicleId,
                    HyoungNo = vehicle?.HyoungNo,
                    DailyUsed = dailyUsed,
                    DailyLimit = dailyLimit,
                    MonthlyUsed = monthlyUsed,
                    MonthlyLimit = monthlyLimit,
                    FuelingLimit = fuelingLimit,
                    IsEnabled = tag.IsEnabled ?? true,
                    VehicleType = vehicleTypeName
            };
        }
    }
}