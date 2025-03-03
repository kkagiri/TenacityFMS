using FMS.WebClient.Report;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using DevExpress.AspNetCore.Reporting.WebDocumentViewer;
using DevExpress.XtraReports.Web.WebDocumentViewer.Native.Services;
using DevExpress.AspNetCore.Reporting.WebDocumentViewer.Native.Services;
namespace FMS.WebClient.Controllers
{

    [ApiController]
    [Route("api/DXXRDV/[controller]")]
    [Authorize]
    public class ReportViewerController : WebDocumentViewerController
    {

        public ReportViewerController(IWebDocumentViewerMvcControllerService controllerService)
                  : base(controllerService)
        {
        }

    }
}
