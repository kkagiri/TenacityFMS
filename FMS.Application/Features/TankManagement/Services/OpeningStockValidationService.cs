using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Features.FMS.TankStock;
using FMS.Domain.Entities.enums;
using FMS.Persistence.DataAccess;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Services.TankStock {
    /// <summary>
    /// Service for enhanced opening stock validation with detailed error information
    /// </summary>
    public class OpeningStockValidationService {
        private readonly GpsdataContext _context;
        private readonly ILogger<OpeningStockValidationService> _logger;

        public OpeningStockValidationService (GpsdataContext context, ILogger<OpeningStockValidationService> logger) {
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// Validates if an opening stock can be created and provides detailed feedback
        /// </summary>
        /// <param name="tankId">Tank ID</param>
        /// <param name="requestedDate">Requested date for the opening stock</param>
        /// <param name="cancellationToken">Cancellation token</param>
        /// <returns>Detailed validation result</returns>
        public async Task<OpeningStockValidationResult> ValidateOpeningStockCreationAsync (int tankId, DateTime requestedDate, CancellationToken cancellationToken = default) {
            try {
                var tank = await _context.Tanks.FindAsync (new object[] { tankId }, cancellationToken);
                if (tank == null) {
                    return new OpeningStockValidationResult {
                    Success = false,
                    Message = $"Tank with ID {tankId} not found",
                    Details = new ValidationDetails {
                    TankId = tankId,
                    ErrorType = "TankNotFound"
                    }
                    };
                }

                // Check for any unclosed opening stock for this tank
                // An opening stock is considered "unclosed" if there's no closing stock after it (on any date)
                var lastUnClosedOpeningStock = await _context.TankVolumeHistories
                    .Where (x => x.TankId == tankId &&
                        x.ChangeReason == VolumeChangeReasonEnum.OpeningStock)
                    .OrderByDescending (x => x.Timestamp)
                    .FirstOrDefaultAsync (os => !_context.TankVolumeHistories
                        .Any (cs => cs.TankId == tankId &&
                            cs.ChangeReason == VolumeChangeReasonEnum.ClosingStock &&
                            cs.Timestamp > os.Timestamp), cancellationToken);

                if (lastUnClosedOpeningStock != null) {
                    var lastOpeningDate = lastUnClosedOpeningStock.Timestamp;
                    var lastOpeningAmount = lastUnClosedOpeningStock.VolumeChange ?? 0;

                    return new OpeningStockValidationResult {
                        Success = false,
                            Message = $"An opening stock already exists for {lastOpeningDate:yyyy-MM-dd} ({lastOpeningAmount:N0}L) without a subsequent closing stock. Please create a closing stock after {lastOpeningDate:yyyy-MM-dd} before adding another opening stock.",
                            Details = new ValidationDetails {
                            LastOpeningStockDate = lastOpeningDate,
                            LastOpeningStockAmount = lastOpeningAmount,
                            TankId = tankId,
                            TankName = tank.Name,
                            SuggestedAction = $"Create a closing stock for any date after {lastOpeningDate:yyyy-MM-dd} with the appropriate amount before proceeding.",
                            ErrorType = "OpeningStockExists"
                            }
                    };
                }

                // Check for existing opening stock on the same day
                var existingOpeningStock = await _context.TankVolumeHistories
                    .Where (x => x.TankId == tankId &&
                        x.Timestamp.Date == requestedDate.Date &&
                        x.ChangeReason == VolumeChangeReasonEnum.OpeningStock)
                    .FirstOrDefaultAsync (cancellationToken);

                if (existingOpeningStock != null) {
                    var existingDate = existingOpeningStock.Timestamp;
                    var existingAmount = existingOpeningStock.VolumeChange ?? 0;

                    return new OpeningStockValidationResult {
                        Success = false,
                            Message = $"An opening stock already exists for {existingDate:yyyy-MM-dd} ({existingAmount:N0}L). You cannot create multiple opening stocks for the same date.",
                            Details = new ValidationDetails {
                            LastOpeningStockDate = existingDate,
                            LastOpeningStockAmount = existingAmount,
                            TankId = tankId,
                            TankName = tank.Name,
                            SuggestedAction = "Choose a different date or update the existing opening stock.",
                            ErrorType = "DuplicateOpeningStock"
                            }
                    };
                }

                // Validation passed
                return new OpeningStockValidationResult {
                    Success = true,
                        Message = "Opening stock can be created"
                };

            } catch (Exception ex) {
                _logger.LogError (ex, "Error validating opening stock creation for Tank {TankId} on {Date}", tankId, requestedDate);
                return new OpeningStockValidationResult {
                    Success = false,
                        Message = "An error occurred during validation. Please try again.",
                        Details = new ValidationDetails {
                            TankId = tankId,
                            ErrorType = "SystemError"
                            }
                };
            }
        }
    }
}