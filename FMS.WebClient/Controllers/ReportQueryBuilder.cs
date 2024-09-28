using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using DevExpress.DataAccess.Sql;
using DevExpress.XtraReports.UI;
using System.Text;
using DevExpress.AspNetCore.Reporting.QueryBuilder;
using DevExpress.AspNetCore.Reporting.QueryBuilder.Native.Services;

namespace FMS.WebClient.Controllers
{
    [ApiController]
    [Route("api/DXXQB/[controller]")]
    [Authorize]
    public class ReportQueryBuilderController : QueryBuilderController 
    {

        public ReportQueryBuilderController(IQueryBuilderMvcControllerService controllerService)
            : base(controllerService)
        {
        }   


    }


}

