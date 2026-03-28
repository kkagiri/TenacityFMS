/**
 * File: JsReportService.cs
 * Purpose: Core report rendering engine — PDF, Excel, HTML, and inline PDF.
 *          Uses jsreport ONLY as a Handlebars template engine (Recipe.Html).
 *          PDF conversion is handled by PuppeteerSharp using the system Chrome/Edge.
 * Dependencies: jsreport.Local, jsreport.Binary, jsreport.Types, PuppeteerSharp,
 *               ClosedXML, IWebHostEnvironment, JsReportTemplateManager, JsReportLetterheadBranding
 * Last Modified: 2026-03-07
 *
 * Key Functions:
 * - RenderPdfAsync        : Template → HTML (jsreport) → PDF (PuppeteerSharp + system Chrome)
 * - RenderExcelAsync      : Structured data → XLSX via ClosedXML (no Chrome needed)
 * - RenderHtmlAsync       : Template → HTML string (preview)
 * - RenderInlinePdfAsync  : Arbitrary HTML string → PDF (PuppeteerSharp)
 * - Template CRUD         : Delegates to JsReportTemplateManager
 *
 * Architecture:
 *   jsreport's Chrome-PDF recipe can't spawn Chrome from its pkg-bundled binary
 *   ("spawn UNKNOWN" error). We bypass it entirely: jsreport renders Handlebars
 *   templates to HTML, and PuppeteerSharp converts that HTML to PDF using the
 *   system-installed Chrome or Edge browser.
 */
using jsreport.Local;
using jsreport.Types;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using PuppeteerSharp;
using PuppeteerSharp.Media;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using ClosedXML.Excel;

namespace FMS.WebClient.Services.Reporting
{
    /// <summary>
    /// Report rendering service. Renders Handlebars templates via jsreport (HTML only),
    /// then converts to PDF using PuppeteerSharp with system Chrome/Edge.
    /// Excel generation uses ClosedXML directly.
    /// All template management is delegated to <see cref="JsReportTemplateManager"/>.
    /// </summary>
    public class JsReportService : IJsReportService, IAsyncDisposable
    {
        // ─── Constants ────────────────────────────────────────────────────────────

        private const int DefaultRenderTimeoutMs = 120_000;
        private const int LargePayloadRenderTimeoutMs = 300_000;
        private const int LargePayloadThresholdBytes = 750_000;

        /// <summary>
        /// Known Chrome/Edge paths checked in priority order.
        /// All existing paths are tried during browser launch.
        /// </summary>
        private static readonly string[] ChromeExecutablePaths =
        [
            @"C:\Program Files\Google\Chrome\Application\chrome.exe",
            @"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
            Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                @"Google\Chrome\Application\chrome.exe"),
            @"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
            @"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
        ];

        /// <summary>
        /// Dedicated writable profile root for PuppeteerSharp browser instances.
        /// Avoids %TEMP% permission issues and profile lock conflicts.
        /// </summary>
        private const string PuppeteerProfileRoot = @"C:\FMSData\PuppeteerProfiles";

        // ─── Fields ───────────────────────────────────────────────────────────────

        private readonly ILogger<JsReportService> _logger;
        private ILocalUtilityReportingService _reportingService;
        private readonly JsReportTemplateManager _templateManager;
        private readonly JsReportLetterheadBranding _branding;

        /// <summary>All Chrome/Edge executables that exist on this machine, checked at startup.</summary>
        private readonly IReadOnlyList<string> _browserExecutablePaths;

        /// <summary>The executable path that successfully launched the current browser instance.</summary>
        private string? _activeBrowserExePath;

        /// <summary>Shared browser instance — lazily created, reused across renders.</summary>
        private IBrowser? _browser;
        private readonly SemaphoreSlim _browserLock = new(1, 1);

        /// <summary>Temp directory used by jsreport — kept for service recreation.</summary>
        private string _jsReportTempPath = string.Empty;

        /// <summary>Lock protecting jsreport service recreation on WORKER_TIMEOUT.</summary>
        private readonly SemaphoreSlim _jsReportLock = new(1, 1);

        // ─── Constructor ──────────────────────────────────────────────────────────

        public JsReportService(ILogger<JsReportService> logger, IWebHostEnvironment environment)
        {
            _logger = logger;

            _templateManager = new JsReportTemplateManager(logger, environment);
            var logoPath = JsReportTemplateManager.ResolveBrandingLogoPath(logger);
            _branding = new JsReportLetterheadBranding(logger, logoPath);

            _logger.LogInformation("JsReport templates path: {Path}", _templateManager.TemplatesPath);
            _logger.LogInformation("JsReport letterhead logo path: {Path}", _branding.LogoPath);

            // ── jsreport setup (Handlebars engine ONLY — no Chrome, no PDF) ───────
            // Use C:\FMSData as the base working directory so jsreport has full
            // write permissions (avoids EPERM under IIS / Windows\TEMP).
            var fmsDataRoot = @"C:\FMSData";
            var jsReportTempPath = Path.Combine(fmsDataRoot, "JsReport_Temp");
            Directory.CreateDirectory(jsReportTempPath);

            // Point the fs-store data directory into the writable folder so
            // jsreport doesn't try to mkdir inside the (read-only) IIS app root.
            var jsReportDataPath = Path.Combine(jsReportTempPath, "data");
            Directory.CreateDirectory(jsReportDataPath);
            Directory.CreateDirectory(Path.Combine(jsReportDataPath, "storage"));

            // ── CRITICAL: Set environment variables so the spawned jsreport child
            // process inherits them. jsreport reads config from env vars using '_'
            // as nested-key separator (e.g. extensions_fs-store_dataDirectory →
            // extensions.fs-store.dataDirectory). This is the ONLY reliable way to
            // override the fs-store path when the jsreport binary's cwd (the IIS
            // app root) is read-only and we can't write a jsreport.config.json there.
            Environment.SetEnvironmentVariable(
                "extensions_fs-store_dataDirectory",
                jsReportDataPath.Replace("\\", "/"));
            Environment.SetEnvironmentVariable(
                "tempDirectory",
                jsReportTempPath.Replace("\\", "/"));

            // Disable extensions we don't need — jsreport is used ONLY as a
            // Handlebars→HTML engine (PuppeteerSharp handles PDF conversion).
            // Disabling chrome-pdf and phantom-pdf avoids worker init timeouts
            // caused by Chrome/Phantom spawning issues in IIS app pools.
            Environment.SetEnvironmentVariable("extensions_chrome-pdf_enabled", "false");
            Environment.SetEnvironmentVariable("extensions_phantom-pdf_enabled", "false");
            Environment.SetEnvironmentVariable("extensions_scripts_enabled", "false");

            // Use port 0 so Node.js picks a random available port — prevents
            // EADDRINUSE when a stale jsreport process from a prior app pool
            // recycle is still holding the default port (5488).
            Environment.SetEnvironmentVariable("httpPort", "0");

            // Increase the worker initialization timeout (default is ~10 s;
            // cold starts under IIS can be slow due to anti-virus or disk I/O).
            Environment.SetEnvironmentVariable("workers_timeout", "60000");

            // Clean up stale socket files from previous runs so the new jsreport
            // daemon doesn't try to reconnect to a dead process.
            try
            {
                var staleSocketDir = Path.Combine(jsReportTempPath, "cli", "wSock");
                if (Directory.Exists(staleSocketDir))
                {
                    Directory.Delete(staleSocketDir, recursive: true);
                    _logger.LogInformation("Cleaned stale jsreport socket dir: {Dir}", staleSocketDir);
                }
            }
            catch (Exception cleanEx)
            {
                _logger.LogWarning(cleanEx, "Could not clean stale jsreport socket dir (non-fatal)");
            }

            _logger.LogInformation(
                "Set jsreport env vars: dataDirectory={DataDir}, tempDirectory={Temp}, " +
                "chrome-pdf=disabled, phantom-pdf=disabled, httpPort=0, workers_timeout=60000",
                jsReportDataPath, jsReportTempPath);

            // Persist for service recreation on WORKER_TIMEOUT
            _jsReportTempPath = jsReportTempPath;

            // Clean up any stale daemon socket files from a previous process crash.
            // A leftover wSock file causes the new daemon to fail with WORKER_TIMEOUT.
            CleanStaleJsReportSockets(jsReportTempPath);

            _reportingService = CreateJsReportService(jsReportTempPath);

            // ── Chrome/Edge detection (for PuppeteerSharp PDF conversion) ─────
            _browserExecutablePaths = ChromeExecutablePaths
                .Where(File.Exists)
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList();

            _activeBrowserExePath = _browserExecutablePaths.FirstOrDefault();

            // Ensure the dedicated profile root exists and is writable
            try
            {
                Directory.CreateDirectory(PuppeteerProfileRoot);
                _logger.LogInformation("PuppeteerSharp profile root: {Path}", PuppeteerProfileRoot);
            }
            catch (Exception profileEx)
            {
                _logger.LogWarning(profileEx,
                    "Could not create PuppeteerSharp profile root at {Path}. " +
                    "Falling back to %TEMP%. Ensure the app-pool identity has write access.",
                    PuppeteerProfileRoot);
            }

            if (_browserExecutablePaths.Count > 0)
            {
                _logger.LogInformation(
                    "PuppeteerSharp detected {Count} browser executable(s): {Paths}",
                    _browserExecutablePaths.Count,
                    string.Join(", ", _browserExecutablePaths));
            }
            else
            {
                _logger.LogWarning(
                    "No system Chrome/Edge found. PDF rendering will fail. " +
                    "Install Chrome or Edge to enable PDF output.");
            }

            _logger.LogInformation(
                "JsReport service initialized (Handlebars engine only, PuppeteerSharp for PDF) " +
                "— templates: {Path}, temp: {Temp}",
                _templateManager.TemplatesPath, jsReportTempPath);

            _templateManager.EnsureSampleTemplatesAsync().Wait();
        }

        // ─── jsreport lifecycle helpers ────────────────────────────────────────────

        /// <summary>
        /// Creates (or re-creates) the jsreport utility service backed by the given temp path.
        /// </summary>
        private static ILocalUtilityReportingService CreateJsReportService(string tempPath)
        {
            return new LocalReporting()
                .UseBinary(jsreport.Binary.JsReportBinary.GetBinary())
                .Configure(cfg =>
                {
                    cfg.TrustUserCode = true;
                    cfg.TempDirectory = tempPath;
                    cfg.FileSystemStore();
                    return cfg;
                })
                .AsUtility()
                .Create();
        }

        /// <summary>
        /// Cleans up all stale jsreport artefacts from a previous process crash:
        ///   1. wSock daemon socket files (cause WORKER_TIMEOUT on next start)
        ///   2. Orphaned binary copies in dotnet/ (jsreport.Binary creates a unique-named
        ///      copy per launch; crashes leave them behind, slowing AV scans)
        ///   3. Unprocessed autocleanup request JSON files
        /// </summary>
        private void CleanStaleJsReportSockets(string tempPath)
        {
            // ── 1. wSock files ──────────────────────────────────────────────────
            try
            {
                var sockDir = Path.Combine(tempPath, "cli", "wSock");
                if (Directory.Exists(sockDir))
                {
                    var stale = Directory.GetFiles(sockDir, "*", SearchOption.AllDirectories);
                    foreach (var f in stale)
                        try { File.Delete(f); } catch { /* ignore */ }

                    if (stale.Length > 0)
                        _logger.LogInformation(
                            "Cleaned {Count} stale jsreport wSock file(s)", stale.Length);
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Could not clean stale jsreport wSock files — continuing anyway");
            }

            // ── 2. Orphaned binary copies (random-prefix *.exe in dotnet/) ──────
            // jsreport.Binary copies itself with a unique name each launch to avoid
            // file locking. Crashes leave these behind and AV scans all of them,
            // increasing startup delay and risk of WORKER_TIMEOUT.
            try
            {
                var dotnetDir = Path.Combine(tempPath, "dotnet");
                if (Directory.Exists(dotnetDir))
                {
                    // Match files like "aBcDeFgH...jsreport.exe" but NOT "jsreport.exe"
                    var orphans = Directory.GetFiles(dotnetDir, "*jsreport.exe", SearchOption.AllDirectories)
                        .Where(f => !string.Equals(Path.GetFileName(f), "jsreport.exe", StringComparison.OrdinalIgnoreCase))
                        .ToArray();

                    foreach (var f in orphans)
                        try { File.Delete(f); } catch { /* ignore */ }

                    if (orphans.Length > 0)
                        _logger.LogInformation(
                            "Cleaned {Count} orphaned jsreport binary copy(ies) from dotnet/", orphans.Length);
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Could not clean orphaned jsreport binary copies — continuing anyway");
            }

            // ── 3. Stale autocleanup request files ──────────────────────────────
            try
            {
                var cleanupDir = Path.Combine(tempPath, "autocleanup");
                if (Directory.Exists(cleanupDir))
                {
                    var stale = Directory.GetFiles(cleanupDir, "req*.json", SearchOption.TopDirectoryOnly);
                    foreach (var f in stale)
                        try { File.Delete(f); } catch { /* ignore */ }

                    if (stale.Length > 0)
                        _logger.LogInformation(
                            "Cleaned {Count} stale jsreport autocleanup file(s)", stale.Length);
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Could not clean stale jsreport autocleanup files — continuing anyway");
            }
        }

        /// <summary>
        /// Recreates the jsreport service after a WORKER_TIMEOUT failure.
        /// Kills the old instance, clears stale sockets, and creates a fresh service.
        /// </summary>
        private async Task RecreateJsReportServiceAsync()
        {
            await _jsReportLock.WaitAsync();
            try
            {
                _logger.LogWarning("Recreating jsreport service after WORKER_TIMEOUT");
                try { await _reportingService.KillAsync(); } catch { /* ignore */ }

                // Brief pause so the OS releases any file/socket handles
                await Task.Delay(2_000);

                CleanStaleJsReportSockets(_jsReportTempPath);

                _reportingService = CreateJsReportService(_jsReportTempPath);
                _logger.LogInformation("jsreport service recreated successfully");
            }
            finally
            {
                _jsReportLock.Release();
            }
        }

        private static bool IsWorkerTimeoutError(Exception ex)
            => ex.Message.Contains("WORKER_TIMEOUT", StringComparison.OrdinalIgnoreCase) ||
               ex.Message.Contains("initialize jsreport", StringComparison.OrdinalIgnoreCase) ||
               ex.Message.Contains("daemonized process", StringComparison.OrdinalIgnoreCase);

        // ─── PDF Render (PuppeteerSharp) ──────────────────────────────────────────

        /// <summary>
        /// Renders a Handlebars template to HTML via jsreport, then converts to PDF
        /// using PuppeteerSharp with the system Chrome browser.
        /// </summary>
        public async Task<byte[]> RenderPdfAsync(string templateName, object data, bool landscape = false)
        {
            try
            {
                // Step 1: Render Handlebars → HTML (jsreport, no Chrome involved)
                var html = await RenderTemplateToHtml(templateName, data);

                // Step 2: Convert HTML → PDF (PuppeteerSharp + system Chrome)
                return await ConvertHtmlToPdfAsync(html, landscape);
            }
            catch (Exception ex)
            {
                if (IsTemplateParseError(ex) && TryGetEmbeddedTemplate(templateName, out var embeddedTemplate))
                {
                    _logger.LogWarning(ex,
                        "Template parse error for {Template}. Falling back to embedded template.",
                        templateName);

                    await TryRepairTemplateFileAsync(templateName, embeddedTemplate);

                    try
                    {
                        var fallbackHtml = await RenderRawHtml(embeddedTemplate, data);
                        return await ConvertHtmlToPdfAsync(fallbackHtml, landscape);
                    }
                    catch (Exception fallbackEx)
                    {
                        _logger.LogError(fallbackEx,
                            "Fallback rendering with embedded template also failed for {Template}",
                            templateName);
                    }
                }

                _logger.LogError(ex, "Error rendering PDF for template {Template}. Payload: {Bytes} bytes",
                    templateName, EstimatePayloadSizeBytes(data));
                throw;
            }
        }

        /// <summary>
        /// Renders an arbitrary HTML string (with Handlebars placeholders) to PDF.
        /// </summary>
        public async Task<byte[]> RenderInlinePdfAsync(string htmlTemplate, object data, bool landscape = false)
        {
            try
            {
                var html = await RenderRawHtml(htmlTemplate, data);
                return await ConvertHtmlToPdfAsync(html, landscape);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error rendering inline PDF");
                throw;
            }
        }

        // ─── Excel Render (ClosedXML) ─────────────────────────────────────────────

        public async Task<byte[]> RenderExcelAsync(string templateName, object data)
        {
            try
            {
                // ── Step 1: try ClosedXML native generation (uses structured payload) ──
                var closedXmlBytes = TryBuildExcelWithClosedXml(data);
                if (closedXmlBytes != null)
                {
                    _logger.LogInformation("Excel generated via ClosedXML for template {Template}", templateName);
                    return closedXmlBytes;
                }

                // ── Step 2: fallback — render HTML and return those bytes ──
                _logger.LogWarning("ClosedXML could not parse payload for {Template}; falling back to HTML bytes", templateName);
                var content = await LoadTemplate(templateName);
                content = _branding.Apply(content);
                var report = await _reportingService.RenderAsync(new RenderRequest
                {
                    Template = new Template
                    {
                        Content = content,
                        Engine = Engine.Handlebars,
                        Recipe = Recipe.Html
                    },
                    Data = data,
                    Options = BuildRenderOptions(data)
                });
                using var ms = new MemoryStream();
                await report.Content.CopyToAsync(ms);
                return ms.ToArray();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error rendering Excel for template {Template}", templateName);
                throw;
            }
        }

        // ─── HTML Render (jsreport Handlebars only) ───────────────────────────────

        public async Task<string> RenderHtmlAsync(string templateName, object data)
        {
            try
            {
                return await RenderTemplateToHtml(templateName, data);
            }
            catch (Exception ex)
            {
                if (IsTemplateParseError(ex) && TryGetEmbeddedTemplate(templateName, out var embeddedTemplate))
                {
                    _logger.LogWarning(ex,
                        "Template parse error for {Template}. Falling back to embedded template.",
                        templateName);

                    await TryRepairTemplateFileAsync(templateName, embeddedTemplate);

                    try
                    {
                        return await RenderRawHtml(embeddedTemplate, data);
                    }
                    catch (Exception fallbackEx)
                    {
                        _logger.LogError(fallbackEx,
                            "Fallback rendering with embedded template also failed for {Template}",
                            templateName);
                    }
                }

                _logger.LogError(ex, "Error rendering HTML for template {Template}", templateName);
                throw;
            }
        }

        // ─── ClosedXML Excel builder ──────────────────────────────────────────────

        private byte[]? TryBuildExcelWithClosedXml(object data)
        {
            try
            {
                // JToken (Newtonsoft) is NOT correctly serialized by System.Text.Json
                // (it becomes an array instead of an object). Use Newtonsoft to serialize.
                var json = data is JToken jt
                    ? jt.ToString(Formatting.None)
                    : JsonConvert.SerializeObject(data);
                using var doc = JsonDocument.Parse(json);
                var root = doc.RootElement;

                using var wb = new XLWorkbook();

                // ── Monthly-grouped structure (TransactionHistorySummary) ────────
                if (root.TryGetProperty("monthlyGroups", out var monthlyGroups) &&
                    monthlyGroups.ValueKind == JsonValueKind.Array)
                {
                    BuildMonthlySummaryExcel(wb, root, monthlyGroups);
                    using var ms = new MemoryStream();
                    wb.SaveAs(ms);
                    return ms.ToArray();
                }

                // ── Site-grouped structure (TankVolumeHistory) ────────────────────
                if (root.TryGetProperty("siteGroups", out var siteGroups) &&
                    siteGroups.ValueKind == JsonValueKind.Array)
                {
                    BuildSummarySheet(wb, root);
                    BuildTransactionsSheet(wb, root, siteGroups);
                    using var ms = new MemoryStream();
                    wb.SaveAs(ms);
                    return ms.ToArray();
                }

                // ── Flat transactions array ───────────────────────────────────────
                if (root.TryGetProperty("transactions", out var flatTxns) &&
                    flatTxns.ValueKind == JsonValueKind.Array)
                {
                    BuildFlatSheet(wb, root, flatTxns);
                    using var ms = new MemoryStream();
                    wb.SaveAs(ms);
                    return ms.ToArray();
                }

                return null;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "ClosedXML generation skipped due to parse failure");
                return null;
            }
        }

        private static void BuildSummarySheet(XLWorkbook wb, JsonElement root)
        {
            var ws = wb.Worksheets.Add("Summary");
            int row = 1;

            ws.Cell(row, 1).Value = GetStr(root, "reportTitle");
            ws.Cell(row, 1).Style.Font.Bold = true;
            ws.Cell(row, 1).Style.Font.FontSize = 14;
            ws.Range(row, 1, row, 6).Merge();
            row++;

            ws.Cell(row, 1).Value = $"Period: {GetStr(root, "dateFrom")} – {GetStr(root, "dateTo")}";
            ws.Range(row, 1, row, 6).Merge();
            row++;
            ws.Cell(row, 1).Value = $"Created by: {GetStr(root, "createdBy")}   |   Generated: {GetStr(root, "generatedAt")}";
            ws.Range(row, 1, row, 6).Merge();
            row += 2;

            if (root.TryGetProperty("summary", out var s))
            {
                ApplyHeaderRow(ws, row, new[] { "Total Transactions", "Total Refills (L)", "Total Dispensed (L)", "Net Balance Change (L)", "Grand Closing Balance (L)" });
                row++;
                ws.Cell(row, 1).Value = GetStr(s, "totalTransactions");
                ws.Cell(row, 2).Value = GetStr(s, "totalRefills");
                ws.Cell(row, 3).Value = GetStr(s, "totalDispensed");
                ws.Cell(row, 4).Value = GetStr(s, "netBalanceChange");
                ws.Cell(row, 5).Value = GetStr(s, "grandClosingBalance");
                row += 2;
            }

            if (root.TryGetProperty("siteGroups", out var sg) && sg.ValueKind == JsonValueKind.Array)
            {
                ApplyHeaderRow(ws, row, new[] { "Site", "Tank", "Fuel Type", "Opening Bal (L)", "Closing Bal (L)", "Expected Closing (L)", "Match", "Dispensing (L)", "Deliveries (L)", "Transfers (L)" });
                row++;
                foreach (var site in sg.EnumerateArray())
                {
                    if (!site.TryGetProperty("tanks", out var tanks)) continue;
                    foreach (var t in tanks.EnumerateArray())
                    {
                        ws.Cell(row, 1).Value = GetStr(site, "siteName");
                        ws.Cell(row, 2).Value = GetStr(t, "tankName");
                        ws.Cell(row, 3).Value = GetStr(t, "fuelType");
                        ws.Cell(row, 4).Value = GetStr(t, "openingBalance");
                        ws.Cell(row, 5).Value = GetStr(t, "closingBalance");
                        ws.Cell(row, 6).Value = GetStr(t, "expectedClosing");
                        ws.Cell(row, 7).Value = t.TryGetProperty("expectedMatch", out var em) && em.GetBoolean() ? "✓" : "!";
                        ws.Cell(row, 8).Value = t.TryGetProperty("dispensing", out var d) ? GetStr(d, "total") : "";
                        ws.Cell(row, 9).Value = t.TryGetProperty("delivery", out var dv) ? GetStr(dv, "total") : "";
                        ws.Cell(row, 10).Value = t.TryGetProperty("transfer", out var tr) ? GetStr(tr, "total") : "";
                        row++;
                    }
                }
            }

            ws.Columns().AdjustToContents();
        }

        private static void BuildTransactionsSheet(XLWorkbook wb, JsonElement root, JsonElement siteGroups)
        {
            var ws = wb.Worksheets.Add("Transactions");
            int row = 1;

            ApplyHeaderRow(ws, row, new[] { "#", "Date", "Time", "Site", "Tank", "Vehicle", "Type", "Vol Change (L)", "Balance After (L)", "Operator", "Notes" });
            row++;

            foreach (var site in siteGroups.EnumerateArray())
            {
                if (!site.TryGetProperty("transactionGroups", out var groups)) continue;

                foreach (var grp in groups.EnumerateArray())
                {
                    if (!grp.TryGetProperty("rows", out var rows)) continue;

                    foreach (var r in rows.EnumerateArray())
                    {
                        ws.Cell(row, 1).Value = r.TryGetProperty("rowNumber", out var rn) ? rn.GetInt32().ToString() : "";
                        var ts = r.TryGetProperty("timestamp", out var t) ? t : default;
                        ws.Cell(row, 2).Value = ts.ValueKind != JsonValueKind.Undefined ? GetStr(ts, "date") : "";
                        ws.Cell(row, 3).Value = ts.ValueKind != JsonValueKind.Undefined ? GetStr(ts, "time") : "";
                        ws.Cell(row, 4).Value = GetStr(r, "siteName");
                        ws.Cell(row, 5).Value = GetStr(r, "tankName");
                        ws.Cell(row, 6).Value = GetStr(r, "vehiclePlate");
                        ws.Cell(row, 7).Value = GetStr(r, "changeReasonLabel");
                        ws.Cell(row, 8).Value = GetStr(r, "volumeChange");
                        ws.Cell(row, 9).Value = GetStr(r, "balanceAfter");
                        ws.Cell(row, 10).Value = GetStr(r, "operatorName");
                        ws.Cell(row, 11).Value = GetStr(r, "notes");
                        row++;
                    }
                }
            }

            if (root.TryGetProperty("summary", out var s))
            {
                row++;
                ws.Cell(row, 7).Value = "TOTAL";
                ws.Cell(row, 8).Value = GetStr(s, "netBalanceChange");
                ws.Cell(row, 9).Value = GetStr(s, "grandClosingBalance");
                ws.Range(row, 1, row, 11).Style.Font.Bold = true;
                ws.Range(row, 1, row, 11).Style.Fill.BackgroundColor = XLColor.FromHtml("#1F2937");
                ws.Range(row, 1, row, 11).Style.Font.FontColor = XLColor.White;
            }

            ws.Columns().AdjustToContents();
        }

        private static void BuildMonthlySummaryExcel(XLWorkbook wb, JsonElement root, JsonElement monthlyGroups)
        {
            var ws = wb.Worksheets.Add("Monthly Summary");
            int row = 1;

            ws.Cell(row, 1).Value = GetStr(root, "reportTitle");
            ws.Cell(row, 1).Style.Font.Bold = true;
            ws.Cell(row, 1).Style.Font.FontSize = 14;
            ws.Range(row, 1, row, 11).Merge();
            row++;

            ws.Cell(row, 1).Value = $"Period: {GetStr(root, "dateFrom")} – {GetStr(root, "dateTo")}";
            ws.Range(row, 1, row, 11).Merge();
            row += 2;

            // Summary row
            if (root.TryGetProperty("summary", out var s))
            {
                ApplyHeaderRow(ws, row, new[] { "Total Transactions", "Total Dispensed (L)", "Total Delivered (L)", "Total Transferred (L)", "Net Variance (L)", "Months", "Sites", "Tanks" });
                row++;
                ws.Cell(row, 1).Value = GetStr(s, "totalTransactions");
                ws.Cell(row, 2).Value = GetStr(s, "totalDispensed");
                ws.Cell(row, 3).Value = GetStr(s, "totalDelivery");
                ws.Cell(row, 4).Value = GetStr(s, "totalTransfer");
                ws.Cell(row, 5).Value = GetStr(s, "netVariance");
                ws.Cell(row, 6).Value = GetStr(s, "monthsCovered");
                ws.Cell(row, 7).Value = GetStr(s, "sitesMonitored");
                ws.Cell(row, 8).Value = GetStr(s, "tanksMonitored");
                row += 2;
            }

            // Monthly detail
            var headers = new[] { "Tank", "Opening (L)", "Dispensing (L)", "Disp #", "Delivery (L)", "Del #", "Transfer (L)", "Xfer #", "Closing (L)", "Variance (L)", "Avg Daily (L)" };

            foreach (var month in monthlyGroups.EnumerateArray())
            {
                // Month header
                ws.Cell(row, 1).Value = GetStr(month, "monthLabel");
                ws.Cell(row, 1).Style.Font.Bold = true;
                ws.Cell(row, 1).Style.Font.FontSize = 12;
                ws.Range(row, 1, row, 11).Merge();
                ws.Range(row, 1, row, 11).Style.Fill.BackgroundColor = XLColor.FromHtml("#1F2937");
                ws.Range(row, 1, row, 11).Style.Font.FontColor = XLColor.White;
                row++;

                ApplyHeaderRow(ws, row, headers);
                row++;

                if (month.TryGetProperty("siteGroups", out var siteGroups))
                {
                    foreach (var site in siteGroups.EnumerateArray())
                    {
                        // Site sub-header
                        ws.Cell(row, 1).Value = GetStr(site, "siteName");
                        ws.Cell(row, 1).Style.Font.Bold = true;
                        ws.Range(row, 1, row, 11).Style.Fill.BackgroundColor = XLColor.FromHtml("#EBF4FC");
                        row++;

                        if (site.TryGetProperty("tanks", out var tanks))
                        {
                            foreach (var t in tanks.EnumerateArray())
                            {
                                ws.Cell(row, 1).Value = GetStr(t, "tankName");
                                ws.Cell(row, 2).Value = GetStr(t, "openingBalance");
                                ws.Cell(row, 3).Value = t.TryGetProperty("dispensing", out var d) ? GetStr(d, "total") : "";
                                ws.Cell(row, 4).Value = t.TryGetProperty("dispensing", out var dc) ? GetStr(dc, "count") : "";
                                ws.Cell(row, 5).Value = t.TryGetProperty("delivery", out var dv) ? GetStr(dv, "total") : "";
                                ws.Cell(row, 6).Value = t.TryGetProperty("delivery", out var dvc) ? GetStr(dvc, "count") : "";
                                ws.Cell(row, 7).Value = t.TryGetProperty("transfer", out var tr) ? GetStr(tr, "total") : "";
                                ws.Cell(row, 8).Value = t.TryGetProperty("transfer", out var trc) ? GetStr(trc, "count") : "";
                                ws.Cell(row, 9).Value = GetStr(t, "closingBalance");
                                ws.Cell(row, 10).Value = GetStr(t, "variance");
                                ws.Cell(row, 11).Value = GetStr(t, "avgDailyConsumption");
                                row++;
                            }
                        }
                    }
                }

                // Subtotal row
                if (month.TryGetProperty("subtotal", out var sub))
                {
                    ws.Cell(row, 1).Value = "Subtotal";
                    ws.Cell(row, 3).Value = GetStr(sub, "dispensing");
                    ws.Cell(row, 4).Value = GetStr(sub, "dispensingCount");
                    ws.Cell(row, 5).Value = GetStr(sub, "delivery");
                    ws.Cell(row, 6).Value = GetStr(sub, "deliveryCount");
                    ws.Cell(row, 7).Value = GetStr(sub, "transfer");
                    ws.Cell(row, 8).Value = GetStr(sub, "transferCount");
                    ws.Cell(row, 10).Value = GetStr(sub, "variance");
                    ws.Range(row, 1, row, 11).Style.Font.Bold = true;
                    ws.Range(row, 1, row, 11).Style.Fill.BackgroundColor = XLColor.FromHtml("#F0F4F8");
                    row++;
                }

                row++; // blank row between months
            }

            // Grand total
            if (root.TryGetProperty("grandTotal", out var gt))
            {
                ws.Cell(row, 1).Value = "Grand Total";
                ws.Cell(row, 3).Value = GetStr(gt, "dispensing");
                ws.Cell(row, 5).Value = GetStr(gt, "delivery");
                ws.Cell(row, 7).Value = GetStr(gt, "transfer");
                ws.Cell(row, 10).Value = GetStr(gt, "variance");
                ws.Range(row, 1, row, 11).Style.Font.Bold = true;
                ws.Range(row, 1, row, 11).Style.Fill.BackgroundColor = XLColor.FromHtml("#1F2937");
                ws.Range(row, 1, row, 11).Style.Font.FontColor = XLColor.White;
            }

            ws.Columns().AdjustToContents();
        }

        private static void BuildFlatSheet(XLWorkbook wb, JsonElement root, JsonElement rows)
        {
            var ws = wb.Worksheets.Add("Data");
            int row = 1;

            if (rows.GetArrayLength() == 0) return;
            var first = rows[0];
            var headers = first.EnumerateObject().Select(p => p.Name).ToArray();
            ApplyHeaderRow(ws, row, headers);
            row++;

            foreach (var r in rows.EnumerateArray())
            {
                int col = 1;
                foreach (var h in headers)
                {
                    ws.Cell(row, col).Value = r.TryGetProperty(h, out var v) ? v.ToString() : "";
                    col++;
                }
                row++;
            }
            ws.Columns().AdjustToContents();
        }

        private static void ApplyHeaderRow(IXLWorksheet ws, int row, IEnumerable<string> headers)
        {
            int col = 1;
            foreach (var h in headers)
            {
                ws.Cell(row, col).Value = h;
                ws.Cell(row, col).Style.Font.Bold = true;
                ws.Cell(row, col).Style.Fill.BackgroundColor = XLColor.FromHtml("#1F2937");
                ws.Cell(row, col).Style.Font.FontColor = XLColor.White;
                col++;
            }
        }

        private static string GetStr(JsonElement el, string key)
            => el.TryGetProperty(key, out var v) ? v.ToString() : "";

        // ─── Template CRUD (delegates to JsReportTemplateManager) ────────────────

        public Task<IEnumerable<string>> GetTemplateListAsync()
            => _templateManager.GetTemplateListAsync();

        public Task<string?> GetTemplateAsync(string templateName)
            => _templateManager.GetTemplateAsync(templateName);

        public Task SaveTemplateAsync(string templateName, string content)
            => _templateManager.SaveTemplateAsync(templateName, content);

        public Task<bool> DeleteTemplateAsync(string templateName)
            => _templateManager.DeleteTemplateAsync(templateName);

        // ─── Dispose ──────────────────────────────────────────────────────────────

        public async ValueTask DisposeAsync()
        {
            if (_browser != null)
            {
                try { await _browser.CloseAsync(); } catch { /* ignore */ }
                try { _browser.Dispose(); } catch { /* ignore */ }
                _browser = null;
            }

            if (_reportingService != null)
                await _reportingService.KillAsync();

            _browserLock.Dispose();
            _jsReportLock.Dispose();
        }

        // ═══════════════════════════════════════════════════════════════════════════
        //  PRIVATE HELPERS
        // ═══════════════════════════════════════════════════════════════════════════

        // ─── jsreport Handlebars rendering (HTML only) ────────────────────────────

        /// <summary>
        /// Loads a named template from disk and renders it with jsreport using
        /// the Handlebars engine + Html recipe. Returns the rendered HTML string.
        /// </summary>
        private async Task<string> RenderTemplateToHtml(string templateName, object data)
        {
            var content = await LoadTemplate(templateName);
            content = _branding.Apply(content);
            return await RenderRawHtml(content, data);
        }

        /// <summary>
        /// Renders an arbitrary HTML+Handlebars string with jsreport (Html recipe only).
        /// Retries once with a fresh jsreport service instance on WORKER_TIMEOUT.
        /// </summary>
        private async Task<string> RenderRawHtml(string htmlContent, object data)
        {
            // Normalize: JToken → ExpandoObject so any downstream serializer
            // (Newtonsoft or System.Text.Json) produces correct JSON.
            var normalizedData = NormalizeDataForRendering(data);

            _logger.LogDebug("RenderRawHtml: data type={Type}, template length={Len}",
                normalizedData?.GetType().Name ?? "null", htmlContent?.Length ?? 0);

            var request = new RenderRequest
            {
                Template = new Template
                {
                    Content = htmlContent,
                    Engine = Engine.Handlebars,
                    Recipe = Recipe.Html
                },
                Data = normalizedData,
                Options = BuildRenderOptions(data)
            };

            jsreport.Types.Report report;
            try
            {
                report = await _reportingService.RenderAsync(request);
            }
            catch (Exception ex) when (IsWorkerTimeoutError(ex))
            {
                _logger.LogWarning(ex,
                    "jsreport WORKER_TIMEOUT on first attempt — recreating service and retrying once");

                await RecreateJsReportServiceAsync();

                // Single retry after service recreation
                report = await _reportingService.RenderAsync(request);
            }

            using var reader = new StreamReader(report.Content);
            var html = await reader.ReadToEndAsync();

            // Debug: log a snippet of the rendered HTML to help diagnose data binding issues
            if (html != null && html.Length > 0)
            {
                var hasSiteGroups = html.Contains("site-divider-row", StringComparison.OrdinalIgnoreCase);
                var hasNoTransactions = html.Contains("No transactions found", StringComparison.OrdinalIgnoreCase);
                _logger.LogInformation(
                    "RenderRawHtml complete: {Len} chars, hasSiteGroups={HasSG}, hasNoTxn={HasNoTxn}",
                    html.Length, hasSiteGroups, hasNoTransactions);
            }

            return html;
        }

        // ─── PuppeteerSharp HTML → PDF ────────────────────────────────────────────

        /// <summary>
        /// Converts rendered HTML to PDF using PuppeteerSharp with system Chrome/Edge.
        /// Maintains a shared browser instance for efficiency.
        /// </summary>
        private async Task<byte[]> ConvertHtmlToPdfAsync(string html, bool landscape = false)
        {
            try
            {
                var browser = await GetOrCreateBrowserAsync();

                await using var page = await browser.NewPageAsync();

                // Set the content and wait for fonts/images to load
                await page.SetContentAsync(html, new NavigationOptions
                {
                    WaitUntil = [WaitUntilNavigation.Networkidle0],
                    Timeout = 30_000
                });

                var pdfBytes = await page.PdfDataAsync(new PdfOptions
                {
                    Format = PaperFormat.A4,
                    Landscape = landscape,
                    PrintBackground = true,
                    DisplayHeaderFooter = true,
                    HeaderTemplate = @"<div style=""width:100%; padding:16px 20px 4px 20px; font-size:9px; color:#6c757d; display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #e5e7eb;"">
                    <span style=""font-weight:700; color:#1F2937; font-size:10px;"">Hyoung Fleet Management</span>
                    <span style=""font-size:8px; color:#9CA3AF;"">Fleet Management &amp; Fueling Operations</span>
                </div>",
                    FooterTemplate = @"<div style=""width:100%; padding:4px 20px; font-size:9px; color:#6c757d; display:flex; justify-content:space-between; align-items:center; border-top:1px solid #e5e7eb;"">
                    <span>HYoung EA &mdash; Fleet Management &amp; Fueling Operations</span>
                    <span>Page <span class=""pageNumber""></span> of <span class=""totalPages""></span></span>
                </div>",
                    MarginOptions = new MarginOptions
                    {
                        Top = "60px",
                        Bottom = "50px",
                        Left = "20px",
                        Right = "20px"
                    }
                });

                return pdfBytes;
            }
            catch (PuppeteerSharp.ProcessException ex)
            {
                _logger.LogWarning(ex,
                    "PuppeteerSharp browser connection failed. Falling back to direct headless Chrome --print-to-pdf.");

                return await ConvertHtmlToPdfByChromeCliAsync(html, landscape);
            }
        }

        /// <summary>
        /// Nuclear fallback: render PDF by invoking Chrome/Edge directly in headless mode
        /// using --print-to-pdf. This bypasses Puppeteer/DevTools connection entirely.
        /// </summary>
        private async Task<byte[]> ConvertHtmlToPdfByChromeCliAsync(string html, bool landscape)
        {
            var cliExePath = _activeBrowserExePath ?? _browserExecutablePaths.FirstOrDefault();
            if (string.IsNullOrWhiteSpace(cliExePath))
                throw new InvalidOperationException("Chrome/Edge executable path is not available for CLI PDF fallback.");

            var workDir = Path.Combine(Path.GetTempPath(), $"fms-chrome-pdf-{Guid.NewGuid():N}");
            Directory.CreateDirectory(workDir);

            var htmlPath = Path.Combine(workDir, "report.html");
            var pdfPath = Path.Combine(workDir, "report.pdf");

            try
            {
                var htmlWithPrintStyle = WrapHtmlForCliPrint(html, landscape);
                await File.WriteAllTextAsync(htmlPath, htmlWithPrintStyle, Encoding.UTF8);

                var psi = new ProcessStartInfo
                {
                    FileName = cliExePath,
                    UseShellExecute = false,
                    RedirectStandardOutput = true,
                    RedirectStandardError = true,
                    CreateNoWindow = true,
                    WorkingDirectory = workDir
                };

                psi.ArgumentList.Add("--headless=new");
                psi.ArgumentList.Add("--disable-gpu");
                psi.ArgumentList.Add("--no-sandbox");
                psi.ArgumentList.Add("--disable-dev-shm-usage");
                psi.ArgumentList.Add("--allow-file-access-from-files");
                psi.ArgumentList.Add("--no-first-run");
                psi.ArgumentList.Add("--disable-extensions");
                psi.ArgumentList.Add("--disable-background-networking");
                psi.ArgumentList.Add("--print-to-pdf-no-header");
                psi.ArgumentList.Add($"--print-to-pdf={pdfPath}");
                psi.ArgumentList.Add(new Uri(htmlPath).AbsoluteUri);

                _logger.LogInformation("Launching Chrome/Edge CLI fallback for PDF: {Path}", cliExePath);

                using var process = Process.Start(psi)
                    ?? throw new InvalidOperationException("Failed to start Chrome process for CLI PDF fallback.");

                using var timeoutCts = new CancellationTokenSource(TimeSpan.FromSeconds(90));
                await process.WaitForExitAsync(timeoutCts.Token);

                var stdErr = await process.StandardError.ReadToEndAsync();
                var stdOut = await process.StandardOutput.ReadToEndAsync();

                if (process.ExitCode != 0)
                {
                    throw new InvalidOperationException(
                        $"Chrome CLI PDF fallback failed (exit code {process.ExitCode}). stderr: {stdErr}. stdout: {stdOut}");
                }

                if (!File.Exists(pdfPath))
                {
                    throw new FileNotFoundException(
                        $"Chrome CLI PDF fallback completed but output file was not created: {pdfPath}. stderr: {stdErr}");
                }

                _logger.LogInformation("Chrome CLI fallback generated PDF successfully: {PdfPath}", pdfPath);
                return await File.ReadAllBytesAsync(pdfPath);
            }
            catch (OperationCanceledException)
            {
                throw new TimeoutException("Chrome CLI PDF fallback timed out after 90 seconds.");
            }
            finally
            {
                try
                {
                    if (Directory.Exists(workDir))
                        Directory.Delete(workDir, recursive: true);
                }
                catch
                {
                    // best effort cleanup only
                }
            }
        }

        private static string WrapHtmlForCliPrint(string html, bool landscape)
        {
            var orientation = landscape ? "landscape" : "portrait";
            var pageStyle =
                "<style>" +
                "@page { size: A4 " + orientation + "; margin: 18mm 8mm 16mm 8mm; }" +
                "html, body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }" +
                "</style>";

            if (html.Contains("</head>", StringComparison.OrdinalIgnoreCase))
            {
                return html.Replace("</head>", pageStyle + "</head>", StringComparison.OrdinalIgnoreCase);
            }

            return "<!doctype html><html><head><meta charset=\"utf-8\">" + pageStyle + "</head><body>" + html + "</body></html>";
        }

        /// <summary>
        /// Gets or lazily creates a shared Puppeteer browser instance.
        /// Thread-safe via SemaphoreSlim. Tries all detected Chrome/Edge
        /// executables in priority order, recreating the profile directory
        /// on each attempt to avoid stale-lock issues.
        /// </summary>
        private async Task<IBrowser> GetOrCreateBrowserAsync()
        {
            if (_browser != null && _browser.IsConnected)
                return _browser;

            await _browserLock.WaitAsync();
            try
            {
                // Double-check after acquiring lock
                if (_browser != null && _browser.IsConnected)
                    return _browser;

                if (_browserExecutablePaths.Count == 0)
                {
                    throw new InvalidOperationException(
                        "No system Chrome or Edge browser found. Install Chrome or Edge to enable PDF rendering. " +
                        "Checked paths: " + string.Join(", ", ChromeExecutablePaths));
                }

                // Try each available browser executable in priority order.
                // For each executable, allow up to 2 launch attempts (second attempt
                // kills stale processes and recreates the profile directory).
                var allErrors = new List<string>();

                foreach (var exePath in GetBrowserLaunchCandidates())
                {
                    const int maxAttemptsPerExe = 2;
                    for (int attempt = 1; attempt <= maxAttemptsPerExe; attempt++)
                    {
                        try
                        {
                            _browser = await LaunchBrowserCoreAsync(exePath, attempt);
                            _activeBrowserExePath = exePath;

                            _logger.LogInformation(
                                "PuppeteerSharp browser launched successfully " +
                                "(exe: {Exe}, PID: {Pid}, attempt: {Attempt})",
                                exePath, _browser.Process?.Id ?? -1, attempt);

                            return _browser;
                        }
                        catch (Exception ex) when (attempt < maxAttemptsPerExe)
                        {
                            var msg = $"{exePath} attempt {attempt}: {ex.GetType().Name} — {ex.Message}";
                            allErrors.Add(msg);
                            _logger.LogWarning(ex,
                                "PuppeteerSharp launch failed ({Exe}, attempt {Attempt}). " +
                                "Killing stale processes and retrying with fresh profile...",
                                exePath, attempt);

                            if (_browser != null)
                            {
                                try { _browser.Dispose(); } catch { /* ignore */ }
                                _browser = null;
                            }

                            KillStaleChromePuppeteerProcesses();
                            await Task.Delay(2_000);
                        }
                        catch (Exception ex)
                        {
                            var msg = $"{exePath} attempt {attempt}: {ex.GetType().Name} — {ex.Message}";
                            allErrors.Add(msg);
                            _logger.LogWarning(ex,
                                "PuppeteerSharp launch failed ({Exe}, attempt {Attempt}). " +
                                "Moving to next browser executable...",
                                exePath, attempt);

                            if (_browser != null)
                            {
                                try { _browser.Dispose(); } catch { /* ignore */ }
                                _browser = null;
                            }

                            KillStaleChromePuppeteerProcesses();
                        }
                    }
                }

                throw new InvalidOperationException(
                    "Browser launch failed for all detected executables. " +
                    "Tried: [" + string.Join("; ", allErrors) + "]");
            }
            catch (Exception ex) when (ex is not InvalidOperationException)
            {
                _logger.LogError(ex, "Failed to launch PuppeteerSharp browser");
                throw;
            }
            finally
            {
                _browserLock.Release();
            }
        }

        /// <summary>
        /// Core browser launch logic with explicit timeout and a dedicated
        /// user-data-dir under <see cref="PuppeteerProfileRoot"/> to avoid
        /// profile lock conflicts and %TEMP% permission issues.
        /// The profile directory is recreated on each attempt to clear stale locks.
        /// </summary>
        private async Task<IBrowser> LaunchBrowserCoreAsync(string exePath, int attempt)
        {
            // Build a per-executable profile subdirectory so Chrome and Edge
            // don't share (and lock) the same profile.
            var exeLabel = Path.GetFileNameWithoutExtension(exePath).ToLowerInvariant();
            var profileDir = Path.Combine(
                Directory.Exists(PuppeteerProfileRoot) ? PuppeteerProfileRoot : Path.GetTempPath(),
                $"fms-puppeteer-{exeLabel}");

            // Recreate the profile directory on every attempt to clear stale
            // lock files (SingletonLock, SingletonSocket, etc.) that prevent
            // the browser from starting cleanly.
            try
            {
                if (Directory.Exists(profileDir))
                {
                    Directory.Delete(profileDir, recursive: true);
                    _logger.LogInformation(
                        "Deleted stale PuppeteerSharp profile dir: {Dir}", profileDir);
                }
            }
            catch (Exception delEx)
            {
                _logger.LogWarning(delEx,
                    "Could not delete PuppeteerSharp profile dir {Dir} — continuing anyway", profileDir);
            }

            Directory.CreateDirectory(profileDir);

            _logger.LogInformation(
                "Launching PuppeteerSharp browser (exe: {Exe}, attempt: {Attempt}, profile: {Dir})",
                exePath, attempt, profileDir);

            return await Puppeteer.LaunchAsync(new LaunchOptions
            {
                ExecutablePath = exePath,
                Headless = true,
                Timeout = 120_000,
                Args =
                [
                    "--no-sandbox",
                    "--disable-setuid-sandbox",
                    "--disable-dev-shm-usage",
                    "--disable-gpu",
                    "--disable-extensions",
                    "--disable-background-networking",
                    "--disable-default-apps",
                    "--no-first-run",
                    "--disable-features=TranslateUI",
                    "--disable-component-update",
                    "--disable-hang-monitor",
                    $"--user-data-dir={profileDir}"
                ]
            });
        }

        private IEnumerable<string> GetBrowserLaunchCandidates()
        {
            if (!string.IsNullOrWhiteSpace(_activeBrowserExePath) && File.Exists(_activeBrowserExePath))
            {
                yield return _activeBrowserExePath;
            }

            foreach (var browserPath in _browserExecutablePaths)
            {
                if (!string.Equals(browserPath, _activeBrowserExePath, StringComparison.OrdinalIgnoreCase))
                {
                    yield return browserPath;
                }
            }
        }

        /// <summary>
        /// Kills orphaned Chrome and Edge processes that were previously launched by
        /// PuppeteerSharp (identified by executable path or the --user-data-dir argument
        /// containing "fms-puppeteer-"). Prevents stale processes from holding
        /// debugging ports and causing subsequent launch timeouts.
        /// </summary>
        private void KillStaleChromePuppeteerProcesses()
        {
            try
            {
                // Check both Chrome and Edge process names to cover all executables
                var processNames = new[] { "chrome", "msedge" };
                int killed = 0;

                foreach (var processName in processNames)
                {
                    var candidates = Process.GetProcessesByName(processName);
                    foreach (var proc in candidates)
                    {
                        try
                        {
                            // Only kill instances we spawned (identified by our profile dir in command line)
                            var cmdLine = GetProcessCommandLine(proc);
                            if (cmdLine != null && cmdLine.Contains("fms-puppeteer-", StringComparison.OrdinalIgnoreCase))
                            {
                                proc.Kill(entireProcessTree: true);
                                killed++;
                            }
                        }
                        catch { /* process may have already exited */ }
                        finally
                        {
                            proc.Dispose();
                        }
                    }
                }

                if (killed > 0)
                    _logger.LogInformation("Killed {Count} stale PuppeteerSharp browser process(es)", killed);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Error while cleaning up stale browser processes");
            }
        }

        /// <summary>
        /// Attempts to read the command line of a process via WMI (Windows) or /proc (Linux).
        /// Returns null if unavailable.
        /// </summary>
        private static string? GetProcessCommandLine(Process process)
        {
            try
            {
                // On Windows, use the environment block or MainModule as a proxy
                return process.MainModule?.FileName;
            }
            catch
            {
                return null;
            }
        }

        // ─── Shared helpers ───────────────────────────────────────────────────────

        private async Task<string> LoadTemplate(string templateName)
        {
            var resolvedTemplateName = ResolveTemplateName(templateName);

            // Always prefer embedded (compiled) templates over disk files.
            // Disk files may be stale from a previous deployment and miss
            // new fields (e.g. variance). If the embedded template exists,
            // use it and silently repair the disk copy.
            if (TryGetEmbeddedTemplate(resolvedTemplateName, out var embedded))
            {
                // Fire-and-forget repair so disk stays in sync for external editors
                _ = TryRepairTemplateFileAsync(resolvedTemplateName, embedded);
                return embedded;
            }

            // No embedded template — use disk file (custom / user-uploaded templates)
            var content = await _templateManager.GetTemplateAsync(resolvedTemplateName);
            if (string.IsNullOrEmpty(content))
                throw new FileNotFoundException($"Template '{resolvedTemplateName}' not found.");
            return content;
        }

        private RenderOptions BuildRenderOptions(object data)
        {
            var payloadBytes = EstimatePayloadSizeBytes(data);
            var timeoutMs = payloadBytes >= LargePayloadThresholdBytes
                ? LargePayloadRenderTimeoutMs
                : DefaultRenderTimeoutMs;

            _logger.LogDebug("JsReport render: {Bytes} bytes → timeout {Ms}ms", payloadBytes, timeoutMs);
            return new RenderOptions { Timeout = timeoutMs };
        }

        private int EstimatePayloadSizeBytes(object data)
        {
            if (data == null) return 0;
            try
            {
                if (data is JsonElement jsonElement)
                    return Encoding.UTF8.GetByteCount(jsonElement.GetRawText());
                return Encoding.UTF8.GetByteCount(JsonConvert.SerializeObject(data));
            }
            catch (Exception ex)
            {
                _logger.LogDebug(ex, "Failed to estimate payload size");
                return 0;
            }
        }

        private static bool IsTemplateParseError(Exception ex)
        {
            var message = ex.ToString();
            return message.Contains("parse error", StringComparison.OrdinalIgnoreCase)
                || message.Contains("OPEN_ENDBLOCK", StringComparison.OrdinalIgnoreCase)
                || message.Contains("error when evaluating engine handlebars", StringComparison.OrdinalIgnoreCase);
        }

        private static bool TryGetEmbeddedTemplate(string templateName, out string content)
        {
            content = templateName switch
            {
                "pump-transaction-report" => JsReportHtmlTemplates.PumpTransaction(),
                "vehicle-consumption-report" => JsReportHtmlTemplates.VehicleConsumption(),
                "fuel-refill-report" => JsReportHtmlTemplates.FuelRefill(),
                "fuel-delivery-report" => JsReportHtmlTemplates.FuelDelivery(),
                "device-offline-report" => JsReportHtmlTemplates.DeviceOffline(),
                "pts-device-status-report" => JsReportHtmlTemplates.PtsDeviceStatus(),
                "tank-volume-history-report" => JsReportHtmlTemplates.TankVolumeHistory(),
                "issue-tracker-report" => JsReportHtmlTemplates.IssueTracker(),
                "consumption-by-refills-report" => JsReportHtmlTemplates.ConsumptionByRefills(),
                "transaction-history-summary-report" => JsReportHtmlTemplates.TransactionHistorySummary(),
                "vehicle-document-compliance-report" => JsReportHtmlTemplates.VehicleDocumentCompliance(),
                "live-trip-operations-report" => LiveTripOperationsHtmlTemplate.Get(),
                _ => string.Empty
            };

            return !string.IsNullOrWhiteSpace(content);
        }

        private static string ResolveTemplateName(string templateName)
        {
            return templateName switch
            {
                "transaction-volume-history-report" => "tank-volume-history-report",
                _ => templateName
            };
        }

        private async Task TryRepairTemplateFileAsync(string templateName, string embeddedTemplate)
        {
            try
            {
                await _templateManager.SaveTemplateAsync(templateName, embeddedTemplate);
                _logger.LogInformation("Template {Template} repaired using embedded default", templateName);
            }
            catch (Exception repairEx)
            {
                _logger.LogWarning(repairEx,
                    "Failed to auto-repair template file for {Template}.",
                    templateName);
            }
        }

        /// <summary>
        /// Converts JToken (Newtonsoft) data to a serialization-agnostic ExpandoObject.
        /// This prevents issues when jsreport or System.Text.Json encounters a JToken —
        /// System.Text.Json serializes JObject as an array of JProperty entries instead
        /// of a proper JSON object, breaking Handlebars data bindings.
        /// </summary>
        private static object NormalizeDataForRendering(object data)
        {
            if (data is JToken jt)
            {
                // Round-trip: JToken → JSON string → ExpandoObject
                // The ExpandoObjectConverter ensures objects → ExpandoObject, arrays → List<object>
                var json = jt.ToString(Formatting.None);
                var result = JsonConvert.DeserializeObject<System.Dynamic.ExpandoObject>(
                    json, new Newtonsoft.Json.Converters.ExpandoObjectConverter());
                return result!;
            }

            return data;
        }
    }
}
