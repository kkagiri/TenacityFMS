/**
 * File: JsReportTemplateManager.cs
 * Purpose: Manages jsreport HTML template files — path resolution, read, write, delete, and seeding defaults.
 * Dependencies: JsReportHtmlTemplates, ILogger, System.IO
 * Last Modified: 2026-03-11
 *
 * Key Functions:
 * - GetWritableTemplatesPath: Resolves a writable directory for storing templates
 * - GetTemplateListAsync: Lists available template names
 * - GetTemplateAsync: Reads a template file by name
 * - SaveTemplateAsync: Writes/overwrites a template file
 * - DeleteTemplateAsync: Deletes a template file
 * - EnsureSampleTemplatesAsync: Seeds default templates if not already present
 */
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using FMS.Application.Features.WarningLetter.Templates;

namespace FMS.WebClient.Services.Reporting
{
    /// <summary>
    /// Manages jsreport template file storage: resolution of writable paths,
    /// CRUD operations, and seeding default templates on first run.
    /// </summary>
    internal sealed class JsReportTemplateManager
    {
        private const string FmsDataRootPath = "C:\\FMSData";
        private readonly ILogger _logger;
        private readonly string _templatesPath;

        public string TemplatesPath => _templatesPath;

        public JsReportTemplateManager(ILogger logger, IWebHostEnvironment environment)
        {
            _logger = logger;
            _templatesPath = ResolveWritableTemplatesPath(environment);
        }

        // ─── Path Resolution ─────────────────────────────────────────────────────

        private string ResolveWritableTemplatesPath(IWebHostEnvironment environment)
        {
            // Priority 1: C:\FMSData\reports\templates (shared FMS data root)
            var fmsData = Path.Combine(FmsDataRootPath, "reports", "templates");
            if (TryCreateDirectory(fmsData)) return fmsData;

            // Priority 2: ProgramData shared report template location.
            var logs = Path.Combine("C:\\ProgramData\\TenacityFMS", "ReportTemplates");
            if (TryCreateDirectory(logs)) return logs;

            // Priority 3: User temp folder (always writable)
            var temp = Path.Combine(Path.GetTempPath(), "FMS_ReportTemplates");
            if (TryCreateDirectory(temp)) return temp;

            // Priority 4: ProgramData (system-wide, usually writable)
            var programData = Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.CommonApplicationData),
                    "TenacityFMS", "ReportTemplates");
            if (TryCreateDirectory(programData)) return programData;

            // Fallback: App_Data (may fail in IIS)
            var appData = Path.Combine(environment.ContentRootPath, "App_Data", "ReportTemplates");
            TryCreateDirectory(appData);
            return appData;
        }

        internal static string ResolveBrandingLogoPath(ILogger logger)
        {
            const string logoFileName = "letterhead-logo.png";

            var fmsData = Path.Combine(FmsDataRootPath, "reports", "branding");
            if (TryCreateDirectoryStatic(fmsData))
                return Path.Combine(fmsData, logoFileName);

            var programData = Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.CommonApplicationData),
                "Tenacy", "FMS", "reports", "branding");
            if (TryCreateDirectoryStatic(programData))
                return Path.Combine(programData, logoFileName);

            var temp = Path.Combine(Path.GetTempPath(), "FMS_Reports", "branding");
            if (TryCreateDirectoryStatic(temp))
                return Path.Combine(temp, logoFileName);

            logger.LogWarning("Could not create any writable branding directory. Letterhead logo will not be available.");
            return Path.Combine(Path.GetTempPath(), "FMS_Reports", "branding", logoFileName);
        }

        // ─── Template CRUD ────────────────────────────────────────────────────────

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
                var filePath = TemplatePath(templateName);
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
                await File.WriteAllTextAsync(TemplatePath(templateName), content);
                _logger.LogInformation("Saved template: {Template}", templateName);
            }
            catch (UnauthorizedAccessException ex)
            {
                _logger.LogError(ex, "Access denied saving template: {Template} to {Path}", templateName, _templatesPath);
                throw new InvalidOperationException(
                    $"Unable to save template '{templateName}'. Check file system permissions.", ex);
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
                var filePath = TemplatePath(templateName);
                if (!File.Exists(filePath)) return Task.FromResult(false);
                File.Delete(filePath);
                _logger.LogInformation("Deleted template: {Template}", templateName);
                return Task.FromResult(true);
            }
            catch (UnauthorizedAccessException ex)
            {
                _logger.LogError(ex, "Access denied deleting template: {Template}", templateName);
                throw new InvalidOperationException(
                    $"Unable to delete template '{templateName}'. Check file system permissions.", ex);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting template: {Template}", templateName);
                throw;
            }
        }

        // ─── Default Template Seeding ─────────────────────────────────────────────

        public async Task EnsureSampleTemplatesAsync()
        {
            var logoBase64 = LoadLogoBase64();
            var templates = new Dictionary<string, Func<string>>
            {
                ["pump-transaction-report"] = JsReportHtmlTemplates.PumpTransaction,
                ["vehicle-consumption-report"] = JsReportHtmlTemplates.VehicleConsumption,
                ["fuel-refill-report"] = JsReportHtmlTemplates.FuelRefill,
                ["fuel-delivery-report"] = JsReportHtmlTemplates.FuelDelivery,
                ["device-offline-report"] = JsReportHtmlTemplates.DeviceOffline,
                ["pts-device-status-report"] = JsReportHtmlTemplates.PtsDeviceStatus,
                ["tank-volume-history-report"] = JsReportHtmlTemplates.TankVolumeHistory,
                ["issue-tracker-report"] = JsReportHtmlTemplates.IssueTracker,
                ["consumption-by-refills-report"] = JsReportHtmlTemplates.ConsumptionByRefills,
                ["tank-level-detail-report"] = JsReportHtmlTemplates.TankLevelDetail,
                ["alarm-report"] = JsReportHtmlTemplates.AlarmReport,
                ["storage-received-vs-dispensed-report"] = JsReportHtmlTemplates.StorageReceivedVsDispensed,
                ["vehicle-trip-analysis-report"] = VehicleTripAnalysisHtmlTemplate.Get,
                ["live-trip-operations-report"] = LiveTripOperationsHtmlTemplate.Get,
                ["monthly-fleet-report"] = () => MonthlyFleetReportHtmlTemplate.Get(logoBase64),
                ["weekly-fleet-report"] = WeeklyFleetReportHtmlTemplate.Get,
                ["warning-letter-report"] = WarningLetterHtmlTemplates.GetTemplate,
                ["warning-letter-analytics-report"] = WarningLetterAnalyticsHtmlTemplate.Get,
                ["warning-letter-candidates-report"] = WarningLetterCandidatesHtmlTemplate.Get,
            };

            foreach (var (name, generator) in templates)
            {
                try
                {
                    var filePath = TemplatePath(name);
                    var embeddedContent = generator();

                    // Always overwrite on-disk templates with the latest embedded version.
                    // This prevents stale templates from causing missing sections / data.
                    if (File.Exists(filePath))
                    {
                        var existing = await File.ReadAllTextAsync(filePath);
                        if (existing != embeddedContent)
                        {
                            await File.WriteAllTextAsync(filePath, embeddedContent);
                            _logger.LogInformation(
                                "Updated template '{Template}' at {Path} (embedded version was newer)",
                                name, filePath);
                        }
                    }
                    else
                    {
                        await File.WriteAllTextAsync(filePath, embeddedContent);
                        _logger.LogInformation("Created default template '{Template}' at {Path}", name, filePath);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Could not seed template '{Template}' at {Path}", name, _templatesPath);
                }
            }
        }

        // ─── Helpers ──────────────────────────────────────────────────────────────

        private string TemplatePath(string name) =>
            Path.Combine(_templatesPath, $"{name}.html");

        internal static bool TryCreateDirectoryStatic(string path)
        {
            try
            {
                if (!Directory.Exists(path)) Directory.CreateDirectory(path);
                var testFile = Path.Combine(path, ".write_test");
                File.WriteAllText(testFile, "test");
                File.Delete(testFile);
                return true;
            }
            catch { return false; }
        }

        private bool TryCreateDirectory(string path) => TryCreateDirectoryStatic(path);

        private static string? LoadLogoBase64()
        {
            var candidates = new[]
            {
                @"C:\FMSData\assets\logo.png",
                Path.Combine(AppContext.BaseDirectory, "assets", "logo.png")
            };
            foreach (var path in candidates)
            {
                if (!File.Exists(path)) continue;
                try
                {
                    var bytes = File.ReadAllBytes(path);
                    return "data:image/png;base64," + Convert.ToBase64String(bytes);
                }
                catch { }
            }
            return null;
        }
    }
}
