using System;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.FuelAudit.DTOs;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.FuelAudit.Commands
{
    /// <summary>
    /// Command to submit tanker opening/closing readings
    /// </summary>
    public record SubmitTankerReadingCommand(SubmitTankerReadingDTO ReadingData)
        : IRequest<FMSResponse<TankerReadingDTO>>;

    /// <summary>
    /// Handler for SubmitTankerReadingCommand
    /// </summary>
    public class SubmitTankerReadingCommandHandler
        : IRequestHandler<SubmitTankerReadingCommand, FMSResponse<TankerReadingDTO>>
    {
        private readonly GpsdataContext _context;
        private readonly ILogger<SubmitTankerReadingCommandHandler> _logger;

        public SubmitTankerReadingCommandHandler(
            GpsdataContext context,
            ILogger<SubmitTankerReadingCommandHandler> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<FMSResponse<TankerReadingDTO>> Handle(
            SubmitTankerReadingCommand request,
            CancellationToken cancellationToken)
        {
            try
            {
                var dto = request.ReadingData;

                // Get the audit
                var audit = await _context.FuelAudits
                    .FirstOrDefaultAsync(a => a.Id == dto.AuditId, cancellationToken);

                if (audit == null)
                {
                    return FMSResponse<TankerReadingDTO>.Failed($"Audit {dto.AuditId} not found");
                }

                if (audit.Status == "Finalized" || audit.Status == "Cancelled")
                {
                    return FMSResponse<TankerReadingDTO>.Failed(
                        $"Cannot modify {audit.Status.ToLower()} audit");
                }

                // Get the tank
                var tank = await _context.Tanks
                    .FirstOrDefaultAsync(t => t.Id == dto.TankId, cancellationToken);

                if (tank == null)
                {
                    return FMSResponse<TankerReadingDTO>.Failed($"Tank {dto.TankId} not found");
                }

                // Find or create the reading record
                var reading = await _context.FuelAuditTankerReadings
                    .FirstOrDefaultAsync(r => r.AuditId == dto.AuditId && r.TankId == dto.TankId,
                        cancellationToken);

                if (reading == null)
                {
                    reading = new Domain.Entities.FuelAudit.FuelAuditTankerReading
                    {
                        AuditId = dto.AuditId,
                        TankId = (int)dto.TankId,
                        TankName = tank.Name,
                        TankCapacity = tank.TankVolume,
                        CreatedAt = DateTime.UtcNow,
                        CreatedBy = dto.CreatedBy
                    };
                    _context.FuelAuditTankerReadings.Add(reading);
                }

                // Update opening reading if provided
                if (dto.OpeningStock.HasValue)
                {
                    reading.OpeningStock = dto.OpeningStock;
                    reading.OpeningReadingTime = dto.OpeningReadingTime ?? DateTime.UtcNow;
                    reading.OpeningMethod = dto.OpeningMethod ?? "Manual";
                    reading.OpeningNotes = dto.OpeningNotes;
                }

                // Update closing reading if provided
                if (dto.ClosingStock.HasValue)
                {
                    reading.ClosingStock = dto.ClosingStock;
                    reading.ClosingReadingTime = dto.ClosingReadingTime ?? DateTime.UtcNow;
                    reading.ClosingMethod = dto.ClosingMethod ?? "Manual";
                    reading.ClosingNotes = dto.ClosingNotes;
                }

                // Update movement data if provided
                if (dto.FuelReceived.HasValue)
                    reading.FuelReceived = dto.FuelReceived;
                if (dto.FuelDispensed.HasValue)
                    reading.FuelDispensed = dto.FuelDispensed;
                if (dto.FuelTransferredIn.HasValue)
                    reading.FuelTransferredIn = dto.FuelTransferredIn;
                if (dto.FuelTransferredOut.HasValue)
                    reading.FuelTransferredOut = dto.FuelTransferredOut;

                reading.UpdatedAt = DateTime.UtcNow;
                reading.UpdatedBy = dto.UpdatedBy;

                await _context.SaveChangesAsync(cancellationToken);

                _logger.LogInformation("Submitted tanker reading for Tank {TankId} in Audit {AuditId}",
                    dto.TankId, dto.AuditId);

                // Return updated reading
                var result = new TankerReadingDTO
                {
                    Id = reading.Id,
                    AuditId = reading.AuditId,
                    TankId = reading.TankId,
                    TankName = reading.TankName,
                    TankCapacity = reading.TankCapacity,
                    OpeningStock = reading.OpeningStock,
                    OpeningReadingTime = reading.OpeningReadingTime,
                    OpeningMethod = reading.OpeningMethod,
                    OpeningNotes = reading.OpeningNotes,
                    ClosingStock = reading.ClosingStock,
                    ClosingReadingTime = reading.ClosingReadingTime,
                    ClosingMethod = reading.ClosingMethod,
                    ClosingNotes = reading.ClosingNotes,
                    FuelReceived = reading.FuelReceived,
                    FuelDispensed = reading.FuelDispensed,
                    FuelTransferredIn = reading.FuelTransferredIn,
                    FuelTransferredOut = reading.FuelTransferredOut,
                    ExpectedClosing = reading.ExpectedClosing,
                    Variance = reading.Variance,
                    VariancePercent = reading.VariancePercent,
                    HasVarianceFlag = reading.HasVarianceFlag,
                    CreatedAt = reading.CreatedAt
                };

                return FMSResponse<TankerReadingDTO>.Success(result, "Tanker reading saved");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error submitting tanker reading");
                return FMSResponse<TankerReadingDTO>.Failed($"Error: {ex.Message}");
            }
        }
    }
}
