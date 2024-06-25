// using System.ServiceModel;
// using DevExpress.XtraReports.UI;
// using DevExpress.XtraReports.Web.Extensions;
// using FMS.Domain.Entities.Reports;
// using FMS.Persistence.DataAccess;
// using Microsoft.EntityFrameworkCore;

// namespace FMS.WebClient.ReportViewer;

// public class CustomReportStorageWebExtension : ReportStorageWebExtension
// {

//     private readonly GpsdataContext _context;
//     public CustomReportStorageWebExtension(GpsdataContext context)
//     {
//         _context = context;
//     }

//     public override bool CanSetData(string url) {
//          // Determines whether a report with the specified URL can be saved.
//          // Add custom logic that returns **false** for reports that should be read-only.
//         //  // Return **true** if no valdation is required.
//          // This method is called only for valid URLs (if the **IsValidUrl** method returns **true**).

//          return  true;
//     }
//      public override bool IsValidUrl(string url) {
//          // Determines whether the URL passed to the current report storage is valid.
//          // Implement your own logic to prohibit URLs that contain spaces or other specific characters.
//          // Return **true** if no validation is required.

//          return Path.GetFileName(url) == url;
//    }


// public override byte[] GetData(string url) {
//         try
//         {
//           var report = _context.ReportItems.FirstOrDefault(r=>r.Name == url);
//           if(report != null)
//           {
//          return report.LayoutData;
//            }
//         }
//         catch (Exception)
//         {
//             throw new FaultException(new FaultReason("Could not get report data."), new FaultCode("Server"), "GetData");
//         }

//         throw new FaultException(new FaultReason($"Could not find report '{url}'."), new FaultCode("Server"), "GetData");
//     }
//     public override Dictionary<string, string> GetUrls() {
//         // Returns a dictionary that contains the report names (URLs) and display names. 
//         // The Report Designer uses this method to populate the Open Report and Save Report dialogs.

//         //return Directory.GetFiles(reportDirectory, "*" + FileExtension)
//         //                      .Select(Path.GetFileNameWithoutExtension)
//         //                      .Union(ReportsFactory.Reports.Select(x => x.Key))
//         //                      .ToDictionary<string, string>(x => x);
//         return  _context.ReportItems.ToDictionary(r=>r.Name,r=>r.DisplayName);
//     }

//    public override void SetData(XtraReport report, string url) {
//         // Saves the specified report to the report storage with the specified name
//         // (saves existing reports only). 
//         try
//         {
//             var reportItem = _context.ReportItems.FirstOrDefault(r => r.Name == url);
//             if (reportItem == null)
//             {
//                 reportItem = new ReportItem
//                 {
//                     Name = url,
//                     DisplayName = url,
                   
//                 };
//                 _context.ReportItems.Add(reportItem);
//             }

//             using (var ms = new MemoryStream())
//             {
//                 report.SaveLayoutToXml(ms);
//                reportItem.LayoutData = ms.ToArray();
//             }
//                             _context.SaveChanges();

//         }catch(Exception ex)
//         {
//             throw new FaultException(new FaultReason("Could not set report data."), new FaultCode("Server"), "SetData");
//         }
//    }

//     public override string SetNewData(XtraReport report, string defaultUrl) {
//          // Allows you to validate and correct the specified name (URL).
//          // This method also allows you to return the resulting name (URL),
//          // and to save your report to a storage. The method is called only for new reports.
//          SetData(report, defaultUrl);
//          return defaultUrl;
//    }
// } 



