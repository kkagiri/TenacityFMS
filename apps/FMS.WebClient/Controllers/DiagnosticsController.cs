using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;
using Microsoft.AspNetCore.Mvc.Infrastructure;

namespace FMS.WebClient.Controllers;

/// <summary>
/// Diagnostic controller to help debug routing issues.
/// Only available in Development environment.
/// </summary>
[ApiController]
[Route("api/v1/[controller]")]
public class DiagnosticsController : ControllerBase
{
    private readonly IActionDescriptorCollectionProvider _actionDescriptorCollectionProvider;
    private readonly IWebHostEnvironment _env;

    public DiagnosticsController(
        IActionDescriptorCollectionProvider actionDescriptorCollectionProvider,
        IWebHostEnvironment env)
    {
        _actionDescriptorCollectionProvider = actionDescriptorCollectionProvider;
        _env = env;
    }

    /// <summary>
    /// List all registered routes/endpoints in the application.
    /// </summary>
    [HttpGet("routes")]
    public IActionResult GetAllRoutes()
    {
        if (!_env.IsDevelopment())
        {
            return NotFound();
        }

        var routes = _actionDescriptorCollectionProvider.ActionDescriptors.Items
            .Select(ad => new
            {
                Controller = ad.RouteValues.TryGetValue("controller", out var ctrl) ? ctrl : null,
                Action = ad.RouteValues.TryGetValue("action", out var act) ? act : null,
                Template = ad.AttributeRouteInfo?.Template ?? "N/A",
                DisplayName = ad.DisplayName,
                ControllerType = ad.GetType().Name
            })
            .OrderBy(r => r.Controller)
            .ThenBy(r => r.Action)
            .ToList();

        // Filter for DevExpress routes
        var devExpressRoutes = routes
            .Where(r => r.Template != null &&
                       (r.Template.StartsWith("DXXRD") ||
                        r.Template.StartsWith("DXXRDV") ||
                        r.Template.StartsWith("DXXQB") ||
                        (r.Controller != null && r.Controller.Contains("Designer")) ||
                        (r.Controller != null && r.Controller.Contains("Viewer")) ||
                        (r.Controller != null && r.Controller.Contains("QueryBuilder"))))
            .ToList();

        return Ok(new
        {
            TotalRoutes = routes.Count,
            DevExpressRoutes = devExpressRoutes,
            AllRoutes = routes
        });
    }

    /// <summary>
    /// Check if DevExpress services are registered.
    /// </summary>
    [HttpGet("devexpress-status")]
    public IActionResult GetDevExpressStatus()
    {
        if (!_env.IsDevelopment())
        {
            return NotFound();
        }

        var services = HttpContext.RequestServices;

        var designerService = services.GetService(typeof(DevExpress.AspNetCore.Reporting.ReportDesigner.Native.Services.IReportDesignerMvcControllerService));
        var viewerService = services.GetService(typeof(DevExpress.AspNetCore.Reporting.WebDocumentViewer.Native.Services.IWebDocumentViewerMvcControllerService));
        var queryBuilderService = services.GetService(typeof(DevExpress.AspNetCore.Reporting.QueryBuilder.Native.Services.IQueryBuilderMvcControllerService));

        return Ok(new
        {
            ReportDesignerServiceRegistered = designerService != null,
            WebDocumentViewerServiceRegistered = viewerService != null,
            QueryBuilderServiceRegistered = queryBuilderService != null,
            DesignerServiceType = designerService?.GetType().FullName,
            ViewerServiceType = viewerService?.GetType().FullName,
            QueryBuilderServiceType = queryBuilderService?.GetType().FullName
        });
    }
}
