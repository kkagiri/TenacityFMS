namespace FMS.IoT.Contracts.Gateway.Models;

/// <summary>
/// Validation result for protocol messages
/// </summary>
public class ValidationResult {
    public bool IsValid { get; set; }
    public List<string> Warnings { get; set; } = new ();
    public List<string> Errors { get; set; } = new ();
    public Dictionary<string, object> Context { get; set; } = new ();
    public string? SchemaVersion { get; set; }
    public DateTime ValidatedAt { get; set; } = DateTime.UtcNow;
}