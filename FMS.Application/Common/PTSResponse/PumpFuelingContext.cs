using System;
using FMS.Application.Common.Constants;

namespace FMS.Application.Common.PTSResponse
{
    /// <summary>
    /// Context information for active fueling operations, broadcasted with upload status.
    /// This provides real-time visibility into who is fueling what at each pump.
    /// </summary>
    public class PumpFuelingContext
    {
        /// <summary>
        /// Pump ID this context applies to
        /// </summary>
        public int PumpId { get; set; }

        /// <summary>
        /// Transaction ID if available
        /// </summary>
        public int? TransactionId { get; set; }

        /// <summary>
        /// Fueling mode: "Vehicle" or "Transfer" (to tank)
        /// Use PumpOperationMode constants for strong typing
        /// </summary>
        public string Mode { get; set; } = PumpOperationMode.Unknown;

        /// <summary>
        /// Vehicle ID if fueling a vehicle
        /// </summary>
        public int? VehicleId { get; set; }

        /// <summary>
        /// Vehicle plate number or Hyoung number for display
        /// </summary>
        public string? VehicleName { get; set; }

        /// <summary>
        /// Tank ID if this is a transfer operation
        /// </summary>
        public int? TankId { get; set; }

        /// <summary>
        /// Tank name for display
        /// </summary>
        public string? TankName { get; set; }

        /// <summary>
        /// User ID who authorized the fueling
        /// </summary>
        public string? FueledByUserId { get; set; }

        /// <summary>
        /// User name who authorized the fueling for display
        /// </summary>
        public string? FueledByUserName { get; set; }

        /// <summary>
        /// The fuel tag used for this transaction (if any)
        /// </summary>
        public string? Tag { get; set; }

        /// <summary>
        /// Nozzle ID being used
        /// </summary>
        public int? NozzleId { get; set; }

        /// <summary>
        /// When the authorization was granted
        /// </summary>
        public DateTime? AuthorizedAt { get; set; }

        /// <summary>
        /// Connection type used (WebSocket/HTTP)
        /// </summary>
        public string? ConnectionType { get; set; }

        /// <summary>
        /// Whether auto-close is enabled for this transaction
        /// </summary>
        public bool AutoCloseTransaction { get; set; }

        /// <summary>
        /// Odometer reading at authorization time
        /// </summary>
        public decimal? Odometer { get; set; }
    }
}
