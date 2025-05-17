using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using FMS.Application.Common;
using FMS.Application.Common.PTSResponse;
using FMS.Application.ModelsDTOs.ATG;
using FMS.Application.ModelsDTOs.ATG.Common;
using FMS.Domain.Entities;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Command.DatabaseCommand.PTSCommands.PumpTransactionCommand {
    public record CreatePumpTransactionCommand (PumpTransactionDto PumpTransactionDto) : IRequest<FMSResponseMessage>;

    public class CreatePumpTransactionCommandHandler : IRequestHandler<CreatePumpTransactionCommand, FMSResponseMessage> {
        private readonly GpsdataContext _context;
        private readonly ILogger<CreatePumpTransactionCommandHandler> _logger;

        public CreatePumpTransactionCommandHandler (GpsdataContext context, ILogger<CreatePumpTransactionCommandHandler> logger) {
            _context = context ??
                throw new ArgumentNullException (nameof (context));
            _logger = logger ??
                throw new ArgumentNullException (nameof (logger));
        }

        public async Task<FMSResponseMessage> Handle (CreatePumpTransactionCommand request, CancellationToken cancellationToken) {
            try {
                var validationErrors = ValidatePumpTransaction (request.PumpTransactionDto);
                if (validationErrors.Any ()) {
                    _logger.LogWarning ("Pump transaction validation failed: {Errors}", string.Join (", ", validationErrors));
                    return new FMSResponseMessage (false, $"Validation failed: {string.Join(", ", validationErrors)}");
                }

                var existingTransaction = await CheckExistingTransaction (request.PumpTransactionDto, cancellationToken);
                if (existingTransaction != null) {
                    _logger.LogInformation ("Pump transaction already exists for PTS {PtsId}, Transaction {TransactionId}",
                        request.PumpTransactionDto.PtsId, request.PumpTransactionDto.Transaction);
                    return new FMSResponseMessage (true, "Transaction already exists");
                }

                var pumpTransactionData = new Pumptransaction {
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
                    ConfigurationId = request.PumpTransactionDto.ConfigurationId
                };

                _context.Pumptransactions.Add (pumpTransactionData);
                await _context.SaveChangesAsync (cancellationToken);

                _logger.LogInformation ("Pump transaction saved successfully for PTS {PtsId}, Transaction {TransactionId}",
                    request.PumpTransactionDto.PtsId, request.PumpTransactionDto.Transaction);
                return new FMSResponseMessage (true, "Transaction saved successfully");
            } catch (Exception ex) {
                _logger.LogError (ex, "Error saving pump transaction for PTS {PtsId}, Transaction {TransactionId}",
                    request.PumpTransactionDto.PtsId, request.PumpTransactionDto.Transaction);
                return new FMSResponseMessage (false, $"Error saving transaction: {ex.Message}");
            }
        }

        private List<string> ValidatePumpTransaction (PumpTransactionDto dto) {
            var errors = new List<string> ();

            if (string.IsNullOrEmpty (dto.PtsId))
                errors.Add ("PTS ID is required");

            if (dto.Pump <= 0)
                errors.Add ("Invalid pump number");

            if (dto.Nozzle <= 0)
                errors.Add ("Invalid nozzle number");

            if (dto.Transaction <= 0)
                errors.Add ("Invalid transaction number");

            if (dto.Volume <= 0)
                errors.Add ("Invalid volume");

            if (dto.Amount < 0)
                errors.Add ("Amount cannot be negative");

            return errors;
        }

        private async Task<Pumptransaction> CheckExistingTransaction (PumpTransactionDto dto, CancellationToken cancellationToken) {
            return await _context.Pumptransactions.FindAsync (
                new object[] { dto.PtsId, dto.Transaction },
                cancellationToken);
        }
    }
}