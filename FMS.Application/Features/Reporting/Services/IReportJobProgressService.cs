/**
 * File: IReportJobProgressService.cs
 * Purpose: Interface for broadcasting async report job progress via SignalR.
 *          Mirrors the IGpsFetchProgressService pattern.
 * Dependencies: FrontEndHub, ReportJobProgressDTO
 * Last Modified: 2026-02-24
 *
 * Key Methods:
 * - SendJobStarted: Broadcast that a report job has been queued
 * - SendProgress: Broadcast incremental progress updates
 * - SendCompleted: Broadcast completion with download info
 * - SendError: Broadcast failure
 */

using System.Threading.Tasks;
using FMS.Application.Features.Reporting.DTOs;

namespace FMS.Application.Features.Reporting.Services
{
    /// <summary>
    /// Broadcasts report job lifecycle events via SignalR FrontEndHub
    /// </summary>
    public interface IReportJobProgressService
    {
        Task SendJobStarted(ReportJobProgressDTO progress);
        Task SendProgress(ReportJobProgressDTO progress);
        Task SendCompleted(ReportJobProgressDTO progress);
        Task SendError(ReportJobProgressDTO progress);
    }
}
