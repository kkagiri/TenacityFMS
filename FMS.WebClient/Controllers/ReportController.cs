using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace FMS.WebClient.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ReportController : ControllerBase 
{

    private readonly IMediator _mediatr;

    public ReportController(IMediator mediatr)
    {
        _mediatr = mediatr;
    }

    //[HttpPost("generate")]
    //public async Task<IActionResult> GenerateVehicleConsumptionReport([FromBody] VehicleConsumptionReportDto([FromBody]) vehicleConsumptionReportDto)

    //{

    //    var report = new VehicleConsumptionReport
    //    {
            
    //    }

    //}
    
}