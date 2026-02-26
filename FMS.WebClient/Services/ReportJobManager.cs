/**
 * File: ReportJobManager.cs
 * Purpose: In-memory manager for async report generation jobs.
 *          Orchestrates data fetching (via MediatR), PDF/Excel rendering (via JsReport),
 *          SignalR progress broadcasting, and optional email delivery.
 * Dependencies: MediatR, IJsReportService, IReportJobProgressService, IEmailService
 * Last Modified: 2026-02-24
 *
 * Key Features:
 * - ConcurrentDictionary-based in-memory job store with auto-cleanup
 * - Background Task.Run execution with progress updates every phase
 * - Result bytes cached for 30 minutes for download
 * - Optional email delivery of finished PDF/Excel reports
 */

using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Newtonsoft.Json.Linq;
using FMS.Application.Features.Reporting.DTOs;
using FMS.Application.Features.Reporting.Services;
using FMS.Application.Features.Notification.Services;
using FMS.Application.Features.Notification.DTOs;
using FMS.WebClient.Services.Reporting;
using MediatR;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace FMS.WebClient.Services
{
    /// <summary>
    /// In-memory async report job manager with SignalR progress tracking
    /// </summary>
    public class ReportJobManager : IReportJobManager
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly IReportJobProgressService _progressService;
        private readonly ILogger<ReportJobManager> _logger;

        /// <summary>Active job metadata keyed by JobId</summary>
        private readonly ConcurrentDictionary<string, ReportJobDTO> _jobs = new();

        /// <summary>Generated report bytes keyed by JobId (auto-expire after 30 min)</summary>
        private readonly ConcurrentDictionary<string, (byte[] Data, DateTime ExpiresAt)> _results = new();

        /// <summary>Cancellation tokens keyed by JobId</summary>
        private readonly ConcurrentDictionary<string, CancellationTokenSource> _cancellations = new();

        /// <summary>How long to keep results available for download</summary>
        private static readonly TimeSpan ResultTTL = TimeSpan.FromMinutes(30);

        /// <summary>Max concurrent report jobs per user</summary>
        private const int MaxJobsPerUser = 3;

        public ReportJobManager(
            IServiceScopeFactory scopeFactory,
            IReportJobProgressService progressService,
            ILogger<ReportJobManager> logger)
        {
            _scopeFactory = scopeFactory;
            _progressService = progressService;
            _logger = logger;
        }

        public async Task<ReportJobDTO> SubmitJobAsync(
            SubmitReportJobDTO request, string userId, string userName, string userEmail)
        {
            // Enforce concurrency limit per user
            var userJobs = _jobs.Values
                .Where(j => j.UserId == userId && j.Status < ReportJobStatus.Completed)
                .Count();

            if (userJobs >= MaxJobsPerUser)
            {
                throw new InvalidOperationException(
                    $"Maximum {MaxJobsPerUser} concurrent report jobs allowed. Please wait for a running job to finish.");
            }

            var jobId = $"RPT-{DateTime.UtcNow:yyyyMMdd-HHmmss}-{Guid.NewGuid().ToString("N")[..8]}";
            var job = new ReportJobDTO
            {
                JobId = jobId,
                UserId = userId,
                UserName = userName,
                Status = ReportJobStatus.Queued,
                ProgressPercent = 0,
                StatusMessage = "Job queued",
                TemplateName = request.TemplateName,
                OutputFormat = request.OutputFormat ?? "pdf",
                ReportTitle = request.ReportTitle,
                DeliverByEmail = request.DeliverByEmail,
                EmailAddress = request.DeliverByEmail
                    ? (!string.IsNullOrWhiteSpace(request.EmailAddress) ? request.EmailAddress : userEmail)
                    : string.Empty,
                CreatedAtUtc = DateTime.UtcNow
            };

            _jobs[jobId] = job;

            var cts = new CancellationTokenSource();
            _cancellations[jobId] = cts;

            // Broadcast job started
            await _progressService.SendJobStarted(BuildProgressDTO(job));

            // Fire and forget the actual work
            _ = Task.Run(async () =>
            {
                try
                {
                    await ExecuteJobAsync(job, request, cts.Token);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Report job {JobId} failed with unhandled exception", jobId);
                    job.Status = ReportJobStatus.Failed;
                    job.StatusMessage = $"Unexpected error: {ex.Message}";
                    job.CompletedAtUtc = DateTime.UtcNow;
                    try { await _progressService.SendError(BuildProgressDTO(job)); } catch { /* ignore */ }
                }
                finally
                {
                    _cancellations.TryRemove(jobId, out var disposed);
                    disposed?.Dispose();
                }
            });

            return job;
        }

        public ReportJobDTO GetJobStatus(string jobId)
        {
            return _jobs.TryGetValue(jobId, out var job) ? job : null;
        }

        public byte[] GetJobResult(string jobId)
        {
            if (_results.TryGetValue(jobId, out var entry) && entry.ExpiresAt > DateTime.UtcNow)
            {
                return entry.Data;
            }
            return null;
        }

        public bool CancelJob(string jobId)
        {
            if (_cancellations.TryGetValue(jobId, out var cts))
            {
                cts.Cancel();
                if (_jobs.TryGetValue(jobId, out var job))
                {
                    job.Status = ReportJobStatus.Cancelled;
                    job.StatusMessage = "Cancelled by user";
                    job.CompletedAtUtc = DateTime.UtcNow;
                }
                return true;
            }
            return false;
        }

        public IEnumerable<ReportJobDTO> GetActiveJobs(string userId)
        {
            return _jobs.Values
                .Where(j => j.UserId == userId)
                .OrderByDescending(j => j.CreatedAtUtc)
                .Take(10);
        }

        public void CleanupExpiredJobs()
        {
            var cutoff = DateTime.UtcNow.AddHours(-1);
            var toRemove = _jobs.Values
                .Where(j => j.Status >= ReportJobStatus.Completed && j.CreatedAtUtc < cutoff)
                .Select(j => j.JobId)
                .ToList();

            foreach (var id in toRemove)
            {
                _jobs.TryRemove(id, out _);
                _results.TryRemove(id, out _);
                _cancellations.TryRemove(id, out var cts);
                cts?.Dispose();
            }

            if (toRemove.Count > 0)
            {
                _logger.LogDebug("Cleaned up {Count} expired report jobs", toRemove.Count);
            }
        }

        public bool SetEmailDelivery(string jobId, string emailAddress)
        {
            if (!_jobs.TryGetValue(jobId, out var job))
                return false;

            // Can only enable email if job is still running or just completed (result still available)
            if (job.Status == ReportJobStatus.Cancelled || job.Status == ReportJobStatus.Failed)
                return false;

            job.DeliverByEmail = true;
            if (!string.IsNullOrWhiteSpace(emailAddress))
                job.EmailAddress = emailAddress;

            // If job already completed, trigger email delivery now
            if (job.Status == ReportJobStatus.Completed && _results.TryGetValue(jobId, out var entry))
            {
                _ = Task.Run(async () =>
                {
                    try
                    {
                        await SendEmailForCompletedJob(job, entry.Data);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Failed to email completed report job {JobId}", jobId);
                    }
                });
            }

            _logger.LogInformation("Email delivery enabled for job {JobId} to {Email}", jobId, job.EmailAddress);
            return true;
        }

        /// <summary>Send email for an already-completed job whose result is still cached</summary>
        private async Task SendEmailForCompletedJob(ReportJobDTO job, byte[] fileBytes)
        {
            using var scope = _scopeFactory.CreateScope();
            var emailService = scope.ServiceProvider.GetService<IEmailService>();
            if (emailService == null || !emailService.IsConfigurationValid())
            {
                _logger.LogWarning("Email service not configured; cannot email job {JobId}", job.JobId);
                return;
            }

            var ext = job.OutputFormat.ToLower() switch { "excel" => "xlsx", _ => "pdf" };
            var contentType = job.OutputFormat.ToLower() switch
            {
                "excel" => "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                _ => "application/pdf"
            };
            var fileName = $"{SanitizeFileName(job.ReportTitle)}_{DateTime.Now:yyyyMMdd}.{ext}";

            var attachment = new EmailAttachmentDto
            {
                FileName = fileName,
                ContentType = contentType,
                Content = fileBytes
            };

            var subject = $"FMS Report Ready: {job.ReportTitle}";
            var body = $@"
                <h2>Your report is ready</h2>
                <p>The report <strong>{job.ReportTitle}</strong> has been generated successfully.</p>
                <table style='border-collapse:collapse; margin:16px 0;'>
                    <tr><td style='padding:4px 12px; border:1px solid #ddd;'><strong>Records</strong></td><td style='padding:4px 12px; border:1px solid #ddd;'>{job.RecordCount:N0}</td></tr>
                    <tr><td style='padding:4px 12px; border:1px solid #ddd;'><strong>Format</strong></td><td style='padding:4px 12px; border:1px solid #ddd;'>{job.OutputFormat.ToUpper()}</td></tr>
                    <tr><td style='padding:4px 12px; border:1px solid #ddd;'><strong>File Size</strong></td><td style='padding:4px 12px; border:1px solid #ddd;'>{FormatFileSize(fileBytes.Length)}</td></tr>
                    <tr><td style='padding:4px 12px; border:1px solid #ddd;'><strong>Generated</strong></td><td style='padding:4px 12px; border:1px solid #ddd;'>{DateTime.Now:yyyy-MM-dd HH:mm:ss}</td></tr>
                </table>
                <p>The report is attached to this email.</p>
                <p style='color:#888; font-size:12px;'>This is an automated message from FMS Report Engine.</p>";

            await emailService.SendEmailAsync(
                job.EmailAddress, subject, body,
                isHtml: true,
                attachments: new[] { attachment });

            job.Status = ReportJobStatus.EmailSent;
            job.StatusMessage = $"Report emailed to {job.EmailAddress}";
            await _progressService.SendCompleted(BuildProgressDTO(job));
        }

        // ──────────────────────────────────────────────────────
        //  Private: job execution pipeline
        // ──────────────────────────────────────────────────────

        private async Task ExecuteJobAsync(
            ReportJobDTO job, SubmitReportJobDTO request, CancellationToken ct)
        {
            using var scope = _scopeFactory.CreateScope();
            var mediator = scope.ServiceProvider.GetRequiredService<IMediator>();
            var jsReport = scope.ServiceProvider.GetRequiredService<IJsReportService>();

            // Brief delay to let the HTTP response reach the client and register SignalR listeners
            await Task.Delay(800, ct);

            // ── Phase 1: Fetch data ──
            job.Status = ReportJobStatus.FetchingData;
            job.ProgressPercent = 10;
            job.StatusMessage = "Fetching report data...";
            await _progressService.SendProgress(BuildProgressDTO(job));

            ct.ThrowIfCancellationRequested();

            var reportData = await FetchDataViaMediator(mediator, request, ct);

            if (reportData == null)
            {
                job.Status = ReportJobStatus.Failed;
                job.StatusMessage = "No data returned from query";
                job.CompletedAtUtc = DateTime.UtcNow;
                await _progressService.SendError(BuildProgressDTO(job));
                return;
            }

            job.ProgressPercent = 50;
            job.StatusMessage = $"Data fetched ({job.RecordCount} records). Rendering {job.OutputFormat.ToUpper()}...";
            await _progressService.SendProgress(BuildProgressDTO(job));

            ct.ThrowIfCancellationRequested();

            // ── Phase 2: Render report ──
            job.Status = ReportJobStatus.Rendering;
            job.ProgressPercent = 60;
            await _progressService.SendProgress(BuildProgressDTO(job));

            byte[] fileBytes;
            // Wide reports (many columns) render in landscape orientation
            var useLandscape = request.SourceId is "tank-volume-history";
            try
            {
                fileBytes = job.OutputFormat.ToLower() switch
                {
                    "excel" => await jsReport.RenderExcelAsync(request.TemplateName, reportData),
                    "html" => Encoding.UTF8.GetBytes(await jsReport.RenderHtmlAsync(request.TemplateName, reportData)),
                    _ => await jsReport.RenderPdfAsync(request.TemplateName, reportData, useLandscape),
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Report rendering failed for job {JobId}", job.JobId);
                job.Status = ReportJobStatus.Failed;
                var concise = ex.Message;
                if (!string.IsNullOrWhiteSpace(concise) && concise.Length > 600)
                {
                    concise = concise.Substring(0, 600) + "...";
                }
                job.StatusMessage = $"Rendering failed: {concise}";
                job.CompletedAtUtc = DateTime.UtcNow;
                await _progressService.SendError(BuildProgressDTO(job));
                return;
            }

            ct.ThrowIfCancellationRequested();

            job.FileSizeBytes = fileBytes.Length;
            job.ProgressPercent = 90;
            job.StatusMessage = "Report rendered. Finalizing...";
            await _progressService.SendProgress(BuildProgressDTO(job));

            // ── Phase 3: Store result for download ──
            _results[job.JobId] = (fileBytes, DateTime.UtcNow.Add(ResultTTL));

            // ── Phase 4 (optional): Email delivery ──
            if (job.DeliverByEmail && !string.IsNullOrWhiteSpace(job.EmailAddress))
            {
                job.StatusMessage = "Sending email...";
                job.ProgressPercent = 95;
                await _progressService.SendProgress(BuildProgressDTO(job));

                try
                {
                    var emailService = scope.ServiceProvider.GetService<IEmailService>();
                    if (emailService != null && emailService.IsConfigurationValid())
                    {
                        var ext = job.OutputFormat.ToLower() switch { "excel" => "xlsx", "html" => "html", _ => "pdf" };
                        var contentType = job.OutputFormat.ToLower() switch
                        {
                            "excel" => "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                            "html"  => "text/html",
                            _ => "application/pdf"
                        };
                        var fileName = $"{SanitizeFileName(job.ReportTitle)}_{DateTime.Now:yyyyMMdd}.{ext}";

                        var attachment = new EmailAttachmentDto
                        {
                            FileName = fileName,
                            ContentType = contentType,
                            Content = fileBytes
                        };

                        var subject = $"FMS Report: {job.ReportTitle}";
                        var body = BuildReportEmailBody(job, fileBytes.Length);

                        await emailService.SendEmailAsync(
                            job.EmailAddress, subject, body,
                            isHtml: true,
                            attachments: new[] { attachment });

                        job.Status = ReportJobStatus.EmailSent;
                        job.StatusMessage = $"Report emailed to {job.EmailAddress}";
                        _logger.LogInformation("Report job {JobId} emailed to {Email}", job.JobId, job.EmailAddress);
                    }
                    else
                    {
                        _logger.LogWarning("Email service not configured; skipping email delivery for job {JobId}", job.JobId);
                        job.Status = ReportJobStatus.Completed;
                        job.StatusMessage = "Report ready (email not configured)";
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Email delivery failed for report job {JobId}", job.JobId);
                    // Job is still completed even if email fails — result available for download
                    job.Status = ReportJobStatus.Completed;
                    job.StatusMessage = $"Report ready (email failed: {ex.Message})";
                }
            }
            else
            {
                job.Status = ReportJobStatus.Completed;
                job.StatusMessage = "Report ready for download";
            }

            job.CompletedAtUtc = DateTime.UtcNow;
            job.ProgressPercent = 100;
            await _progressService.SendCompleted(BuildProgressDTO(job));

            _logger.LogInformation(
                "Report job {JobId} completed in {Elapsed:F1}s — {Records} records, {Size} bytes",
                job.JobId, job.ElapsedSeconds, job.RecordCount, job.FileSizeBytes);
        }

        /// <summary>
        /// Dispatches the appropriate MediatR query based on the report source,
        /// then shapes the result into a template-ready payload.
        /// </summary>
        private async Task<object> FetchDataViaMediator(
            IMediator mediator, SubmitReportJobDTO request, CancellationToken ct)
        {
            var job = _jobs[request.SourceId == "tank-volume-history"
                ? _jobs.Keys.Last() // gets the latest - fallback
                : _jobs.Keys.Last()];

            // We look up the job by matching — but cleaner to just use the request
            var currentJob = _jobs.Values.FirstOrDefault(j =>
                j.Status == ReportJobStatus.FetchingData &&
                j.TemplateName == request.TemplateName);

            switch (request.SourceId)
            {
                case "tank-volume-history":
                    return await FetchTankVolumeHistoryData(mediator, request, currentJob, ct);

                case "pump-transaction":
                    return await FetchPumpTransactionData(mediator, request, currentJob, ct);

                default:
                    _logger.LogWarning("Unknown report source: {SourceId}", request.SourceId);
                    return null;
            }
        }

        private async Task<object> FetchTankVolumeHistoryData(
            IMediator mediator, SubmitReportJobDTO request, ReportJobDTO job, CancellationToken ct)
        {
            var query = new FMS.Application.Features.TankManagement.TankVolumeHistory.Queries.GetTankVolumeHistoryFilteredQuery
            {
                StartDate = GetDateParam(request.Parameters, "startDate"),
                EndDate = GetDateParam(request.Parameters, "endDate"),
                SiteId = GetIntParam(request.Parameters, "siteId"),
                TankId = GetIntParam(request.Parameters, "tankId"),
                Take = null, // No limit for report — get all records
                IncludeVehicleNames = true,
                UseManualDispensing = false
            };

            var result = await mediator.Send(query, ct);
            if (!result.IsSuccess || result.Data == null)
            {
                _logger.LogWarning("TankVolumeHistory query failed for report job: {Msg}", result.Message);
                return null;
            }

            var records = result.Data;
            if (job != null) job.RecordCount = records.Count;

            // Shape into template-ready payload — mirrors frontend reportDataBuilder
            return BuildTankVolumeHistoryPayload(records, request, job?.UserName);
        }

        private async Task<object> FetchPumpTransactionData(
            IMediator mediator, SubmitReportJobDTO request, ReportJobDTO job, CancellationToken ct)
        {
            var siteIds = GetIntListParam(request.Parameters, "siteIds");
            var tankIds = GetIntListParam(request.Parameters, "tankIds");
            var vehicleIds = GetIntListParam(request.Parameters, "vehicleIds");

            var query = new FMS.Application.Features.TankManagement.PumpTransaction.GetPumpTransactionQuery
            {
                StartDate = GetDateParam(request.Parameters, "startDate"),
                EndDate = GetDateParam(request.Parameters, "endDate"),
                SiteIds = siteIds,
                TankIds = tankIds,
                VehicleIds = vehicleIds
            };

            var result = await mediator.Send(query, ct);
            if (!result.IsSuccess || result.Data == null)
            {
                _logger.LogWarning("PumpTransaction query failed for report job: {Msg}", result.Message);
                return null;
            }

            var transactions = result.Data.ToList();
            if (job != null) job.RecordCount = transactions.Count;

            return new
            {
                reportTitle = request.ReportTitle ?? "Pump Transaction Report",
                generatedAt = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss"),
                generatedBy = "System (Background)",
                dateFrom = GetDateParam(request.Parameters, "startDate")?.ToString("yyyy-MM-dd") ?? "All",
                dateTo = GetDateParam(request.Parameters, "endDate")?.ToString("yyyy-MM-dd") ?? "All",
                reportId = $"RPT-{DateTime.Now:yyyyMMdd-HHmmss}",
                summary = new
                {
                    totalTransactions = transactions.Count,
                    totalVolume = transactions.Sum(t => t.Volume).ToString("N2"),
                    totalAmount = transactions.Sum(t => t.Amount).ToString("N2"),
                },
                transactions = transactions.Select((t, i) => new
                {
                    rowNumber = i + 1,
                    dateTime = t.DateTime.ToString("yyyy-MM-dd HH:mm"),
                    vehicleName = t.VehicleName ?? "-",
                    tankName = t.TankName ?? "-",
                    volume = t.Volume.ToString("N2"),
                    amount = t.Amount.ToString("N2"),
                }).ToList()
            };
        }

        /// <summary>
        /// Type badge info for Handlebars: changeReasonLabel + changeReasonClass.
        /// Keys mirror VolumeChangeReasonEnum integer values.
        /// </summary>
        /// <summary>
        /// Display labels mapped to VolumeChangeReasonEnum integer values.
        /// MUST match the enum ordering in VolumeChangeReasonEnum.cs:
        ///   0=OpeningStock, 1=ClosingStock, 2=Delivery, 3=TransferIn, 4=TransferOut,
        ///   5=Adjustment, 6=Dispensing, 7=AutomatedDispensing, 8=Reconciliation,
        ///   9=AutomatedReconciliation, 10=InTankDelivery
        /// </summary>
        private static readonly Dictionary<int, (string Label, string CssClass)> _typeInfo =
            new()
            {
                { 0,  ("Opening Stock",          "type-adjust")   },  // OpeningStock
                { 1,  ("Closing Stock",          "type-adjust")   },  // ClosingStock
                { 2,  ("Delivery",               "type-refill")   },  // Delivery
                { 3,  ("Transfer In",            "type-transfer") },  // TransferIn
                { 4,  ("Transfer Out",           "type-transfer") },  // TransferOut
                { 5,  ("Adjustment",             "type-adjust")   },  // Adjustment
                { 6,  ("Manual Dispensing",      "type-dispense") },  // Dispensing
                { 7,  ("Auto Dispense",          "type-dispense") },  // AutomatedDispensing
                { 8,  ("Reconciliation",         "type-adjust")   },  // Reconciliation
                { 9,  ("Auto Reconciliation",    "type-adjust")   },  // AutomatedReconciliation
                { 10, ("In-Tank Delivery",       "type-refill")   },  // InTankDelivery
            };

        /// <summary>
        /// Reason codes for DELIVERY operations — used for totalDelivery.
        /// Delivery=2, InTankDelivery=10
        /// </summary>
        private static readonly HashSet<int> _deliveryReasons = new() { 2, 10 };

        /// <summary>
        /// Reason codes that REMOVE fuel (negative VolumeChange) — used for totalDispensed.
        /// Dispensing=6, AutomatedDispensing=7
        /// </summary>
        private static readonly HashSet<int> _dispensingReasons = new() { 6, 7 };

        /// <summary>
        /// Reason codes for TRANSFER operations — used for totalTransfer.
        /// TransferIn=3, TransferOut=4
        /// </summary>
        private static readonly HashSet<int> _transferReasons = new() { 3, 4 };

        private object BuildTankVolumeHistoryPayload(
            List<FMS.Application.Features.FMS.TankVolumeHistory.TankVolumeHistoryDTO> records,
            SubmitReportJobDTO request,
            string createdBy = null)
        {
            var displayCreatedBy = !string.IsNullOrWhiteSpace(createdBy) ? createdBy : "System";

            if (records == null || records.Count == 0)
            {
                var emptyPayload = new
                {
                    reportTitle = request.ReportTitle ?? "Tank Volume History Report",
                    reportSubtitle = "No data found",
                    createdBy = displayCreatedBy,
                    dateFrom = GetDateParam(request.Parameters, "startDate")?.ToString("dd MMM yyyy") ?? "All",
                    dateTo = GetDateParam(request.Parameters, "endDate")?.ToString("dd MMM yyyy") ?? "All",
                    generatedAt = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss"),
                    reportId = $"RPT-{DateTime.Now:yyyyMMdd-HHmmss}",
                    summary = new { totalTransactions = 0, totalDispensed = "0.00", totalTransfer = "0.00", totalDelivery = "0.00", netBalanceChange = "0.00", grandClosingBalance = "0.00" },
                    siteGroups = Array.Empty<object>(),
                };
                return JToken.FromObject(emptyPayload);
            }

            // ── Global summary aggregates ─────────────────────────────────────────
            decimal globalDelivery = 0m;
            decimal globalDispensed = 0m;
            decimal globalTransfer = 0m;

            foreach (var r in records)
            {
                var code = (int)r.ChangeReason;
                var vol = Math.Abs(r.VolumeChange ?? 0m);
                if (_deliveryReasons.Contains(code)) globalDelivery += vol;
                if (_dispensingReasons.Contains(code)) globalDispensed += vol;
                if (_transferReasons.Contains(code)) globalTransfer += vol;
            }

            var netBalanceChange = globalDelivery + globalTransfer - globalDispensed;

            // ── Group by TankId (sorted by TankName) ─────────────────────────────
            var tankGroups = records
                .GroupBy(r => r.TankId ?? 0)
                .OrderBy(g => g.First().TankName ?? "")
                .ToList();

            // ── Build siteGroups: site → tanks[] + transactionGroups[] ─────────────
            // Preserve insertion order by site appearance
            var siteMap = new Dictionary<string, (List<object> Tanks, List<object> TxGroups)>(
                StringComparer.OrdinalIgnoreCase);
            decimal grandClosingBalance = 0m;
            int globalRowNumber = 1;

            foreach (var group in tankGroups)
            {
                var tankRecords = group.OrderBy(r => r.Timestamp).ToList();
                var tankName = tankRecords[0].TankName ?? $"Tank {group.Key}";
                var siteName = tankRecords[0].Site ?? "—";

                // Opening = NewVolume of first record minus its VolumeChange
                var firstRec = tankRecords[0];
                var openingBal = (firstRec.NewVolume ?? 0m) - (firstRec.VolumeChange ?? 0m);
                var closingBal = tankRecords[^1].NewVolume ?? 0m;
                grandClosingBalance += closingBal;

                decimal dispensingTotal = 0m; int dispensingCount = 0;
                decimal deliveryTotal = 0m; int deliveryCount = 0;
                decimal transferInTotal = 0m; int transferInCount = 0;
                decimal transferOutTotal = 0m; int transferOutCount = 0;

                foreach (var r in tankRecords)
                {
                    var code = (int)r.ChangeReason;
                    var vol = Math.Abs(r.VolumeChange ?? 0m);
                    if (code == 6 || code == 7) { dispensingTotal += vol; dispensingCount++; }    // Dispensing=6, AutomatedDispensing=7
                    if (code == 2 || code == 10) { deliveryTotal += vol; deliveryCount++; }       // Delivery=2, InTankDelivery=10
                    if (code == 3) { transferInTotal += vol; transferInCount++; }                  // TransferIn=3
                    if (code == 4) { transferOutTotal += vol; transferOutCount++; }                // TransferOut=4
                }

                var expectedClosing = openingBal + deliveryTotal + transferInTotal
                                      - dispensingTotal - transferOutTotal;
                var expectedMatch = Math.Abs(expectedClosing - closingBal) < 1m;
                var transferCount = transferInCount + transferOutCount;

                var tankEntry = new
                {
                    tankName = tankName,
                    fuelType = "Diesel",
                    openingBalance = openingBal.ToString("N2"),
                    closingBalance = closingBal.ToString("N2"),
                    expectedClosing = expectedClosing.ToString("N2"),
                    expectedMatch,
                    dispensing = new { total = dispensingTotal.ToString("N2"), count = dispensingCount },
                    delivery = new { total = deliveryTotal.ToString("N2"), count = deliveryCount },
                    transfer = new { total = Math.Abs(transferInTotal - transferOutTotal).ToString("N2"), count = transferCount },
                };

                // ── Build transaction rows for this tank ──────────────────────────
                decimal groupNet = 0m;
                var rows = new List<object>();
                foreach (var r in tankRecords)
                {
                    var code = (int)r.ChangeReason;
                    if (!_typeInfo.TryGetValue(code, out var typeInfo))
                        typeInfo = ($"Type {code}", "type-adjust");

                    var volChange = r.VolumeChange ?? 0m;
                    var volFormatted = volChange.ToString("+0.00;-0.00;0.00");
                    groupNet += volChange;

                    rows.Add(new
                    {
                        rowNumber = globalRowNumber++,
                        siteName = siteName,
                        timestamp = new
                        {
                            date = r.Timestamp.ToString("dd MMM yyyy"),
                            time = r.Timestamp.ToString("HH:mm"),
                        },
                        tankName = tankName,
                        vehiclePlate = !string.IsNullOrWhiteSpace(r.VehicleName) ? r.VehicleName : "—",
                        changeReasonLabel = typeInfo.Label,
                        changeReasonClass = typeInfo.CssClass,
                        isPositive = volChange >= 0,
                        volumeChange = volFormatted,
                        balanceAfter = (r.NewVolume ?? 0m).ToString("N2"),
                        operatorName = !string.IsNullOrWhiteSpace(r.RecordedByUserName) ? r.RecordedByUserName
                                          : !string.IsNullOrWhiteSpace(r.RecordedBy) ? r.RecordedBy
                                          : "— (System)",
                        notes = BuildTransactionNotes(r),
                    });
                }

                var txGroup = new
                {
                    groupName = tankName,
                    fuelType = "Diesel",
                    openingBalance = openingBal.ToString("N2"),
                    closingBalance = closingBal.ToString("N2"),
                    groupNet = groupNet.ToString("+0.00;-0.00;0.00"),
                    rows,
                };

                if (!siteMap.TryGetValue(siteName, out var siteData))
                {
                    siteData = (new List<object>(), new List<object>());
                    siteMap[siteName] = siteData;
                }
                siteData.Tanks.Add(tankEntry);
                siteData.TxGroups.Add(txGroup);
            }

            var siteGroupsPayload = siteMap
                .OrderBy(kv => kv.Key)
                .Select(kv => (object)new
                {
                    siteName = kv.Key,
                    tanks = kv.Value.Tanks,
                    transactionGroups = kv.Value.TxGroups,
                })
                .ToList();

            // ── Build dynamic subtitle from actual filter values ──────────────────
            var siteFilterId = GetIntParam(request.Parameters, "siteId");
            var tankFilterId = GetIntParam(request.Parameters, "tankId");
            string siteFilterName = siteFilterId.HasValue
                ? records.FirstOrDefault(r => !string.IsNullOrWhiteSpace(r.Site))?.Site ?? "All Sites"
                : "All Sites";
            string tankFilterName = tankFilterId.HasValue
                ? records.FirstOrDefault(r => !string.IsNullOrWhiteSpace(r.TankName))?.TankName ?? "All Tanks"
                : "All Tanks";
            // Use GetStringParam for user-supplied filter labels (if frontend sends them)
            var reportSubtitle = $"{tankFilterName} - {siteFilterName}";

            // ── Assemble final payload ────────────────────────────────────────────
            // Wrap in JToken to ensure anonymous types inside List<object> serialize
            // correctly regardless of the JSON serializer (System.Text.Json loses
            // anonymous type properties when the declared type is 'object').
            var payload = new
            {
                reportTitle = request.ReportTitle ?? "Tank Volume History Report",
                reportSubtitle,
                createdBy = displayCreatedBy,
                dateFrom = GetDateParam(request.Parameters, "startDate")?.ToString("dd MMM yyyy") ?? "All",
                dateTo = GetDateParam(request.Parameters, "endDate")?.ToString("dd MMM yyyy") ?? "All",
                generatedAt = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss"),
                reportId = $"RPT-{DateTime.Now:yyyyMMdd-HHmmss}",
                summary = new
                {
                    totalTransactions = records.Count,
                    totalDispensed = globalDispensed.ToString("N2"),
                    totalTransfer = globalTransfer.ToString("N2"),
                    totalDelivery = globalDelivery.ToString("N2"),
                    netBalanceChange = netBalanceChange.ToString("+0.00;-0.00;0.00"),
                    grandClosingBalance = grandClosingBalance.ToString("N2"),
                },
                siteGroups = siteGroupsPayload,
            };

            // Serialize → parse → ensures nested anonymous objects in List<object>
            // retain their properties (Newtonsoft resolves runtime types correctly)
            return JToken.FromObject(payload);
        }

        /// <summary>Builds the Notes column text for a single transaction row.</summary>
        private static string BuildTransactionNotes(
            FMS.Application.Features.FMS.TankVolumeHistory.TankVolumeHistoryDTO r)
        {
            var parts = new List<string>();
            // Only show vehicle type when an actual vehicle is on the transaction
            if (!string.IsNullOrWhiteSpace(r.VehicleName) && !string.IsNullOrWhiteSpace(r.VehicleType))
                parts.Add(r.VehicleType);
            // Transfer destination/source (relevant for TransferIn / TransferOut rows)
            if (!string.IsNullOrWhiteSpace(r.TransferTankName))
                parts.Add($"→ {r.TransferTankName}" +
                           (!string.IsNullOrWhiteSpace(r.TransferTankSite)
                               ? $" ({r.TransferTankSite})"
                               : ""));
            // Site grouping is now shown as a separate column — omit from notes
            return parts.Count > 0 ? string.Join(" · ", parts) : "";
        }

        // ──────────────────────────────────────────────────────
        //  Helpers
        // ──────────────────────────────────────────────────────

        private ReportJobProgressDTO BuildProgressDTO(ReportJobDTO job)
        {
            return new ReportJobProgressDTO
            {
                JobId = job.JobId,
                UserId = job.UserId,
                Status = job.Status,
                ProgressPercent = job.ProgressPercent,
                StatusMessage = job.StatusMessage,
                ReportTitle = job.ReportTitle,
                RecordCount = job.RecordCount,
                FileSizeBytes = job.FileSizeBytes,
                ElapsedSeconds = job.ElapsedSeconds,
                Timestamp = DateTime.UtcNow
            };
        }

        private static DateTime? GetDateParam(Dictionary<string, object> parameters, string key)
        {
            if (parameters == null || !parameters.TryGetValue(key, out var val)) return null;
            if (val is DateTime dt) return dt;
            if (val is string s && DateTime.TryParse(s, out var parsed)) return parsed;
            // System.Text.Json deserialization wraps values in JsonElement
            if (val is System.Text.Json.JsonElement je)
            {
                if (je.ValueKind == System.Text.Json.JsonValueKind.String
                    && DateTime.TryParse(je.GetString(), out var jeParsed))
                    return jeParsed;
            }
            // Newtonsoft JValue / generic fallback
            if (val?.ToString() is string str && !string.IsNullOrWhiteSpace(str)
                && DateTime.TryParse(str, out var fallback))
                return fallback;
            return null;
        }

        private static int? GetIntParam(Dictionary<string, object> parameters, string key)
        {
            if (parameters == null || !parameters.TryGetValue(key, out var val)) return null;
            if (val is int i) return i;
            if (val is long l) return (int)l;
            if (val is string s && int.TryParse(s, out var parsed)) return parsed;
            // System.Text.Json deserialization wraps values in JsonElement
            if (val is System.Text.Json.JsonElement je)
            {
                if (je.ValueKind == System.Text.Json.JsonValueKind.Number)
                    return je.GetInt32();
                if (je.ValueKind == System.Text.Json.JsonValueKind.String
                    && int.TryParse(je.GetString(), out var jeParsed))
                    return jeParsed;
            }
            // Newtonsoft JValue / generic fallback
            if (val?.ToString() is string str && int.TryParse(str, out var fallback))
                return fallback;
            return null;
        }

        private static List<int> GetIntListParam(Dictionary<string, object> parameters, string key)
        {
            if (parameters == null || !parameters.TryGetValue(key, out var val)) return null;
            if (val is List<int> list) return list;
            if (val is string s)
            {
                return s.Split(',', StringSplitOptions.RemoveEmptyEntries)
                    .Select(x => int.TryParse(x.Trim(), out var v) ? v : (int?)null)
                    .Where(x => x.HasValue)
                    .Select(x => x.Value)
                    .ToList();
            }
            return null;
        }

        private static string SanitizeFileName(string name)
        {
            if (string.IsNullOrWhiteSpace(name)) return "Report";
            var invalid = System.IO.Path.GetInvalidFileNameChars();
            return string.Join("_", name.Split(invalid, StringSplitOptions.RemoveEmptyEntries)).Trim();
        }

        private static string FormatFileSize(long bytes)
        {
            if (bytes < 1024) return $"{bytes} B";
            if (bytes < 1024 * 1024) return $"{bytes / 1024.0:F1} KB";
            return $"{bytes / (1024.0 * 1024.0):F1} MB";
        }

        /// <summary>
        /// Builds an M365-style flat-design HTML email body for report delivery.
        /// </summary>
        private static string BuildReportEmailBody(ReportJobDTO job, long fileSizeBytes)
        {
            var formatBadge = job.OutputFormat.ToUpper() switch
            {
                "PDF"   => "<span style='display:inline-block;padding:2px 8px;border-radius:10px;font-size:11px;font-weight:600;background:#deecf9;color:#0078d4;'>PDF</span>",
                "EXCEL" => "<span style='display:inline-block;padding:2px 8px;border-radius:10px;font-size:11px;font-weight:600;background:#dff6dd;color:#107c10;'>EXCEL</span>",
                "HTML"  => "<span style='display:inline-block;padding:2px 8px;border-radius:10px;font-size:11px;font-weight:600;background:#fff4ce;color:#ca5010;'>HTML</span>",
                _       => $"<span style='display:inline-block;padding:2px 8px;border-radius:10px;font-size:11px;font-weight:600;background:#f3f2f1;color:#605e5c;'>{job.OutputFormat.ToUpper()}</span>"
            };

            return $@"
<!DOCTYPE html>
<html>
<head><meta charset='UTF-8'></head>
<body style='margin:0;padding:0;background:#f3f2f1;font-family:""Segoe UI"",-apple-system,system-ui,sans-serif;'>
<table cellpadding='0' cellspacing='0' border='0' width='100%' style='background:#f3f2f1;padding:32px 0;'>
<tr><td align='center'>
<table cellpadding='0' cellspacing='0' border='0' width='560' style='max-width:560px;background:#ffffff;border:1px solid #edebe9;border-radius:8px;overflow:hidden;'>

  <!-- Header Bar -->
  <tr><td style='background:#0078d4;padding:16px 24px;'>
    <table width='100%' cellpadding='0' cellspacing='0' border='0'>
    <tr>
      <td style='font-size:16px;font-weight:600;color:#ffffff;'>Hyoung Fleet Management</td>
      <td align='right' style='font-size:11px;color:rgba(255,255,255,0.8);'>Report Delivery</td>
    </tr>
    </table>
  </td></tr>

  <!-- Body -->
  <tr><td style='padding:28px 24px 12px;'>
    <h2 style='margin:0 0 4px;font-size:18px;font-weight:600;color:#201f1e;'>{System.Net.WebUtility.HtmlEncode(job.ReportTitle)}</h2>
    <p style='margin:0 0 20px;font-size:13px;color:#605e5c;'>Your requested report has been generated and is attached to this email.</p>

    <!-- Info Card -->
    <table cellpadding='0' cellspacing='0' border='0' width='100%' style='background:#faf9f8;border:1px solid #edebe9;border-radius:6px;'>
      <tr>
        <td style='padding:14px 18px;border-bottom:1px solid #edebe9;'>
          <table width='100%' cellpadding='0' cellspacing='0' border='0'>
          <tr>
            <td style='font-size:12px;font-weight:600;color:#605e5c;text-transform:uppercase;letter-spacing:0.3px;'>Records</td>
            <td align='right' style='font-size:14px;font-weight:600;color:#201f1e;'>{job.RecordCount:N0}</td>
          </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style='padding:14px 18px;border-bottom:1px solid #edebe9;'>
          <table width='100%' cellpadding='0' cellspacing='0' border='0'>
          <tr>
            <td style='font-size:12px;font-weight:600;color:#605e5c;text-transform:uppercase;letter-spacing:0.3px;'>Format</td>
            <td align='right'>{formatBadge}</td>
          </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style='padding:14px 18px;border-bottom:1px solid #edebe9;'>
          <table width='100%' cellpadding='0' cellspacing='0' border='0'>
          <tr>
            <td style='font-size:12px;font-weight:600;color:#605e5c;text-transform:uppercase;letter-spacing:0.3px;'>File Size</td>
            <td align='right' style='font-size:13px;color:#201f1e;'>{FormatFileSize(fileSizeBytes)}</td>
          </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style='padding:14px 18px;'>
          <table width='100%' cellpadding='0' cellspacing='0' border='0'>
          <tr>
            <td style='font-size:12px;font-weight:600;color:#605e5c;text-transform:uppercase;letter-spacing:0.3px;'>Generated</td>
            <td align='right' style='font-size:13px;color:#201f1e;'>{DateTime.Now:dd MMM yyyy, HH:mm}</td>
          </tr>
          </table>
        </td>
      </tr>
    </table>
  </td></tr>

  <!-- Attachment Note -->
  <tr><td style='padding:8px 24px 24px;'>
    <p style='margin:0;font-size:13px;color:#605e5c;'>
      <span style='display:inline-block;width:16px;height:16px;border-radius:50%;background:#deecf9;text-align:center;line-height:16px;font-size:10px;color:#0078d4;margin-right:6px;vertical-align:middle;'>&#128206;</span>
      The report file is attached to this email.
    </p>
  </td></tr>

  <!-- Footer -->
  <tr><td style='padding:16px 24px;border-top:1px solid #edebe9;background:#faf9f8;'>
    <p style='margin:0;font-size:11px;color:#a19f9d;'>
      This is an automated message from Hyoung FMS Report Engine. Please do not reply to this email.
    </p>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>";
        }
    }
}
