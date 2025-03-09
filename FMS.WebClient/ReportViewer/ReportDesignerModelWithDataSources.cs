using DevExpress.XtraReports.UI;

namespace FMS.WebClient.ReportViewer;

public class ReportDesignerModelWithDataSources
{
    public XtraReport Report { get; set; }
    public Dictionary<string, object> DataSources { get; set; }
}