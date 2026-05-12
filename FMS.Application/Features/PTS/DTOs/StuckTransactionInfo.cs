using System;

namespace FMS.Application.Features.PTS.DTOs
{
    /// <summary>
    /// Information about a stuck (stale) transaction detected on a pump.
    /// Used during authorization to prevent new transactions when stuck ones exist.
    /// </summary>
    public class StuckTransactionInfo
    {
        /// <summary>
        /// The transaction ID that is stuck.
        /// </summary>
        public int TransactionId { get; set; }

        /// <summary>
        /// The pump ID where the stuck transaction exists.
        /// </summary>
        public int PumpId { get; set; }

        /// <summary>
        /// The device ID containing the stuck transaction.
        /// </summary>
        public string DeviceId { get; set; } = string.Empty;

        /// <summary>
        /// When the transaction was started.
        /// </summary>
        public DateTime StartTime { get; set; }

        /// <summary>
        /// How long the transaction has been stuck.
        /// </summary>
        public TimeSpan Age { get; set; }
    }
}
