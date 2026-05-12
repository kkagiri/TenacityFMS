using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Command.DatabaseCommand.TankVolumeHistoryCommand;
using FMS.Application.Common;
using FMS.Application.Features.TankManagement.Deliveries.DTOs;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Command.DatabaseCommand.DeliveriesCommands;

/// <summary>
/// Command to update delivery using correction-based approach
/// This creates a correction entry and soft deletes the original
/// </summary>
public record UpdateDeliveryCommand (
    int OriginalDeliveryId,
    DeliveryCorrectionDto CorrectionData
) : IRequest<FMSResponseMessage>;

public class UpdateDeliveryCommandHandler : IRequestHandler<UpdateDeliveryCommand, FMSResponseMessage> {
    private readonly GpsdataContext _context;
    private readonly ILogger<UpdateDeliveryCommandHandler> _logger;
    private readonly IMediator _mediator;

    public UpdateDeliveryCommandHandler (
        GpsdataContext context,
        ILogger<UpdateDeliveryCommandHandler> logger,
        IMediator mediator) {
        _context = context;
        _logger = logger;
        _mediator = mediator;
    }

    public async Task<FMSResponseMessage> Handle (UpdateDeliveryCommand request, CancellationToken cancellationToken) {
        try {
            // 1. Validate the original record exists
            var originalDelivery = await _context.Deliveries.FindAsync ([request.OriginalDeliveryId], cancellationToken);
            if (originalDelivery == null) {
                return new FMSResponseMessage (false, $"Original delivery with ID {request.OriginalDeliveryId} not found");
            }

            // 2. Find the associated TankVolumeHistory record
            var originalTankVolumeHistory = await _context.TankVolumeHistories
                .Where (tvh => tvh.ReferenceId == request.OriginalDeliveryId &&
                    tvh.ChangeReason == Domain.Entities.enums.VolumeChangeReasonEnum.Delivery)
                .FirstOrDefaultAsync (cancellationToken);

            if (originalTankVolumeHistory == null) {
                return new FMSResponseMessage (false, $"Associated tank volume history for delivery {request.OriginalDeliveryId} not found");
            }

            // 3. Soft delete the original tank volume history record with validation
            var deleteResult = await _mediator.Send (new DeleteTankVolumeHistoryCommand (
                DeletedBy: request.CorrectionData.RecordedBy,
                Id: originalTankVolumeHistory.Id,
                ValidateFutureRecords: true
            ), cancellationToken);

            if (!deleteResult.Success) {
                return new FMSResponseMessage (false, $"Failed to delete original tank volume history: {deleteResult.Message}");
            }

            // 4. Create new correction entry using existing create command
            var createResult = await _mediator.Send (new CreateDeliveryCommand (new Features.FMS.Delivery.cs.DeliveryDTO {
                TankId = request.CorrectionData.TankId,
                    DeliveryDate = request.CorrectionData.DeliveryDate,
                    ManualDeliveryAmount = request.CorrectionData.ManualDeliveryAmount,
                    SensorDeliveryAmount = request.CorrectionData.SensorDeliveryAmount,
                    DeliveryTemperature = request.CorrectionData.DeliveryTemperature,
                    DeliveryDensity = request.CorrectionData.DeliveryDensity,
                    DeliveryMass = request.CorrectionData.DeliveryMass,
                    StockBeforeDelivery = request.CorrectionData.StockBeforeDelivery,
                    StockAfterDelivery = request.CorrectionData.StockAfterDelivery,
                    PricePerLiter = request.CorrectionData.PricePerLiter,
                    SupplierId = request.CorrectionData.SupplierId,
                    Lponumber = request.CorrectionData.Lponumber,
                    Product = request.CorrectionData.Product,
                    RecordedBy = request.CorrectionData.RecordedBy,
                    CreatedOn = DateTime.UtcNow,
                    // Correction tracking
                    IsCorrection = true,
                    CorrectsRecordId = request.OriginalDeliveryId,
                    CorrectionReason = request.CorrectionData.CorrectionReason
            }), cancellationToken);

            if (!createResult.Success) {
                _logger.LogError ("Failed to create correction entry for delivery {DeliveryId}: {Error}",
                    request.OriginalDeliveryId, createResult.Message);
                return new FMSResponseMessage (false, $"Failed to create correction entry: {createResult.Message}");
            }

            _logger.LogInformation ("Successfully created correction entry for delivery {OriginalId} by user {UserId}. Reason: {Reason}",
                request.OriginalDeliveryId, request.CorrectionData.RecordedBy, request.CorrectionData.CorrectionReason);

            return new FMSResponseMessage (true, "Delivery correction completed successfully");

        } catch (Exception ex) {
            _logger.LogError (ex, "Error processing delivery correction for ID {DeliveryId}", request.OriginalDeliveryId);
            return new FMSResponseMessage (false, $"Error processing delivery correction: {ex.Message}");
        }
    }
}