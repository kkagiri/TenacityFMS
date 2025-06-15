using MediatR;

namespace FMS.Domain.Events;

//Cursor - Domain event for discrepancy detection
public class DiscrepancyDetectedEvent : INotification {
    public int TankId { get; set; }
    public int PolicyId { get; set; }
    public decimal VarianceLiters { get; set; }
    public decimal VariancePercentage { get; set; }
    public DateTime DetectedAt { get; set; }
    public DiscrepancySeverity Severity { get; set; }
    public decimal ExpectedVolume { get; set; }
    public decimal ActualVolume { get; set; }
}

public enum DiscrepancySeverity {
    Low,
    Medium,
    High,
    Critical
}