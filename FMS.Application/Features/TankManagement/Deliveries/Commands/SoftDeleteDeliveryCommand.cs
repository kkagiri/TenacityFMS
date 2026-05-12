using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Command.DatabaseCommand.TankVolumeHistoryCommand;
using FMS.Application.Common;
using FMS.Application.Services.TankStock;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.TankManagement.Deliveries.Commands
{
    /// <summary>
    /// Command to soft delete a delivery record
    /// This also soft deletes the associated TankVolumeHistory record
    /// </summary>
    public record SoftDeleteDeliveryCommand(
        int DeliveryId,
        string DeletedBy
    ) : IRequest<FMSResponse>;

    public class SoftDeleteDeliveryCommandHandler : IRequestHandler<SoftDeleteDeliveryCommand, FMSResponse>
    {
        private readonly GpsdataContext _context;
        private readonly ILogger<SoftDeleteDeliveryCommandHandler> _logger;
        private readonly IMediator _mediator;
        private readonly TankStockFutureRecordsService _futureRecordsService;

        public SoftDeleteDeliveryCommandHandler(
            GpsdataContext context,
            ILogger<SoftDeleteDeliveryCommandHandler> logger,
            IMediator mediator,
            TankStockFutureRecordsService futureRecordsService)
        {
            _context = context;
            _logger = logger;
            _mediator = mediator;
            _futureRecordsService = futureRecordsService;
        }

        public async Task<FMSResponse> Handle(SoftDeleteDeliveryCommand request, CancellationToken cancellationToken)
        {
            try
            {
                // 1. Validate the delivery exists
                var delivery = await _context.Deliveries
                    .Include(d => d.Tank)
                    .FirstOrDefaultAsync(d => d.Id == request.DeliveryId, cancellationToken);

                if (delivery == null)
                {
                    return FMSResponse.NotFound("DELIVERY_NOT_FOUND", $"Delivery with ID {request.DeliveryId} not found");
                }

                // Check if already soft deleted
                if (delivery.IsDeleted)
                {
                    return FMSResponse.FailedResponse("Delivery has already been deleted", "DELIVERY_ALREADY_DELETED");
                }

                // 2. Validate user exists
                var user = await _context.Users.FindAsync(new object[] { request.DeletedBy }, cancellationToken);
                if (user == null)
                {
                    return FMSResponse.NotFound("USER_NOT_FOUND", $"User {request.DeletedBy} not found");
                }

                // 3. Validate historical deletion against future records policy
                // For deletion, we validate using ValidateHistoricalEntryAsync
                // (checking if the date can be modified/deleted based on future records)
                if (delivery.DeliveryDate.Date < DateTime.Now.Date)
                {
                    var futureRecordsValidation = await _futureRecordsService.ValidateHistoricalEntryAsync(
                        delivery.TankId,
                        delivery.DeliveryDate,
                        Domain.Entities.enums.VolumeChangeReasonEnum.Delivery,
                        cancellationToken);

                    if (!futureRecordsValidation.IsAllowed)
                    {
                        return FMSResponse.BusinessLogicError("FUTURE_RECORDS_POLICY_VIOLATION", futureRecordsValidation.Message);
                    }

                    // Log warning if future records exist
                    if (futureRecordsValidation.RequiresUserConfirmation)
                    {
                        _logger.LogWarning("Historical delivery deletion with future records: Delivery {DeliveryId}, Tank {TankId}, Date {DeliveryDate}, Policy {Policy}, Future Records {Count}",
                            request.DeliveryId, delivery.TankId, delivery.DeliveryDate, futureRecordsValidation.Policy, futureRecordsValidation.FutureRecordsCount);
                    }
                }

                // 4. Find and soft delete the associated TankVolumeHistory record
                var tankVolumeHistory = await _context.TankVolumeHistories
                    .Where(tvh => tvh.ReferenceId == request.DeliveryId &&
                        tvh.ChangeReason == Domain.Entities.enums.VolumeChangeReasonEnum.Delivery &&
                        tvh.IsDeleted != true)
                    .FirstOrDefaultAsync(cancellationToken);

                if (tankVolumeHistory == null)
                {
                    _logger.LogWarning("Associated tank volume history for delivery {DeliveryId} not found", request.DeliveryId);
                    // Continue with delivery deletion even if volume history not found
                }
                else
                {
                    // Soft delete the TankVolumeHistory using the command
                    var deleteHistoryResult = await _mediator.Send(new DeleteTankVolumeHistoryCommand(
                        DeletedBy: request.DeletedBy,
                        Id: tankVolumeHistory.Id,
                        ValidateFutureRecords: true
                    ), cancellationToken);

                    // FMSResponseMessage returns bool Success property
                    if (!deleteHistoryResult.Success)
                    {
                        return FMSResponse.FailedResponse($"Failed to delete associated tank volume history: {deleteHistoryResult.Message}", "VOLUME_HISTORY_DELETE_FAILED");
                    }
                }

                // 5. Soft delete the delivery
                delivery.IsDeleted = true;
                delivery.DeletedAt = DateTime.UtcNow;
                delivery.DeletedBy = request.DeletedBy;

                // 6. Update tank current stock if using bookkeeping and it's current day
                // UseBookKeeping is sbyte? type - check if it's 1 (true) and current day
                bool isUsingBookKeeping = delivery.Tank.UseBookKeeping.GetValueOrDefault() == 1;
                if (isUsingBookKeeping && delivery.DeliveryDate.Date == DateTime.Now.Date)
                {
                    delivery.Tank.CurrentStock -= delivery.ManualDeliveryAmount;
                    _context.Tanks.Update(delivery.Tank);
                }

                _context.Deliveries.Update(delivery);
                await _context.SaveChangesAsync(cancellationToken);

                _logger.LogInformation("Successfully soft deleted delivery {DeliveryId} by user {UserId}",
                    request.DeliveryId, request.DeletedBy);

                return FMSResponse.SuccessResponse("Delivery deleted successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error soft deleting delivery {DeliveryId}", request.DeliveryId);
                return FMSResponse.SystemError($"Error deleting delivery: {ex.Message}");
            }
        }
    }
}
