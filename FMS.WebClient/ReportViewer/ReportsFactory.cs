using System.Collections.Generic;
using System;
using DevExpress.XtraReports.UI;
using FMS.WebClient.ReportViewer.Reports;

namespace FMS.WebClient.ReportViewer
{
    public static class ReportsFactory
    {
        public static Dictionary<string, Func<XtraReport>> Reports = new Dictionary<string, Func<XtraReport>>()
        {
            //Reports are here 
            ["VehicleConsumptionReport"] = () => new VehicleConsumptionReport()
        };

    }


}
