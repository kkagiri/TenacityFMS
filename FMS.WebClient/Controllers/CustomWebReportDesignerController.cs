// using DevExpress.AspNetCore.Reporting.QueryBuilder;
// using DevExpress.AspNetCore.Reporting.QueryBuilder.Native.Services;
// using DevExpress.AspNetCore.Reporting.ReportDesigner;
// using DevExpress.AspNetCore.Reporting.ReportDesigner.Native.Services;
// using DevExpress.XtraReports.Web.ReportDesigner.Services;
// using DevExpress.AspNetCore.Reporting.WebDocumentViewer;
// using DevExpress.AspNetCore.Reporting.WebDocumentViewer.Native.Services;
// using Microsoft.AspNetCore.Mvc;
// using System.ComponentModel.DataAnnotations;
// using DevExpress.XtraReports.Web.ReportDesigner;
// using MediatR;
// using DevExpress.DataAccess.Sql;

// namespace FMS.WebClient.Controllers
// {
//     [Route("DXXRD")]
//     public class CustomWebReportDesignerController : ReportDesignerController
//     {
//         public CustomWebReportDesignerController(IReportDesignerMvcControllerService controllerService) : base(controllerService)
//         {
//         }
//              [HttpPost("VehicleConsumptionReport")]
//             public IActionResult GetVehicleConsumptReport(
//             [FromForm] string reportUrl, 
//             [FromServices] IReportDesignerClientSideModelGenerator modelGenerator) //use IReportDesignerModelBuilder
//             {
//                 var dataSources = new Dictionary<string, object>();

//                 var ds = new SqlDataSource("FMSConnection");

//                  //create a query to access VehicleConsumptiontable

//                  SqlQuery query = SelectQueryFluentBuilder.AddTable("VehicleConsumption").SelectAllColumnsFromTable().Build("VehicleConsumption");

//                  ds.Queries.Add(query);
//                  ds.RebuildResultSchema();
//                  dataSources.Add("VehicleConsumption", ds);

//                  reportUrl = string.IsNullOrEmpty(reportUrl)?"vehicleconsumption":reportUrl;

//                 //var designerModel = await modelGenerator.


//                 var model = modelGenerator.GetModel(reportUrl,dataSources, ReportDesignerController.DefaultUri, WebDocumentViewerController.DefaultUri, QueryBuilderController.DefaultUri);
//                 return DesignerModel(model);
//             }



//     }

// public class CustomWebDocumentViewerController : WebDocumentViewerController
// {
//     public CustomWebDocumentViewerController(IWebDocumentViewerMvcControllerService controllerService) : base(controllerService)
//     {
//     }
// }
//     public class CustomQueryBuilderController : QueryBuilderController
//         {
//             public CustomQueryBuilderController(IQueryBuilderMvcControllerService controllerService) : base(controllerService)
//             {
//             }
//         }
// }
