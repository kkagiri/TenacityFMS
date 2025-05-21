// using System;
// using System.Threading;
// using System.Threading.Tasks;
// using FMS.Application.Command.DatabaseCommand.TankVolumeHistoryCommand;
// using FMS.Application.Common;
// using FMS.Domain.Entities;
// using FMS.Persistence.DataAccess;
// using MediatR;
// using Microsoft.EntityFrameworkCore;
// using Microsoft.Extensions.Logging;

// namespace FMS.Application.Command.DatabaseCommand.FuelRefillCommand {
//     /*
//      * THIS IS A SAMPLE FILE DEMONSTRATING HOW TO USE THE TankVolumeHistoryIntegrationService
//      * It is not meant to be used in production, but rather as a reference for implementing
//      * tank volume history integration in the real command handlers.
//      */

//     // Example of a command that creates a fuel refill
//     public record CreateSampleFuelRefillCommand (
//         int VehicleId,
//         int TankId,
//         DateTime RefillDate,
//         decimal Amount,
//         string UserId) : IRequest<FMSResponseMessage>;

//     public class CreateSampleFuelRefillCommandHandler : IRequestHandler<CreateSampleFuelRefillCommand, FMSResponseMessage> {
//         private readonly GpsdataContext _context;
//         private readonly ILogger<CreateSampleFuelRefillCommandHandler> _logger;
//         private readonly TankVolumeHistoryIntegrationService _tankVolumeHistoryService;

//         public CreateSampleFuelRefillCommandHandler (
//             GpsdataContext context,
//             ILogger<CreateSampleFuelRefillCommandHandler> logger,
//             TankVolumeHistoryIntegrationService tankVolumeHistoryService) {
//             _context = context;
//             _logger = logger;
//             _tankVolumeHistoryService = tankVolumeHistoryService;
//         }

//         public async Task<FMSResponseMessage> Handle (CreateSampleFuelRefillCommand request, CancellationToken cancellationToken) {
//             try {
//                 // Validate the request
//                 if (request.Amount <= 0) {
//                     return new FMSResponseMessage (false, "Refill amount must be greater than zero");
//                 }

//                 var vehicle = await _context.Vehicles.FirstOrDefaultAsync (v => v.Id == request.VehicleId, cancellationToken);
//                 if (vehicle == null) {
//                     return new FMSResponseMessage (false, $"Vehicle with ID {request.VehicleId} not found");
//                 }

//                 var tank = await _context.Tanks.FirstOrDefaultAsync (t => t.Id == request.TankId, cancellationToken);
//                 if (tank == null) {
//                     return new FMSResponseMessage (false, $"Tank with ID {request.TankId} not found");
//                 }

//                 // Create new fuel refill
//                 var fuelRefill = new Fuelrefil {
//                     VehicleId = request.VehicleId,
//                     TankId = request.TankId,
//                     RefillDate = request.RefillDate,
//                     Amount = request.Amount,
//                     CreatedOn = DateTime.UtcNow,
//                     CreatedBy = request.UserId
//                 };

//                 _context.Fuelrefils.Add (fuelRefill);
//                 await _context.SaveChangesAsync (cancellationToken);

//                 // After saving the fuel refill, update tank volume history
//                 // Note: fuel refills decrease tank volume (negative volume change)
//                 var volumeUpdateResult = await _tankVolumeHistoryService.ProcessFuelRefillChangeAsync (
//                     tankId: request.TankId,
//                     timestamp: request.RefillDate,
//                     volumeChange: -request.Amount, // Negative because fuel is taken from the tank
//                     refillId : fuelRefill.Id,
//                     actionType : ActionType.Create, // This is a new refill
//                     recordedBy : request.UserId,
//                     cancellationToken : cancellationToken);

//                 if (!volumeUpdateResult.Success) {
//                     _logger.LogWarning ("Failed to update tank volume history: {Message}", volumeUpdateResult.Message);
//                     // We continue even if volume history update fails, but log the error
//                 }

//                 return new FMSResponseMessage (true, "Fuel refill created successfully");
//             } catch (Exception ex) {
//                 _logger.LogError (ex, "Error creating fuel refill");
//                 return new FMSResponseMessage (false, $"Error creating fuel refill: {ex.Message}");
//             }
//         }
//     }

//     // Example of a command that updates a fuel refill
//     public record UpdateSampleFuelRefillCommand (
//         int FuelRefillId,
//         int TankId,
//         DateTime RefillDate,
//         decimal NewAmount,
//         decimal OldAmount,
//         string UserId) : IRequest<FMSResponseMessage>;

//     public class UpdateSampleFuelRefillCommandHandler : IRequestHandler<UpdateSampleFuelRefillCommand, FMSResponseMessage> {
//         private readonly GpsdataContext _context;
//         private readonly ILogger<UpdateSampleFuelRefillCommandHandler> _logger;
//         private readonly TankVolumeHistoryIntegrationService _tankVolumeHistoryService;

//         public UpdateSampleFuelRefillCommandHandler (
//             GpsdataContext context,
//             ILogger<UpdateSampleFuelRefillCommandHandler> logger,
//             TankVolumeHistoryIntegrationService tankVolumeHistoryService) {
//             _context = context;
//             _logger = logger;
//             _tankVolumeHistoryService = tankVolumeHistoryService;
//         }

//         public async Task<FMSResponseMessage> Handle (UpdateSampleFuelRefillCommand request, CancellationToken cancellationToken) {
//             try {
//                 // Validate the request
//                 if (request.NewAmount <= 0) {
//                     return new FMSResponseMessage (false, "Refill amount must be greater than zero");
//                 }

//                 var fuelRefill = await _context.FuelRefills.FindAsync (new object[] { request.FuelRefillId }, cancellationToken);
//                 if (fuelRefill == null) {
//                     return new FMSResponseMessage (false, $"Fuel refill with ID {request.FuelRefillId} not found");
//                 }

//                 // Update fuel refill
//                 fuelRefill.RefillDate = request.RefillDate;
//                 fuelRefill.Amount = request.NewAmount;
//                 fuelRefill.UpdatedOn = DateTime.UtcNow;
//                 fuelRefill.UpdatedBy = request.UserId;

//                 await _context.SaveChangesAsync (cancellationToken);

//                 // The volume change is the difference between the new and old amount
//                 // Remember that refills reduce tank volume, so we negate the amounts
//                 decimal volumeChange = -request.NewAmount;

//                 // Update tank volume history
//                 var volumeUpdateResult = await _tankVolumeHistoryService.ProcessFuelRefillChangeAsync (
//                     tankId: request.TankId,
//                     timestamp: request.RefillDate,
//                     volumeChange: volumeChange,
//                     refillId: fuelRefill.Id,
//                     actionType: ActionType.Update, // This is an update
//                     recordedBy : request.UserId,
//                     cancellationToken : cancellationToken);

//                 if (!volumeUpdateResult.Success) {
//                     _logger.LogWarning ("Failed to update tank volume history: {Message}", volumeUpdateResult.Message);
//                     // We continue even if volume history update fails, but log the error
//                 }

//                 return new FMSResponseMessage (true, "Fuel refill updated successfully");
//             } catch (Exception ex) {
//                 _logger.LogError (ex, "Error updating fuel refill");
//                 return new FMSResponseMessage (false, $"Error updating fuel refill: {ex.Message}");
//             }
//         }
//     }

//     // Example of a command that deletes a fuel refill
//     public record DeleteSampleFuelRefillCommand (
//         int FuelRefillId,
//         int TankId,
//         decimal Amount,
//         DateTime RefillDate,
//         string UserId) : IRequest<FMSResponseMessage>;

//     public class DeleteSampleFuelRefillCommandHandler : IRequestHandler<DeleteSampleFuelRefillCommand, FMSResponseMessage> {
//         private readonly GpsdataContext _context;
//         private readonly ILogger<DeleteSampleFuelRefillCommandHandler> _logger;
//         private readonly TankVolumeHistoryIntegrationService _tankVolumeHistoryService;

//         public DeleteSampleFuelRefillCommandHandler (
//             GpsdataContext context,
//             ILogger<DeleteSampleFuelRefillCommandHandler> logger,
//             TankVolumeHistoryIntegrationService tankVolumeHistoryService) {
//             _context = context;
//             _logger = logger;
//             _tankVolumeHistoryService = tankVolumeHistoryService;
//         }

//         public async Task<FMSResponseMessage> Handle (DeleteSampleFuelRefillCommand request, CancellationToken cancellationToken) {
//             try {
//                 var fuelRefill = await _context.FuelRefils.FindAsync (new object[] { request.FuelRefillId }, cancellationToken);
//                 if (fuelRefill == null) {
//                     return new FMSResponseMessage (false, $"Fuel refill with ID {request.FuelRefillId} not found");
//                 }

//                 _context.FuelRefils.Remove (fuelRefill);
//                 await _context.SaveChangesAsync (cancellationToken);

//                 // When deleting a fuel refill, we need to update the tank volume history
//                 // The volume change is positive (we're adding back the amount that was removed)
//                 var volumeUpdateResult = await _tankVolumeHistoryService.ProcessFuelRefillChangeAsync (
//                     tankId: request.TankId,
//                     timestamp: request.RefillDate,
//                     volumeChange: request.Amount, // Positive because we're removing the refill
//                     refillId : request.FuelRefillId,
//                     actionType : ActionType.Delete, // This is a deletion
//                     recordedBy : request.UserId,
//                     cancellationToken : cancellationToken);

//                 if (!volumeUpdateResult.Success) {
//                     _logger.LogWarning ("Failed to update tank volume history: {Message}", volumeUpdateResult.Message);
//                     // We continue even if volume history update fails, but log the error
//                 }

//                 return new FMSResponseMessage (true, "Fuel refill deleted successfully");
//             } catch (Exception ex) {
//                 _logger.LogError (ex, "Error deleting fuel refill");
//                 return new FMSResponseMessage (false, $"Error deleting fuel refill: {ex.Message}");
//             }
//         }
//     }
// }