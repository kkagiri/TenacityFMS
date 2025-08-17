using System;
using MediatR;

namespace FMS.Domain.Events {
    /// <summary>
    /// Domain event published when opening stock is successfully created
    /// Used by NotificationPolicy system for variance detection
    /// </summary>
    public class OpeningStockCreatedEvent : INotification {
        public int TankId { get; set; }
        public decimal OpeningStock { get; set; }
        public decimal? PreviousClosingStock { get; set; }
        public DateTime EntryDate { get; set; }
        public string RecordedBy { get; set; } = null!;
        public int SiteId { get; set; }
        public decimal TankCapacity { get; set; }
        public int StockId { get; set; }
        public string TankName { get; set; } = null!;
        public string SiteName { get; set; } = null!;

        // Additional context for variance calculation
        public decimal? LastPhysicalStock { get; set; }
        public DateTime? LastPhysicalStockDate { get; set; }
        public decimal? AverageStock30Days { get; set; }
        public bool IsFirstOpeningStock { get; set; }
    }
}