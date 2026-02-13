/**
 * File: JsReportService.cs
 * Purpose: Render JsReport templates to PDF, Excel, and HTML using embedded jsreport.Local
 * Dependencies: jsreport.Local, jsreport.Types, Newtonsoft.Json, ILogger
 * Last Modified: 2026-02-12
 *
 * Key Functions:
 * - RenderPdfAsync: Renders a named template to PDF with adaptive timeout for large payloads
 * - RenderExcelAsync: Renders a named template to XLSX with adaptive timeout
 * - RenderHtmlAsync: Renders a named template to HTML preview with adaptive timeout
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
    /// JsReport service for generating PDF and Excel reports
    /// Uses embedded JsReport engine with Handlebars templating
    /// </summary>
    public class JsReportService : IJsReportService, IAsyncDisposable
    {
        private const int DefaultRenderTimeoutMs = 120000;
        private const int LargePayloadRenderTimeoutMs = 300000;
        private const int LargePayloadThresholdBytes = 750000;
        private const string LetterheadLogoFileName = "letterhead-logo.png";
        private const string FmsDataRootPath = "C:\\FMSData";

        private readonly ILogger<JsReportService> _logger;
        private readonly ILocalUtilityReportingService _reportingService;
        private readonly string _templatesPath;
        private readonly string _letterheadLogoPath;
        private readonly string _letterheadLogoDataUri;

        public JsReportService(ILogger<JsReportService> logger, IWebHostEnvironment environment)
        {
            _logger = logger;

            // ALWAYS use a writable location (C:\Logs or temp folder) to avoid IIS permission issues
            // Do NOT use deployment directory (C:\inetpub\wwwroot) as it's read-only for app pools
            _templatesPath = GetWritableTemplatesPath(environment);
            _letterheadLogoPath = GetLetterheadLogoPath(environment);
            _letterheadLogoDataUri = LoadLetterheadLogoDataUri(_letterheadLogoPath);

            _logger.LogInformation("JsReport templates path: {Path}", _templatesPath);
            _logger.LogInformation("JsReport letterhead logo path: {Path}", _letterheadLogoPath);

            // Configure embedded JsReport with temp directory
            var jsReportTempPath = Path.Combine(Path.GetTempPath(), "FMS_JsReport_Temp");
            Directory.CreateDirectory(jsReportTempPath);

            var localReporting = new LocalReporting()
                .UseBinary(jsreport.Binary.JsReportBinary.GetBinary())
                .Configure(cfg =>
                {
                    cfg.TrustUserCode = true;
                    cfg.TempDirectory = jsReportTempPath; // Use writable temp directory
                    cfg.FileSystemStore();
                    return cfg;
                })
                .AsUtility();

            _reportingService = localReporting.Create();

            _logger.LogInformation("JsReport service initialized successfully.");
            _logger.LogInformation("  - Templates: {TemplatesPath}", _templatesPath);
            _logger.LogInformation("  - Temp files: {TempPath}", jsReportTempPath);

            // Ensure sample templates exist
            EnsureSampleTemplatesAsync().Wait();
        }

        /// <summary>
        /// Gets a writable templates path, avoiding IIS deployment directories
        /// </summary>
        private string GetWritableTemplatesPath(IWebHostEnvironment environment)
        {
            // Priority 1: C:\FMSData\reports\templates (shared writable data location)
            var fmsDataTemplatesPath = Path.Combine(FmsDataRootPath, "reports", "templates");
            if (TryCreateDirectory(fmsDataTemplatesPath))
            {
                return fmsDataTemplatesPath;
            }

            // Priority 2: C:\Logs\FMS.Webclient\ReportTemplates (legacy location)
            var logsPath = Path.Combine("C:\\Logs\\FMS.Webclient", "ReportTemplates");
            if (TryCreateDirectory(logsPath))
            {
                return logsPath;
            }

            // Priority 3: User temp folder
            var tempPath = Path.Combine(Path.GetTempPath(), "FMS_ReportTemplates");
            if (TryCreateDirectory(tempPath))
            {
                return tempPath;
            }

            // Priority 4: ProgramData folder (system-wide, usually writable)
            var programDataPath = Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.CommonApplicationData),
                "Hyoung", "FMS", "ReportTemplates");
            if (TryCreateDirectory(programDataPath))
            {
                return programDataPath;
            }

            // Fallback: App_Data (may fail in IIS)
            var appDataPath = Path.Combine(environment.ContentRootPath, "App_Data", "ReportTemplates");
            TryCreateDirectory(appDataPath);
            return appDataPath;
        }

        private string GetLetterheadLogoPath(IWebHostEnvironment environment)
        {
            // Primary location: C:\FMSData\reports\branding
            var fmsDataBrandingPath = Path.Combine(FmsDataRootPath, "reports", "branding");
            if (TryCreateDirectory(fmsDataBrandingPath))
            {
                return Path.Combine(fmsDataBrandingPath, LetterheadLogoFileName);
            }

            // Fallback: existing web root path
            var webRootPath = environment.WebRootPath;
            if (string.IsNullOrWhiteSpace(webRootPath))
            {
                webRootPath = Path.Combine(environment.ContentRootPath, "wwwroot");
            }

            var brandingFolderPath = Path.Combine(webRootPath, "reports", "branding");
            TryCreateDirectory(brandingFolderPath);

            return Path.Combine(brandingFolderPath, LetterheadLogoFileName);
        }

        private string LoadLetterheadLogoDataUri(string logoPath)
        {
            try
            {
                if (!File.Exists(logoPath))
                {
                    _logger.LogWarning(
                        "Letterhead logo not found at {LogoPath}. Place logo file there to show branding in all reports.",
                        logoPath);
                    return string.Empty;
                }

                var imageBytes = File.ReadAllBytes(logoPath);
                if (imageBytes.Length == 0)
                {
                    _logger.LogWarning("Letterhead logo file is empty at {LogoPath}", logoPath);
                    return string.Empty;
                }

                var mimeType = GetImageMimeType(Path.GetExtension(logoPath));
                return $"data:{mimeType};base64,{Convert.ToBase64String(imageBytes)}";
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to load letterhead logo from {LogoPath}", logoPath);
                return string.Empty;
            }
        }

        private static string GetImageMimeType(string extension)
        {
            return extension.ToLowerInvariant() switch
            {
                ".jpg" or ".jpeg" => "image/jpeg",
                ".svg" => "image/svg+xml",
                ".gif" => "image/gif",
                ".webp" => "image/webp",
                _ => "image/png",
            };
        }

        private string ApplyLetterheadBranding(string templateContent)
        {
            if (string.IsNullOrWhiteSpace(templateContent))
            {
                return templateContent;
            }

            if (templateContent.Contains("fms-report-letterhead", StringComparison.OrdinalIgnoreCase))
            {
                return templateContent;
            }

            var updatedTemplate = templateContent;
            var cssBlock = GetLetterheadCssBlock();
            const string styleClosingTag = "</style>";

            var styleIndex = updatedTemplate.IndexOf(styleClosingTag, StringComparison.OrdinalIgnoreCase);
            if (styleIndex >= 0)
            {
                updatedTemplate = updatedTemplate.Insert(styleIndex, cssBlock);
            }
            else
            {
                const string headClosingTag = "</head>";
                var headIndex = updatedTemplate.IndexOf(headClosingTag, StringComparison.OrdinalIgnoreCase);
                var inlineStyleBlock = $"\n<style>{cssBlock}\n</style>\n";

                updatedTemplate = headIndex >= 0
                    ? updatedTemplate.Insert(headIndex, inlineStyleBlock)
                    : inlineStyleBlock + updatedTemplate;
            }

            var letterheadHtml = BuildLetterheadHtmlBlock();
            const string bodyOpenTag = "<body";
            var bodyStartIndex = updatedTemplate.IndexOf(bodyOpenTag, StringComparison.OrdinalIgnoreCase);
            if (bodyStartIndex >= 0)
            {
                var bodyTagEndIndex = updatedTemplate.IndexOf('>', bodyStartIndex);
                updatedTemplate = bodyTagEndIndex >= 0
                    ? updatedTemplate.Insert(bodyTagEndIndex + 1, $"\n{letterheadHtml}\n")
                    : $"{letterheadHtml}\n{updatedTemplate}";
            }
            else
            {
                updatedTemplate = $"{letterheadHtml}\n{updatedTemplate}";
            }

            return updatedTemplate;
        }

        private static string GetLetterheadCssBlock()
        {
            return @"
        .fms-report-letterhead { margin: 0 0 18px 0; padding-bottom: 10px; border-bottom: 2px solid #d1d5db; }
        .fms-report-letterhead img { display: block; width: 100%; max-height: 140px; object-fit: contain; object-position: left center; }
        .fms-report-letterhead-missing { border: 1px dashed #9ca3af; background: #f9fafb; color: #374151; font-size: 11px; padding: 10px 12px; border-radius: 4px; }
        .fms-report-letterhead-missing code { background: #eef2f7; padding: 2px 4px; border-radius: 3px; }";
        }

        private string BuildLetterheadHtmlBlock()
        {
            if (!string.IsNullOrWhiteSpace(_letterheadLogoDataUri))
            {
                return $@"<div class=""fms-report-letterhead"">
        <img src=""{_letterheadLogoDataUri}"" alt=""Company Letterhead"" />
    </div>";
            }

            return $@"<div class=""fms-report-letterhead fms-report-letterhead-missing"">
        Letterhead logo not found. Place your letterhead image at:
        <code>{_letterheadLogoPath.Replace("\\", "/")}</code>
    </div>";
        }

        private bool TryCreateDirectory(string path)
        {
            try
            {
                if (!Directory.Exists(path))
                {
                    Directory.CreateDirectory(path);
                }
                // Test write access
                var testFile = Path.Combine(path, ".write_test");
                File.WriteAllText(testFile, "test");
                File.Delete(testFile);
                return true;
            }
            catch
            {
                return false;
            }
        }

        private async Task EnsureSampleTemplatesAsync()
        {
            var templates = new Dictionary<string, Func<string>>
            {
                ["pump-transaction-report"] = GetPumpTransactionTemplate,
                ["vehicle-consumption-report"] = GetVehicleConsumptionTemplate,
                ["fuel-refill-report"] = GetFuelRefillTemplate,
                ["fuel-delivery-report"] = GetFuelDeliveryTemplate,
                ["device-offline-report"] = GetDeviceOfflineTemplate,
                ["pts-device-status-report"] = GetPtsDeviceStatusTemplate,
                ["tank-volume-history-report"] = GetTankVolumeHistoryTemplate,
                ["issue-tracker-report"] = GetIssueTrackerTemplate,
                ["consumption-by-refills-report"] = GetConsumptionByRefillsTemplate,
            };

            foreach (var (name, generator) in templates)
            {
                try
                {
                    var filePath = Path.Combine(_templatesPath, $"{name}.html");
                    if (!File.Exists(filePath))
                    {
                        await File.WriteAllTextAsync(filePath, generator());
                        _logger.LogInformation("Created sample {Template} template at {Path}", name, filePath);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Could not create template {Template} at {Path}", name, _templatesPath);
                }
            }
        }

        public async Task<byte[]> RenderPdfAsync(string templateName, object data)
        {
            try
            {
                var templateContent = await GetTemplateAsync(templateName);
                if (string.IsNullOrEmpty(templateContent))
                {
                    throw new FileNotFoundException($"Template '{templateName}' not found");
                }
                templateContent = ApplyLetterheadBranding(templateContent);

                var report = await _reportingService.RenderAsync(new RenderRequest
                {
                    Template = new Template
                    {
                        Content = templateContent,
                        Engine = Engine.Handlebars,
                        Recipe = Recipe.ChromePdf,
                        Chrome = BuildPdfChromeOptions()
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
                _logger.LogError(
                    ex,
                    "Error rendering PDF for template {Template}. Payload size: {PayloadBytes} bytes",
                    templateName,
                    EstimatePayloadSizeBytes(data));
                throw;
            }
        }

        public async Task<byte[]> RenderExcelAsync(string templateName, object data)
        {
            try
            {
                var templateContent = await GetTemplateAsync(templateName);
                if (string.IsNullOrEmpty(templateContent))
                {
                    throw new FileNotFoundException($"Template '{templateName}' not found");
                }
                templateContent = ApplyLetterheadBranding(templateContent);

                var report = await _reportingService.RenderAsync(new RenderRequest
                {
                    Template = new Template
                    {
                        Content = templateContent,
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
                var templateContent = await GetTemplateAsync(templateName);
                if (string.IsNullOrEmpty(templateContent))
                {
                    throw new FileNotFoundException($"Template '{templateName}' not found");
                }
                templateContent = ApplyLetterheadBranding(templateContent);

                var report = await _reportingService.RenderAsync(new RenderRequest
                {
                    Template = new Template
                    {
                        Content = templateContent,
                        Engine = Engine.Handlebars,
                        Recipe = Recipe.Html
                    },
                    Data = data,
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
                var brandedTemplate = ApplyLetterheadBranding(htmlTemplate);
                var report = await _reportingService.RenderAsync(new RenderRequest
                {
                    Template = new Template
                    {
                        Content = brandedTemplate,
                        Engine = Engine.Handlebars,
                        Recipe = Recipe.ChromePdf,
                        Chrome = BuildPdfChromeOptions()
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
                _logger.LogError(ex, "Error rendering inline PDF");
                throw;
            }
        }

        public Task<IEnumerable<string>> GetTemplateListAsync()
        {
            var templates = Directory.GetFiles(_templatesPath, "*.html")
                .Select(f => Path.GetFileNameWithoutExtension(f))
                .OrderBy(n => n)
                .AsEnumerable();

            return Task.FromResult(templates);
        }

        public async Task<string?> GetTemplateAsync(string templateName)
        {
            try
            {
                var filePath = Path.Combine(_templatesPath, $"{templateName}.html");
                if (!File.Exists(filePath))
                {
                    _logger.LogWarning("Template not found: {Template} at {Path}", templateName, filePath);
                    return null;
                }

                return await File.ReadAllTextAsync(filePath);
            }
            catch (UnauthorizedAccessException ex)
            {
                _logger.LogError(ex, "Access denied reading template: {Template}", templateName);
                throw;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error reading template: {Template}", templateName);
                throw;
            }
        }

        public async Task SaveTemplateAsync(string templateName, string content)
        {
            try
            {
                var filePath = Path.Combine(_templatesPath, $"{templateName}.html");
                await File.WriteAllTextAsync(filePath, content);
                _logger.LogInformation("Saved template: {Template}", templateName);
            }
            catch (UnauthorizedAccessException ex)
            {
                _logger.LogError(ex, "Access denied saving template: {Template} to {Path}", templateName, _templatesPath);
                throw new InvalidOperationException($"Unable to save template '{templateName}'. Check file system permissions.", ex);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error saving template: {Template}", templateName);
                throw;
            }
        }

        public Task<bool> DeleteTemplateAsync(string templateName)
        {
            try
            {
                var filePath = Path.Combine(_templatesPath, $"{templateName}.html");
                if (File.Exists(filePath))
                {
                    File.Delete(filePath);
                    _logger.LogInformation("Deleted template: {Template}", templateName);
                    return Task.FromResult(true);
                }
                return Task.FromResult(false);
            }
            catch (UnauthorizedAccessException ex)
            {
                _logger.LogError(ex, "Access denied deleting template: {Template}", templateName);
                throw new InvalidOperationException($"Unable to delete template '{templateName}'. Check file system permissions.", ex);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting template: {Template}", templateName);
                throw;
            }
        }

        public async ValueTask DisposeAsync()
        {
            if (_reportingService != null)
            {
                await _reportingService.KillAsync();
            }
        }

        private RenderOptions BuildRenderOptions(object data)
        {
            var payloadBytes = EstimatePayloadSizeBytes(data);
            var timeoutMs = payloadBytes >= LargePayloadThresholdBytes
                ? LargePayloadRenderTimeoutMs
                : DefaultRenderTimeoutMs;

            _logger.LogDebug(
                "JsReport render payload size {PayloadBytes} bytes. Using timeout {TimeoutMs}ms",
                payloadBytes,
                timeoutMs);

            return new RenderOptions
            {
                Timeout = timeoutMs
            };
        }

        private Chrome BuildPdfChromeOptions()
        {
            return new Chrome
            {
                MarginTop = "20px",
                MarginBottom = "45px",
                MarginLeft = "20px",
                MarginRight = "20px",
                Format = "A4",
                PrintBackground = true,
                DisplayHeaderFooter = true,
                HeaderTemplate = "<div></div>",
                FooterTemplate = @"<div style=""width:100%; padding:0 16px; font-size:9px; color:#6c757d; text-align:right;"">
                    Page <span class=""pageNumber""></span> of <span class=""totalPages""></span>
                </div>"
            };
        }

        private int EstimatePayloadSizeBytes(object data)
        {
            if (data == null)
            {
                return 0;
            }

            try
            {
                if (data is JsonElement jsonElement)
                {
                    return Encoding.UTF8.GetByteCount(jsonElement.GetRawText());
                }

                var serialized = JsonConvert.SerializeObject(data);
                return Encoding.UTF8.GetByteCount(serialized);
            }
            catch (Exception ex)
            {
                _logger.LogDebug(ex, "Failed to estimate JsReport payload size");
                return 0;
            }
        }

        private string GetPumpTransactionTemplate()
        {
            return @"<!DOCTYPE html>
<html>
<head>
    <title>Pump Transaction Report</title>
    <style>
        * { box-sizing: border-box; }
        body {
            font-family: 'Segoe UI', Arial, sans-serif;
            margin: 0;
            padding: 20px;
            font-size: 12px;
            color: #333;
        }
        .report-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 3px solid #007bff;
            padding-bottom: 15px;
            margin-bottom: 20px;
        }
        .report-title h1 {
            margin: 0;
            font-size: 24px;
            color: #007bff;
        }
        .report-title p {
            margin: 5px 0 0 0;
            color: #666;
        }
        .report-meta {
            text-align: right;
            font-size: 11px;
            color: #666;
        }
        .report-meta p { margin: 3px 0; }
        .filter-summary {
            background: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 4px;
            padding: 12px 16px;
            margin-bottom: 20px;
        }
        .filter-summary h3 {
            margin: 0 0 10px 0;
            font-size: 13px;
            color: #495057;
        }
        .summary-section {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 15px;
            margin-bottom: 20px;
        }
        .summary-card {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 8px;
            padding: 15px;
            color: white;
            text-align: center;
        }
        .summary-card.volume { background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); }
        .summary-card.amount { background: linear-gradient(135deg, #ee0979 0%, #ff6a00 100%); }
        .summary-card.transactions { background: linear-gradient(135deg, #4776E6 0%, #8E54E9 100%); }
        .summary-card .value {
            font-size: 22px;
            font-weight: 700;
            margin-bottom: 5px;
        }
        .summary-card .label {
            font-size: 11px;
            opacity: 0.9;
        }
        .data-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
            font-size: 10px;
        }
        .data-table thead th {
            background: #343a40;
            color: white;
            padding: 10px 8px;
            text-align: left;
            font-weight: 600;
        }
        .data-table tbody td {
            padding: 8px;
            border-bottom: 1px solid #dee2e6;
        }
        .data-table tbody tr:nth-child(even) {
            background: #f8f9fa;
        }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .text-muted { color: #6c757d; }
        .text-success { color: #28a745; }
        .font-bold { font-weight: 600; }
        .report-footer {
            margin-top: 30px;
            padding-top: 15px;
            border-top: 2px solid #dee2e6;
            display: flex;
            justify-content: space-between;
            font-size: 10px;
            color: #6c757d;
        }
    </style>
</head>
<body>
    <div class=""report-header"">
        <div class=""report-title"">
            <h1>Pump Transaction Report</h1>
            <p>{{reportTitle}}</p>
        </div>
        <div class=""report-meta"">
            <p><strong>Generated:</strong> {{generatedAt}}</p>
            <p><strong>Period:</strong> {{dateFrom}} - {{dateTo}}</p>
        </div>
    </div>

    <div class=""summary-section"">
        <div class=""summary-card transactions"">
            <div class=""value"">{{summary.totalTransactions}}</div>
            <div class=""label"">Total Transactions</div>
        </div>
        <div class=""summary-card volume"">
            <div class=""value"">{{summary.totalVolume}} L</div>
            <div class=""label"">Total Volume</div>
        </div>
        <div class=""summary-card amount"">
            <div class=""value"">{{summary.currency}}{{summary.totalAmount}}</div>
            <div class=""label"">Total Amount</div>
        </div>
        <div class=""summary-card"">
            <div class=""value"">{{summary.uniqueVehicles}}</div>
            <div class=""label"">Unique Vehicles</div>
        </div>
    </div>

    {{#if transactions}}
    <table class=""data-table"">
        <thead>
            <tr>
                <th>#</th>
                <th>Date/Time</th>
                <th>PTS / Pump</th>
                <th>Vehicle</th>
                <th>Fuel Grade</th>
                <th class=""text-right"">Volume (L)</th>
                <th class=""text-right"">Amount</th>
                <th>Odometer</th>
                <th>Operator</th>
            </tr>
        </thead>
        <tbody>
            {{#each transactions}}
            <tr>
                <td class=""text-center text-muted"">{{rowNumber}}</td>
                <td>{{dateTime}}</td>
                <td>{{ptsName}} / Pump {{pump}}</td>
                <td>
                    <div class=""font-bold"">{{vehicleName}}</div>
                    <div class=""text-muted"">{{vehicleNumberPlate}}</div>
                </td>
                <td>{{fuelGradeName}}</td>
                <td class=""text-right font-bold text-success"">{{volume}}</td>
                <td class=""text-right font-bold"">{{amount}}</td>
                <td class=""text-right"">{{odometer}}</td>
                <td>{{employeeName}}</td>
            </tr>
            {{/each}}
        </tbody>
        <tfoot>
            <tr style=""background:#343a40; color:white; font-weight:600;"">
                <td colspan=""5"" class=""text-right"">TOTALS:</td>
                <td class=""text-right"">{{summary.totalVolume}} L</td>
                <td class=""text-right"">{{summary.currency}}{{summary.totalAmount}}</td>
                <td colspan=""2""></td>
            </tr>
        </tfoot>
    </table>
    {{else}}
    <div style=""text-align:center; padding:40px; color:#6c757d;"">
        <p>No transactions found for the selected criteria.</p>
    </div>
    {{/if}}

    <div class=""report-footer"">
        <div>
            <p><strong>FMS Fleet Management System</strong></p>
        </div>
        <div style=""text-align:right;"">
            <p>Report ID: {{reportId}}</p>
        </div>
    </div>
</body>
</html>";
        }

        #region Auto-generated Report Templates

        private static string BuildGenericReportTemplate(string title, string color, string icon,
            string summarySection, string tableSection, string emptyMessage)
        {
            return $@"<!DOCTYPE html>
<html>
<head>
    <title>{title}</title>
    <style>
        * {{ box-sizing: border-box; }}
        body {{ font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 20px; font-size: 12px; color: #333; }}
        .report-header {{ display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid {color}; padding-bottom: 15px; margin-bottom: 20px; }}
        .report-title h1 {{ margin: 0; font-size: 24px; color: {color}; }}
        .report-title p {{ margin: 5px 0 0 0; color: #666; }}
        .report-meta {{ text-align: right; font-size: 11px; color: #666; }}
        .report-meta p {{ margin: 3px 0; }}
        .filter-summary {{ background: #f8f9fa; border: 1px solid #dee2e6; border-radius: 4px; padding: 12px 16px; margin-bottom: 20px; font-size: 11px; }}
        .filter-summary h3 {{ margin: 0 0 8px 0; font-size: 13px; color: #495057; }}
        .filter-summary .filter-grid {{ display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 6px; }}
        .filter-summary .filter-item {{ display: flex; gap: 4px; }}
        .filter-summary .filter-label {{ font-weight: 600; color: #495057; }}
        .filter-summary .filter-value {{ color: #6c757d; }}
        .summary-section {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 15px; margin-bottom: 20px; }}
        .summary-card {{ border-radius: 8px; padding: 15px; color: white; text-align: center; }}
        .summary-card .value {{ font-size: 22px; font-weight: 700; margin-bottom: 5px; }}
        .summary-card .label {{ font-size: 11px; opacity: 0.9; }}
        .card-primary {{ background: linear-gradient(135deg, {color} 0%, #667eea 100%); }}
        .card-success {{ background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); }}
        .card-warning {{ background: linear-gradient(135deg, #ee0979 0%, #ff6a00 100%); }}
        .card-info    {{ background: linear-gradient(135deg, #4776E6 0%, #8E54E9 100%); }}
        .data-table {{ width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 10px; }}
        .data-table thead th {{ background: #343a40; color: white; padding: 10px 8px; text-align: left; font-weight: 600; }}
        .data-table tbody td {{ padding: 8px; border-bottom: 1px solid #dee2e6; }}
        .data-table tbody tr:nth-child(even) {{ background: #f8f9fa; }}
        .text-right {{ text-align: right; }}
        .text-center {{ text-align: center; }}
        .text-muted {{ color: #6c757d; }}
        .text-success {{ color: #28a745; }}
        .text-danger {{ color: #dc3545; }}
        .font-bold {{ font-weight: 600; }}
        .report-footer {{ margin-top: 30px; padding-top: 15px; border-top: 2px solid #dee2e6; display: flex; justify-content: space-between; font-size: 10px; color: #6c757d; }}
    </style>
</head>
<body>
    <div class=""report-header"">
        <div class=""report-title"">
            <h1>{title}</h1>
            <p>{{{{reportTitle}}}}</p>
        </div>
        <div class=""report-meta"">
            <p><strong>Generated:</strong> {{{{generatedAt}}}}</p>
            <p><strong>Period:</strong> {{{{dateFrom}}}} - {{{{dateTo}}}}</p>
        </div>
    </div>

    <div class=""filter-summary"">
        <h3>Report Parameters</h3>
        <div class=""filter-grid"">
            {{{{#if dateFrom}}}}<div class=""filter-item""><span class=""filter-label"">From:</span><span class=""filter-value"">{{{{dateFrom}}}}</span></div>{{{{/if}}}}
            {{{{#if dateTo}}}}<div class=""filter-item""><span class=""filter-label"">To:</span><span class=""filter-value"">{{{{dateTo}}}}</span></div>{{{{/if}}}}
            {{{{#if startDate}}}}<div class=""filter-item""><span class=""filter-label"">Start:</span><span class=""filter-value"">{{{{startDate}}}}</span></div>{{{{/if}}}}
            {{{{#if endDate}}}}<div class=""filter-item""><span class=""filter-label"">End:</span><span class=""filter-value"">{{{{endDate}}}}</span></div>{{{{/if}}}}
            {{{{#if siteId}}}}<div class=""filter-item""><span class=""filter-label"">Site:</span><span class=""filter-value"">{{{{siteId}}}}</span></div>{{{{/if}}}}
            {{{{#if siteName}}}}<div class=""filter-item""><span class=""filter-label"">Site:</span><span class=""filter-value"">{{{{siteName}}}}</span></div>{{{{/if}}}}
            {{{{#if tankId}}}}<div class=""filter-item""><span class=""filter-label"">Tank:</span><span class=""filter-value"">{{{{tankId}}}}</span></div>{{{{/if}}}}
            {{{{#if tankName}}}}<div class=""filter-item""><span class=""filter-label"">Tank:</span><span class=""filter-value"">{{{{tankName}}}}</span></div>{{{{/if}}}}
            {{{{#if vehicleId}}}}<div class=""filter-item""><span class=""filter-label"">Vehicle:</span><span class=""filter-value"">{{{{vehicleId}}}}</span></div>{{{{/if}}}}
            {{{{#if deviceId}}}}<div class=""filter-item""><span class=""filter-label"">Device:</span><span class=""filter-value"">{{{{deviceId}}}}</span></div>{{{{/if}}}}
            {{{{#if issueTemplateId}}}}<div class=""filter-item""><span class=""filter-label"">Template:</span><span class=""filter-value"">{{{{issueTemplateId}}}}</span></div>{{{{/if}}}}
            {{{{#if status}}}}<div class=""filter-item""><span class=""filter-label"">Status:</span><span class=""filter-value"">{{{{status}}}}</span></div>{{{{/if}}}}
            {{{{#if categoryIds}}}}<div class=""filter-item""><span class=""filter-label"">Categories:</span><span class=""filter-value"">{{{{categoryIds}}}}</span></div>{{{{/if}}}}
            {{{{#if pageNumber}}}}<div class=""filter-item""><span class=""filter-label"">Page:</span><span class=""filter-value"">{{{{pageNumber}}}}</span></div>{{{{/if}}}}
            {{{{#if pageSize}}}}<div class=""filter-item""><span class=""filter-label"">Page Size:</span><span class=""filter-value"">{{{{pageSize}}}}</span></div>{{{{/if}}}}
        </div>
    </div>

{summarySection}
{tableSection}

    {{{{#unless records}}}}{{{{#unless items}}}}{{{{#unless transactions}}}}{{{{#unless data}}}}
    <div style=""text-align:center; padding:40px; color:#6c757d;"">
        <p>{emptyMessage}</p>
    </div>
    {{{{/unless}}}}{{{{/unless}}}}{{{{/unless}}}}{{{{/unless}}}}

    <div class=""report-footer"">
        <div><p><strong>FMS Fleet Management System</strong></p></div>
        <div style=""text-align:right;""><p>Report ID: {{{{reportId}}}}</p></div>
    </div>
</body>
</html>";
        }

        private string GetVehicleConsumptionTemplate()
        {
            return BuildGenericReportTemplate(
                "Vehicle Consumption Report", "#4776E6", "truck",
                @"    {{#if summary}}
    <div class=""summary-section"">
        <div class=""summary-card card-primary""><div class=""value"">{{summary.totalVehicles}}</div><div class=""label"">Vehicles</div></div>
        <div class=""summary-card card-success""><div class=""value"">{{summary.totalVolume}} L</div><div class=""label"">Total Volume</div></div>
        <div class=""summary-card card-warning""><div class=""value"">{{summary.totalCost}}</div><div class=""label"">Total Cost</div></div>
        <div class=""summary-card card-info""><div class=""value"">{{summary.avgConsumption}}</div><div class=""label"">Avg L/100km</div></div>
    </div>
    {{/if}}",
                @"    {{#if records}}
    <table class=""data-table"">
        <thead><tr><th>#</th><th>Vehicle</th><th>Plate</th><th>Type</th><th>Site</th><th class=""text-right"">Volume (L)</th><th class=""text-right"">Distance (km)</th><th class=""text-right"">L/100km</th><th class=""text-right"">Cost</th></tr></thead>
        <tbody>
            {{#each records}}
            <tr>
                <td class=""text-center text-muted"">{{rowNumber}}</td>
                <td class=""font-bold"">{{vehicleName}}</td>
                <td>{{numberPlate}}</td>
                <td>{{vehicleType}}</td>
                <td>{{siteName}}</td>
                <td class=""text-right text-success font-bold"">{{volume}}</td>
                <td class=""text-right"">{{distance}}</td>
                <td class=""text-right font-bold"">{{consumption}}</td>
                <td class=""text-right"">{{cost}}</td>
            </tr>
            {{/each}}
        </tbody>
    </table>
    {{/if}}",
                "No vehicle consumption data found for the selected criteria.");
        }

        private string GetFuelRefillTemplate()
        {
            return BuildGenericReportTemplate(
                "Fuel Refill Report", "#11998e", "gas-pump",
                @"    {{#if summary}}
    <div class=""summary-section"">
        <div class=""summary-card card-primary""><div class=""value"">{{summary.totalRefills}}</div><div class=""label"">Total Refills</div></div>
        <div class=""summary-card card-success""><div class=""value"">{{summary.totalVolume}} L</div><div class=""label"">Total Volume</div></div>
        <div class=""summary-card card-warning""><div class=""value"">{{summary.fuelAverage}} {{summary.fuelAverageUnit}}</div><div class=""label"">Fuel Average</div></div>
        <div class=""summary-card card-info""><div class=""value"">{{summary.uniqueVehicles}}</div><div class=""label"">Vehicles</div></div>
    </div>
    {{/if}}",
                @"    {{#if records}}
    <table class=""data-table"">
        <thead><tr><th>#</th><th>Date/Time (Local)</th><th>Vehicle</th><th>Site</th><th class=""text-right"">Volume (L)</th><th class=""text-right"">Fuel Average</th></tr></thead>
        <tbody>
            {{#each records}}
            <tr>
                <td class=""text-center text-muted"">{{rowNumber}}</td>
                <td>{{dateTime}}</td>
                <td class=""font-bold"">{{vehicleName}}</td>
                <td>{{siteName}}</td>
                <td class=""text-right text-success font-bold"">{{volume}}</td>
                <td class=""text-right"">{{fuelAverage}} {{fuelAverageUnit}}</td>
            </tr>
            {{/each}}
        </tbody>
    </table>
    {{/if}}",
                "No fuel refill records found for the selected criteria.");
        }

        private string GetFuelDeliveryTemplate()
        {
            return BuildGenericReportTemplate(
                "Fuel Delivery Report", "#ee0979", "truck-loading",
                @"    {{#if summary}}
    <div class=""summary-section"">
        <div class=""summary-card card-primary""><div class=""value"">{{summary.totalDeliveries}}</div><div class=""label"">Deliveries</div></div>
        <div class=""summary-card card-success""><div class=""value"">{{summary.totalVolume}} L</div><div class=""label"">Volume Delivered</div></div>
        <div class=""summary-card card-warning""><div class=""value"">{{summary.totalCost}}</div><div class=""label"">Total Cost</div></div>
        <div class=""summary-card card-info""><div class=""value"">{{summary.uniqueTanks}}</div><div class=""label"">Tanks</div></div>
    </div>
    {{/if}}",
                @"    {{#if records}}
    <table class=""data-table"">
        <thead><tr><th>#</th><th>Date</th><th>Supplier</th><th>Tank</th><th>Fuel Grade</th><th class=""text-right"">Volume (L)</th><th class=""text-right"">Cost</th><th>Site</th></tr></thead>
        <tbody>
            {{#each records}}
            <tr>
                <td class=""text-center text-muted"">{{rowNumber}}</td>
                <td>{{deliveryDate}}</td>
                <td class=""font-bold"">{{supplierName}}</td>
                <td>{{tankName}}</td>
                <td>{{fuelGradeName}}</td>
                <td class=""text-right text-success font-bold"">{{volume}}</td>
                <td class=""text-right"">{{cost}}</td>
                <td>{{siteName}}</td>
            </tr>
            {{/each}}
        </tbody>
    </table>
    {{/if}}",
                "No fuel delivery records found for the selected criteria.");
        }

        private string GetDeviceOfflineTemplate()
        {
            return BuildGenericReportTemplate(
                "Device Offline Report", "#dc3545", "plug-circle-xmark",
                @"    {{#if summary}}
    <div class=""summary-section"">
        <div class=""summary-card card-primary""><div class=""value"">{{summary.totalEvents}}</div><div class=""label"">Offline Events</div></div>
        <div class=""summary-card card-warning""><div class=""value"">{{summary.totalDowntime}}</div><div class=""label"">Total Downtime</div></div>
        <div class=""summary-card card-info""><div class=""value"">{{summary.affectedDevices}}</div><div class=""label"">Devices Affected</div></div>
        <div class=""summary-card card-success""><div class=""value"">{{summary.avgDuration}}</div><div class=""label"">Avg Duration</div></div>
    </div>
    {{/if}}",
                @"    {{#if records}}
    <table class=""data-table"">
        <thead><tr><th>#</th><th>Device</th><th>Site</th><th>Went Offline</th><th>Came Online</th><th class=""text-right"">Duration</th><th>Status</th></tr></thead>
        <tbody>
            {{#each records}}
            <tr>
                <td class=""text-center text-muted"">{{rowNumber}}</td>
                <td class=""font-bold"">{{deviceName}}</td>
                <td>{{siteName}}</td>
                <td>{{offlineAt}}</td>
                <td>{{onlineAt}}</td>
                <td class=""text-right font-bold"">{{duration}}</td>
                <td>{{#if isOnline}}<span class=""text-success"">Online</span>{{else}}<span class=""text-danger"">Offline</span>{{/if}}</td>
            </tr>
            {{/each}}
        </tbody>
    </table>
    {{/if}}",
                "No offline events found for the selected criteria.");
        }

        private string GetPtsDeviceStatusTemplate()
        {
            return BuildGenericReportTemplate(
                "PTS Device Status Report", "#6f42c1", "server",
                @"    {{#if summary}}
    <div class=""summary-section"">
        <div class=""summary-card card-primary""><div class=""value"">{{summary.totalDevices}}</div><div class=""label"">Total Devices</div></div>
        <div class=""summary-card card-success""><div class=""value"">{{summary.onlineCount}}</div><div class=""label"">Online</div></div>
        <div class=""summary-card card-warning""><div class=""value"">{{summary.offlineCount}}</div><div class=""label"">Offline</div></div>
        <div class=""summary-card card-info""><div class=""value"">{{summary.uptimePercent}}%</div><div class=""label"">Uptime</div></div>
    </div>
    {{/if}}",
                @"    {{#if records}}
    <table class=""data-table"">
        <thead><tr><th>#</th><th>Device</th><th>Site</th><th>IP Address</th><th>Status</th><th>Last Seen</th><th class=""text-right"">Uptime %</th><th>Firmware</th></tr></thead>
        <tbody>
            {{#each records}}
            <tr>
                <td class=""text-center text-muted"">{{rowNumber}}</td>
                <td class=""font-bold"">{{deviceName}}</td>
                <td>{{siteName}}</td>
                <td class=""text-muted"">{{ipAddress}}</td>
                <td>{{#if isOnline}}<span class=""text-success font-bold"">Online</span>{{else}}<span class=""text-danger font-bold"">Offline</span>{{/if}}</td>
                <td>{{lastSeenAt}}</td>
                <td class=""text-right"">{{uptimePercent}}%</td>
                <td class=""text-muted"">{{firmwareVersion}}</td>
            </tr>
            {{/each}}
        </tbody>
    </table>
    {{/if}}",
                "No PTS device data found for the selected criteria.");
        }

        private string GetTankVolumeHistoryTemplate()
        {
            return BuildGenericReportTemplate(
                "Tank Volume History Report", "#fd7e14", "chart-area",
                @"    {{#if summary}}
    <div class=""summary-section"">
        <div class=""summary-card card-primary""><div class=""value"">{{summary.totalTransactions}}</div><div class=""label"">Transactions</div></div>
        <div class=""summary-card card-success""><div class=""value"">{{summary.totalDelivered}} L</div><div class=""label"">Deliveries + Transfer In</div></div>
        <div class=""summary-card card-warning""><div class=""value"">{{summary.totalConsumed}} L</div><div class=""label"">Dispensed + Transfer Out</div></div>
        <div class=""summary-card card-info""><div class=""value"">{{summary.tanksMonitored}}</div><div class=""label"">Tanks</div></div>
    </div>
    {{/if}}",
                @"    {{#if records}}
    <table class=""data-table"">
        <thead><tr><th>#</th><th>Date</th><th>Time</th><th>Site</th><th>Tank</th><th>Transaction Type</th><th>Vehicle</th><th>Vehicle Type</th><th>Transfer Tank</th><th>Transfer Site</th><th class=""text-right"">Volume Change (L)</th><th class=""text-right"">New Volume (L)</th></tr></thead>
        <tbody>
            {{#each records}}
            <tr>
                <td class=""text-center text-muted"">{{rowNumber}}</td>
                <td>{{date}}</td>
                <td>{{time}}</td>
                <td>{{siteName}}</td>
                <td class=""font-bold"">{{tankName}}</td>
                <td>
                    {{#if isOpeningOrClosing}}
                        <span style=""background:#fff3cd; padding:2px 6px; border-radius:3px;"">{{transactionType}}</span>
                    {{else}}
                        {{#if isDelivery}}
                            <span style=""background:#d4edda; padding:2px 6px; border-radius:3px;"">{{transactionType}}</span>
                        {{else}}
                            {{#if isDispensing}}
                                <span style=""background:#f8d7da; padding:2px 6px; border-radius:3px;"">{{transactionType}}</span>
                            {{else}}
                                {{transactionType}}
                            {{/if}}
                        {{/if}}
                    {{/if}}
                </td>
                <td>{{vehicleName}}</td>
                <td>{{vehicleType}}</td>
                <td>{{transferTankName}}</td>
                <td>{{transferTankSite}}</td>
                <td class=""text-right {{#if isNegativeVolume}}text-danger{{else}}text-success{{/if}} font-bold"">{{volumeChange}}</td>
                <td class=""text-right"">{{newVolume}}</td>
            </tr>
            {{/each}}
        </tbody>
    </table>
    {{/if}}",
                "No tank volume history data found for the selected criteria.");
        }

        private string GetIssueTrackerTemplate()
        {
            return BuildGenericReportTemplate(
                "Issue Tracker Report", "#0ea5e9", "clipboard-list-check",
                @"    {{#if summary}}
    <div class=""summary-section"">
        <div class=""summary-card card-primary""><div class=""value"">{{summary.totalIssues}}</div><div class=""label"">Total Issues</div></div>
        <div class=""summary-card card-success""><div class=""value"">{{summary.openIssues}}</div><div class=""label"">Open</div></div>
        <div class=""summary-card card-warning""><div class=""value"">{{summary.closedIssues}}</div><div class=""label"">Closed</div></div>
        <div class=""summary-card card-info""><div class=""value"">{{summary.autoCreatedIssues}}</div><div class=""label"">Auto Created</div></div>
    </div>
    {{/if}}",
                @"    {{#if records}}
    <table class=""data-table"">
        <thead><tr><th>#</th><th>Opened (Local)</th><th>Site</th><th>Vehicle</th><th>Template</th><th>Status</th><th>Category</th><th>Issue</th><th>Assigned To</th><th>Opened By</th></tr></thead>
        <tbody>
            {{#each records}}
            <tr>
                <td class=""text-center text-muted"">{{rowNumber}}</td>
                <td>{{openDate}}</td>
                <td>{{siteName}}</td>
                <td class=""font-bold"">{{vehicleName}}</td>
                <td>{{issueTemplateName}}</td>
                <td>{{statusName}}</td>
                <td>{{categoryName}}</td>
                <td>{{problemTitle}}</td>
                <td>{{assignedTo}}</td>
                <td>{{openedBy}}</td>
            </tr>
            {{/each}}
        </tbody>
    </table>
    {{/if}}",
                "No issue tracker data found for the selected criteria.");
        }

        private string GetConsumptionByRefillsTemplate()
        {
            return BuildGenericReportTemplate(
                "Consumption by Refills Report", "#20c997", "chart-bar",
                @"    {{#if summary}}
    <div class=""summary-section"">
        <div class=""summary-card card-primary""><div class=""value"">{{summary.totalVehicles}}</div><div class=""label"">Vehicles</div></div>
        <div class=""summary-card card-success""><div class=""value"">{{summary.totalFuel}} L</div><div class=""label"">Total Fuel</div></div>
        <div class=""summary-card card-warning""><div class=""value"">{{summary.totalDistance}} km</div><div class=""label"">Total Distance</div></div>
        <div class=""summary-card card-info""><div class=""value"">{{summary.avgConsumption}}</div><div class=""label"">Avg L/100km</div></div>
    </div>
    {{/if}}",
                @"    {{#if records}}
    <table class=""data-table"">
        <thead><tr><th>#</th><th>Vehicle</th><th>Plate</th><th>Site</th><th class=""text-right"">Refills</th><th class=""text-right"">Volume (L)</th><th class=""text-right"">Distance (km)</th><th class=""text-right"">L/100km</th></tr></thead>
        <tbody>
            {{#each records}}
            <tr>
                <td class=""text-center text-muted"">{{rowNumber}}</td>
                <td class=""font-bold"">{{vehicleName}}</td>
                <td>{{numberPlate}}</td>
                <td>{{siteName}}</td>
                <td class=""text-center"">{{refillCount}}</td>
                <td class=""text-right text-success font-bold"">{{totalVolume}}</td>
                <td class=""text-right"">{{totalDistance}}</td>
                <td class=""text-right font-bold"">{{consumption}}</td>
            </tr>
            {{/each}}
        </tbody>
    </table>
    {{/if}}",
                "No consumption data found for the selected criteria.");
        }

        #endregion
    }
}
