using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using FMS.Application.Command.DatabaseCommand.TankVolumeHistoryCommand;
using FMS.Application.Common;
using FMS.Application.ModelsDTOs.FMS.TankStock;
using FMS.Domain.Entities;
using FMS.Domain.Entities.enums;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Command.DatabaseCommand.TankStockCommand;

//Cursor - Create Stock Adjustment Command following CQRS pattern with proper integration
public record CreateStockAdjustmentCommand (StockAdjustmentDTO StockAdjustmentDTO) : IRequest<FMSResponse<int>>;

public class CreateStockAdjustmentCommandHandler : IRequestHandler<CreateStockAdjustmentCommand, FMSResponse<int>> {
    private readonly GpsdataContext _context;
    private readonly ILogger<CreateStockAdjustmentCommandHandler> _logger;
    private readonly IMapper _mapper;
    private readonly TankVolumeHistoryIntegrationService _tankVolumeHistoryService; //Cursor - Added integration service

    public CreateStockAdjustmentCommandHandler (
        GpsdataContext context,
        ILogger<CreateStockAdjustmentCommandHandler> logger,
        IMapper mapper,
        TankVolumeHistoryIntegrationService tankVolumeHistoryService) { //Cursor - Added integration service
        _context = context;
        _logger = logger;
        _mapper = mapper;
        _tankVolumeHistoryService = tankVolumeHistoryService; //Cursor - Added integration service
    }

    public async Task<FMSResponse<int>> Handle (CreateStockAdjustmentCommand request, CancellationToken cancellationToken) {
        try {
            // Validation: Check if tank exists
            var tank = await _context.Tanks.FirstOrDefaultAsync (t => t.Id == request.StockAdjustmentDTO.TankId, cancellationToken);
            if (tank == null) {
                _logger.LogWarning ("Tank with ID {TankId} does not exist", request.StockAdjustmentDTO.TankId);
                return FMSResponse<int>.Failed ($"Tank with ID {request.StockAdjustmentDTO.TankId} does not exist.");
            }

            // Validation: Check if user exists
            var user = await _context.Users.FirstOrDefaultAsync (u => u.Id == request.StockAdjustmentDTO.CreatedBy, cancellationToken);
            if (user == null) {
                _logger.LogWarning ("User with ID {UserId} does not exist", request.StockAdjustmentDTO.CreatedBy);
                return FMSResponse<int>.Failed ($"User with ID {request.StockAdjustmentDTO.CreatedBy} does not exist.");
            }

            // Validation: Check tank capacity
            if (request.StockAdjustmentDTO.NewVolume > tank.TankVolume) {
                _logger.LogWarning ("New volume {NewVolume} exceeds tank capacity {TankCapacity}",
                    request.StockAdjustmentDTO.NewVolume, tank.TankVolume);
                return FMSResponse<int>.ValidationFailed (new List<string> {
                    $"New volume {request.StockAdjustmentDTO.NewVolume}L exceeds tank capacity {tank.TankVolume}L"
                });
            }

            // Validation: Check for negative volume
            if (request.StockAdjustmentDTO.NewVolume < 0) {
                _logger.LogWarning ("New volume cannot be negative: {NewVolume}", request.StockAdjustmentDTO.NewVolume);
                return FMSResponse<int>.ValidationFailed (new List<string> {
                    "New volume cannot be negative"
                });
            }

            // Cursor - Create StockAdjustment entity instead of direct TankVolumeHistory
            var stockAdjustment = new StockAdjustment {
                TankId = request.StockAdjustmentDTO.TankId,
                SiteId = request.StockAdjustmentDTO.SiteId,
                AdjustmentDate = request.StockAdjustmentDTO.AdjustmentDate,
                PreviousVolume = request.StockAdjustmentDTO.CurrentVolume,
                NewVolume = request.StockAdjustmentDTO.NewVolume,
                VolumeChange = request.StockAdjustmentDTO.VolumeChange,
                AdjustmentType = request.StockAdjustmentDTO.AdjustmentType,
                ReasonCode = (StockAdjustmentReasonEnum) request.StockAdjustmentDTO.ReasonCode,
                Reason = request.StockAdjustmentDTO.Reason,
                Notes = request.StockAdjustmentDTO.Notes,
                CreatedBy = request.StockAdjustmentDTO.CreatedBy,
                CreatedOn = DateTime.UtcNow,
                Status = 1 // Approved by default for now
            };

            _context.StockAdjustments.Add (stockAdjustment);
            await _context.SaveChangesAsync (cancellationToken);

            // Cursor - Use TankVolumeHistoryIntegrationService for proper volume tracking
            var volumeUpdateResult = await _tankVolumeHistoryService.ProcessAdjustmentChangeAsync (
                tankId: request.StockAdjustmentDTO.TankId,
                timestamp: request.StockAdjustmentDTO.AdjustmentDate,
                volumeChange: request.StockAdjustmentDTO.VolumeChange,
                adjustmentId: stockAdjustment.Id,
                actionType: ActionType.Create,
                recordedBy: request.StockAdjustmentDTO.CreatedBy,
                cancellationToken: cancellationToken);

            if (!volumeUpdateResult.Success) {
                _logger.LogWarning ("Failed to update tank volume history: {Message}", volumeUpdateResult.Message);
                // Remove the stock adjustment if volume history update fails
                _context.StockAdjustments.Remove (stockAdjustment);
                await _context.SaveChangesAsync (cancellationToken);
                return FMSResponse<int>.Failed ($"Failed to update tank volume history: {volumeUpdateResult.Message}");
            }

            // Cursor - Update the stock adjustment with the TankVolumeHistory reference
            var volumeHistoryRecord = await _context.TankVolumeHistories
                .Where (tvh => tvh.TankId == request.StockAdjustmentDTO.TankId &&
                    tvh.ReferenceId == stockAdjustment.Id &&
                    tvh.ReferenceType == "Adjustment")
                .FirstOrDefaultAsync (cancellationToken);

            if (volumeHistoryRecord != null) {
                stockAdjustment.TankVolumeHistoryId = volumeHistoryRecord.Id;
                await _context.SaveChangesAsync (cancellationToken);
            }

            _logger.LogInformation ("Stock adjustment created successfully for Tank {TankId}, Volume changed from {CurrentVolume} to {NewVolume}",
                request.StockAdjustmentDTO.TankId, request.StockAdjustmentDTO.CurrentVolume, request.StockAdjustmentDTO.NewVolume);

            return FMSResponse<int>.Success (stockAdjustment.Id, "Stock adjustment created successfully");
        } catch (Exception ex) {
            _logger.LogError (ex, "Error creating stock adjustment for Tank {TankId}", request.StockAdjustmentDTO.TankId);
            return FMSResponse<int>.SystemError ("An error occurred while creating the stock adjustment");
        }
    }
}