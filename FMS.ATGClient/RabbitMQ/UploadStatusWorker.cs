
using MediatR;
using System.Text;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using FMS.Domain.ATGStatus;
using Newtonsoft.Json;
using FMS.Application.Command.PTSCommand.FuelDispensing;
using AutoMapper.Configuration.Annotations;
using System.Threading;
using FMS.Application.Command.PTSCommand;

namespace FMS.ATGClient.RabbitMQ
{
    public class UploadStatusWorker : BackgroundService
    {

        private readonly RabbitMQService _rabbitMQService;
        private readonly IMediator _mediator;
        private readonly ILogger<UploadStatusWorker> _logger;


        public UploadStatusWorker (RabbitMQService rabbitMQService, IMediator mediator, ILogger<UploadStatusWorker> logger)
        {
            _rabbitMQService = rabbitMQService;
            _mediator = mediator;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("UploadStatusWorker is starting");
            _rabbitMQService.ConsumeUploadStatus(async (sender,args) =>
                {
                    try
                    {

                        _logger.LogInformation("consuming upload status");
                        var uploadStatusJson = Encoding.UTF8.GetString(args.Body.ToArray());

                        var uploadStatus = JsonConvert.DeserializeObject<UploadStatus>(uploadStatusJson);


                        bool isNozzleUp = uploadStatus.Pumps?.IdleStatus?.NozzlesUp?.Any(nozzleNo => nozzleNo > 0) == true;

                        bool hasReaderData = uploadStatus.Pumps?.IdleStatus?.Tags?.Any(tag =>!string.IsNullOrWhiteSpace(tag.ToString())) == true;




                        if (isNozzleUp && !hasReaderData)
                        {

                            var tagInfo = uploadStatus.Pumps.IdleStatus.Tags.FirstOrDefault();
                            var pumpNumber = uploadStatus.Pumps.IdleStatus.Ids.FirstOrDefault();
                            var nozzleNumber = uploadStatus.Pumps.IdleStatus.NozzlesUp.FirstOrDefault();

                           var readRFIDCommand = new PumpGetTagCommand(pumpNumber, nozzleNumber);

                           var readRFIDResults = await _mediator.Send(readRFIDCommand);

                           if (readRFIDResults.Success)
                           {
                               var fuelDispenseCommand = new FuelDispenseCommand(readRFIDResults.TagData, pumpNumber, nozzleNumber);
                               await _mediator.Send(fuelDispenseCommand);
                           }

                           else
                           {
                               _logger.LogError($"Failed to read RFID data. Error: {readRFIDResults.ErrorMessage}");
                           }
                        }
                        else if (isNozzleUp )
                        {
                            var tagInfo = uploadStatus.Pumps.IdleStatus.Tags.FirstOrDefault();
                            var pumpNumber = uploadStatus.Pumps.IdleStatus.Ids.FirstOrDefault();
                            var nozzleNumber = uploadStatus.Pumps.IdleStatus.NozzlesUp.FirstOrDefault();
                            //send FuelDispeseCommand 

                            var fuelDispenseCommand = new FuelDispenseCommand(tagInfo.ToString(), pumpNumber, nozzleNumber);

                            await _mediator.Send(fuelDispenseCommand);
                        }


                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Error while processing upload status");
                    }

                },stoppingToken);
           
        }
    }
}
