namespace FMS.Application.Features.Notification.DTOs {
    /// <summary>
    /// Email configuration settings
    /// </summary>
    public class EmailSettings {
        /// <summary>
        /// SMTP server address
        /// </summary>
        public string SmtpServer { get; set; } = string.Empty;

        /// <summary>
        /// SMTP server port
        /// </summary>
        public int SmtpPort { get; set; } = 25;

        /// <summary>
        /// Whether to use SSL/TLS
        /// </summary>
        public bool UseSsl { get; set; } = false;

        /// <summary>
        /// SMTP username for authentication
        /// </summary>
        public string? Username { get; set; }

        /// <summary>
        /// SMTP password for authentication
        /// </summary>
        public string? Password { get; set; }

        /// <summary>
        /// Default from address
        /// </summary>
        public string FromAddress { get; set; } = string.Empty;

        /// <summary>
        /// Default from display name
        /// </summary>
        public string? FromDisplayName { get; set; }

        /// <summary>
        /// Connection timeout in seconds
        /// </summary>
        public int TimeoutSeconds { get; set; } = 30;

        /// <summary>
        /// Maximum retry attempts for failed emails
        /// </summary>
        public int MaxRetryAttempts { get; set; } = 3;

        /// <summary>
        /// Delay between retry attempts in seconds
        /// </summary>
        public int RetryDelaySeconds { get; set; } = 5;
    }
}