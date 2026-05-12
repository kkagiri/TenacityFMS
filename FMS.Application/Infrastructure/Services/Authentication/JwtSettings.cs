using System;

namespace FMS.Application.Infrastructure.Services.Authentication {
    /// <summary>
    /// JWT settings class for configuration
    /// </summary>
    public class JwtSettings {
        /// <summary>
        /// Secret key for signing JWT tokens
        /// </summary>
        public string SecretKey { get; set; }

        /// <summary>
        /// JWT issuer
        /// </summary>
        public string Issuer { get; set; }

        /// <summary>
        /// JWT audience
        /// </summary>
        public string Audience { get; set; }

        /// <summary>
        /// Number of days before the token expires
        /// </summary>
        public int ExpireDays { get; set; }
    }
}