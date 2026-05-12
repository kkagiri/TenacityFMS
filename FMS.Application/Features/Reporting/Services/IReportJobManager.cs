/**
 * File: IReportJobManager.cs
 * Purpose: Interface for managing async report generation jobs.
 *          Provides job submission, status tracking, result download, and cancellation.
 * Dependencies: ReportJobDTO, SubmitReportJobDTO
 * Last Modified: 2026-02-24
 *
 * Key Methods:
 * - SubmitJobAsync: Queue a new report generation job
 * - GetJobStatus: Get current status of a job
 * - GetJobResult: Get the generated file bytes for download
 * - CancelJob: Cancel a running job
 * - GetActiveJobs: List active jobs for a user
 */

using System.Collections.Generic;
using System.Threading.Tasks;
using FMS.Application.Features.Reporting.DTOs;

namespace FMS.Application.Features.Reporting.Services
{
    /// <summary>
    /// Manages the lifecycle of async report generation jobs
    /// </summary>
    public interface IReportJobManager
    {
        /// <summary>Submit a new async report generation job</summary>
        Task<ReportJobDTO> SubmitJobAsync(SubmitReportJobDTO request, string userId, string userName, string userEmail);

        /// <summary>Get current status of a job</summary>
        ReportJobDTO GetJobStatus(string jobId);

        /// <summary>Get the generated file bytes (returns null if not ready)</summary>
        byte[] GetJobResult(string jobId);

        /// <summary>Cancel a running job</summary>
        bool CancelJob(string jobId);

        /// <summary>Get active jobs for a specific user</summary>
        IEnumerable<ReportJobDTO> GetActiveJobs(string userId);

        /// <summary>Clean up expired jobs (called periodically)</summary>
        void CleanupExpiredJobs();

        /// <summary>Enable email delivery on a running or completed job</summary>
        bool SetEmailDelivery(string jobId, string emailAddress);
    }
}
