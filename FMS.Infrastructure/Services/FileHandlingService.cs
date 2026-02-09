/**
 * File: FileHandlingService.cs
 * Purpose: Handles file uploads and deletions using a configurable external storage path
 * Dependencies: IFileHandlingService, FileStorageSettings, ILogger
 * Last Modified: 2026-02-09
 *
 * Key Functions:
 * - UploadFileAsync: Saves an uploaded file to the configured storage path
 * - DeleteFile: Removes a file from storage
 * - GetPhysicalPath: Resolves a relative file path to the physical storage location
 *
 * Note: Uses C:\FMSData\uploads by default (configurable via appsettings FileStorage:BasePath).
 *       Does NOT use ContentRootPath/wwwroot to avoid IIS permission issues.
 */
using FMS.Application.CommonInterface;
using FMS.Application.Configuration;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System;
using System.IO;
using System.Linq;
using System.Threading.Tasks;

namespace FMS.Infrastructure.Services
{
    public class FileHandlingService : IFileHandlingService
    {
        private readonly string _basePath;
        private readonly FileStorageSettings _settings;
        private readonly ILogger<FileHandlingService> _logger;

        public FileHandlingService(
            IOptions<FileStorageSettings> settings,
            ILogger<FileHandlingService> logger)
        {
            _settings = settings.Value;
            _logger = logger;
            _basePath = _settings.BasePath;

            // Ensure base storage directory exists on startup
            EnsureStorageDirectory(_basePath);
        }

        public bool DeleteFile(string filePath)
        {
            if (string.IsNullOrEmpty(filePath))
            {
                return false;
            }

            try
            {
                var physicalPath = GetPhysicalPath(filePath);

                if (!File.Exists(physicalPath))
                {
                    _logger.LogWarning("File not found for deletion: {FilePath}", physicalPath);
                    return false;
                }

                File.Delete(physicalPath);
                _logger.LogInformation("Deleted file: {FilePath}", physicalPath);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting file: {FilePath}", filePath);
                return false;
            }
        }

        public async Task<string> UploadFileAsync(IFormFile file, string uploadDirectory)
        {
            if (file == null || file.Length == 0)
            {
                return null;
            }

            // Validate file size
            var maxBytes = _settings.MaxFileSizeMB * 1024L * 1024L;
            if (file.Length > maxBytes)
            {
                throw new InvalidOperationException(
                    $"File size ({file.Length / (1024 * 1024.0):F1} MB) exceeds maximum allowed size ({_settings.MaxFileSizeMB} MB).");
            }

            // Validate file extension
            var extension = Path.GetExtension(file.FileName)?.ToLowerInvariant();
            if (_settings.AllowedExtensions?.Length > 0 &&
                !_settings.AllowedExtensions.Contains(extension, StringComparer.OrdinalIgnoreCase))
            {
                throw new InvalidOperationException(
                    $"File extension '{extension}' is not allowed. Allowed: {string.Join(", ", _settings.AllowedExtensions)}");
            }

            // Build storage path
            var uploadFolderPath = Path.Combine(_basePath, uploadDirectory);
            EnsureStorageDirectory(uploadFolderPath);

            var fileName = $"{Guid.NewGuid()}{extension}";
            var filePath = Path.Combine(uploadFolderPath, fileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            // Return URL using the API file-serving endpoint (/api/v1/files/)
            // This works with IIS ARR which already proxies /api/* to the backend.
            // Frontend opens this URL directly via window.open().
            var relativePath = Path.Combine(uploadDirectory, fileName).Replace("\\", "/");
            var servingUrl = $"/api/v1/files/{relativePath}";
            _logger.LogInformation("Uploaded file: {ServingUrl} ({Size} bytes)", servingUrl, file.Length);
            return servingUrl;
        }

        /// <summary>
        /// Resolves a relative file path to the full physical storage path.
        /// Handles multiple URL formats:
        ///   - Old format: vehicle-documents/abc.pdf
        ///   - Static middleware format: /uploads/vehicle-documents/abc.pdf
        ///   - API endpoint format: /api/v1/files/vehicle-documents/abc.pdf
        /// </summary>
        public string GetPhysicalPath(string relativePath)
        {
            if (string.IsNullOrEmpty(relativePath))
                return null;

            var normalized = relativePath
                .TrimStart('/')
                .Replace('/', Path.DirectorySeparatorChar);

            // Strip /uploads/ prefix if present
            var uploadsPrefix = $"uploads{Path.DirectorySeparatorChar}";
            if (normalized.StartsWith(uploadsPrefix, StringComparison.OrdinalIgnoreCase))
            {
                normalized = normalized.Substring(uploadsPrefix.Length);
            }

            // Strip /api/v1/files/ prefix if present
            var apiPrefix = $"api{Path.DirectorySeparatorChar}v1{Path.DirectorySeparatorChar}files{Path.DirectorySeparatorChar}";
            if (normalized.StartsWith(apiPrefix, StringComparison.OrdinalIgnoreCase))
            {
                normalized = normalized.Substring(apiPrefix.Length);
            }

            return Path.Combine(_basePath, normalized);
        }

        private void EnsureStorageDirectory(string path)
        {
            try
            {
                if (!Directory.Exists(path))
                {
                    Directory.CreateDirectory(path);
                    _logger.LogInformation("Created storage directory: {Path}", path);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to create storage directory: {Path}. File uploads may fail.", path);
            }
        }
    }
}
