using DevExpress.AspNetCore.Reporting.WebDocumentViewer;
using DevExpress.AspNetCore.Reporting.WebDocumentViewer.Native.Services;
using Microsoft.AspNetCore.Mvc;

namespace FMS.WebClient.Controllers.Reporting;

/// <summary>
/// Controller for DevExpress Web Document Viewer - provides report viewing capabilities.
/// Handles report rendering, export, and printing operations.
///
/// Routes:
/// - POST /DXXRDV/Invoke - Handle viewer operations
/// </summary>
[ApiExplorerSettings(IgnoreApi = true)]
public class WebDocumentViewerController : DevExpress.AspNetCore.Reporting.WebDocumentViewer.WebDocumentViewerController
{
    public WebDocumentViewerController(IWebDocumentViewerMvcControllerService controllerService)
        : base(controllerService)
    {
    }
}
