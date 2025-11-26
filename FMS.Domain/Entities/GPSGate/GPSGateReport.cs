using System;

namespace FMS.Domain.Entities.GPSGate
{
    public class GPSGateReport
    {
        public int Id { get; set; }
        public int ReportId { get; set; }
        public string? ReportName { get; set; }
        public int HandleId { get; set; }
        public string SessionId { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public string Status { get; set; } // Processing, Completed, Failed, Cancelled
        public DateTime RequestedAt { get; set; }
        public DateTime? CompletedAt { get; set; }
        public string? ReportData { get; set; }
        public string? ErrorMessage { get; set; }
        public int? RequestedByUserId { get; set; }
    }
}
