using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.PTS;
using FMS.Application.Features.TankManagement.Deliveries.Services;
using FMS.Domain.Entities;
using FMS.Domain.Entities.Features.TankStockManagement;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Command.DatabaseCommand.PTSCommands.InTankDeliveryCommand
{
    public class CreateInTankDeliveryCommand : IRequest<FMSResponse>
    {
        public InTankDeliveryDto InTankDeliveryDto { get; set; }
        public string DeviceId { get; set; }

        public CreateInTankDeliveryCommand(InTankDeliveryDto inTankDeliveryDto, string deviceId)
        {
            InTankDeliveryDto = inTankDeliveryDto;
            DeviceId = deviceId;
        }
    }

    public class CreateInTankDeliveryCommandHandler : IRequestHandler<CreateInTankDeliveryCommand, FMSResponse>
    {
        private readonly GpsdataContext _context;
        private readonly ILogger<CreateInTankDeliveryCommandHandler> _logger;
        private readonly IInTankDeliveryDetectionService _detectionService;

        public CreateInTankDeliveryCommandHandler(
            GpsdataContext context,
            ILogger<CreateInTankDeliveryCommandHandler> logger,
            IInTankDeliveryDetectionService detectionService)
        {
            _context = context;
            _logger = logger;
            _detectionService = detectionService;
        }

        public async Task<FMSResponse> Handle(CreateInTankDeliveryCommand request, CancellationToken cancellationToken)
        {
            try
            {
                //Cursor: Validation
                var validationErrors = new List<string>();

                if (request.InTankDeliveryDto == null)
                {
                    validationErrors.Add("In-tank delivery data is required");
                }
                else
                {
                    if (request.InTankDeliveryDto.Tank <= 0)
                    {
                        validationErrors.Add("Valid tank number is required");
                    }

                    // FuelGradeId is optional per jsonPTS protocol spec — not all devices send it
                    // PtsId: fall back to DeviceId if not set on DTO
                    if (string.IsNullOrEmpty(request.InTankDeliveryDto.PtsId) && string.IsNullOrEmpty(request.DeviceId))
                    {
                        validationErrors.Add("PTS device ID is required");
                    }

                    if (request.InTankDeliveryDto.StartValues == null)
                    {
                        validationErrors.Add("Start values are required");
                    }

                    if (request.InTankDeliveryDto.EndValues == null)
                    {
                        validationErrors.Add("End values are required");
                    }
                }

                if (validationErrors.Any())
                {
                    return FMSResponse.ValidationFailed(validationErrors);
                }

                var deliveryDto = request.InTankDeliveryDto;

                // Ensure PtsId is set from DeviceId if not already on DTO
                if (string.IsNullOrEmpty(deliveryDto.PtsId))
                {
                    deliveryDto.PtsId = request.DeviceId;
                }

                //Cursor: Try to find the actual Tank entity to link (by PtsId + probe number first, then fallback)
                var tank = await _context.Tanks
                    .FirstOrDefaultAsync(t => t.PtsId == request.DeviceId && t.ProbeNumber == deliveryDto.Tank, cancellationToken);

                // Fallback: match by PtsId only if single tank
                if (tank == null)
                {
                    tank = await _context.Tanks
                        .FirstOrDefaultAsync(t => t.PtsId == request.DeviceId, cancellationToken);
                }

                if (tank != null)
                {
                    deliveryDto.TankId = tank.Id;

                    //Cursor: Update tank's fuel grade info if not set
                    if (!tank.FuelGradeId.HasValue && deliveryDto.FuelGradeId > 0)
                    {
                        tank.FuelGradeId = deliveryDto.FuelGradeId;
                        tank.FuelGradeName = deliveryDto.FuelGradeName;
                    }
                }

                //Cursor: Create in-tank delivery entity
                var inTankDelivery = new Intankdelivery
                {
                    Tank = deliveryDto.Tank,
                    FuelGradeId = deliveryDto.FuelGradeId,
                    FuelGradeName = deliveryDto.FuelGradeName,
                    PacketId = deliveryDto.PacketId,
                    Ptsid = deliveryDto.PtsId,
                    ConfigurationId = deliveryDto.ConfigurationId,
                    TankId = tank?.Id,
                    SiteId = tank?.SiteId,

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

                _context.Intankdeliveries.Add(inTankDelivery);
                await _context.SaveChangesAsync(cancellationToken);

                _logger.LogInformation("In-tank delivery created: DeliveryId={DeliveryId}, Device={DeviceId}, Tank={Tank}, Packet={PacketId}",
                    inTankDelivery.DeliveryId, request.DeviceId, deliveryDto.Tank, deliveryDto.PacketId);

                // === AUTO-DETECTION PROCESSING ===
                // Fire-and-forget to avoid blocking the PTS response
                _ = Task.Run(async () =>
                {
                    try
                    {
                        await _detectionService.ProcessDetectedDeliveryAsync(
                            inTankDelivery, tank, CancellationToken.None);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex,
                            "Non-critical: ITD auto-detection failed for DeliveryId {DeliveryId}",
                            inTankDelivery.DeliveryId);
                    }
                });

                return FMSResponse.SuccessResponse("In-tank delivery processed successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating in-tank delivery for device {DeviceId}, tank {Tank}",
                    request.DeviceId, request.InTankDeliveryDto?.Tank);

                return FMSResponse.FailedResponse($"Error processing in-tank delivery: {ex.Message}");
            }
        }
    }
}