using System.Collections.Generic;

namespace FMS.Application.Features.GPSGate.DTOs
{
    /// <summary>
    /// Generic DTO for processed report results
    /// </summary>
    /// <typeparam name="T">The type of data in the report</typeparam>
    public class ProcessedReportDto<T> where T : class
    {
        public int ReportId { get; set; }
        public string ReportName { get; set; }
        public int HandleId { get; set; }
        public int TotalRows { get; set; }
        public List<T> Data { get; set; }

        public ProcessedReportDto()
        {
            Data = new List<T>();
        }
    }
}
