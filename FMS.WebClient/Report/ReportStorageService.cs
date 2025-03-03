using DevExpress.XtraReports.UI;
using DevExpress.XtraReports.Web.Extensions;
using FMS.Domain.Entities.Reports;
using FMS.Persistence.DataAccess;
using Microsoft.EntityFrameworkCore;

namespace FMS.WebClient.Report
{
    public class ReportStorageService : ReportStorageWebExtension
    {

        private readonly GpsdataContext _context;

        public ReportStorageService(GpsdataContext context)
        {
            _context = context;
        }

        public override bool CanSetData(string url)
        {
            return true;
        }

        public override bool IsValidUrl(string url)
        {
            return !string.IsNullOrEmpty(url);
        }

        public override byte[] GetData(string url)
        {
            var reportItem = _context.ReportItems.FirstOrDefault(x => x.Name == url);
            return reportItem?.LayoutData;
        }

        public override void SetData(XtraReport report, string url)
        {
            using (var ms = new MemoryStream())
            {
                report.SaveLayoutToXml(ms);
                var layoutData = ms.ToArray();

                var existingReport = _context.ReportItems.FirstOrDefault(x => x.Name == url);

                if (existingReport != null)
                {
                    existingReport.LayoutData = layoutData;
                    existingReport.DisplayName = url;
                }
                else
                {
                    _context.ReportItems.Add(new ReportItem
                    {
                        Name = url,
                        DisplayName = url,
                        LayoutData = layoutData
                    });
                }

                _context.SaveChanges();
            }
        }

        public override string SetNewData(XtraReport report, string defaultUrl)
        {
            SetData(report, defaultUrl);
            return defaultUrl;
        }

        public override Dictionary<string, string> GetUrls()
        {
            return _context.ReportItems
                .ToDictionary(
                    x => x.Name,
                    x => x.DisplayName ?? x.Name
                );
        }
    }
}