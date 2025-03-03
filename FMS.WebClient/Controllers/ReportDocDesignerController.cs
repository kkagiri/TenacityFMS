using FMS.WebClient.Report;
using MediatR;
using DevExpress.XtraReports.UI;
using Microsoft.AspNetCore.Mvc;
using DevExpress.XtraReports.Native;
using Microsoft.AspNetCore.Authorization;
using DevExpress.AspNetCore.Reporting.ReportDesigner.Native.Services;
using DevExpress.AspNetCore.Reporting.ReportDesigner;
using DevExpress.XtraReports.Web.ReportDesigner.Services;
using DevExpress.XtraReports.Web.Extensions;

namespace FMS.WebClient.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ReportDocDesignerController : ReportDesignerController
{
    public ReportDocDesignerController(IReportDesignerMvcControllerService controllerService)
        : base(controllerService)
    {

    }

    [HttpPost("GetDesignerModel")]
    public async Task<IActionResult> GetDesignerModel(
        [FromForm] string reportUrl,
        [FromServices] IReportDesignerModelBuilder reportDesignerModelBuilder)
    {
        reportUrl = string.IsNullOrEmpty(reportUrl) ? "DefaultReport" : reportUrl;

        // Check if the report exists


        var designerModel = await reportDesignerModelBuilder
            .Report(reportUrl)
            .BuildModelAsync();

        return DesignerModel(designerModel);
    }
}

