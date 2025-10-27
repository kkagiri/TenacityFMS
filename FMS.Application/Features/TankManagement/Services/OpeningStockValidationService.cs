using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Features.FMS.TankStock;
using FMS.Domain.Entities.enums;
using FMS.Persistence.DataAccess;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Services.TankStock
{
    /// <summary>
    /// Service for enhanced opening stock validation with detailed error information
    /// </summary>
    public class OpeningStockValidationService
    {
        private readonly GpsdataContext _context;
        private readonly ILogger<OpeningStockValidationService> _logger;

        public OpeningStockValidationService(GpsdataContext context, ILogger<OpeningStockValidationService> logger)
        {
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
        public async Task<OpeningStockValidationResult> ValidateOpeningStockCreationAsync(int tankId, DateTime requestedDate, CancellationToken cancellationToken = default)
        {
            try
            {
                var tank = await _context.Tanks.FindAsync(new object[] { tankId }, cancellationToken);
                if (tank == null)
                {
                    return new OpeningStockValidationResult
                    {
                        Success = false,
                        Message = $"Tank with ID {tankId} not found",
                        Details = new ValidationDetails
                        {
                            TankId = tankId,
                            ErrorType = "TankNotFound"
                        }
                    };
                }

                // Check for existing opening stock on the same day FIRST
                var existingOpeningStock = await _context.TankVolumeHistories
                    .Where(x => x.TankId == tankId &&
                        x.Timestamp.Date == requestedDate.Date &&
                        x.ChangeReason == VolumeChangeReasonEnum.OpeningStock)
                    .FirstOrDefaultAsync(cancellationToken);

                if (existingOpeningStock != null)
                {
                    var existingDate = existingOpeningStock.Timestamp;
                    // Use NewVolume instead of VolumeChange for the actual opening stock amount
                    var existingAmount = existingOpeningStock.NewVolume ?? 0;

                    return new OpeningStockValidationResult
                    {
                        Success = false,
                        Message = $"An opening stock already exists for {existingDate:yyyy-MM-dd} ({existingAmount:N0}L). You cannot create multiple opening stocks for the same date.",
                        Details = new ValidationDetails
                        {
                            LastOpeningStockDate = existingDate,
                            LastOpeningStockAmount = existingAmount,
                            TankId = tankId,
                            TankName = tank.Name,
                            SuggestedAction = "Choose a different date or update the existing opening stock.",
                            ErrorType = "DuplicateOpeningStock"
                        }
                    };
                }

                // Check for any unclosed opening stock that is AFTER or ON the requested date
                // Only block if trying to create opening stock before or on the same date as an unclosed opening stock
                var unClosedOpeningStockAfterRequestedDate = await _context.TankVolumeHistories
                    .Where(x => x.TankId == tankId &&
                        x.ChangeReason == VolumeChangeReasonEnum.OpeningStock &&
                        x.Timestamp.Date >= requestedDate.Date) // Only check opening stocks on or after requested date
                    .OrderByDescending(x => x.Timestamp)
                    .FirstOrDefaultAsync(cancellationToken);

                if (unClosedOpeningStockAfterRequestedDate != null)
                {
                    // Check if there's a closing stock after this opening stock
                    var hasClosingStockAfter = await _context.TankVolumeHistories
                        .AnyAsync(cs => cs.TankId == tankId &&
                            cs.ChangeReason == VolumeChangeReasonEnum.ClosingStock &&
                            cs.Timestamp > unClosedOpeningStockAfterRequestedDate.Timestamp,
                            cancellationToken);

                    if (!hasClosingStockAfter)
                    {
                        var lastOpeningDate = unClosedOpeningStockAfterRequestedDate.Timestamp;
                        // Use NewVolume instead of VolumeChange for the actual opening stock amount
                        var lastOpeningAmount = unClosedOpeningStockAfterRequestedDate.NewVolume ?? 0;

                        return new OpeningStockValidationResult
                        {
                            Success = false,
                            Message = $"An opening stock already exists for {lastOpeningDate:yyyy-MM-dd} ({lastOpeningAmount:N0}L) without a subsequent closing stock. Please create a closing stock after {lastOpeningDate:yyyy-MM-dd} before adding an opening stock for an earlier date.",
                            Details = new ValidationDetails
                            {
                                LastOpeningStockDate = lastOpeningDate,
                                LastOpeningStockAmount = lastOpeningAmount,
                                TankId = tankId,
                                TankName = tank.Name,
                                SuggestedAction = $"Create a closing stock for any date after {lastOpeningDate:yyyy-MM-dd} before creating an opening stock for {requestedDate:yyyy-MM-dd}.",
                                ErrorType = "OpeningStockExists"
                            }
                        };
                    }
                }

                // Validation passed
                return new OpeningStockValidationResult
                {
                    Success = true,
                    Message = "Opening stock can be created"
                };

            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error validating opening stock creation for Tank {TankId} on {Date}", tankId, requestedDate);
                return new OpeningStockValidationResult
                {
                    Success = false,
                    Message = "An error occurred during validation. Please try again.",
                    Details = new ValidationDetails
                    {
                        TankId = tankId,
                        ErrorType = "SystemError"
                    }
                };
            }
        }
    }
}