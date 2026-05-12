using System;
using Microsoft.AspNetCore.Mvc;
namespace FMS.WebClient.Controllers;

[ApiController]
[Route ("api/v1/[controller]")]
public class HealthController : ControllerBase {

    [HttpGet]
    public IActionResult Get () {
        try {
            // You can add more checks here (e.g., database connection)
            return Ok (new { Status = "OK", Timestamp = DateTime.UtcNow, Message = "FMS.WebClient is up" });
        } catch (Exception ex) {
            // Log the exception if you have a logging mechanism
            return StatusCode (500, new { Status = "Error", Message = ex.Message });
        }
    }
}