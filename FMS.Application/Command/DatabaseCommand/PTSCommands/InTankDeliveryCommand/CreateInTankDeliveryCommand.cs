using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.PTS;
using FMS.Domain.Entities;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Command.DatabaseCommand.PTSCommands.InTankDeliveryCommand {
    public class CreateInTankDeliveryCommand : IRequest<FMSResponse> {
        public InTankDeliveryDto InTankDeliveryDto { get; set; }
        public string DeviceId { get; set; }

        public CreateInTankDeliveryCommand (InTankDeliveryDto inTankDeliveryDto, string deviceId) {
            InTankDeliveryDto = inTankDeliveryDto;
            DeviceId = deviceId;
        }
    }

    public class CreateInTankDeliveryCommandHandler : IRequestHandler<CreateInTankDeliveryCommand, FMSResponse> {
        private readonly GpsdataContext _context;
        private readonly ILogger<CreateInTankDeliveryCommandHandler> _logger;

        public CreateInTankDeliveryCommandHandler (
            GpsdataContext context,
            ILogger<CreateInTankDeliveryCommandHandler> logger) {
            _context = context;
            _logger = logger;
        }

        public async Task<FMSResponse> Handle (CreateInTankDeliveryCommand request, CancellationToken cancellationToken) {
            try {
                //Cursor: Validation
                var validationErrors = new List<string> ();

                if (request.InTankDeliveryDto == null) {
                    validationErrors.Add ("In-tank delivery data is required");
                } else {
                    if (request.InTankDeliveryDto.Tank <= 0) {
                        validationErrors.Add ("Valid tank number is required");
                    }

                    if (request.InTankDeliveryDto.FuelGradeId <= 0) {
                        validationErrors.Add ("Valid fuel grade ID is required");
                    }

                    if (string.IsNullOrEmpty (request.InTankDeliveryDto.PtsId)) {
                        validationErrors.Add ("PTS device ID is required");
                    }

                    if (request.InTankDeliveryDto.StartValues == null) {
                        validationErrors.Add ("Start values are required");
                    }

                    if (request.InTankDeliveryDto.EndValues == null) {
                        validationErrors.Add ("End values are required");
                    }
                }

                if (validationErrors.Any ()) {
                    return FMSResponse.ValidationFailed (validationErrors);
                }

                var deliveryDto = request.InTankDeliveryDto;

                //Cursor: Try to find the actual Tank entity to link
                var tank = await _context.Tanks
                    .FirstOrDefaultAsync (t => t.PtsId == request.DeviceId, cancellationToken);

                if (tank != null) {
                    deliveryDto.TankId = tank.Id;

                    //Cursor: Update tank's fuel grade info if not set
                    if (!tank.FuelGradeId.HasValue && deliveryDto.FuelGradeId > 0) {
                        tank.FuelGradeId = deliveryDto.FuelGradeId;
                        tank.FuelGradeName = deliveryDto.FuelGradeName;
                    }
                }

                //Cursor: Create in-tank delivery entity
                var inTankDelivery = new Intankdelivery {
                    Tank = deliveryDto.Tank,
                    FuelGradeId = deliveryDto.FuelGradeId,
                    FuelGradeName = deliveryDto.FuelGradeName,
                    PacketId = deliveryDto.PacketId,
                    Ptsid = deliveryDto.PtsId,
                    ConfigurationId = deliveryDto.ConfigurationId,

                    // Start values
                    StartDateTime = deliveryDto.StartValues?.DateTime,
                    StartProductHeight = deliveryDto.StartValues?.ProductHeight,
                    StartWaterHeight = deliveryDto.StartValues?.WaterHeight,
                    StartTemperature = deliveryDto.StartValues?.Temperature,
                    StartProductVolume = deliveryDto.StartValues?.ProductVolume,
                    StartProductTcvolume = deliveryDto.StartValues?.ProductTCVolume,
                    StartProductDensity = deliveryDto.StartValues?.ProductDensity,
                    StartProductMass = deliveryDto.StartValues?.ProductMass,

                    // End values
                    EndDateTime = deliveryDto.EndValues?.DateTime,
                    EndProductHeight = deliveryDto.EndValues?.ProductHeight,
                    EndWaterHeight = deliveryDto.EndValues?.WaterHeight,
                    EndTemperature = deliveryDto.EndValues?.Temperature,
                    EndProductVolume = deliveryDto.EndValues?.ProductVolume,
                    EndProductTcvolume = deliveryDto.EndValues?.ProductTCVolume,
                    EndProductDensity = deliveryDto.EndValues?.ProductDensity,
                    EndProductMass = deliveryDto.EndValues?.ProductMass,

                    // Absolute values
                    AbsoluteProductHeight = deliveryDto.AbsoluteValues?.ProductHeight,
                    AbsoluteWaterHeight = deliveryDto.AbsoluteValues?.WaterHeight,
                    AbsoluteTemperature = deliveryDto.AbsoluteValues?.Temperature,
                    AbsoluteProductVolume = deliveryDto.AbsoluteValues?.ProductVolume,
                    AbsoluteProductTcvolume = deliveryDto.AbsoluteValues?.ProductTCVolume,
                    AbsoluteProductDensity = deliveryDto.AbsoluteValues?.ProductDensity,
                    AbsoluteProductMass = deliveryDto.AbsoluteValues?.ProductMass,
                    PumpsDispensedVolume = deliveryDto.AbsoluteValues?.PumpsDispensedVolume
                };

                _context.Intankdeliveries.Add (inTankDelivery);
                await _context.SaveChangesAsync (cancellationToken);

                _logger.LogInformation ("In-tank delivery created successfully for device {DeviceId}, tank {Tank}, packet {PacketId}",
                    request.DeviceId, deliveryDto.Tank, deliveryDto.PacketId);

                return FMSResponse.SuccessResponse ("In-tank delivery processed successfully");
            } catch (Exception ex) {
                _logger.LogError (ex, "Error creating in-tank delivery for device {DeviceId}, tank {Tank}",
                    request.DeviceId, request.InTankDeliveryDto?.Tank);

                return FMSResponse.FailedResponse ($"Error processing in-tank delivery: {ex.Message}");
            }
        }
    }
}