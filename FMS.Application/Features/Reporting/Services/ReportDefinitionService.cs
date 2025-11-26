using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using FMS.Application.Features.Reporting.DTOs;

namespace FMS.Application.Features.Reporting.Services
{
    /// <summary>
    /// Implementation of report definition service
    /// This is a simple in-memory implementation. You can enhance it to use database storage.
    /// </summary>
    public class ReportDefinitionService : IReportDefinitionService
    {
        private readonly List<ReportDefinitionDTO> _reportDefinitions;
        private readonly List<ReportTemplateDTO> _reportTemplates;

        public ReportDefinitionService()
        {
            _reportDefinitions = new List<ReportDefinitionDTO>();
            _reportTemplates = new List<ReportTemplateDTO>();

            // Initialize with built-in report definitions
            InitializeBuiltInReports();
        }

        public Task<ReportDefinitionDTO?> GetReportDefinitionAsync(string reportId)
        {
            var report = _reportDefinitions.FirstOrDefault(r => r.ReportId == reportId);
            return Task.FromResult(report);
        }

        public Task<List<ReportDefinitionDTO>> GetAllReportDefinitionsAsync()
        {
            return Task.FromResult(_reportDefinitions.Where(r => r.IsActive).ToList());
        }

        public Task<ReportTemplateDTO> SaveReportTemplateAsync(SaveReportTemplateDTO template, string userId)
        {
            var templateDto = new ReportTemplateDTO
            {
                TemplateId = template.TemplateId ?? Guid.NewGuid().ToString(),
                TemplateName = template.TemplateName,
                Description = template.Description,
                ReportDefinition = template.ReportDefinition,
                IsDefault = template.IsDefault,
                IsShared = template.ShareWithUsers,
                CreatedBy = userId,
                CreatedAt = DateTime.UtcNow
            };

            var existing = _reportTemplates.FirstOrDefault(t => t.TemplateId == templateDto.TemplateId);
            if (existing != null)
            {
                _reportTemplates.Remove(existing);
                templateDto.ModifiedAt = DateTime.UtcNow;
            }

            _reportTemplates.Add(templateDto);
            return Task.FromResult(templateDto);
        }

        public Task<List<ReportTemplateDTO>> GetReportTemplatesAsync(string? userId, string? reportId, bool includeShared)
        {
            var templates = _reportTemplates.AsQueryable();

            if (!string.IsNullOrEmpty(userId))
            {
                templates = templates.Where(t => t.CreatedBy == userId || (includeShared && t.IsShared));
            }

            if (!string.IsNullOrEmpty(reportId))
            {
                templates = templates.Where(t => t.ReportDefinition.ReportId == reportId);
            }

            return Task.FromResult(templates.ToList());
        }

        public Task<bool> DeleteReportTemplateAsync(string templateId, string userId)
        {
            var template = _reportTemplates.FirstOrDefault(t => t.TemplateId == templateId && t.CreatedBy == userId);
            if (template != null)
            {
                _reportTemplates.Remove(template);
                return Task.FromResult(true);
            }
            return Task.FromResult(false);
        }

        private void InitializeBuiltInReports()
        {
            // Tank Volume History Report
            _reportDefinitions.Add(new ReportDefinitionDTO
            {
                ReportId = "tank-volume-history-report",
                ReportName = "Tank Volume History Report",
                Description = "Detailed report of tank volume changes with filtering and grouping capabilities",
                Category = "Tank Management",
                Type = ReportType.DataGrid,
                Icon = "fa-light fa-gas-pump",
                DataSourceEndpoint = "/api/v1/TankVolumeHistory/filtered",
                RequiredPermission = "_Read_tankVolumeHistory",
                DefaultFilters = new Dictionary<string, object>
                {
                    { "take", 100 },
                    { "includeVehicleNames", true },
                    { "useManualDispensing", false }
                },
                Columns = new List<ReportColumnDTO>
                {
                    new() { DataField = "id", Caption = "ID", DataType = "number", Visible = false },
                    new() { DataField = "siteName", Caption = "Site", DataType = "string", AllowGrouping = true, Width = 150 },
                    new() { DataField = "tankName", Caption = "Tank", DataType = "string", AllowGrouping = true, Width = 120 },
                    new() { DataField = "recordedDate", Caption = "Date", DataType = "date", Format = "MM/dd/yyyy HH:mm", Width = 150, AllowGrouping = true },
                    new() { DataField = "volumeChange", Caption = "Volume Change", DataType = "number", Format = "0.00", Alignment = "right", Width = 130 },
                    new() { DataField = "runningBalance", Caption = "Running Balance", DataType = "number", Format = "0.00", Alignment = "right", Width = 150 },
                    new() { DataField = "changeReason", Caption = "Change Reason", DataType = "string", AllowGrouping = true, Width = 150 },
                    new() { DataField = "vehicleName", Caption = "Vehicle", DataType = "string", Width = 120 },
                    new() { DataField = "recordedBy", Caption = "Recorded By", DataType = "string", Width = 150 }
                },
                Groupings = new List<ReportGroupingDTO>
                {
                    new() { DataField = "siteName", SortOrder = "asc" }
                },
                Summaries = new List<ReportSummaryDTO>
                {
                    new() { DataField = "volumeChange", SummaryType = "sum", DisplayFormat = "Total: {0:N2}", ShowInGroupFooter = true },
                    new() { DataField = "volumeChange", SummaryType = "count", DisplayFormat = "Count: {0}", ShowInGroupFooter = true }
                },
                ExportOptions = new ReportExportOptions
                {
                    EnableExcelExport = true,
                    EnablePdfExport = true,
                    EnableCsvExport = true,
                    DefaultFileName = "tank-volume-history",
                    PdfPageOrientation = "landscape"
                }
            });

            // Tank Volume Pivot Report
            _reportDefinitions.Add(new ReportDefinitionDTO
            {
                ReportId = "tank-volume-pivot-report",
                ReportName = "Tank Volume Pivot Analysis",
                Description = "Pivot analysis of tank volume data with flexible dimensions",
                Category = "Tank Management",
                Type = ReportType.PivotGrid,
                Icon = "fa-light fa-table-pivot",
                DataSourceEndpoint = "/api/v1/TankStockReports/pivot-data",
                RequiredPermission = "_Read_tankStock",
                DefaultFilters = new Dictionary<string, object>
                {
                    { "groupByPeriod", "month" },
                    { "useManualDispensing", false },
                    { "useCombinedDispensing", false }
                },
                PivotConfiguration = new PivotGridConfiguration
                {
                    Fields = new List<PivotFieldDTO>
                    {
                        new() { DataField = "siteName", Caption = "Site", Area = "row", AllowSorting = true, AllowExpanding = true },
                        new() { DataField = "tankName", Caption = "Tank", Area = "row", AllowSorting = true, AllowExpanding = true },
                        new() { DataField = "timePeriod", Caption = "Time Period", Area = "row", SortOrder = "asc" },
                        new() { DataField = "changeReason", Caption = "Change Reason", Area = "column", AllowSorting = true },
                        new() { DataField = "totalVolume", Caption = "Total Volume", Area = "data", SummaryType = "sum", Format = "0.00" },
                        new() { DataField = "transactionCount", Caption = "Transaction Count", Area = "filter", SummaryType = "sum" }
                    },
                    ShowBorders = true,
                    ShowColumnGrandTotals = true,
                    ShowRowGrandTotals = true,
                    ShowColumnTotals = true,
                    ShowRowTotals = true,
                    AllowSortingBySummary = true,
                    AllowFiltering = true,
                    AllowExpanding = true
                },
                ExportOptions = new ReportExportOptions
                {
                    EnableExcelExport = true,
                    EnablePdfExport = false,
                    EnableCsvExport = true,
                    DefaultFileName = "tank-volume-pivot",
                    PdfPageOrientation = "landscape"
                }
            });

            // Add more built-in reports as needed
        }

        /// <summary>
        /// Register a custom report definition programmatically
        /// </summary>
        public void RegisterReportDefinition(ReportDefinitionDTO reportDefinition)
        {
            var existing = _reportDefinitions.FirstOrDefault(r => r.ReportId == reportDefinition.ReportId);
            if (existing != null)
            {
                _reportDefinitions.Remove(existing);
            }
            _reportDefinitions.Add(reportDefinition);
        }
    }
}
