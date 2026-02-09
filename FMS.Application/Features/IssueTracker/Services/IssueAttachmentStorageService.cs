/**
 * File: IssueAttachmentStorageService.cs
 * Purpose: Local file system implementation for issue attachment storage
 * Dependencies: IConfiguration
 * Last Modified: 2026-02-09
 *
 * Key Functions:
 * - SaveFileAsync: Stores file in {BasePath}/{issueId}/{storedFileName}
 * - DeleteFileAsync: Removes a stored file from disk
 * - GetFullPath: Resolves relative path to absolute path
 *
 * Configuration: Set "IssueTracker:AttachmentStoragePath" in appsettings.json
 *   Default: C:\FMSData\uploads\issues (writable outside IIS deployment directory)
 */
using System;
using System.IO;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.IssueTracker.Services
{
    public class IssueAttachmentStorageService : IIssueAttachmentStorageService
    {
        private readonly string _basePath;
        private readonly ILogger<IssueAttachmentStorageService> _logger;

        public IssueAttachmentStorageService(IConfiguration configuration, ILogger<IssueAttachmentStorageService> logger)
        {
            _logger = logger;

            // Use configured path, or default to C:\FMSData\uploads\issues
            // DO NOT use AppDomain.CurrentDomain.BaseDirectory — under IIS that's the
            // read-only deployment directory (C:\inetpub\wwwroot\...)
            _basePath = configuration["IssueTracker:AttachmentStoragePath"]
                ?? Path.Combine("C:\\", "FMSData", "uploads", "issues");

            // Ensure the base directory exists
            try
            {
                if (!Directory.Exists(_basePath))
                {
                    Directory.CreateDirectory(_basePath);
                    _logger.LogInformation("Created attachment storage directory: {BasePath}", _basePath);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to create attachment storage directory: {BasePath}. Uploads may fail.", _basePath);
            }
        }

        public async Task<string> SaveFileAsync(int issueId, string storedFileName, Stream fileStream, CancellationToken cancellationToken = default)
        {
            var issueDir = Path.Combine(_basePath, issueId.ToString());
            if (!Directory.Exists(issueDir))
            {
                Directory.CreateDirectory(issueDir);
            }

            var fullPath = Path.Combine(issueDir, storedFileName);
            var relativePath = $"issues/{issueId}/{storedFileName}";

            using (var output = new FileStream(fullPath, FileMode.Create, FileAccess.Write))
            {
                await fileStream.CopyToAsync(output, cancellationToken);
            }

            _logger.LogInformation("Stored attachment {FileName} for issue {IssueId} at {Path}", storedFileName, issueId, relativePath);
            return relativePath;
        }

        public Task<bool> DeleteFileAsync(string relativePath, CancellationToken cancellationToken = default)
        {
            var fullPath = GetFullPath(relativePath);
            if (File.Exists(fullPath))
            {
                File.Delete(fullPath);
                _logger.LogInformation("Deleted attachment at {Path}", relativePath);
                return Task.FromResult(true);
            }

            _logger.LogWarning("Attempted to delete non-existent attachment at {Path}", relativePath);
            return Task.FromResult(false);
        }

        public string GetFullPath(string relativePath)
        {
            // relativePath is like "issues/42/abc.jpg", base already points to the issues root
            // Strip the leading "issues/" since _basePath already covers it
            var stripped = relativePath.StartsWith("issues/", StringComparison.OrdinalIgnoreCase)
                ? relativePath.Substring("issues/".Length)
                : relativePath;

            return Path.Combine(_basePath, stripped.Replace('/', Path.DirectorySeparatorChar));
        }

        public bool FileExists(string relativePath)
        {
            return File.Exists(GetFullPath(relativePath));
        }
    }
}
