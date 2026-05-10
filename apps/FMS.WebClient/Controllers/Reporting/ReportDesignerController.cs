using DevExpress.AspNetCore.Reporting.ReportDesigner;
using DevExpress.AspNetCore.Reporting.ReportDesigner.Native.Services;
using DevExpress.XtraReports.Web.ReportDesigner;
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
    /// Uses DevExpress ReportDesignerClientSideModelGenerator for proper model structure.
    /// DevelopmentMode is set via UseDevelopmentMode() in service configuration.
    /// </summary>
    [HttpPost("[action]")]
    public async Task<IActionResult> GetDesignerModel([FromForm] string? reportUrl, [FromForm] string? dataSources)
    {
        var host = $"{Request.Scheme}://{Request.Host}";

        _logger.LogInformation("GetDesignerModel called - ReportUrl: {ReportUrl}, Host: {Host}", reportUrl ?? "(new)", host);

        try
        {
            // Use DevExpress client-side model generator with string-based signature
            // Parameters: reportUrl, dataSources (JSON dict), designerUri, viewerUri, queryBuilderUri
            var generator = new ReportDesignerClientSideModelGenerator(HttpContext.RequestServices);
            var model = await generator.GetModelAsync(
                reportUrl ?? string.Empty,                                    // Report URL/name
                new Dictionary<string, object>(),                             // Data sources dictionary
                "/DXXRD",                                                     // Designer handler URI
                "/DXXRDV",                                                    // Viewer handler URI
                "/DXXQB"                                                      // Query builder handler URI
            );

            _logger.LogInformation("GetDesignerModel returning model for report: {ReportUrl}", reportUrl ?? "(new)");

            // Return the model directly - DevelopmentMode is set via UseDevelopmentMode() in service configuration
            return Ok(model);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error building designer model for report: {ReportUrl}", reportUrl);
            throw;
        }
    }
}
