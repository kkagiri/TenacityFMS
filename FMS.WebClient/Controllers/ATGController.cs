using System;
using NLog;
using Microsoft.AspNetCore.Mvc;
using MediatR;
using System.Security.Cryptography;
using FMS.Application.Command.DatabaseCommand.ATGCommands.TankMeasurementsCommand;
using Microsoft.Extensions.Configuration;
using System.Text;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using FMS.Application.ModelsDTOs.ATG;
using FMS.Domain.Entities;
using Microsoft.Extensions.Logging;
using AutoMapper.Configuration.Annotations;
using FMS.Application.ModelsDTOs.ATG.Common;
using FMS.Application.Command.DatabaseCommand.ATGCommands.InTankDeliveryCommand;
using FMS.Application.Command.DatabaseCommand.ATGCommands.PumpTransactoinCommand;
using FMS.Application.Command.DatabaseCommand.ATGCommands.AlertRecordCommand;
using FMS.Application.Common;
using Microsoft.AspNetCore.SignalR;
using FMS.WebClient.Signal;
using FMS.Domain.ATGStatus;
using FMS.Application.Command;

namespace FMS.WebClient.Controllers;


[ApiController]
[Route("ATG")]
public class ATGController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly IConfiguration _configuration;
    private readonly ILogger<ATGController> _logger;
    private readonly IHubContext<PtsStatusHub> _hubContext;




    public ATGController(IMediator mediator, IConfiguration configuration, ILogger<ATGController> logger, IHubContext<PtsStatusHub> hubContext)
    {
        _logger = logger;
        _mediator = mediator;
        _configuration = configuration;
        _hubContext = hubContext;
    }
}



