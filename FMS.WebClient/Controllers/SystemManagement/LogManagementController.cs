using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using FMS.Application.Services.Logging;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace FMS.WebClient.Controllers.SystemManagement
{
    /// <summary>
    /// Controller for managing system logs - download, cleanup, and configuration
    /// </summary>
    [ApiController]
    [Route("api/v1/[controller]")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    public class LogManagementController : ControllerBase
    {
        private readonly ILogCleanupService _logCleanupService;
        private readonly ILogger<LogManagementController> _logger;

        // Log directories from appsettings.json
        private static readonly Dictionary<string, string> LogDirectories = new()
        {
            { "app", @"C:\Logs\FMS.Webclient\app" },
            { "errors", @"C:\Logs\FMS.Webclient\errors" },
            { "audit", @"C:\Logs\FMS.Webclient\audit" },
            { "slow", @"C:\Logs\FMS.Webclient\slow" },
            { "startup", @"C:\Logs\FMS.Webclient\startup" }
        };

        public LogManagementController(
            ILogCleanupService logCleanupService,
            ILogger<LogManagementController> logger)
        {
            _logCleanupService = logCleanupService;
            _logger = logger;
        }

        /// <summary>
        /// Get list of available log categories
        /// </summary>
        [HttpGet("categories")]
        public ActionResult<IEnumerable<LogCategoryDto>> GetLogCategories()
        {
            try
            {
                var categories = LogDirectories.Select(kvp => new LogCategoryDto
                {
                    Name = kvp.Key,
                    Path = kvp.Value,
                    Exists = Directory.Exists(kvp.Value),
                    FileCount = Directory.Exists(kvp.Value) ? Directory.GetFiles(kvp.Value, "*.log").Length : 0
                }).ToList();

                return Ok(categories);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving log categories");
                return StatusCode(500, new { message = "Error retrieving log categories" });
            }
        }

        /// <summary>
        /// Get list of log files for a specific category
        /// </summary>
        /// <param name="category">Log category (app, errors, audit, slow, startup)</param>
        [HttpGet("files/{category}")]
        public ActionResult<IEnumerable<LogFileDto>> GetLogFiles(string category)
        {
            try
            {
                if (!LogDirectories.TryGetValue(category.ToLower(), out var directoryPath))
                {
                    return BadRequest(new { message = $"Invalid log category: {category}" });
                }

                if (!Directory.Exists(directoryPath))
                {
                    return NotFound(new { message = $"Log directory not found: {directoryPath}" });
                }

                var files = Directory.GetFiles(directoryPath, "*.log")
                    .Select(f =>
                    {
                        var fileInfo = new FileInfo(f);
                        return new LogFileDto
                        {
                            FileName = fileInfo.Name,
                            FullPath = fileInfo.FullName,
                            SizeBytes = fileInfo.Length,
                            SizeMB = Math.Round(fileInfo.Length / (1024.0 * 1024.0), 2),
                            CreatedDate = fileInfo.CreationTime,
                            ModifiedDate = fileInfo.LastWriteTime,
                            Category = category
                        };
                    })
                    .OrderByDescending(f => f.ModifiedDate)
                    .ToList();

                return Ok(files);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving log files for category: {Category}", category);
                return StatusCode(500, new { message = "Error retrieving log files" });
            }
        }

        /// <summary>
        /// Download a specific log file
        /// </summary>
        /// <param name="category">Log category</param>
        /// <param name="fileName">File name</param>
        [HttpGet("download/{category}/{fileName}")]
        public IActionResult DownloadLogFile(string category, string fileName)
        {
            try
            {
                if (!LogDirectories.TryGetValue(category.ToLower(), out var directoryPath))
                {
                    return BadRequest(new { message = $"Invalid log category: {category}" });
                }

                var filePath = Path.Combine(directoryPath, fileName);

                // Security check: ensure the file is within the allowed directory
                var fullPath = Path.GetFullPath(filePath);
                var fullDirectory = Path.GetFullPath(directoryPath);

                if (!fullPath.StartsWith(fullDirectory, StringComparison.OrdinalIgnoreCase))
                {
                    _logger.LogWarning("Attempted directory traversal attack: {FilePath}", filePath);
                    return BadRequest(new { message = "Invalid file path" });
                }

                if (!System.IO.File.Exists(filePath))
                {
                    return NotFound(new { message = $"Log file not found: {fileName}" });
                }

                _logger.LogInformation("User {User} downloading log file: {Category}/{FileName}",
                    User?.Identity?.Name ?? "Unknown", category, fileName);

                var fileBytes = System.IO.File.ReadAllBytes(filePath);
                return File(fileBytes, "text/plain", fileName);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error downloading log file: {Category}/{FileName}", category, fileName);
                return StatusCode(500, new { message = "Error downloading log file" });
            }
        }

        /// <summary>
        /// Download all log files for a category as a zip
        /// </summary>
        /// <param name="category">Log category</param>
        [HttpGet("download-all/{category}")]
        public IActionResult DownloadAllLogs(string category)
        {
            try
            {
                if (!LogDirectories.TryGetValue(category.ToLower(), out var directoryPath))
                {
                    return BadRequest(new { message = $"Invalid log category: {category}" });
                }

                if (!Directory.Exists(directoryPath))
                {
                    return NotFound(new { message = $"Log directory not found: {directoryPath}" });
                }

                var files = Directory.GetFiles(directoryPath, "*.log");
                if (files.Length == 0)
                {
                    return NotFound(new { message = "No log files found" });
                }

                _logger.LogInformation("User {User} downloading all {Category} logs ({Count} files)",
                    User?.Identity?.Name ?? "Unknown", category, files.Length);

                using (var memoryStream = new MemoryStream())
                {
                    using (var archive = new System.IO.Compression.ZipArchive(memoryStream, System.IO.Compression.ZipArchiveMode.Create, true))
                    {
                        foreach (var file in files)
                        {
                            var fileInfo = new FileInfo(file);
                            var entry = archive.CreateEntry(fileInfo.Name);

                            using var entryStream = entry.Open();
                            using var fileStream = System.IO.File.OpenRead(file);
                            fileStream.CopyTo(entryStream);
                        }
                    }

                    memoryStream.Position = 0;
                    var zipFileName = $"{category}-logs-{DateTime.Now:yyyyMMdd-HHmmss}.zip";
                    return File(memoryStream.ToArray(), "application/zip", zipFileName);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error downloading all logs for category: {Category}", category);
                return StatusCode(500, new { message = "Error downloading logs" });
            }
        }

        /// <summary>
        /// Get current log retention configuration
        /// </summary>
        [HttpGet("retention")]
        public async Task<ActionResult<LogRetentionDto>> GetLogRetention()
        {
            try
            {
                var retentionDays = await _logCleanupService.GetLogRetentionDaysAsync();
                return Ok(new LogRetentionDto
                {
                    RetentionDays = retentionDays,
                    CutoffDate = DateTime.Now.AddDays(-retentionDays)
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving log retention configuration");
                return StatusCode(500, new { message = "Error retrieving retention configuration" });
            }
        }

        /// <summary>
        /// Manually trigger log cleanup
        /// </summary>
        [HttpPost("cleanup")]
        public async Task<ActionResult<LogCleanupResultDto>> TriggerLogCleanup()
        {
            try
            {
                _logger.LogInformation("Manual log cleanup triggered by user: {User}", User?.Identity?.Name ?? "Unknown");

                var deletedCount = await _logCleanupService.CleanupOldLogsAsync();
                var retentionDays = await _logCleanupService.GetLogRetentionDaysAsync();

                return Ok(new LogCleanupResultDto
                {
                    Success = true,
                    DeletedFiles = deletedCount,
                    RetentionDays = retentionDays,
                    CleanupDate = DateTime.Now,
                    Message = $"Successfully deleted {deletedCount} log files older than {retentionDays} days"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during manual log cleanup");
                return StatusCode(500, new LogCleanupResultDto
                {
                    Success = false,
                    DeletedFiles = 0,
                    Message = $"Error during log cleanup: {ex.Message}"
                });
            }
        }

        /// <summary>
        /// Get log statistics
        /// </summary>
        [HttpGet("statistics")]
        public ActionResult<LogStatisticsDto> GetLogStatistics()
        {
            try
            {
                var statistics = new LogStatisticsDto
                {
                    Categories = new List<CategoryStatistics>()
                };

                long totalSize = 0;
                int totalFiles = 0;

                foreach (var kvp in LogDirectories)
                {
                    if (!Directory.Exists(kvp.Value))
                    {
                        continue;
                    }

                    var files = Directory.GetFiles(kvp.Value, "*.log");
                    var categorySize = files.Sum(f => new FileInfo(f).Length);

                    totalSize += categorySize;
                    totalFiles += files.Length;

                    statistics.Categories.Add(new CategoryStatistics
                    {
                        Category = kvp.Key,
                        FileCount = files.Length,
                        TotalSizeBytes = categorySize,
                        TotalSizeMB = Math.Round(categorySize / (1024.0 * 1024.0), 2),
                        OldestFile = files.Length > 0 ? files.Min(f => new FileInfo(f).LastWriteTime) : (DateTime?)null,
                        NewestFile = files.Length > 0 ? files.Max(f => new FileInfo(f).LastWriteTime) : (DateTime?)null
                    });
                }

                statistics.TotalFiles = totalFiles;
                statistics.TotalSizeBytes = totalSize;
                statistics.TotalSizeMB = Math.Round(totalSize / (1024.0 * 1024.0), 2);

                return Ok(statistics);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving log statistics");
                return StatusCode(500, new { message = "Error retrieving log statistics" });
            }
        }
    }

    // DTOs
    public class LogCategoryDto
    {
        public string Name { get; set; } = null!;
        public string Path { get; set; } = null!;
        public bool Exists { get; set; }
        public int FileCount { get; set; }
    }

    public class LogFileDto
    {
        public string FileName { get; set; } = null!;
        public string FullPath { get; set; } = null!;
        public long SizeBytes { get; set; }
        public double SizeMB { get; set; }
        public DateTime CreatedDate { get; set; }
        public DateTime ModifiedDate { get; set; }
        public string Category { get; set; } = null!;
    }

    public class LogRetentionDto
    {
        public int RetentionDays { get; set; }
        public DateTime CutoffDate { get; set; }
    }

    public class LogCleanupResultDto
    {
        public bool Success { get; set; }
        public int DeletedFiles { get; set; }
        public int RetentionDays { get; set; }
        public DateTime? CleanupDate { get; set; }
        public string Message { get; set; } = null!;
    }

    public class LogStatisticsDto
    {
        public int TotalFiles { get; set; }
        public long TotalSizeBytes { get; set; }
        public double TotalSizeMB { get; set; }
        public List<CategoryStatistics> Categories { get; set; } = new();
    }

    public class CategoryStatistics
    {
        public string Category { get; set; } = null!;
        public int FileCount { get; set; }
        public long TotalSizeBytes { get; set; }
        public double TotalSizeMB { get; set; }
        public DateTime? OldestFile { get; set; }
        public DateTime? NewestFile { get; set; }
    }
}
