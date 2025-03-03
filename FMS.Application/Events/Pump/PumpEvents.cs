using MediatR;

namespace FMS.Application.Events.Pump
{


    public record NozzleStateChangeEvent : INotification
    {
        // Required primary fields
        public string DeviceId { get; init; }
        public int PumpId { get; init; }
        public int NozzleId { get; init; }

        // Last transaction details - these match the protocol specification
        public int? LastNozzle { get; init; }
        public int? LastTransaction { get; init; }
        public decimal? LastVolume { get; init; }
        public decimal? LastAmount { get; init; }
        public decimal? LastPrice { get; init; }

        // Constructor for creating the event
        public NozzleStateChangeEvent(
            string deviceId,
            int pumpId,
            int nozzleNumber,
            int? lastNozzle = null,
            int? lastTransaction = null,
            decimal? lastVolume = null,
            decimal? lastAmount = null,
            decimal? lastPrice = null)
        {
            DeviceId = deviceId;
            PumpId = pumpId;
            NozzleId = nozzleNumber;
            LastNozzle = lastNozzle;
            LastTransaction = lastTransaction;
            LastVolume = lastVolume;
            LastAmount = lastAmount;
            LastPrice = lastPrice;
        }
    }

    public record TagReadEvent(string DeviceId, int PumpId, int NozzleId, string TagId) : INotification;

    public record PumpStateChangeEvent(string DeviceId, int PumpId, string State) : INotification;

    public record TransactionCompletedEvent(string DeviceId, int PumpId, int TrasactionId) : INotification;
}