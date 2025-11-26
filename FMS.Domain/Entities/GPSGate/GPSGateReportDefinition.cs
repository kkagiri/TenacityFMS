using System;

namespace FMS.Domain.Entities.GPSGate
{
    public class GPSGateReportDefinition
    {
        public int Id { get; set; }
        public int ReportId { get; set; }
        public string ReportName { get; set; }
        public string Description { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }
}
