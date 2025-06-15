using System;

namespace FMS.Application.ModelsDTOs.FMS.TankStock;

//Cursor - DTO for stock report summary
public class StockReportSummaryDTO {
    public int Id { get; set; }
    public string ReportType { get; set; } = null!;
    public DateTime GeneratedDate { get; set; }
    public string GeneratedBy { get; set; } = null!;
    public string Status { get; set; } = null!;
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public int? SiteId { get; set; }
    public string? FileName { get; set; }
    public string? ContentType { get; set; }
    public long? FileSize { get; set; }
    public string? ErrorMessage { get; set; }
}