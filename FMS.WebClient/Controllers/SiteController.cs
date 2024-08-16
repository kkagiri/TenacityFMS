using FMS.Application.Command.DatabaseCommand.UserManagement;
using FMS.Application.Queries.Database.FMSQuery.SiteQuery;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace FMS.WebClient.Controllers
{

    [ApiController]
    [Route("api/[controller]")]
    [Authorize]

    public class SiteController : ControllerBase
    {

        private readonly IMediator _mediator;

        public SiteController(IMediator mediator)
        {
            _mediator = mediator;
        }

        //return list of sites
        [HttpGet("getlist")]
        [Authorize]
        public async Task<IActionResult> GetSiteList()
        {

           var query = new GetSiteQuery();
            var sites =await _mediator.Send(query);
            return Ok(sites);

        }

        //return list of sites by user id
        [HttpGet("getsitebyuserid")]
        [Authorize]
        public async Task<IActionResult> GetSitesByUserId()
        {

            var userIdClaim = User.Claims.FirstOrDefault(c =>
                 c.Type == "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier" &&
                 Guid.TryParse(c.Value, out _));

            if (userIdClaim == null) return BadRequest("Invalid User ID");

            var query = new GetSitesByUserIdQuery(userIdClaim.Value);
            var sites = await _mediator.Send(query);
            return Ok(sites);
        }

        [HttpPut("assignSitestoUser")]
        [Authorize]
        public async Task<IActionResult> AssignSiteToUser(AssignSitesToUserCommand command)
        {
            if (command == null || string.IsNullOrEmpty(command.UserId) || command.SiteIds == null || !command.SiteIds.Any())
            {
                return BadRequest("Invalid command payload");
            }

            try
            {
                var result = await _mediator.Send(command);

                if (result)
                {
                    return Ok("Sites assigned to user successfully");
                }

                return StatusCode(500, "An error occurred while assigning sites to the user");
            }
            catch (Exception ex)
            {
                // Log the exception details
                return StatusCode(500, ex.Message);
            }
        }


        //update site 
 

     

    }
}
