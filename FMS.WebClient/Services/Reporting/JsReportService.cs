/**
 * File: JsReportService.cs
 * Purpose: Core jsreport rendering engine — PDF, Excel, HTML, and inline PDF.
 * Dependencies: jsreport.Local, jsreport.Binary, jsreport.Types, IWebHostEnvironment,
 *               JsReportTemplateManager, JsReportLetterheadBranding
 * Last Modified: 2026-02-18
 *
 * Key Functions:
 * - RenderPdfAsync        : Renders a named template to PDF bytes (Chrome PDF recipe)
 * - RenderExcelAsync      : Renders a named template to XLSX bytes (HtmlToXlsx recipe)
 * - RenderHtmlAsync       : Renders a named template to HTML string (preview)
 * - RenderInlinePdfAsync  : Renders an arbitrary HTML string to PDF bytes
 * - Template CRUD         : Delegates to JsReportTemplateManager
 * - Chrome config & daemon cleanup are handled in the constructor
 */
using jsreport.Local;
using jsreport.Types;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace FMS.WebClient.Services.Reporting
{
    /// <summary>
    /// JsReport rendering service. Produces PDF / Excel / HTML output from
    /// Handlebars templates stored on disk. All template management is
    /// delegated to <see cref="JsReportTemplateManager"/>.
    /// </summary>
    public class JsReportService : IJsReportService, IAsyncDisposable
    {
        // ─── Constants ────────────────────────────────────────────────────────────

        private const int DefaultRenderTimeoutMs      = 120_000;
        private const int LargePayloadRenderTimeoutMs = 300_000;
        private const int LargePayloadThresholdBytes  = 750_000;

        /// <summary>
        /// Known Chrome/Edge paths checked in priority order.
        /// The first existing path is written into jsreport.config.json to avoid 'spawn UNKNOWN'.
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

        // ─── Constructor ──────────────────────────────────────────────────────────

        public JsReportService(ILogger<JsReportService> logger, IWebHostEnvironment environment)
        {
            _logger = logger;

            _templateManager = new JsReportTemplateManager(logger, environment);
            var logoPath = JsReportTemplateManager.ResolveBrandingLogoPath(logger);
            _branding = new JsReportLetterheadBranding(logger, logoPath);

            _logger.LogInformation("JsReport templates path: {Path}", _templateManager.TemplatesPath);
            _logger.LogInformation("JsReport letterhead logo path: {Path}", _branding.LogoPath);

            var jsReportTempPath = Path.Combine(Path.GetTempPath(), "FMS_JsReport_Temp");
            Directory.CreateDirectory(jsReportTempPath);

            // Route jsreport to system Chrome to avoid 'spawn UNKNOWN' from bundled Chromium.
            var chromeExePath = ChromeExecutablePaths.FirstOrDefault(File.Exists);
            if (chromeExePath != null)
            {
                _logger.LogInformation("JsReport will use system Chrome: {Path}", chromeExePath);
                WriteJsReportChromeConfig(jsReportTempPath, chromeExePath);
                WriteJsReportChromeConfig(
                    Path.Combine(environment.ContentRootPath, "jsreport"), chromeExePath);
            }
            else
            {
                _logger.LogWarning("System Chrome not found — jsreport will attempt its bundled Chromium.");
            }

            // Kill stale daemons so they restart with the new Chrome config.
            KillStaleJsReportDaemons(jsReportTempPath);

            var localReporting = new LocalReporting()
                .UseBinary(jsreport.Binary.JsReportBinary.GetBinary())
                .Configure(cfg =>
                {
                    cfg.TrustUserCode = true;
                    cfg.TempDirectory = jsReportTempPath;
                    cfg.FileSystemStore();
                    return cfg;
                })
                .AsUtility();

            _reportingService = localReporting.Create();

            _logger.LogInformation("JsReport service initialized — templates: {Path}, temp: {Temp}",
                _templateManager.TemplatesPath, jsReportTempPath);

            _templateManager.EnsureSampleTemplatesAsync().Wait();
        }

        // ─── Render Methods ───────────────────────────────────────────────────────

        public async Task<byte[]> RenderPdfAsync(string templateName, object data)
        {
            try
            {
                var content = await LoadTemplate(templateName);
                content = _branding.Apply(content);

                var report = await _reportingService.RenderAsync(new RenderRequest
                {
                    Template = new Template
                    {
                        Content = content,
                        Engine  = Engine.Handlebars,
                        Recipe  = Recipe.ChromePdf,
                        Chrome  = BuildPdfChromeOptions()
                    },
                    Data    = data,
                    Options = BuildRenderOptions(data)
                });

                using var ms = new MemoryStream();
                await report.Content.CopyToAsync(ms);
                return ms.ToArray();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error rendering PDF for template {Template}. Payload: {Bytes} bytes",
                    templateName, EstimatePayloadSizeBytes(data));
                throw;
            }
        }

        public async Task<byte[]> RenderExcelAsync(string templateName, object data)
        {
            try
            {
                var content = await LoadTemplate(templateName);
                content = _branding.Apply(content);

                var report = await _reportingService.RenderAsync(new RenderRequest
                {
                    Template = new Template
                    {
                        Content = content,
                        Engine = Engine.Handlebars,
                        Recipe = Recipe.HtmlToXlsx
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

        public async Task<string> RenderHtmlAsync(string templateName, object data)
        {
            try
            {
                var content = await LoadTemplate(templateName);
                content = _branding.Apply(content);

                var report = await _reportingService.RenderAsync(new RenderRequest
                {
                    Template = new Template
                    {
                        Content = content,
                        Engine  = Engine.Handlebars,
                        Recipe  = Recipe.Html
                    },
                    Data    = data,
                    Options = BuildRenderOptions(data)
                });

                using var reader = new StreamReader(report.Content);
                return await reader.ReadToEndAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error rendering HTML for template {Template}", templateName);
                throw;
            }
        }

        public async Task<byte[]> RenderInlinePdfAsync(string htmlTemplate, object data)
        {
            try
            {
                var branded = _branding.Apply(htmlTemplate);
                var report = await _reportingService.RenderAsync(new RenderRequest
                {
                    Template = new Template
                    {
                        Content = branded,
                        Engine  = Engine.Handlebars,
                        Recipe  = Recipe.ChromePdf,
                        Chrome  = BuildPdfChromeOptions()
                    },
                    Data    = data,
                    Options = BuildRenderOptions(data)
                });

                using var ms = new MemoryStream();
                await report.Content.CopyToAsync(ms);
                return ms.ToArray();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error rendering inline PDF");
                throw;
            }
        }

        // ─── Template CRUD (delegates to JsReportTemplateManager) ────────────────

        public Task<IEnumerable<string>> GetTemplateListAsync()
            => _templateManager.GetTemplateListAsync();

        public Task<string?> GetTemplateAsync(string templateName)
            => _templateManager.GetTemplateAsync(templateName);

        public Task SaveTemplateAsync(string templateName, string content)
            => _templateManager.SaveTemplateAsync(templateName, content);

        public Task<bool> DeleteTemplateAsync(string templateName)
            => _templateManager.DeleteTemplateAsync(templateName);

        public async ValueTask DisposeAsync()
        {
            if (_reportingService != null)
                await _reportingService.KillAsync();
        }

        // ─── Private Helpers ──────────────────────────────────────────────────────

        /// <summary>Loads template content; throws <see cref="FileNotFoundException"/> if missing.</summary>
        private async Task<string> LoadTemplate(string templateName)
        {
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

        /// <summary>
        /// Writes a jsreport.config.json into the jsreport working directory so the Chrome PDF
        /// recipe uses the system-installed browser instead of the bundled Chromium.
        /// The bundled Chromium can fail to spawn on some Windows configurations (spawn UNKNOWN).
        /// </summary>
        private void WriteJsReportChromeConfig(string directoryPath, string chromeExePath)
        {
            try
            {
                if (!Directory.Exists(directoryPath))
                {
                    Directory.CreateDirectory(directoryPath);
                }

                // jsreport reads jsreport.config.json from its working directory
                var configPath = Path.Combine(directoryPath, "jsreport.config.json");
                var config = new
                {
                    chrome = new
                    {
                        launchOptions = new
                        {
                            executablePath = chromeExePath,
                            args = new[] { "--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage" }
                        }
                    }
                };
                var json = System.Text.Json.JsonSerializer.Serialize(config, new System.Text.Json.JsonSerializerOptions { WriteIndented = true });
                File.WriteAllText(configPath, json);
                _logger.LogInformation("Written jsreport chrome config to: {Path}", configPath);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Could not write jsreport chrome config to {Path}. PDF rendering may fail.", directoryPath);
            }
        }

        /// <summary>
        /// Kills any stale jsreport daemon processes tracked in the wSock PID file.
        /// Stale daemons from a previous app run keep their old configuration (without Chrome path)
        /// and will continue to fail with 'spawn UNKNOWN' until they are restarted.
        /// </summary>
        private void KillStaleJsReportDaemons(string jsReportTempPath)
        {
            try
            {
                // jsreport writes the daemon PID into the wSock folder
                var wSockDir = Path.Combine(jsReportTempPath, "cli", "wSock");
                if (!Directory.Exists(wSockDir))
                {
                    return;
                }

                // Terminate any running processes whose PID is listed in the socket files
                foreach (var pidFile in Directory.GetFiles(wSockDir, "*.pid", SearchOption.TopDirectoryOnly))
                {
                    var content = File.ReadAllText(pidFile).Trim();
                    if (int.TryParse(content, out var pid))
                    {
                        try
                        {
                            var process = System.Diagnostics.Process.GetProcessById(pid);
                            if (process != null && !process.HasExited)
                            {
                                _logger.LogInformation("Killing stale jsreport daemon (pid {Pid})", pid);
                                process.Kill(entireProcessTree: true);
                            }
                        }
                        catch (ArgumentException)
                        {
                            // Process not found — already gone
                        }
                        catch (Exception ex)
                        {
                            _logger.LogDebug(ex, "Could not kill stale jsreport daemon (pid {Pid})", pid);
                        }

                        File.Delete(pidFile);
                    }
                }

                // Also delete the wSock directory so jsreport creates a fresh daemon
                try { Directory.Delete(wSockDir, recursive: true); } catch { /* ignore */ }
            }
            catch (Exception ex)
            {
                _logger.LogDebug(ex, "Could not clean up stale jsreport daemons.");
            }
        }

        private Chrome BuildPdfChromeOptions() => new Chrome
        {
            MarginTop           = "20px",
            MarginBottom        = "45px",
            MarginLeft          = "20px",
            MarginRight         = "20px",
            Format              = "A4",
            PrintBackground     = true,
            DisplayHeaderFooter = true,
            HeaderTemplate      = "<div></div>",
            FooterTemplate      = @"<div style=""width:100%; padding:0 16px; font-size:9px; color:#6c757d; text-align:right;"">
                    Page <span class=""pageNumber""></span> of <span class=""totalPages""></span>
                </div>"
        };

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
                _logger.LogDebug(ex, "Failed to estimate JsReport payload size");
                return 0;
            }
        }
    }
}
