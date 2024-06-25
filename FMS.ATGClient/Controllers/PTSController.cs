using FMS.Application.Command.DatabaseCommand.ATGCommands.AlertRecordCommand;
using FMS.Application.Command.DatabaseCommand.ATGCommands.InTankDeliveryCommand;
using FMS.Application.Command.DatabaseCommand.ATGCommands.PumpTransactoinCommand;
using FMS.Application.Command.DatabaseCommand.ATGCommands.TankMeasurementsCommand;
using FMS.Application.Common;
using FMS.Application.FuelDispensing.Commands;
using FMS.Application.ModelsDTOs.ATG.Common;
using FMS.Application.Queries.Database.PTSQueries;
using FMS.ATGClient.PTS.FuelDispensing.Hub;
using FMS.ATGClient.RabbitMQ;
using FMS.Domain.ATGStatus;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System.Security.Cryptography;
using System.Text;

namespace FMS.ATGClient.Controllers
{

    [ApiController]
    [Route("PTS")]
    public class PTSController : Controller
    {
        private readonly IMediator _mediator;
        private readonly IConfiguration _configuration;
        private readonly ILogger _logger;
       // private readonly IHubContext<PtsStatusHub> _hubContext;
       private readonly RabbitMQService _rabbitMQService;

        public PTSController(IMediator mediator, IConfiguration configuration ,RabbitMQService rabbitMQService, ILogger<PTSController> logger)
        {
            _rabbitMQService = rabbitMQService;
            _mediator = mediator;
            _configuration = configuration;
            _logger = logger;
//_hubContext = hubContext;

        }


        [HttpPost]
        [Route("post")]
        public async Task<IActionResult> Post()
        {

            // You would validate the HMAC signature here if you're using the SecretKey
            // This example assumes you have a method to validate the HMAC called ValidateHMAC
            // if (Request.Headers.TryGetValue("X-Data-Signature", out var signature) &&
            //    !await validateHMAC(signature,Request.Body,secretKey))
            // {
            //     return Unauthorized();
            //  }

            //TODO: Check if the Header X-Pts-Id is in the Database . If not return 401 with message "PTS ID not found"
            //extract headers 
            
            if(!Request.Headers.ContainsKey("X-Pts-Id"))
            {
                return BadRequest("PTS ID not found");
            }
            
             int ptsID = int.Parse( Request.Headers["X-Pts-Id"].ToString());

          
         //   var configuration = await _mediator.Send(new GetPTSDeviceConfigurationQuery{DeviceID = ptsID });

        //    if (configuration == null)
         //   {
         //       return BadRequest("PTS ID not found");
         //   }
        //

            //intiate ptsCommunication Service 
            
            try
            {
                var requestBody = await new StreamReader(Request.Body).ReadToEndAsync();
                var ptsRequestDto = JsonConvert.DeserializeObject<PtsBaseRequest>(requestBody);

                if (ptsRequestDto?.Packets == null || !ptsRequestDto.Packets.Any())
                {
                    return BadRequest("Invalid or missing packet data");
                }

                bool isUploadStatus = false;


                var responses = new List<string>();

                foreach (var packet in ptsRequestDto.Packets)
                {
                    string response;

                    switch (packet.Type)
                    {

                        case "UploadStatus":

                            isUploadStatus = true;
                            try{
                            _rabbitMQService.PublishUploadStatus(packet.Data.ToString());
                                _logger.LogInformation("Message published successfully");
                            }catch
                            {
                                _logger.LogError("Error in RabbitMQ Publish");
                            }
                            var command = new UploadStatusCommand { Data = packet.Data };
                           // var uploadStatus = await _mediator.Send(command);                          
                            response = ConfirmationMessage.Success(packet.Id, "UploadStatus", "OK");
                            
                            break;
                        case "UploadTankMeasurement":

                            var tankcommand = new CreateTankMeasurementCommand { PtsRequestDto = ptsRequestDto };
                            response = await _mediator.Send(tankcommand);
                            break;
                        case "UploadPumpTransaction":
                            var pumpCommand = new CreatePumpTransactionCommand { PtsRequestDto = ptsRequestDto };
                            response = await _mediator.Send(pumpCommand);
                            break;
                        case "UploadInTankDelivery":
                            var deliveryCommand = new CreateInTankDeliveryCommand { PtsRequestDto = ptsRequestDto };
                            response = await _mediator.Send(deliveryCommand);
                            break;
                        case "UploadAlertRecord":
                            var alertCommand = new CreateAlertRecordCommand { PtsRequestDto = ptsRequestDto };
                            response = await _mediator.Send(alertCommand);
                            break;
                        default:
                            _logger.LogError("Unknown request type: {RequestType}", packet.Type);
                            response = ConfirmationMessage.Error(packet.Id, packet.Type, 400, "Unknown request type");
                            break;
                    }

                    responses.Add(response);
                }

                var hasError = responses.Any(r =>r.Contains("\"Code\":"));
                if (hasError)
                {
                    return BadRequest(string.Join("", responses));

                }
                else
                {
                    return Ok(string.Join("", responses));
                }

            }
            catch (JsonException ex)
            {
                _logger.LogError(ex, "Invalid Json Format");
                return BadRequest("Invalid Json Format");
            }

        }


        private string CreateHmacSignature(string responseData)
        {
            var secretKey = _configuration["SecretKey"];
            var secretKeyBytes = Encoding.UTF8.GetBytes(secretKey);
            using (var hmac = new HMACSHA256(secretKeyBytes))
            {
                var responseBytes = Encoding.UTF8.GetBytes(responseData);
                var hash = hmac.ComputeHash(responseBytes);
                return Convert.ToBase64String(hash);
            }
        }
        public async Task<bool> validateHMAC(string receivedSignature, Stream requestBodyStream, string secretKey)
        {
            using (var reader = new StreamReader(requestBodyStream))
            {
                var requestbody = await reader.ReadToEndAsync();

                // Compute the hash from the request body and the secret key
                var secretKeyBytes = Encoding.UTF8.GetBytes(secretKey);
                using (var hmac = new HMACSHA256(secretKeyBytes))
                {
                    var bodyBytes = Encoding.UTF8.GetBytes(requestbody);
                    var computedHash = hmac.ComputeHash(bodyBytes);
                    var computedSignature = Convert.ToBase64String(computedHash);

                    // Compare the computed signature with the received signature
                    return computedSignature == receivedSignature;
                }


            }
        }
    }
}


