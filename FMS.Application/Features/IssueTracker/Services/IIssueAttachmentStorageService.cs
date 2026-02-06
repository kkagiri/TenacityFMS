/**
 * File: IIssueAttachmentStorageService.cs
 * Purpose: Interface for issue attachment file storage operations
 * Dependencies: None
 * Last Modified: 2026-02-06
 */
using System.IO;
using System.Threading;
using System.Threading.Tasks;

namespace FMS.Application.Features.IssueTracker.Services
{
    /// <summary>
    /// Abstracts file storage for issue attachments (local disk, cloud, etc.)
    /// </summary>
    public interface IIssueAttachmentStorageService
    {
        /// <summary>
        /// Saves a file and returns the relative path where it was stored
        /// </summary>
        Task<string> SaveFileAsync(int issueId, string storedFileName, Stream fileStream, CancellationToken cancellationToken = default);

        /// <summary>
        /// Deletes a file by its relative path
        /// </summary>
        Task<bool> DeleteFileAsync(string relativePath, CancellationToken cancellationToken = default);

        /// <summary>
        /// Gets the full physical path for a relative path (for serving files)
        /// </summary>
        string GetFullPath(string relativePath);

        /// <summary>
        /// Checks whether a file exists at the given relative path
        /// </summary>
        bool FileExists(string relativePath);
    }
}
