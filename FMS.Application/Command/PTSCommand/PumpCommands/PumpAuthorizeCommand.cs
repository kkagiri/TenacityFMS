using MediatR;
using FMS.Domain.Entities.PTS;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using FMS.Persistence.DataAccess;
using System.Threading;
using FMS.Domain.Entities.PTS.Enums;
using FMS.Infrastructure.EventBus.RabbitMQ;
using FMS.Application.PTSServices.PumpService;
using Microsoft.Extensions.Logging;
using FMS.Application.Helpers;
using FMS.Application.Infrastructure.Expections.Base;
using FMS.Application.Infrastructure.DistCacheTracker;
using FMS.Application.Common;
using FMS.Application.Command.PTSCommand.TagCommands;

namespace FMS.Application.Command.PTSCommand.PumpCommands
{
    public record PumpAuthorizeCommand : IRequest<FMSResponseMessage<PumpAuthorizeConfirmation>>
    {

        public string? DeviceId { get; set; }
        public int PumpId { get; set; } = 0;
        public PumpAuthorizeType PumpAuthorizeType { get; set; }

        public double? Dose { get; set; }
        public NozzleOrFuelIdSelector NozzleOrFuelIdSelector { get; set; }
        public int Nozzle { get; set; } = 0;
        public List<int>? Nozzles { get; set; }
        public int? FuelGradeId { get; set; }
        public bool PriceEnabled { get; set; }
        public PumpAuthorizeType Type { get; set; }
        public bool AutoCloseTransaction { get; set; }
        public bool TransactionEnabled { get; set; }
        public int Transaction { get; set; }
        public string? Tag { get; set; }


    }


    public class PumpAuthorizeCommandHandler : IRequestHandler<PumpAuthorizeCommand, FMSResponseMessage<PumpAuthorizeConfirmation>>
    {

        private readonly GpsdataContext _context;
        private readonly ILogger<PumpAuthorizeCommandHandler> _logger;
        private readonly IAuthorizationStateTracker _authTracker;
        private readonly IMediator _mediator;

        private readonly IPumpService _pumpService;

        public PumpAuthorizeCommandHandler(IAuthorizationStateTracker authstatetracker, IMediator mediator, GpsdataContext context, IPumpService pumpService, ILogger<PumpAuthorizeCommandHandler> logger)
        {
            _authTracker = authstatetracker;
            _mediator = mediator;
            _context = context;
            _pumpService = pumpService;
            _logger = logger;
        }


        public async Task<FMSResponseMessage<PumpAuthorizeConfirmation>> Handle(PumpAuthorizeCommand request, CancellationToken cancellationToken)
        {
            try
            {

                //1. validate Request
                if (!await ValidateRequest(request))
                {
                    _logger.LogError("Invalid request for authorizing pump {PumpId} for device {DeviceId}", request.PumpId, request.DeviceId);
                    return new FMSResponseMessage<PumpAuthorizeConfirmation>(false, "Invalid request", null!);
                }

                //2. check if alread authorized

                if (await _authTracker.IsAuthorized(request.DeviceId!, request.Nozzle))
                {
                    _logger.LogInformation("Pump {PumpId} already authorized for device {DeviceId}", request.PumpId, request.DeviceId);
                    return new FMSResponseMessage<PumpAuthorizeConfirmation>(true, "Pump already authorized", null!);
                }

                //3. Aunthicate the tag if Provide

                if (!string.IsNullOrEmpty(request.Tag))
                {
                    var tagAuthentication = await _mediator.Send(new AuthenticateTagCommand(request.Tag), cancellationToken);

                    if (!tagAuthentication.IsAuthenticated)
                    {
                        _logger.LogInformation("Tag read ignored - tag not authenticated for device {DeviceId}, pump {PumpId}", request.DeviceId, request.PumpId);
                        return new FMSResponseMessage<PumpAuthorizeConfirmation>(false, "Tag not authenticated", null!);
                    }

                    //use the tag doss limi if not provided
                    if (!request.Dose.HasValue)
                    {
                        request = request with { Dose = (double)tagAuthentication.dose };
                    }
                }

                var pumpAuthorizeData = new PumpAuthorizeData
                {
                    Pump = request.PumpId,
                    NozzleOrFuelIdSelector = request.NozzleOrFuelIdSelector,
                    Nozzle = request.Nozzle,
                    Nozzles = request.Nozzles,
                    FuelGradeId = request.FuelGradeId ?? 0,
                    PriceEnabled = request.PriceEnabled,
                    Type = request.Type,
                    Dose = request.Dose ?? 0,
                    AutoCloseTransaction = request.AutoCloseTransaction,
                    TransactionEnabled = request.TransactionEnabled,
                    Transaction = PacketIdGenerator.GetNextId(),
                    Tag = request.Tag
                };





                var confirmation = await _pumpService.PumpAuthorizeAsync(request.DeviceId!, pumpAuthorizeData);

                //log the confirmation
                if (confirmation != null)
                {
                    _logger.LogInformation("Pump {PumpId} authorized successfully for device {DeviceId}. Transaction: {TransactionId}", request.PumpId, request.DeviceId, confirmation.Transaction);
                    await _authTracker.SetAuthorized(request.DeviceId!, request.Nozzle, new AuthState
                    {
                        DeviceId = request.DeviceId!,
                        PumpId = request.PumpId,
                        TagId = request.Tag,

                        NozzleId = request.Nozzle,
                        ExpiresAt = DateTime.UtcNow.AddMinutes(5),
                        Status = "Authorized",
                        TransactionId = confirmation.Transaction,
                        AuthorizedAt = DateTime.UtcNow,
                        AuthorizedAmount = (decimal)(request.Dose ?? 0)
                    });

                    return new FMSResponseMessage<PumpAuthorizeConfirmation>(true, "Pump authorized", confirmation);
                }

                return new FMSResponseMessage<PumpAuthorizeConfirmation>(false, "Pump not authorized", null!);
            }
            catch (PTSDeviceException ex)
            {
                _logger.LogError(ex, "PTS device error while authorizing pump {PumpId} for device {DeviceId}",
                    request.PumpId, request.DeviceId);
                return new FMSResponseMessage<PumpAuthorizeConfirmation>(false, ex.Message, null!);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error while authorizing pump {PumpId} for device {DeviceId}",
                                       request.PumpId, request.DeviceId);
                throw;
            }


        }

        private async Task<bool> ValidateRequest(PumpAuthorizeCommand request)
        {
            if (string.IsNullOrEmpty(request.DeviceId)) return false;

            if (request.PumpId <= 0 || request.PumpId > 50) return false;

            if (request.Dose <= 0) return false;
            if (request.NozzleOrFuelIdSelector == NozzleOrFuelIdSelector.NOZZLE && request.Nozzle <= 0) return false;
            if (request.NozzleOrFuelIdSelector == NozzleOrFuelIdSelector.FUELGRADEID && request.FuelGradeId <= 0) return false;
            return true;
        }

    }
}
