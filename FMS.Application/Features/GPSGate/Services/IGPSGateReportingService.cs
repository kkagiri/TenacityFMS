using System;
using System.Threading.Tasks;
using FMS.Application.Features.GPSGate.DTOs;

namespace FMS.Application.Features.GPSGate.Services
{
    public interface IGPSGateReportingService
    {
        Task<GenerateReportResponseDto> GenerateReportAsync(string sessionId, int reportId, DateTime startDate, DateTime endDate);
        Task<ReportStatusDto> GetReportStatusAsync(string sessionId, int handleId);
        Task<FetchReportResponseDto> FetchReportAsync(string sessionId, int handleId);
        Task<bool> CancelReportAsync(string sessionId, int handleId);
    }
}
