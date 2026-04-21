

using System;
using System.Collections.Generic;

namespace FMS.Application.Features.ErrorHandling.Dtos
{
    public class ErrorLogDto
    {
        public Guid Id { get; set; }
        public DateTime TimeStamp { get; set; }
        public string Message { get; set; }
        public string Stack { get; set; }
        public string ComponentStack { get; set; }
        public string UserAgent { get; set; }
        public string Url { get; set; }
        public string UserId { get; set; }
        public string Fingerprint { get; set; }

        public DateTime CreatedAt { get; set; }
    }

    public class ErrorLogGroupDto
    {
        public string Fingerprint { get; set; }
        public string Message { get; set; }
        public string Stack { get; set; }
        public string ComponentStack { get; set; }
        public string Url { get; set; }
        public string UserAgent { get; set; }
        public DateTime FirstSeenAt { get; set; }
        public DateTime LastSeenAt { get; set; }
        public int OccurrenceCount { get; set; }
        public int DistinctUserCount { get; set; }
        public List<string> UserIds { get; set; } = new();
        public Guid LatestLogId { get; set; }
    }

    public class ErrorLogDashboardDto
    {
        public List<ErrorLogGroupDto> GroupedErrors { get; set; } = new();
        public List<ErrorLogDto> RecentErrors { get; set; } = new();
        public int PageNumber { get; set; }
        public int PageSize { get; set; }
        public int TotalRecentRecords { get; set; }
        public bool HasMore { get; set; }
    }

    public class ErrorLogReportDto
    {
        public string Message { get; set; }
        public string Stack { get; set; }
        public string ComponentStack { get; set; }
        public string UserAgent { get; set; }
        public DateTime TimeStamp { get; set; }
        public string Url { get; set; }
        public string UserId { get; set; } // Optional:can be populated by serversidte
    }
}