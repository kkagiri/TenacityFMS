/**
 * File: AlarmReportRecordDto.cs
 * Purpose: Flat DTO used by the reporting module to render device and probe alarm report rows.
 * Dependencies: None
 * Last Modified: 2026-03-24
 */
using System;

namespace FMS.Application.Features.Notification.DTOs.Notification
{
    public class AlarmReportRecordDto
    {
        public int Id { get; set; }
        public DateTime OccurredAt { get; set; }
        public string PtsId { get; set; } = string.Empty;
        public string DeviceType { get; set; } = string.Empty;
        public int DeviceNumber { get; set; }
        public int AlertCode { get; set; }
        public string State { get; set; } = string.Empty;
        public string AlarmType { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Severity { get; set; } = string.Empty;
        public string? ConfigurationId { get; set; }
        public int? AlarmId { get; set; }
    }
}