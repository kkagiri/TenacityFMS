using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using FMS.Application.Common;
using FMS.Application.Common.PTSResponse;
using FMS.Application.Events.Pump;
using FMS.Application.Features.ATG;
using FMS.Application.Features.ATG.Common;
using FMS.Application.Services.Configuration;
using FMS.Domain.Entities;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Command.DatabaseCommand.PTSCommands.PumpTransactionCommand
{

    public record CreatePumpTransactionCommand(PumpTransactionDto PumpTransactionDto) : IRequest<FMSResponseMessage>;

    public class CreatePumpTransactionCommandHandler : IRequestHandler<CreatePumpTransactionCommand, FMSResponseMessage>
    {
        private readonly GpsdataContext _context;
        private readonly ILogger<CreatePumpTransactionCommandHandler> _logger;
        private readonly PumpTransactionIntegrationService _integrationService;
        private readonly ISystemConfigurationService _systemConfigService;
        private readonly IMediator _mediator;

        public CreatePumpTransactionCommandHandler(
            GpsdataContext context,
            ILogger<CreatePumpTransactionCommandHandler> logger,
            PumpTransactionIntegrationService integrationService,
            ISystemConfigurationService systemConfigService,
            IMediator mediator)
        {
            _context = context ??
                throw new ArgumentNullException(nameof(context));
            _logger = logger ??
                throw new ArgumentNullException(nameof(logger));
            _integrationService = integrationService ??
                throw new ArgumentNullException(nameof(integrationService));
            _systemConfigService = systemConfigService ??
                throw new ArgumentNullException(nameof(systemConfigService));
            _mediator = mediator ??
                throw new ArgumentNullException(nameof(mediator));
        }

        public async Task<FMSResponseMessage> Handle(CreatePumpTransactionCommand request, CancellationToken cancellationToken)
        {
            try
            {
                var validationErrors = ValidatePumpTransaction(request.PumpTransactionDto);
                if (validationErrors.Any())
                {
                    _logger.LogWarning("Pump transaction validation failed: {Errors}", string.Join(", ", validationErrors));
                    return new FMSResponseMessage(false, $"Validation failed: {string.Join(", ", validationErrors)}");
                }

                var existingTransaction = await CheckExistingTransaction(request.PumpTransactionDto, cancellationToken);
                if (existingTransaction != null)
                {
                    _logger.LogInformation("Pump transaction already exists for PTS {PtsId}, Transaction {TransactionId}",
                        request.PumpTransactionDto.PtsId, request.PumpTransactionDto.Transaction);

                    // Check if it already has a tank volume history entry
                    if (!existingTransaction.HasBeenProcessed && existingTransaction.TankId.HasValue)
                    {
                        await ProcessTankVolumeHistory(existingTransaction, cancellationToken);
                    }

                    return new FMSResponseMessage(true, "Transaction already exists");
                }

                var pumpTransactionData = new Pumptransaction
                {
                    PacketId = request.PumpTransactionDto.PacketId,
                    PtsId = request.PumpTransactionDto.PtsId,
                    DateTime = request.PumpTransactionDto.DateTime,
                    DateTimeStart = request.PumpTransactionDto.DateTimeStart,
                    FuelGradeId = request.PumpTransactionDto.FuelGradeId,
                    FuelGradeName = request.PumpTransactionDto.FuelGradeName,
                    Nozzle = request.PumpTransactionDto.Nozzle,
                    Price = request.PumpTransactionDto.Price,
                    Pump = request.PumpTransactionDto.Pump,
                    Tag = request.PumpTransactionDto.Tag,
                    Tcvolume = request.PumpTransactionDto.TCVolume,
                    TotalAmount = request.PumpTransactionDto.TotalAmount,
                    TotalVolume = request.PumpTransactionDto.TotalVolume,
                    Transaction = request.PumpTransactionDto.Transaction,
                    UserId = request.PumpTransactionDto.UserId,
                    Volume = request.PumpTransactionDto.Volume,
                    ConfigurationId = request.PumpTransactionDto.ConfigurationId,
                    TankId = request.PumpTransactionDto.TankId,
                    VehicleId = request.PumpTransactionDto.VehicleId,
                    Odometer = request.PumpTransactionDto.Odometer, //Cursor: Add odometer reading
                    FuelLevelBefore = request.PumpTransactionDto.FuelLevelBefore,
                    FuelLevelAfter = request.PumpTransactionDto.FuelLevelAfter,
                    HasBeenProcessed = false
                };

                // Get site ID from tank if available
                int? siteId = null;
                if (pumpTransactionData.TankId.HasValue)
                {
                    var tank = await _context.Tanks.FindAsync(new object[] { pumpTransactionData.TankId.Value }, cancellationToken);
                    siteId = tank?.SiteId;
                }

                // Check configuration to see if we should check for duplicates
                var checkForDuplicates = await _systemConfigService.GetPtsCheckForDuplicateManualEntriesAsync(cancellationToken);

                // Check for potential duplicate manual entry if configured and we have vehicle ID
                if (checkForDuplicates &&
                    pumpTransactionData.VehicleId.HasValue &&
                    pumpTransactionData.Volume.HasValue)
                {

                    var isDuplicate = await _integrationService.CheckForDuplicateManualEntryAsync(
                        pumpTransactionData.VehicleId.Value,
                        pumpTransactionData.Volume.Value,
                        pumpTransactionData.DateTime,
                        siteId,
                        _mediator,
                        cancellationToken);

                    if (isDuplicate)
                    {
                        _logger.LogWarning("Detected potential duplicate manual entry for vehicle {VehicleId} with volume {Volume}. " +
                            "Skipping tank volume history update to prevent double-counting.",
                            pumpTransactionData.VehicleId, pumpTransactionData.Volume);
                        pumpTransactionData.HasBeenProcessed = true; // Mark as processed to avoid future processing
                    }
                }

                await _context.SaveChangesAsync(cancellationToken);

                // Publish event so downstream handlers (refueling, calibration) can react
                try
                {
                    await _mediator.Publish(new TransactionCompletedEvent(
                        pumpTransactionData.PtsId,
                        pumpTransactionData.Pump ?? 0,
                        pumpTransactionData.Id,
                        pumpTransactionData.Nozzle), cancellationToken);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to publish TransactionCompletedEvent for transaction {Id}", pumpTransactionData.Id);
                }

                // Process tank volume history if configured, not a duplicate, and we have tank ID
                var autoCreateLedger = await _systemConfigService.GetPtsAutoCreateLedgerEntriesAsync(cancellationToken);
                if (autoCreateLedger &&
                    !pumpTransactionData.HasBeenProcessed &&
                    pumpTransactionData.TankId.HasValue)
                {
                    await ProcessTankVolumeHistory(pumpTransactionData, cancellationToken);
                }

                _logger.LogInformation("Pump transaction saved successfully for PTS {PtsId}, Transaction {TransactionId}",
                    request.PumpTransactionDto.PtsId, request.PumpTransactionDto.Transaction);
                return new FMSResponseMessage(true, "Transaction saved successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error saving pump transaction for PTS {PtsId}, Transaction {TransactionId}",
                    request.PumpTransactionDto.PtsId, request.PumpTransactionDto.Transaction);
                return new FMSResponseMessage(false, $"Error saving transaction: {ex.Message}");
            }
        }

        private async Task ProcessTankVolumeHistory(Pumptransaction transaction, CancellationToken cancellationToken)
        {
            if (!transaction.TankId.HasValue || !transaction.Volume.HasValue)
            {
                _logger.LogWarning("Cannot process tank volume history - missing tank ID or volume for transaction {TransactionId}",
                    transaction.Transaction);
                return;
            }

            // IMPORTANT: Use transaction.Id (database primary key), NOT transaction.Transaction (PTS transaction number)
            var result = await _integrationService.ProcessPumpTransactionAsync(
                transaction.TankId.Value,
                transaction.Id,  // Fixed: Use database Id, not PTS Transaction number
                transaction.DateTime,
                transaction.Volume.Value,
                transaction.UserId?.ToString() ?? "System",
                cancellationToken);

            if (result.Success)
            {
                // Mark as processed to avoid duplicate processing
                transaction.HasBeenProcessed = true;
                await _context.SaveChangesAsync(cancellationToken);
            }
        }

        private List<string> ValidatePumpTransaction(PumpTransactionDto dto)
        {
            var errors = new List<string>();

            if (string.IsNullOrEmpty(dto.PtsId))
                errors.Add("PTS ID is required");

            if (dto.Pump <= 0)
                errors.Add("Invalid pump number");

            if (dto.Transaction <= 0)
                errors.Add("Invalid transaction number");



            return errors;
        }

        private async Task<Pumptransaction> CheckExistingTransaction(PumpTransactionDto dto, CancellationToken cancellationToken)
        {
            return await _context.Pumptransactions
                .FirstOrDefaultAsync(p => p.PtsId == dto.PtsId && p.Transaction == dto.Transaction,
                    cancellationToken);
        }
    }
}