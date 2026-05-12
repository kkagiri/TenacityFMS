//Cursor: System Configuration Query Parameters DTO
using System.ComponentModel.DataAnnotations;

namespace FMS.Application.Features.SystemConfiguration {
    public class SystemConfigurationQueryDto {
        [Range (1, int.MaxValue, ErrorMessage = "Page must be greater than 0")]
        public int Page { get; set; } = 1;

        [Range (1, 100, ErrorMessage = "Page size must be between 1 and 100")]
        public int PageSize { get; set; } = 50;

        public string Category { get; set; } = string.Empty;
        public string DataType { get; set; } = string.Empty;
        public string SearchTerm { get; set; } = string.Empty;

        // Using string to handle null values properly from query string
        private string? _isActive = null;
        public string IsActiveString {
            get => _isActive;
            set => _isActive = value;
        }

        private string? _isEditable = null;
        public string IsEditableString {
            get => _isEditable;
            set => _isEditable = value;
        }

        // Computed properties that convert string to nullable boolean
        public bool? IsActive {
            get {
                if (string.IsNullOrEmpty (_isActive) || _isActive.Equals ("null", System.StringComparison.OrdinalIgnoreCase))
                    return null;

                if (bool.TryParse (_isActive, out bool result))
                    return result;

                return null;
            }
        }

        public bool? IsEditable {
            get {
                if (string.IsNullOrEmpty (_isEditable) || _isEditable.Equals ("null", System.StringComparison.OrdinalIgnoreCase))
                    return null;

                if (bool.TryParse (_isEditable, out bool result))
                    return result;

                return null;
            }
        }
    }
}