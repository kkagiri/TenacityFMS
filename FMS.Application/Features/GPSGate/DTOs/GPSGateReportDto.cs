using System;

namespace FMS.Application.Features.GPSGate.DTOs
{
    public class GPSGateReportDto
    {
        public int Id { get; set; }
        public int ReportId { get; set; }
        public string ReportName { get; set; }
        public int HandleId { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public string Status { get; set; }
        public DateTime RequestedAt { get; set; }
        public DateTime? CompletedAt { get; set; }
        public string ErrorMessage { get; set; }
    }

    public class GenerateReportRequestDto
    {
        public int ReportId { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
    }

    public class GenerateReportResponseDto
    {
        public int HandleId { get; set; }
        public bool Success { get; set; }
        public string Message { get; set; }
    }

    public class ReportStatusDto
    {
        public int HandleId { get; set; }
        public string Status { get; set; }
        public int Progress { get; set; }
        public string Message { get; set; }
    }

    public class FetchReportResponseDto
    {
        public string ReportData { get; set; }
        public bool Success { get; set; }
        public string Message { get; set; }
    }
}
