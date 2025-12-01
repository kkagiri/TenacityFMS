using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.FuelAudit.DTOs;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.FuelAudit.Queries
{
    /// <summary>
    /// Query to get audit thresholds
    /// </summary>
    public record GetAuditThresholdsQuery()
        : IRequest<FMSResponse<AuditThresholdsDTO>>;

    /// <summary>
    /// Handler for GetAuditThresholdsQuery
    /// </summary>
    public class GetAuditThresholdsQueryHandler
        : IRequestHandler<GetAuditThresholdsQuery, FMSResponse<AuditThresholdsDTO>>
    {
        private readonly GpsdataContext _context;
        private readonly ILogger<GetAuditThresholdsQueryHandler> _logger;

        public GetAuditThresholdsQueryHandler(
            GpsdataContext context,
            ILogger<GetAuditThresholdsQueryHandler> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<FMSResponse<AuditThresholdsDTO>> Handle(
            GetAuditThresholdsQuery request,
            CancellationToken cancellationToken)
        {
            try
            {
                // Get all active thresholds
                var thresholds = await _context.FuelAuditThresholds
                    .Where(t => t.IsActive)
                    .ToListAsync(cancellationToken);

                var result = new AuditThresholdsDTO
                {
                    Thresholds = thresholds
                        .GroupBy(t => t.ThresholdType)
                        .Select(g => g.First())
                        .Select(t => new ThresholdDTO
                        {
                            Id = t.Id,
                            ThresholdType = t.ThresholdType,
                            Category = t.Category,
                            WarningThreshold = t.ThresholdValue,
                            CriticalThreshold = t.ThresholdValue * 2, // Default: critical = 2x warning
                            IsPercentage = t.Unit == "Percent",
                            Description = t.Name
                        })
                        .ToList()
                };

                // Ensure all required threshold types exist with defaults
                EnsureDefaultThresholds(result);

                return FMSResponse<AuditThresholdsDTO>.Success(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting audit thresholds");
                return FMSResponse<AuditThresholdsDTO>.Failed($"Error: {ex.Message}");
            }
        }

        private void EnsureDefaultThresholds(AuditThresholdsDTO result)
        {
            var defaultThresholds = new[]
            {
                new ThresholdDTO
                {
                    ThresholdType = "TankerVariance",
                    Category = "Tanker",
                    WarningThreshold = 1.0m,
                    CriticalThreshold = 2.0m,
                    IsPercentage = true,
                    Description = "Acceptable variance between expected and actual tanker stock"
                },
                new ThresholdDTO
                {
                    ThresholdType = "FleetVariance",
                    Category = "Fleet",
                    WarningThreshold = 2.0m,
                    CriticalThreshold = 5.0m,
                    IsPercentage = true,
                    Description = "Acceptable variance in fleet fuel consumption"
                },
                new ThresholdDTO
                {
                    ThresholdType = "VehicleVariance",
                    Category = "Vehicle",
                    WarningThreshold = 5.0m,
                    CriticalThreshold = 10.0m,
                    IsPercentage = true,
                    Description = "Acceptable variance for individual vehicle consumption"
                },
                new ThresholdDTO
                {
                    ThresholdType = "FuelEfficiency",
                    Category = "Vehicle",
                    WarningThreshold = 20.0m,
                    CriticalThreshold = 15.0m,
                    IsPercentage = false,
                    Description = "Minimum acceptable fuel efficiency (km/L)"
                },
                new ThresholdDTO
                {
                    ThresholdType = "DataQuality",
                    Category = "Quality",
                    WarningThreshold = 80.0m,
                    CriticalThreshold = 60.0m,
                    IsPercentage = true,
                    Description = "Minimum data quality/GPS coverage percentage"
                },
                new ThresholdDTO
                {
                    ThresholdType = "UnexplainedVariance",
                    Category = "System",
                    WarningThreshold = 50.0m,
                    CriticalThreshold = 100.0m,
                    IsPercentage = false,
                    Description = "Maximum unexplained variance in liters"
                }
            };

            foreach (var defaultThreshold in defaultThresholds)
            {
                if (!result.Thresholds.Any(t => t.ThresholdType == defaultThreshold.ThresholdType))
                {
                    defaultThreshold.IsTankSpecific = false;
                    result.Thresholds.Add(defaultThreshold);
                }
            }
        }
    }
}
