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
    private readonly IMediator _mediator; //Cursor - Added mediator for UpdateTankVolumeHistoryCommand

    public CreateStockAdjustmentCommandHandler (
        GpsdataContext context,
        ILogger<CreateStockAdjustmentCommandHandler> logger,
        IMapper mapper,
        IMediator mediator) { //Cursor - Added mediator injection
        _context = context;
        _logger = logger;
        _mapper = mapper;
        _mediator = mediator; //Cursor - Added mediator assignment
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

            //Cursor - Ensure VolumeChange is calculated if not provided
            var calculatedVolumeChange = request.StockAdjustmentDTO.NewVolume - request.StockAdjustmentDTO.CurrentVolume;
            if (request.StockAdjustmentDTO.VolumeChange == 0 && calculatedVolumeChange != 0) {
                request.StockAdjustmentDTO.VolumeChange = calculatedVolumeChange;
            }

            // Cursor - Create StockAdjustment entity
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

            // Cursor - Create TankVolumeHistory record directly with correct NewVolume
            var tankVolumeHistory = new TankVolumeHistory {
                TankId = request.StockAdjustmentDTO.TankId,
                Timestamp = request.StockAdjustmentDTO.AdjustmentDate,
                VolumeChange = request.StockAdjustmentDTO.VolumeChange,
                NewVolume = request.StockAdjustmentDTO.NewVolume, //Cursor - Set the correct NewVolume directly
                ChangeReason = VolumeChangeReasonEnum.Adjustment,
                RecordedBy = request.StockAdjustmentDTO.CreatedBy,
                ReferenceId = stockAdjustment.Id,
                ReferenceType = "Adjustment",
                CreatedOn = DateTime.UtcNow
            };

            _context.TankVolumeHistories.Add (tankVolumeHistory);
            await _context.SaveChangesAsync (cancellationToken);

            // Cursor - Update the stock adjustment with the TankVolumeHistory reference
            stockAdjustment.TankVolumeHistoryId = tankVolumeHistory.Id;
            await _context.SaveChangesAsync (cancellationToken);

            // Cursor - Update subsequent TankVolumeHistory records to recalculate their NewVolume based on this adjustment
            var updateResult = await _mediator.Send (
                new UpdateTankVolumeHistoryCommand (
                    request.StockAdjustmentDTO.TankId,
                    request.StockAdjustmentDTO.AdjustmentDate.AddMilliseconds (1), // Start just after this adjustment
                    false, // Not historical update
                    true), // Update tank current stock
                cancellationToken);

            if (!updateResult.Success) {
                _logger.LogWarning ("Failed to update subsequent tank volume history: {Message}", updateResult.Message);
                // We continue since the adjustment was created successfully, but log the issue
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