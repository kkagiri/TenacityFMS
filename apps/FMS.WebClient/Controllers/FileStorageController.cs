/**
 * File: FileStorageController.cs
 * Purpose: Serves uploaded files from the external file storage path (C:\FMSData\uploads)
 * Dependencies: FileStorageSettings
 * Last Modified: 2026-02-09
 *
 * Key Endpoints:
 * - GET /api/v1/files/{*filePath}: Serves a file from storage with proper content type
 *
 * Security: Files are named with GUIDs (unguessable). Anonymous access is allowed
 * to support window.open() from the frontend which cannot send JWT bearer tokens.
 * This matches the original behavior where files were served as static files from wwwroot.
 */
using FMS.Application.Configuration;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.StaticFiles;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System;
using System.IO;

namespace FMS.WebClient.Controllers
{
    [ApiController]
    [Route("api/v1/files")]
    public class FileStorageController : ControllerBase
    {
        private readonly FileStorageSettings _settings;
        private readonly ILogger<FileStorageController> _logger;
        private readonly FileExtensionContentTypeProvider _contentTypeProvider;

        public FileStorageController(
            IOptions<FileStorageSettings> settings,
            ILogger<FileStorageController> logger)
        {
            _settings = settings.Value;
            _logger = logger;
            _contentTypeProvider = new FileExtensionContentTypeProvider();
        }

        /// <summary>
        /// Serves an uploaded file from external storage.
        /// Example: GET /api/v1/files/vehicle-documents/abc123.pdf
        /// AllowAnonymous because the frontend uses window.open() which cannot attach JWT headers.
        /// Files use GUID names so they are not guessable.
        /// </summary>
        [HttpGet("{**filePath}")]
        [AllowAnonymous]
        public IActionResult GetFile(string filePath)
        {
            if (string.IsNullOrWhiteSpace(filePath))
            {
                return BadRequest(new { success = false, message = "File path is required" });
            }

            // Sanitize path to prevent directory traversal attacks
            var normalized = filePath
                .Replace("..", "")
                .Replace("~", "")
                .TrimStart('/');

            var physicalPath = Path.Combine(_settings.BasePath, normalized.Replace('/', Path.DirectorySeparatorChar));

            // Ensure the resolved path is still within the base storage directory
            var fullBasePath = Path.GetFullPath(_settings.BasePath);
            var fullFilePath = Path.GetFullPath(physicalPath);

            if (!fullFilePath.StartsWith(fullBasePath, StringComparison.OrdinalIgnoreCase))
            {
                _logger.LogWarning("Path traversal attempt blocked: {RequestedPath}", filePath);
                return BadRequest(new { success = false, message = "Invalid file path" });
            }

            if (!System.IO.File.Exists(fullFilePath))
            {
                return NotFound(new { success = false, message = "File not found" });
            }

            // Determine content type
            if (!_contentTypeProvider.TryGetContentType(fullFilePath, out var contentType))
            {
                contentType = "application/octet-stream";
            }

            _logger.LogDebug("Serving file: {FilePath} ({ContentType})", filePath, contentType);

            var fileStream = new FileStream(fullFilePath, FileMode.Open, FileAccess.Read, FileShare.Read);
            return File(fileStream, contentType);
        }
    }
}
