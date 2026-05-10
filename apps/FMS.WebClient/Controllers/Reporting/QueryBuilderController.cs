using DevExpress.AspNetCore.Reporting.QueryBuilder;
using DevExpress.AspNetCore.Reporting.QueryBuilder.Native.Services;
using Microsoft.AspNetCore.Mvc;

namespace FMS.WebClient.Controllers.Reporting;

/// <summary>
/// Controller for DevExpress Query Builder - provides data source query design capabilities.
///
/// Routes:
/// - POST /DXXQB/Invoke - Handle query builder operations
/// </summary>
[ApiExplorerSettings(IgnoreApi = true)]
public class QueryBuilderController : DevExpress.AspNetCore.Reporting.QueryBuilder.QueryBuilderController
{
    public QueryBuilderController(IQueryBuilderMvcControllerService controllerService)
        : base(controllerService)
    {
    }
}
