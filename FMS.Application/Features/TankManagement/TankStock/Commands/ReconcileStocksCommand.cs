using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Command.DatabaseCommand.TankVolumeHistoryCommand;
using FMS.Application.Common;
using FMS.Application.Features.FMS.TankStock;
using FMS.Domain.Entities;
using FMS.Domain.Entities.enums;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Command.DatabaseCommand.TankStockCommand;

//Cursor - Reconcile Stocks Command for bulk stock reconciliation with integration service
public record ReconcileStocksCommand (StockReconciliationRequestDTO ReconciliationRequest) : IRequest<FMSResponse<StockReconciliationResultDTO>>;

public class ReconcileStocksCommandHandler : IRequestHandler<ReconcileStocksCommand, FMSResponse<StockReconciliationResultDTO>> {
    private readonly GpsdataContext _context;
    private readonly ILogger<ReconcileStocksCommandHandler> _logger;
    private readonly TankVolumeHistoryIntegrationService _tankVolumeHistoryService; //Cursor - Added integration service

    public ReconcileStocksCommandHandler (
        GpsdataContext context,
        ILogger<ReconcileStocksCommandHandler> logger,
        TankVolumeHistoryIntegrationService tankVolumeHistoryService) { //Cursor - Added integration service
        _context = context;
        _logger = logger;
        _tankVolumeHistoryService = tankVolumeHistoryService; //Cursor - Added integration service
    }

    public async Task<FMSResponse<StockReconciliationResultDTO>> Handle (ReconcileStocksCommand request, CancellationToken cancellationToken) {
        try {
            var result = new StockReconciliationResultDTO {
                TotalReconciled = request.ReconciliationRequest.DiscrepancyIds.Count,
                ReconciliationDate = DateTime.UtcNow
            };

            // Validate user exists
            var user = await _context.Users.FirstOrDefaultAsync (u => u.Id == request.ReconciliationRequest.UserId, cancellationToken);
            if (user == null) {
                _logger.LogWarning ("User with ID {UserId} does not exist", request.ReconciliationRequest.UserId);
                return FMSResponse<StockReconciliationResultDTO>.Failed ($"User with ID {request.ReconciliationRequest.UserId} does not exist.");
            }

            // Cursor - Get discrepancies based on StockDiscrepancyDTO IDs (tank IDs)
            // Since DiscrepancyIds represent tank IDs in this context
            var tanks = await _context.Tanks
                .Include (t => t.Site)
                .Where (t => request.ReconciliationRequest.DiscrepancyIds.Contains (t.Id))
                .ToListAsync (cancellationToken);

            if (!tanks.Any ()) {
                _logger.LogWarning ("No tanks found for reconciliation");
                return FMSResponse<StockReconciliationResultDTO>.Failed ("No tanks found for reconciliation");
            }

            // Cursor - Use TankVolumeHistoryIntegrationService for proper reconciliation
            foreach (var tank in tanks) {
                try {
                    var reconciliationResult = await _tankVolumeHistoryService.ReconcileTankCurrentStockAsync (
                        tankId: tank.Id,
                        recordedBy: request.ReconciliationRequest.UserId,
                        cancellationToken: cancellationToken);

                    if (reconciliationResult.Success) {
                        result.SuccessfulReconciliations++;
                        _logger.LogInformation ("Successfully reconciled Tank {TankId} ({TankName})",
                            tank.Id, tank.Name);
                    } else {
                        result.FailedReconciliations++;
                        result.Errors.Add ($"Failed to reconcile Tank {tank.Name} (ID: {tank.Id}): {reconciliationResult.Message}");
                        _logger.LogWarning ("Failed to reconcile Tank {TankId}: {Message}",
                            tank.Id, reconciliationResult.Message);
                    }
                } catch (Exception ex) {
                    _logger.LogError (ex, "Error reconciling Tank {TankId}", tank.Id);
                    result.FailedReconciliations++;
                    result.Errors.Add ($"Failed to reconcile Tank {tank.Name} (ID: {tank.Id}): {ex.Message}");
                }
            }

            var message = result.FailedReconciliations > 0 ?
                $"Reconciliation completed with {result.FailedReconciliations} failures out of {result.TotalReconciled} tanks" :
                $"Successfully reconciled {result.SuccessfulReconciliations} tanks";

            _logger.LogInformation ("Stock reconciliation completed: {SuccessCount}/{TotalCount} successful",
                result.SuccessfulReconciliations, result.TotalReconciled);

            return FMSResponse<StockReconciliationResultDTO>.Success (result, message);
        } catch (Exception ex) {
            _logger.LogError (ex, "Error during stock reconciliation");
            return FMSResponse<StockReconciliationResultDTO>.SystemError ("An error occurred during stock reconciliation");
        }
    }
}