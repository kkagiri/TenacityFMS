using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Domain.Entities;
using FMS.Domain.Entities.enums;
using FMS.Persistence.DataAccess;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Primitives;

namespace FMS.Application.Command.DatabaseCommand.Common
{
    /// <summary>
    /// Appends a new adjustment in TankVolumeHistory for a given tank,
    /// referencing the transaction's old volume and the new volume.
    /// Optionally ignores negative changes and can re-base subsequent entries.
    /// </summary>
    /// <param name="tankId">The tank to adjust</param>
    /// <param name="referenceID">The ID of the transaction that triggered the adjustment</param>
    /// <param name="oldVolume">The volume before the adjustment</param>
    /// <param name="newVolume">The volume after the adjustment</param>
    /// <param name="reasonEnum">The reason for the adjustment</param>
    /// <param name="ignoreNegatives">Whether to ignore negative changes</param>
    /// <param name="rebaseSubsequentTransactions">Whether to recalculate subsequent ledger entries
    ///  after applying this change</param>
    public interface ITankVolumeAdjustmentService
    {
        Task AdjustTankVolumeAsync(
            int tankId,
            int referenceID,
            decimal oldVolume,
            decimal newVolume,
            VolumeChangeReasonEnum reasonEnum,
            string recordedBy,
            bool ignoreNegatives = false,
            bool rebaseSubsequentTransactions = true,
            CancellationToken cancellationToken = default
        );
    }


    public class TankVolumeAdjustmentService : ITankVolumeAdjustmentService
    {
        private readonly GpsdataContext _context;
        private readonly ILogger<TankVolumeAdjustmentService> _logger;

        public TankVolumeAdjustmentService(GpsdataContext context, ILogger<TankVolumeAdjustmentService> logger)
        {
            _context = context;
            _logger = logger;
        }



        public async Task AdjustTankVolumeAsync(
            int tankId,
            int referenceID,
            decimal oldVolume,
            decimal newVolume,
            VolumeChangeReasonEnum reasonEnum,
            string recordedBy,
            bool ignoreNegatives = false,
            bool rebaseSubsequentTransactions = true,
            CancellationToken cancellationToken = default)
        {

            var difference = newVolume - oldVolume;

            if (ignoreNegatives && difference < 0)
            {
                _logger.LogWarning("Ignoring negative volume change for tank {tankId} from {oldVolume} to {newVolume}", tankId, oldVolume, newVolume);
                return;

            }



            var newHistoryEntry = new TankVolumeHistory
            {
                TankId = tankId,
                CreatedOn = DateTime.UtcNow,
                NewVolume = newVolume,
                ChangeReason = reasonEnum,
                ReferenceId = referenceID,
                VolumeChange = difference,
                ReferenceType = reasonEnum.ToString(),
                RecordedBy = recordedBy
            };

            await _context.TankVolumeHistories.AddAsync(newHistoryEntry, cancellationToken);
            await _context.SaveChangesAsync(cancellationToken);

            if (rebaseSubsequentTransactions)
            {
                await RebaseSubsequentTransactionsAsync(tankId, newHistoryEntry.Timestamp, difference, cancellationToken);
            }

        }


        private async Task RebaseSubsequentTransactionsAsync(int tankId, DateTime timestamp, decimal difference, CancellationToken cancellationToken)
        {
            var subsequentTransactions = await _context.TankVolumeHistories
                .Where(x => x.TankId == tankId && x.Timestamp > timestamp)
                .OrderBy(x => x.Timestamp)
                .ToListAsync(cancellationToken);

            foreach (var transaction in subsequentTransactions)
            {
                // Increase or decrease the "NewVolume" by the difference
                transaction.NewVolume = (transaction.NewVolume ?? 0) + difference;
                transaction.VolumeChange += difference;

                _context.TankVolumeHistories.Update(transaction);

            }

            await _context.SaveChangesAsync(cancellationToken);
        }

    }
}