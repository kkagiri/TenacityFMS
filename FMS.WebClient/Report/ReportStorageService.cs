using DevExpress.XtraReports.UI;
using DevExpress.XtraReports.Web.Extensions;
using FMS.Domain.Entities.Reports;
using FMS.Persistence.DataAccess;
using Microsoft.EntityFrameworkCore;

namespace FMS.WebClient.Report;

/// <summary>
/// Custom report storage extension that persists reports to the database.
/// This allows reports to be stored, retrieved, and managed from the reportitems table.
/// </summary>
public class ReportStorageService : ReportStorageWebExtension
{
    private readonly IServiceProvider _serviceProvider;

    public ReportStorageService(IServiceProvider serviceProvider)
    {
        _serviceProvider = serviceProvider;
    }

    /// <summary>
    /// Creates a scoped DbContext to ensure proper connection management.
    /// </summary>
    private GpsdataContext CreateDbContext()
    {
        var scope = _serviceProvider.CreateScope();
        return scope.ServiceProvider.GetRequiredService<GpsdataContext>();
    }

    public override bool CanSetData(string url)
    {
        // Allow saving all reports - could add permission checks here
        return true;
    }

    public override bool IsValidUrl(string url)
    {
        // Empty URL is valid for new reports
        // Otherwise validate URL format - only allow simple names without path separators
        return string.IsNullOrEmpty(url) || (!url.Contains('/') && !url.Contains('\\'));
    }

    public override byte[] GetData(string url)
    {
        // Handle empty URL - return a blank report for new report creation
        if (string.IsNullOrEmpty(url))
        {
            using var newReport = new XtraReport
            {
                Name = "NewReport",
                DisplayName = "New Report"
            };
            using var ms = new MemoryStream();
            newReport.SaveLayoutToXml(ms);
            return ms.ToArray();
        }

        using var context = CreateDbContext();
        var reportItem = context.ReportItems.FirstOrDefault(x => x.Name == url);

        // If report exists but has no layout data, return a blank report layout
        if (reportItem != null && reportItem.LayoutData == null)
        {
            // Create a blank report with the report name
            using var blankReport = new XtraReport
            {
                Name = url,
                DisplayName = reportItem.DisplayName ?? url
            };
            using var ms = new MemoryStream();
            blankReport.SaveLayoutToXml(ms);
            return ms.ToArray();
        }

        if (reportItem?.LayoutData == null)
        {
            throw new InvalidOperationException($"Report '{url}' not found.");
        }

        return reportItem.LayoutData;
    }

    public override void SetData(XtraReport report, string url)
    {
        using var context = CreateDbContext();
        using var ms = new MemoryStream();

        report.SaveLayoutToXml(ms);
        var layoutData = ms.ToArray();

        var existingReport = context.ReportItems.FirstOrDefault(x => x.Name == url);

        if (existingReport != null)
        {
            existingReport.LayoutData = layoutData;
            existingReport.UpdatedAt = DateTime.UtcNow;
        }
        else
        {
            context.ReportItems.Add(new ReportItem
            {
                Name = url,
                DisplayName = url,
                LayoutData = layoutData,
                CreatedAt = DateTime.UtcNow
            });
        }

        context.SaveChanges();
    }

    public override string SetNewData(XtraReport report, string defaultUrl)
    {
        // Ensure unique name
        using var context = CreateDbContext();
        var name = defaultUrl;
        var counter = 1;

        while (context.ReportItems.Any(r => r.Name == name))
        {
            name = $"{defaultUrl}_{counter++}";
        }

        SetData(report, name);
        return name;
    }

    public override Dictionary<string, string> GetUrls()
    {
        using var context = CreateDbContext();
        return context.ReportItems
            .AsNoTracking()
            .ToDictionary(
                x => x.Name,
                x => x.DisplayName ?? x.Name
            );
    }
}