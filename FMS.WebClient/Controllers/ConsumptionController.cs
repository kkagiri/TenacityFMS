using Microsoft.AspNetCore.Mvc;
using FMS.Application.Queries;
using MediatR;
using FMS.Application.Queries.GPSGATEServer.GetconsumptionReport;
using FMS.Domain.Entities.Auth;
using System.Globalization;
using FMS.Application.Queries.GPSGATEServer.LoginQuery;
using FMS.WebClient.Models.DatabaseViewModel;
using FMS.Application.Command.DatabaseCommand.ConsumptionCmd;
using AutoMapper;
using FMS.Application.Command.DatabaseCommand.ConsumtionCmd.Update;
using FMS.Application.Queries.Database.FMSQuery.Consumption;
//using FMS.Application.Queries.Database.Consumption;

namespace FMS.WebClient.Controllers
{

    [ApiController]
    [Route("api/[controller]")]
    public class ConsumptionController : ControllerBase
    {
        private readonly IMediator _mediator;
        private readonly IConfiguration _configuration;
        private readonly IMapper _mapper;
        private readonly ILogger _logger;

        public ConsumptionController (IMediator mediator, IConfiguration configuration,IMapper mapper,ILogger<ConsumptionController> logger)
        {
            _mapper = mapper;
            _mediator = mediator;
            _configuration = configuration;
            _logger = logger;
        }

        /// <summary>
        /// Get histroical data TODO: Search days on settings or application
        /// </summary>
        /// <param name="vehicleId"></param>
        /// <param name="date"></param>
        /// <returns></returns>
        [HttpGet("gethistoryconsumptionbyvehicle")]
        public async Task<IActionResult> GetHistoryConsumptionDatabyVehicle([FromQuery]int vehicleId, [FromQuery] string datestring, [FromQuery] int entry)
        {
          var date = DateTime.ParseExact(datestring, "yyyy-MM-dd", CultureInfo.InvariantCulture);

            if (vehicleId <= 0 || date == default(DateTime))
            {
                return BadRequest("Invalid vehicle ID or date");
            }

            if(entry < 5 || entry >30 )
            {
                return BadRequest("Entry must be between 5 and 30 days");
            }
            try
            {

                var query = new GetHistoryConsumptionByVehicleQuery { Entry = entry, VehicleId = vehicleId, startDate = date };

                var results = await _mediator.Send(query);

                return Ok(results);
            }
            catch(Exception ex)
            {
                _logger.LogError(ex, "Error Fetching history consumption Data");
                return StatusCode(StatusCodes.Status500InternalServerError,new {Message = ex.Message});
            }

        }


        [HttpGet("getbyid")]
        public async Task<IActionResult> GetByID(int id)
        {
            if(id <=0)
            {
                return BadRequest("invalid consumption ID");
            }
            try
            {
                var query = new GetConsumptionByIdQuery { Id = id };

                var result = await _mediator.Send(query);

                if(result==null)
                {
                    return NotFound();
                }

                return Ok(result);
            }catch (Exception ex)
            {
                _logger.LogError(ex, "Error Consumption data by ID");
                return StatusCode(StatusCodes.Status500InternalServerError, new {Message = ex.Message});
            }
        }




        [HttpGet]
        public async Task<IActionResult> Get(DateTime from) 
        {
          //load settings from appsettings.json

          string? username = _configuration["GPSGateUser:Username"];
          string? password = _configuration["GPSGateUser:Password"];
          int?applicationID  = int.Parse(_configuration["ApplicationID"]??"0");
          int fuelConsumptionReportId = int.Parse(_configuration["FuelConsumptionReportID"]??"0");


            var fromDate =from.Date;
            var toDate = fromDate.AddDays(1).AddTicks(-1); //add one day to from date

          var loginquery = new LoginQuery{

            GPSGateConections = new GPSGateConections{
                GPSGateUser= new GPSGateUser 
                {
                    UserName = username,
                    Password = password
                },
                ApplicationID = applicationID.Value
            }
          };

             var conn = await _mediator.Send(loginquery);
          
            var query = new GetConsumptionReportQuery(conn ,fuelConsumptionReportId, fromDate, toDate);

            var results = await _mediator.Send(query);

            return Ok(results);

        }

        [HttpPost("Create")]
        public async Task<IActionResult> ConsumptionCreate([FromBody] ConsumptionViewModel model)
        {
            if(!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }
         
            var command = _mapper.Map<ConsumptionCreateCmd>(model);

            await _mediator.Send(command);

            return Ok();

        }



        [HttpGet("getlist")]
        public async Task<IActionResult> GetConsumptionList(int pagingNo = 200)
        {
            if(pagingNo < 0 || pagingNo > 5000) return BadRequest("Invalid Paging No");
            var query = new GetConsumptionListQuery(pagingNo);
            var results = await _mediator.Send(query);
            if(results == null || !results.Any())
            {
                return NotFound();
            }
            return Ok(results);
        }

        [HttpPut("Update/{id}")]
        public async Task<IActionResult> ConsumptionUpdate(int id, [FromBody] ConsumptionViewModel model)
        {
            if(!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }
         
            var command = _mapper.Map<ComsumptionUpdateCmd>(model);

            command.Id = id;

            await _mediator.Send(command);

            return Ok();

        }



    }
}
