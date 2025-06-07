using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Domain.Entities;
using FMS.Domain.Entities.enums;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Command.DatabaseCommand.TankVolumeHistoryCommand {
    /// <summary>
    /// Command to reconcile all tanks' current stock with their latest volume history
    /// </summary>
    public record ReconcileAllTanksCommand (
        int? SiteId,
        string RecordedBy) : IRequest<FMSResponseMessage>;

    public class ReconcileAllTanksCommandHandler : IRequestHandler<ReconcileAllTanksCommand, FMSResponseMessage> {
        private readonly GpsdataContext _context;
        private readonly ILogger<ReconcileAllTanksCommandHandler> _logger;
        private readonly IMediator _mediator;

        public ReconcileAllTanksCommandHandler (
            GpsdataContext context,
            ILogger<ReconcileAllTanksCommandHandler> logger,
            IMediator mediator) {
            _context = context;
            _logger = logger;
            _mediator = mediator;
        }

        public async Task<FMSResponseMessage> Handle (ReconcileAllTanksCommand request, CancellationToken cancellationToken) {
            try {
                // Get all tanks, optionally filtered by site
                var query = _context.Tanks.AsQueryable ();

                if (request.SiteId.HasValue) {
                    query = query.Where (t => t.SiteId == request.SiteId.Value);
                }

                // Only consider tanks using bookkeeping
                query = query.Where (t => t.UseBookKeeping == 1);

                var tanks = await query.ToListAsync (cancellationToken);

                if (!tanks.Any ()) {
                    return new FMSResponseMessage (true, "No tanks found for reconciliation");
                }

                _logger.LogInformation ("Starting reconciliation for {Count} tanks", tanks.Count);

                var successCount = 0;
                var errorCount = 0;
                var errorMessages = new List<string> ();

                // Process each tank
                foreach (var tank in tanks) {
                    try {
                        // Get the latest volume history for this tank
                        var latestRecord = await _context.TankVolumeHistories
                            .Where (h => h.TankId == tank.Id)
                            .OrderByDescending (h => h.Timestamp)
                            .FirstOrDefaultAsync (cancellationToken);

                        if (latestRecord != null && latestRecord.NewVolume.HasValue) {
                            // Update tank's current stock with the latest volume
                            var oldStock = tank.CurrentStock;
                            tank.CurrentStock = latestRecord.NewVolume;
                            tank.LastStockUpdate = DateTime.Now;

                            _logger.LogInformation (
                                "Reconciling tank {TankId} ({TankName}) current stock. Old: {OldStock}, New: {NewStock}",
                                tank.Id, tank.Name, oldStock, tank.CurrentStock);

                            successCount++;
                        } else {
                            _logger.LogWarning ("No volume history found for tank {TankId} ({TankName})", tank.Id, tank.Name);
                            errorCount++;
                            errorMessages.Add ($"No volume history found for tank {tank.Name} (ID: {tank.Id})");
                        }
                    } catch (Exception ex) {
                        _logger.LogError (ex, "Error reconciling tank {TankId} ({TankName})", tank.Id, tank.Name);
                        errorCount++;
                        errorMessages.Add ($"Error reconciling tank {tank.Name} (ID: {tank.Id}): {ex.Message}");
                    }
                }

                // Save all changes
                await _context.SaveChangesAsync (cancellationToken);

                // Build response message
                if (errorCount == 0) {
                    return new FMSResponseMessage (true, $"Successfully reconciled {successCount} tanks");
                } else {
                    var message = $"Reconciled {successCount} tanks with {errorCount} errors: {string.Join("; ", errorMessages)}";
                    return new FMSResponseMessage (errorCount < tanks.Count, message);
                }
            } catch (Exception ex) {
                _logger.LogError (ex, "Error in reconcile all tanks command");
                return new FMSResponseMessage (false, $"Error reconciling all tanks: {ex.Message}");
            }
        }
    }
}