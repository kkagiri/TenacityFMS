/**
 * File: JsReportService.cs
 * Purpose: Render JsReport templates to PDF, Excel, and HTML using embedded jsreport.Local
 * Dependencies: jsreport.Local, jsreport.Types, Newtonsoft.Json, ILogger
 * Last Modified: 2026-02-09
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

        private readonly ILogger<JsReportService> _logger;
        private readonly ILocalUtilityReportingService _reportingService;
        private readonly string _templatesPath;

        public JsReportService(ILogger<JsReportService> logger, IWebHostEnvironment environment)
        {
            _logger = logger;

            // ALWAYS use a writable location (C:\Logs or temp folder) to avoid IIS permission issues
            // Do NOT use deployment directory (C:\inetpub\wwwroot) as it's read-only for app pools
            _templatesPath = GetWritableTemplatesPath(environment);

            _logger.LogInformation("JsReport templates path: {Path}", _templatesPath);

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
            // Priority 1: C:\Logs\FMS.Webclient\ReportTemplates (consistent with other logs)
            var logsPath = Path.Combine("C:\\Logs\\FMS.Webclient", "ReportTemplates");
            if (TryCreateDirectory(logsPath))
            {
                return logsPath;
            }

            // Priority 2: User temp folder
            var tempPath = Path.Combine(Path.GetTempPath(), "FMS_ReportTemplates");
            if (TryCreateDirectory(tempPath))
            {
                return tempPath;
            }

            // Priority 3: ProgramData folder (system-wide, usually writable)
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
            try
            {
                // Copy pump transaction template if it doesn't exist
                var pumpTransactionTemplate = Path.Combine(_templatesPath, "pump-transaction-report.html");
                if (!File.Exists(pumpTransactionTemplate))
                {
                    var sampleContent = GetPumpTransactionTemplate();
                    await File.WriteAllTextAsync(pumpTransactionTemplate, sampleContent);
                    _logger.LogInformation("Created sample pump-transaction-report template at {Path}", pumpTransactionTemplate);
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex,
                    "Could not create sample templates at {Path}. Templates may need manual deployment.",
                    _templatesPath);
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

                var report = await _reportingService.RenderAsync(new RenderRequest
                {
                    Template = new Template
                    {
                        Content = templateContent,
                        Engine = Engine.Handlebars,
                        Recipe = Recipe.ChromePdf,
                        Chrome = new Chrome
                        {
                            MarginTop = "20px",
                            MarginBottom = "20px",
                            MarginLeft = "20px",
                            MarginRight = "20px",
                            Format = "A4",
                            PrintBackground = true
                        }
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
                var report = await _reportingService.RenderAsync(new RenderRequest
                {
                    Template = new Template
                    {
                        Content = htmlTemplate,
                        Engine = Engine.Handlebars,
                        Recipe = Recipe.ChromePdf,
                        Chrome = new Chrome
                        {
                            MarginTop = "20px",
                            MarginBottom = "20px",
                            MarginLeft = "20px",
                            MarginRight = "20px",
                            Format = "A4",
                            PrintBackground = true
                        }
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
    }
}
