using AutoMapper;
using FMS.Application.Common;
using FMS.Application.ModelsDTOs.ATG;
using FMS.Application.Services;
using FMS.Domain.Entities;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace FMS.Application.Command.DatabaseCommand.PTSCommands.TankMeasurementsCommand
{
    public class CreateTankMeasurementCommand : IRequest<FMSResponse>
    {
        public TankMeasurementDto TankMeasurementDto { get; set; }
        public string DeviceId { get; set; }

        public CreateTankMeasurementCommand(TankMeasurementDto tankMeasurementDto, string deviceId)
        {
            TankMeasurementDto = tankMeasurementDto;
            DeviceId = deviceId;
        }
    }

    public class CreateTankMeasurementCommandHandler : IRequestHandler<CreateTankMeasurementCommand, FMSResponse>
    {
        private readonly GpsdataContext _context;
        private readonly ILogger<CreateTankMeasurementCommandHandler> _logger;
        private readonly IAlarmHandlerService _alarmHandlerService;

        public CreateTankMeasurementCommandHandler(
            GpsdataContext context,
            ILogger<CreateTankMeasurementCommandHandler> logger,
            IAlarmHandlerService alarmHandlerService)
        {
            _context = context;
            _logger = logger;
            _alarmHandlerService = alarmHandlerService;
        }

        public async Task<FMSResponse> Handle(CreateTankMeasurementCommand request, CancellationToken cancellationToken)
        {
            try
            {
                //Cursor: Validation
                var validationErrors = new List<string>();

                if (request.TankMeasurementDto == null)
                {
                    validationErrors.Add("Tank measurement data is required");
                }
                else
                {
                    if (request.TankMeasurementDto.Tank <= 0)
                    {
                        validationErrors.Add("Valid tank number is required");
                    }

                    if (request.TankMeasurementDto.FuelGradeId <= 0)
                    {
                        validationErrors.Add("Valid fuel grade ID is required");
                    }

                    if (string.IsNullOrEmpty(request.TankMeasurementDto.PtsId))
                    {
                        validationErrors.Add("PTS device ID is required");
                    }
                }

                if (validationErrors.Any())
                {
                    return FMSResponse.ValidationFailed(validationErrors);
                }

                var tankMeasurementDto = request.TankMeasurementDto;

                //Cursor: Try to find the actual Tank entity to link
                var tank = await _context.Tanks
                    .FirstOrDefaultAsync(t => t.PtsId == request.DeviceId, cancellationToken);

                if (tank != null)
                {
                    tankMeasurementDto.TankId = tank.Id;

                    //Cursor: Update tank's fuel grade info if not set
                    if (!tank.FuelGradeId.HasValue && tankMeasurementDto.FuelGradeId > 0)
                    {
                        tank.FuelGradeId = tankMeasurementDto.FuelGradeId;
                        tank.FuelGradeName = tankMeasurementDto.FuelGradeName;
                    }
                }

                //Cursor: Handle alarms
                var alarms = new List<Alarm>();
                if (tankMeasurementDto.Alarms?.Any() == true)
                {
                    var alarmNames = tankMeasurementDto.Alarms.Distinct();
                    alarms = await _context.Alarms
                        .Where(a => alarmNames.Contains(a.Name))
                        .ToListAsync(cancellationToken);
                }

                //Cursor: Create tank measurement entity
                var tankMeasurement = new Tankmeasurement
                {
                    PacketId = tankMeasurementDto.PacketId,
                    Tank = tankMeasurementDto.Tank,
                    TankId = tankMeasurementDto.TankId,
                    ProductUllage = tankMeasurementDto.ProductUllage,
                    Ptsid = tankMeasurementDto.PtsId,
                    DateTime = tankMeasurementDto.DateTime,
                    FuelGradeId = tankMeasurementDto.FuelGradeId,
                    FuelGradeName = tankMeasurementDto.FuelGradeName,
                    ProductHeight = tankMeasurementDto.ProductHeight,
                    WaterHeight = tankMeasurementDto.WaterHeight,
                    Temperature = tankMeasurementDto.Temperature,
                    ProductVolume = tankMeasurementDto.ProductVolume,
                    WaterVolume = tankMeasurementDto.WaterVolume,
                    ProductTcvolume = tankMeasurementDto.ProductTcvolume,
                    ProductDensity = tankMeasurementDto.ProductDensity,
                    ProductMass = tankMeasurementDto.ProductMass,
                    TankFillingPercentage = tankMeasurementDto.TankFillingPercentage,
                    ConfigurationId = tankMeasurementDto.ConfigurationId,
                    Status = tankMeasurementDto.Status,
                    Alarms = alarms
                };

                _context.Tankmeasurements.Add(tankMeasurement);
                await _context.SaveChangesAsync(cancellationToken);

                _logger.LogInformation("Tank measurement created successfully for device {DeviceId}, tank {Tank}, packet {PacketId}",
                    request.DeviceId, tankMeasurementDto.Tank, tankMeasurementDto.PacketId);

                //Cursor: Process alarms for the tank measurement
                try
                {
                    await _alarmHandlerService.ProcessTankMeasurementAlarmsAsync(tankMeasurementDto, request.DeviceId, cancellationToken);
                }
                catch (Exception alarmEx)
                {
                    _logger.LogError(alarmEx, "Error processing alarms for tank measurement from device {DeviceId}", request.DeviceId);
                    // Don't fail the main operation if alarm processing fails
                }

                return FMSResponse.SuccessResponse("Tank measurement processed successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating tank measurement for device {DeviceId}, tank {Tank}",
                    request.DeviceId, request.TankMeasurementDto?.Tank);

                return FMSResponse.FailedResponse($"Error processing tank measurement: {ex.Message}");
            }
        }
    }
}
