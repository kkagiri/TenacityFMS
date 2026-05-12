using System;
using System.Collections.Generic;

namespace FMS.Application.Features.FMS.TankStock;

//Cursor - DTO for stock report generation results
public class StockReportResultDTO {
    public string Id { get; set; } = null!;
    public string ReportType { get; set; } = null!;
    public DateTime GeneratedDate { get; set; }
    public string GeneratedBy { get; set; } = null!;
    public string Status { get; set; } = null!;
    public int TotalTanks { get; set; }
    public decimal TotalCapacity { get; set; }
    public decimal TotalCurrentStock { get; set; }
    public decimal AverageUtilization { get; set; }
    public List<object> ReportData { get; set; } = new List<object> ();
}