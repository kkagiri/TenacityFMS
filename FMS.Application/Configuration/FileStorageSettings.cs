/**
 * File: FileStorageSettings.cs
 * Purpose: Configuration settings for file storage (uploads, documents)
 * Dependencies: None
 * Last Modified: 2026-02-09
 *
 * Key Properties:
 * - BasePath: Root directory for file storage (must be writable by IIS app pool)
 * - MaxFileSizeMB: Maximum allowed file size in megabytes
 * - AllowedExtensions: Permitted file extensions for uploads
 */
namespace FMS.Application.Configuration
{
    /// <summary>
    /// Settings for file storage, bound from appsettings.json "FileStorage" section.
    /// Uses a dedicated writable path outside the deployment directory to avoid
    /// IIS permission issues (ContentRootPath/wwwroot is read-only for app pools).
    /// </summary>
    public class FileStorageSettings
    {
        public const string SectionName = "FileStorage";

        /// <summary>
        /// Root directory for file storage. Defaults to C:\FMSData\uploads.
        /// Must be writable by the IIS app pool identity.
        /// </summary>
        public string BasePath { get; set; } = @"C:\FMSData\uploads";

        /// <summary>
        /// Maximum allowed file size in megabytes.
        /// </summary>
        public int MaxFileSizeMB { get; set; } = 25;

        /// <summary>
        /// Permitted file extensions for uploads.
        /// </summary>
        public string[] AllowedExtensions { get; set; } = new[]
        {
            ".pdf", ".jpg", ".jpeg", ".png", ".doc", ".docx", ".xls", ".xlsx"
        };
    }
}
