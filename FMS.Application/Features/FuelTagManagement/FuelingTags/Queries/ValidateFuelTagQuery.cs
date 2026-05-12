using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Features.FuelTagManagement.FuelingTags.FuelingTags.Queries;
using MediatR;

namespace FMS.Application.Features.FuelTagManagement.FuelingTags.Queries
{
    public record ValidateFuelTagQuery (string TagName) : IRequest<FuelTagValidationResult>;

    public class FuelTagValidationResult {
        public bool IsValid { get; set; }
        public string Message { get; set; }
        public FuelTagDetailsDto VehicleInfo { get; set; }
        public bool IsMasterTag { get; set; }
    }

    public class ValidateTagQueryHandler : IRequestHandler<ValidateFuelTagQuery, FuelTagValidationResult> {
        private readonly IMediator _mediator;

        public ValidateTagQueryHandler (IMediator mediator) {
            _mediator = mediator;
        }

        public async Task<FuelTagValidationResult> Handle (ValidateFuelTagQuery request, CancellationToken cancellationToken) {
            try {
                // Use the existing command
                var authResult = await _mediator.Send (new AuthenticateFuelTagQuery (request.TagName));

                if (!authResult.IsAuthenticated) {
                    return new FuelTagValidationResult {
                        IsValid = false,
                            Message = "Tag authentication failed",
                            VehicleInfo = null,
                            IsMasterTag = authResult.IsMasterTag
                    };
                }

                // Always get tag details, regardless of type (master or vehicle)
                var tagDetails = await _mediator.Send (new GetFuelTagDetailsQuery (request.TagName));

                // Check limits
                bool isDailyLimitExceeded = tagDetails.DailyUsed >= tagDetails.DailyLimit;
                bool isMonthlyLimitExceeded = tagDetails.MonthlyUsed >= tagDetails.MonthlyLimit;

                if (isDailyLimitExceeded) {
                    return new FuelTagValidationResult {
                        IsValid = false,
                            Message = authResult.IsMasterTag ? "Master Tag daily fuel limit exceeded" : "Daily fuel limit exceeded",
                            VehicleInfo = tagDetails,
                            IsMasterTag = authResult.IsMasterTag
                    };
                }

                if (isMonthlyLimitExceeded) {
                    return new FuelTagValidationResult {
                        IsValid = false,
                            Message = authResult.IsMasterTag ? "Master Tag monthly fuel limit exceeded" : "Monthly fuel limit exceeded",
                            VehicleInfo = tagDetails,
                            IsMasterTag = authResult.IsMasterTag
                    };
                }

                if (authResult.IsMasterTag) {
                    // Master Tag is valid and within limits
                    return new FuelTagValidationResult {
                        IsValid = true,
                            Message = "Master Tag is valid",
                            VehicleInfo = null,
                            IsMasterTag = true
                    };
                } else {
                    // Vehicle Tag is valid and within limits
                    return new FuelTagValidationResult {
                        IsValid = true,
                            Message = "Tag is valid",
                            VehicleInfo = tagDetails,
                            IsMasterTag = false
                    };
                }

            } catch (KeyNotFoundException ex) {
                return new FuelTagValidationResult {
                    IsValid = false,
                        Message = ex.Message,
                        VehicleInfo = null,
                        IsMasterTag = false
                };
            }
        }
    }
}