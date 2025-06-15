using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using MediatR;

namespace FMS.Application.Queries.Database.FMSQuery.TagQueries {
    public record ValidateTagQuery (string TagName) : IRequest<TagValidationResult>;

    public class TagValidationResult {
        public bool IsValid { get; set; }
        public string Message { get; set; }
        public TagDetailsDto VehicleInfo { get; set; }
        public bool IsMasterTag { get; set; }
    }

    public class ValidateTagQueryHandler : IRequestHandler<ValidateTagQuery, TagValidationResult> {
        private readonly IMediator _mediator;

        public ValidateTagQueryHandler (IMediator mediator) {
            _mediator = mediator;
        }

        public async Task<TagValidationResult> Handle (ValidateTagQuery request, CancellationToken cancellationToken) {
            try {
                // Use the existing command
                var authResult = await _mediator.Send (new AuthenticateTagQuery (request.TagName));

                if (!authResult.IsAuthenticated) {
                    return new TagValidationResult {
                        IsValid = false,
                            Message = "Tag authentication failed",
                            VehicleInfo = null,
                            IsMasterTag = authResult.IsMasterTag
                    };
                }

                // Always get tag details, regardless of type (master or vehicle)
                var tagDetails = await _mediator.Send (new GetTagDetailsQuery (request.TagName));

                // Check limits
                bool isDailyLimitExceeded = tagDetails.DailyUsed >= tagDetails.DailyLimit;
                bool isMonthlyLimitExceeded = tagDetails.MonthlyUsed >= tagDetails.MonthlyLimit;

                if (isDailyLimitExceeded) {
                    return new TagValidationResult {
                        IsValid = false,
                            Message = authResult.IsMasterTag ? "Master Tag daily fuel limit exceeded" : "Daily fuel limit exceeded",
                            VehicleInfo = tagDetails,
                            IsMasterTag = authResult.IsMasterTag
                    };
                }

                if (isMonthlyLimitExceeded) {
                    return new TagValidationResult {
                        IsValid = false,
                            Message = authResult.IsMasterTag ? "Master Tag monthly fuel limit exceeded" : "Monthly fuel limit exceeded",
                            VehicleInfo = tagDetails,
                            IsMasterTag = authResult.IsMasterTag
                    };
                }

                if (authResult.IsMasterTag) {
                    // Master Tag is valid and within limits
                    return new TagValidationResult {
                        IsValid = true,
                            Message = "Master Tag is valid",
                            VehicleInfo = null,
                            IsMasterTag = true
                    };
                } else {
                    // Vehicle Tag is valid and within limits
                    return new TagValidationResult {
                        IsValid = true,
                            Message = "Tag is valid",
                            VehicleInfo = tagDetails,
                            IsMasterTag = false
                    };
                }

            } catch (KeyNotFoundException ex) {
                return new TagValidationResult {
                    IsValid = false,
                        Message = ex.Message,
                        VehicleInfo = null,
                        IsMasterTag = false
                };
            }
        }
    }
}