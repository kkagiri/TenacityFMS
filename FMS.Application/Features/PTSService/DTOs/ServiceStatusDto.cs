using System;
using System.Collections.Generic;

namespace FMS.Application.Features.PTSService.DTOs {
    public class ServiceStatusDto {
        public string ServiceName { get; set; }
        public string Status { get; set; }
        public DateTime LastStatusCheck { get; set; }
        public string DisplayName { get; set; }
        public bool CanStart { get; set; }
        public bool CanStop { get; set; }
        public bool CanRestart { get; set; }
        public string StartType { get; set; }
        public DateTime? LastStartTime { get; set; }
        public string ProcessId { get; set; }
        public long? MemoryUsageMB { get; set; }
        public string LogFilePath { get; set; }
        public List<string> RecentLogEntries { get; set; } = new ();
        public Dictionary<string, object> AdditionalInfo { get; set; } = new ();
    }
}