using DevExpress.AspNetCore.Reporting.ReportDesigner;
using DevExpress.AspNetCore.Reporting.ReportDesigner.Native.Services;
using Microsoft.AspNetCore.Mvc;

namespace FMS.WebClient.Controllers.Reporting;

/// <summary>
/// Controller for DevExpress Report Designer - provides report design capabilities.
///
/// Routes:
/// - POST /DXXRD - Handle all designer operations (Invoke)
/// - POST /DXXRD/GetDesignerModel - Initialize the designer with configuration model
/// - GET  /DXXRD/GetLocalization - Get localization resources
/// </summary>
[ApiExplorerSettings(IgnoreApi = true)]
public class ReportDesignerController : DevExpress.AspNetCore.Reporting.ReportDesigner.ReportDesignerController
{
    private readonly IWebHostEnvironment _env;
    private readonly ILogger<ReportDesignerController> _logger;

    public ReportDesignerController(
        IReportDesignerMvcControllerService controllerService,
        IWebHostEnvironment env,
        ILogger<ReportDesignerController> logger)
        : base(controllerService)
    {
        _env = env;
        _logger = logger;
    }

    /// <summary>
    /// Returns the designer model required by the DevExpress JavaScript client.
    /// This endpoint provides the initial configuration for the Report Designer.
    /// </summary>
    [HttpPost("[action]")]
    public IActionResult GetDesignerModel([FromForm] string? reportUrl)
    {
        var host = $"{Request.Scheme}://{Request.Host}";

        _logger.LogInformation("GetDesignerModel called - ReportUrl: {ReportUrl}, Host: {Host}", reportUrl ?? "(new)", host);

        // Build the client-side model that DevExpress JS expects
        var model = new
        {
            // Report to load (empty for new report)
            reportUrl = reportUrl ?? "",

            // Request options for designer operations
            requestOptions = new
            {
                host = host,
                invokeAction = "/DXXRD/Invoke"
            },

            // Report preview (viewer) options
            reportPreviewOptions = new
            {
                requestOptions = new
                {
                    host = host,
                    invokeAction = "/DXXRDV/Invoke"
                }
            },

            // Query builder options (for SQL data sources)
            queryBuilderOptions = new
            {
                requestOptions = new
                {
                    host = host,
                    invokeAction = "/DXXQB/Invoke"
                }
            },

            // Data source wizard settings
            // Disable Object Data Source (requires additional type registration)
            // Enable SQL Data Source for MySQL database access
            dataSourceSettings = new
            {
                // Disable Object and Entity Framework data sources
                // Only SQL data sources are available (project MySQL DB)
                allowAddDataSource = true,
                sqlDataSourceAvailable = true,
                jsonDataSourceAvailable = false,
                objectDataSourceAvailable = false,
                efDataSourceAvailable = false
            },

            // Designer settings
            developmentMode = _env.IsDevelopment(),
            allowMDI = true,
            rightToLeft = false
        };

        _logger.LogInformation(
            "GetDesignerModel returning - Designer: {DesignerInvoke}, Preview: {PreviewInvoke}, QueryBuilder: {QBInvoke}",
            model.requestOptions.invokeAction,
            model.reportPreviewOptions.requestOptions.invokeAction,
            model.queryBuilderOptions.requestOptions.invokeAction);

        return Ok(model);
    }
}
