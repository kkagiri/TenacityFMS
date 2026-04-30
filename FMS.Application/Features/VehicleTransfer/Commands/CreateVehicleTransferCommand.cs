/**
 * File: CreateVehicleTransferCommand.cs
 * Purpose: Creates a new vehicle transfer record and related inspection data.
 * Dependencies: AutoMapper, EF Core, file handling service
 * Last Modified: 2026-02-26
 *
 * Key Components:
 * - CreateVehicleTransferCommand: Request contract for transfer creation.
 * - CreateVehicleTransferCommandHandler: Persists transfer and child entities.
 */
using System;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using FMS.Application.Common;
using FMS.Application.CommonInterface;
using FMS.Application.Features.VehicleTransfer.DTOs;
using FMS.Domain.Entities.Features.VehicleManagement;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.VehicleTransfer.Commands;

public record CreateVehicleTransferCommand(CreateVehicleTransferDTO TransferDTO) : IRequest<FMSResponse<VehicleTransferDTO>>;

public class CreateVehicleTransferCommandHandler : IRequestHandler<CreateVehicleTransferCommand, FMSResponse<VehicleTransferDTO>>
{
    private readonly GpsdataContext _context;
    private readonly IMapper _mapper;
    private readonly ILogger<CreateVehicleTransferCommandHandler> _logger;
    private readonly IFileHandlingService _fileHandlingService;

    public CreateVehicleTransferCommandHandler(
        GpsdataContext context,
        IMapper mapper,
        ILogger<CreateVehicleTransferCommandHandler> logger,
        IFileHandlingService fileHandlingService)
    {
        _context = context;
        _mapper = mapper;
        _logger = logger;
        _fileHandlingService = fileHandlingService;
    }

    public async Task<FMSResponse<VehicleTransferDTO>> Handle(CreateVehicleTransferCommand request, CancellationToken cancellationToken)
    {
        try
        {
            var dto = request.TransferDTO;

            // Validate vehicle exists
            var vehicle = await _context.Vehicles
                .Include(v => v.VehicleManufacturer)
                .Include(v => v.VehicleModel)
                .FirstOrDefaultAsync(v => v.VehicleId == dto.VehicleId, cancellationToken);

            if (vehicle == null)
            {
                return FMSResponse<VehicleTransferDTO>.Failed($"Vehicle with ID {dto.VehicleId} not found", "NOT_FOUND");
            }

            // Validate from site
            var fromSite = await _context.Sites.FindAsync(new object[] { dto.FromSiteId }, cancellationToken);
            if (fromSite == null)
            {
                return FMSResponse<VehicleTransferDTO>.Failed($"From Site with ID {dto.FromSiteId} not found", "NOT_FOUND");
            }

            // Validate to site
            var toSite = await _context.Sites.FindAsync(new object[] { dto.ToSiteId }, cancellationToken);
            if (toSite == null)
            {
                return FMSResponse<VehicleTransferDTO>.Failed($"To Site with ID {dto.ToSiteId} not found", "NOT_FOUND");
            }

            // Validate cannot transfer to same site
            if (dto.FromSiteId == dto.ToSiteId)
            {
                return FMSResponse<VehicleTransferDTO>.Failed("Cannot transfer vehicle to the same site", "VALIDATION_ERROR");
            }

            // Create the transfer entity
            var transfer = new Domain.Entities.Features.VehicleManagement.VehicleTransfer
            {
                VehicleId = dto.VehicleId,
                DeliveryNoteNumber = dto.DeliveryNoteNumber,
                FromSiteId = dto.FromSiteId,
                ToSiteId = dto.ToSiteId,
                TransferDate = dto.TransferDate,
                DriverId = dto.DriverId,
                DriverName = dto.DriverName,
                DriverPhone = dto.DriverPhone,
                JobNumber = dto.JobNumber,
                CurrentReading = dto.CurrentReading,
                ReadingUnit = dto.ReadingUnit ?? "hrs",
                NextServiceReading = dto.NextServiceReading,
                BatteryNumber = dto.BatteryNumber,
                MakeModel = dto.MakeModel ?? $"{vehicle.VehicleManufacturer?.Name} {vehicle.VehicleModel?.Name}".Trim(),
                FuelInTank = dto.FuelInTank,
                SealNumber = dto.SealNumber,
                DepartureTime = dto.DepartureTime,
                ArrivalTime = dto.ArrivalTime,
                AntiTheftCheckedDeparture = dto.AntiTheftCheckedDeparture,
                AntiTheftCheckedArrival = dto.AntiTheftCheckedArrival,
                KeysInEnvelopeChecked = dto.KeysInEnvelopeChecked,
                Status = "Draft",
                Remarks = dto.Remarks,
                SenderName = dto.SenderName,
                SenderFunction = dto.SenderFunction,
                ReceiverName = dto.ReceiverName,
                ReceiverFunction = dto.ReceiverFunction,
                ApprovedBy = dto.ApprovedBy,
                WorkshopManagerSign = dto.WorkshopManagerSign,
                // GPS Equipment Checkup
                GpsDeviceId = dto.GpsDeviceId,
                GpsDeviceCondition = dto.GpsDeviceCondition,
                GpsDeviceWorking = dto.GpsDeviceWorking,
                GpsDeviceRemarks = dto.GpsDeviceRemarks,
                FuelSensorId = dto.FuelSensorId,
                FuelSensorCondition = dto.FuelSensorCondition,
                FuelSensorWorking = dto.FuelSensorWorking,
                FuelSensorRemarks = dto.FuelSensorRemarks,
                VehicleManufacturer = dto.VehicleManufacturer,
                VehicleModelName = dto.VehicleModelName,
                CreatedBy = dto.UserId,
                DateCreated = DateTime.UtcNow
            };

            // Handle service filter parts - serialize to JSON
            if (dto.ServiceFilterParts?.Count > 0)
            {
                transfer.ServiceFilterParts = JsonSerializer.Serialize(dto.ServiceFilterParts);
            }

            // Handle document upload
            if (dto.DocumentFile != null)
            {
                try
                {
                    var documentUrl = await _fileHandlingService.UploadFileAsync(dto.DocumentFile, "vehicle-transfers");
                    transfer.DocumentUrl = documentUrl;
                    transfer.DocumentFileName = dto.DocumentFile.FileName;
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to upload transfer document, continuing without document");
                }
            }

            // Add the transfer
            _context.Set<Domain.Entities.Features.VehicleManagement.VehicleTransfer>().Add(transfer);

            // Add checkup items
            if (dto.CheckupItems?.Count > 0)
            {
                foreach (var item in dto.CheckupItems)
                {
                    var checkupItem = new VehicleTransferCheckupItem
                    {
                        SerialNo = item.SerialNo,
                        Description = item.Description,
                        CheckType = item.CheckType,
                        IsGood = item.IsGood,
                        IsFair = item.IsFair,
                        IsDamaged = item.IsDamaged,
                        IsWorn = item.IsWorn,
                        WornPercentage = item.WornPercentage,
                        Remarks = item.Remarks
                    };
                    transfer.CheckupItems.Add(checkupItem);
                }
            }

            // Add tyre details
            if (dto.TyreDetails?.Count > 0)
            {
                foreach (var tyre in dto.TyreDetails)
                {
                    var tyreDetail = new VehicleTransferTyreDetail
                    {
                        Position = tyre.Position,
                        Brand = tyre.Brand,
                        Size = tyre.Size,
                        Condition = tyre.Condition,
                        Remarks = tyre.Remarks
                    };
                    transfer.TyreDetails.Add(tyreDetail);
                }
            }

            // Add battery details
            if (dto.BatteryDetails?.Count > 0)
            {
                foreach (var battery in dto.BatteryDetails)
                {
                    var batteryDetail = new VehicleTransferBatteryDetail
                    {
                        BatteryNumber = battery.BatteryNumber,
                        Condition = battery.Condition,
                        Voltage = battery.Voltage,
                        Remarks = battery.Remarks
                    };
                    transfer.BatteryDetails.Add(batteryDetail);
                }
            }

            await _context.SaveChangesAsync(cancellationToken);

            // Update vehicle working site
            vehicle.WorkingSiteId = dto.ToSiteId;
            vehicle.DateModified = DateTime.UtcNow;
            vehicle.ModifiedBy = dto.UserId;

            // Update vehicle odometer if requested
            if (dto.UpdateOdometer && dto.CurrentReading.HasValue)
            {
                vehicle.CurrentPhysicalReading = dto.CurrentReading.ToString();
            }

            await _context.SaveChangesAsync(cancellationToken);

            // Load related data for response
            await _context.Entry(transfer).Reference(t => t.Vehicle).LoadAsync(cancellationToken);
            await _context.Entry(transfer).Reference(t => t.FromSite).LoadAsync(cancellationToken);
            await _context.Entry(transfer).Reference(t => t.ToSite).LoadAsync(cancellationToken);
            await _context.Entry(transfer).Collection(t => t.CheckupItems).LoadAsync(cancellationToken);
            await _context.Entry(transfer).Collection(t => t.TyreDetails).LoadAsync(cancellationToken);
            await _context.Entry(transfer).Collection(t => t.BatteryDetails).LoadAsync(cancellationToken);

            var responseDTO = _mapper.Map<VehicleTransferDTO>(transfer);

            _logger.LogInformation("Vehicle transfer created successfully. Transfer ID: {TransferId}, Vehicle: {VehicleId}, From: {FromSite} To: {ToSite}",
                transfer.TransferId, transfer.VehicleId, fromSite.Name, toSite.Name);

            return FMSResponse<VehicleTransferDTO>.Success(responseDTO, "Vehicle transfer created successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating vehicle transfer for vehicle {VehicleId}", request.TransferDTO.VehicleId);
            return FMSResponse<VehicleTransferDTO>.Failed($"Error creating vehicle transfer: {ex.Message}");
        }
    }
}
