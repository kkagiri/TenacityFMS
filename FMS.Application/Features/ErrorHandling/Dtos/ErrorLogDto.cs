

using System;

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

        public DateTime CreatedAt { get; set; }
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