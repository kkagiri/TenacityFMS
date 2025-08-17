using System.Collections.Generic;

namespace FMS.Application.Features.Notification.DTOs.AlarmHandlers {
    /// <summary>
    /// Metadata describing a supported alarm handler type and its dynamic fields.
    /// </summary>
    public class AlarmHandlerTypeMetadataDto {
        public string Type { get; set; } = string.Empty; // internal key
        public string Label { get; set; } = string.Empty; // user-facing label
        public string? Description { get; set; }
        public List<AlarmHandlerFieldMetadataDto> Fields { get; set; } = new ();
    }

    public class AlarmHandlerFieldMetadataDto {
        public string Name { get; set; } = string.Empty;
        public string Label { get; set; } = string.Empty;
        public string FieldType { get; set; } = "string"; // string|number|boolean
        public string? Unit { get; set; }
        public bool Required { get; set; }
        public object? DefaultValue { get; set; }
    }
}