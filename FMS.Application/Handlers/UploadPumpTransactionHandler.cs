using FMS.Application.Handlers.Interface;
using FMS.Application.ModelsDTOs.ATG;
using FMS.Domain.Entities;
using FMS.Domain.PTSCommon;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace FMS.Application.Handlers
{
    public class UploadPumpTransactionHandler : IPacketHandler
    {

        private readonly ILogger<UploadPumpTransactionHandler> _logger;

        private readonly IMediator _mediator;
        public UploadPumpTransactionHandler(ILogger<UploadPumpTransactionHandler> logger, IMediator mediator)
        {
            _logger = logger;
            _mediator = mediator;
        }

        public string PacketType => "PumpTransaction";

        public Task<Packet> HandlePacketAsync(string deviceId, Packet packet)
        {
            throw new NotImplementedException();
        }
    }
}

