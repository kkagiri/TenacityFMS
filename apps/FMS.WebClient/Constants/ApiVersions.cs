namespace FMS.WebClient.Constants {
    /// <summary>
    /// Centralized API version management for the FMS system
    /// </summary>
    public static class ApiVersions {
        /// <summary>
        /// Version 1 identifier
        /// </summary>
        public const string V1 = "v1";

        /// <summary>
        /// Current API version (defaults to V1)
        /// </summary>
        public const string Current = V1;

        /// <summary>
        /// Route constants for API versioning
        /// </summary>
        public static class Routes {
            /// <summary>
            /// Base route for API v1 endpoints
            /// </summary>
            public const string V1_BASE = "api/v1";

            /// <summary>
            /// Current base route (defaults to V1)
            /// </summary>
            public const string CURRENT_BASE = V1_BASE;
        }

        /// <summary>
        /// Version headers for API requests
        /// </summary>
        public static class Headers {
            /// <summary>
            /// API version header name
            /// </summary>
            public const string VERSION_HEADER = "API-Version";

            /// <summary>
            /// Default version header value
            /// </summary>
            public const string DEFAULT_VERSION = V1;
        }
    }
}