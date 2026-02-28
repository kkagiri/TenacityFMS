/**
 * File: JsReportService.cs
 * Purpose: Core report rendering engine — PDF, Excel, HTML, and inline PDF.
 *          Uses jsreport ONLY as a Handlebars template engine (Recipe.Html).
 *          PDF conversion is handled by PuppeteerSharp using the system Chrome/Edge.
 * Dependencies: jsreport.Local, jsreport.Binary, jsreport.Types, PuppeteerSharp,
 *               ClosedXML, IWebHostEnvironment, JsReportTemplateManager, JsReportLetterheadBranding
 * Last Modified: 2026-02-25
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
        /// The first existing path is used by PuppeteerSharp to launch the browser.
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

        // ─── Fields ───────────────────────────────────────────────────────────────

        private readonly ILogger<JsReportService> _logger;
        private readonly ILocalUtilityReportingService _reportingService;
        private readonly JsReportTemplateManager _templateManager;
        private readonly JsReportLetterheadBranding _branding;
        private readonly string? _chromeExePath;

        /// <summary>Shared browser instance — lazily created, reused across renders.</summary>
        private IBrowser? _browser;
        private readonly SemaphoreSlim _browserLock = new(1, 1);

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

            _reportingService = new LocalReporting()
                .UseBinary(jsreport.Binary.JsReportBinary.GetBinary())
                .Configure(cfg =>
                {
                    cfg.TrustUserCode = true;
                    cfg.TempDirectory = jsReportTempPath;
                    cfg.FileSystemStore();
                    return cfg;
                })
                .AsUtility()
                .Create();

            // ── Chrome detection (for PuppeteerSharp PDF conversion) ──────────────
            _chromeExePath = ChromeExecutablePaths.FirstOrDefault(File.Exists);

            if (_chromeExePath != null)
            {
                _logger.LogInformation("PuppeteerSharp will use system Chrome: {Path}", _chromeExePath);
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
        /// </summary>
        private async Task<string> RenderRawHtml(string htmlContent, object data)
        {
            // Normalize: JToken → ExpandoObject so any downstream serializer
            // (Newtonsoft or System.Text.Json) produces correct JSON.
            var normalizedData = NormalizeDataForRendering(data);

            _logger.LogDebug("RenderRawHtml: data type={Type}, template length={Len}",
                normalizedData?.GetType().Name ?? "null", htmlContent?.Length ?? 0);

            var report = await _reportingService.RenderAsync(new RenderRequest
            {
                Template = new Template
                {
                    Content = htmlContent,
                    Engine = Engine.Handlebars,
                    Recipe = Recipe.Html
                },
                Data = normalizedData,
                Options = BuildRenderOptions(data)
            });

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

        /// <summary>
        /// Gets or lazily creates a shared Puppeteer browser instance.
        /// Thread-safe via SemaphoreSlim.
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

                if (_chromeExePath == null)
                {
                    throw new InvalidOperationException(
                        "No system Chrome or Edge browser found. Install Chrome or Edge to enable PDF rendering. " +
                        "Checked paths: " + string.Join(", ", ChromeExecutablePaths));
                }

                _logger.LogInformation("Launching PuppeteerSharp browser: {Path}", _chromeExePath);

                _browser = await Puppeteer.LaunchAsync(new LaunchOptions
                {
                    ExecutablePath = _chromeExePath,
                    Headless = true,
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
                        "--no-zygote"
                    ]
                });

                _logger.LogInformation("PuppeteerSharp browser launched successfully (PID: {Pid})",
                    _browser.Process?.Id ?? -1);

                return _browser;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to launch PuppeteerSharp browser at {Path}", _chromeExePath);
                throw;
            }
            finally
            {
                _browserLock.Release();
            }
        }

        // ─── Shared helpers ───────────────────────────────────────────────────────

        private async Task<string> LoadTemplate(string templateName)
        {
            // Always prefer embedded (compiled) templates over disk files.
            // Disk files may be stale from a previous deployment and miss
            // new fields (e.g. variance). If the embedded template exists,
            // use it and silently repair the disk copy.
            if (TryGetEmbeddedTemplate(templateName, out var embedded))
            {
                // Fire-and-forget repair so disk stays in sync for external editors
                _ = TryRepairTemplateFileAsync(templateName, embedded);
                return embedded;
            }

            // No embedded template — use disk file (custom / user-uploaded templates)
            var content = await _templateManager.GetTemplateAsync(templateName);
            if (string.IsNullOrEmpty(content))
                throw new FileNotFoundException($"Template '{templateName}' not found.");
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
                _ => string.Empty
            };

            return !string.IsNullOrWhiteSpace(content);
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
