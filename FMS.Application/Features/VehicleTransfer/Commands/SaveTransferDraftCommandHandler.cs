/**
 * File: SaveTransferDraftCommandHandler.cs
 * Purpose: Handles create/update behavior for vehicle transfer drafts.
 * Dependencies: EF Core, AutoMapper, file upload service
 * Last Modified: 2026-02-26
 *
 * Key Components:
 * - Handle(): Routes to create or update flow based on TransferId.
 * - CreateDraftAsync(): Persists new draft transfer.
 * - UpdateDraftAsync(): Persists changes to an existing draft transfer.
 */
using System;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using FMS.Application.Common;
using FMS.Application.CommonInterface;
using FMS.Application.Features.VehicleTransfer.DTOs;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.VehicleTransfer.Commands;

public class SaveTransferDraftCommandHandler : IRequestHandler<SaveTransferDraftCommand, FMSResponse<VehicleTransferDTO>>
{
    private readonly GpsdataContext _context;
    private readonly IMapper _mapper;
    private readonly IFileHandlingService _fileHandlingService;
    private readonly ILogger<SaveTransferDraftCommandHandler> _logger;

    public SaveTransferDraftCommandHandler(
        GpsdataContext context,
        IMapper mapper,
        IFileHandlingService fileHandlingService,
        ILogger<SaveTransferDraftCommandHandler> logger)
    {
        _context = context;
        _mapper = mapper;
        _fileHandlingService = fileHandlingService;
        _logger = logger;
    }

    public async Task<FMSResponse<VehicleTransferDTO>> Handle(SaveTransferDraftCommand request, CancellationToken cancellationToken)
    {
        if (request.DraftDTO.TransferId.HasValue)
        {
            return await UpdateDraftAsync(request.DraftDTO, cancellationToken);
        }

        return await CreateDraftAsync(request.DraftDTO, cancellationToken);
    }

    private async Task<FMSResponse<VehicleTransferDTO>> CreateDraftAsync(SaveTransferDraftDTO dto, CancellationToken cancellationToken)
    {
        if (!dto.VehicleId.HasValue || !dto.FromSiteId.HasValue || !dto.ToSiteId.HasValue || !dto.TransferDate.HasValue)
        {
            return FMSResponse<VehicleTransferDTO>.Failed(
                "Draft requires Vehicle, From Site, To Site, and Transfer Date",
                "VALIDATION_ERROR");
        }

        if (dto.FromSiteId.Value == dto.ToSiteId.Value)
        {
            return FMSResponse<VehicleTransferDTO>.Failed("Cannot transfer vehicle to the same site", "VALIDATION_ERROR");
        }

        var vehicle = await _context.Vehicles
            .Include(v => v.VehicleManufacturer)
            .Include(v => v.VehicleModel)
            .FirstOrDefaultAsync(v => v.VehicleId == dto.VehicleId.Value, cancellationToken);
        if (vehicle == null)
        {
            return FMSResponse<VehicleTransferDTO>.Failed($"Vehicle with ID {dto.VehicleId.Value} not found", "NOT_FOUND");
        }

        var fromSiteExists = await _context.Sites.AnyAsync(site => site.Id == dto.FromSiteId.Value, cancellationToken);
        if (!fromSiteExists)
        {
            return FMSResponse<VehicleTransferDTO>.Failed($"From Site with ID {dto.FromSiteId.Value} not found", "NOT_FOUND");
        }

        var toSiteExists = await _context.Sites.AnyAsync(site => site.Id == dto.ToSiteId.Value, cancellationToken);
        if (!toSiteExists)
        {
            return FMSResponse<VehicleTransferDTO>.Failed($"To Site with ID {dto.ToSiteId.Value} not found", "NOT_FOUND");
        }

        var transfer = new Domain.Entities.Features.VehicleManagement.VehicleTransfer
        {
            VehicleId = dto.VehicleId.Value,
            DeliveryNoteNumber = dto.DeliveryNoteNumber,
            FromSiteId = dto.FromSiteId.Value,
            ToSiteId = dto.ToSiteId.Value,
            TransferDate = dto.TransferDate.Value,
            DriverId = dto.DriverId,
            DriverName = dto.DriverName,
            DriverPhone = dto.DriverPhone,
            JobNumber = dto.JobNumber,
            CurrentReading = dto.CurrentReading,
            ReadingUnit = string.IsNullOrWhiteSpace(dto.ReadingUnit) ? "hrs" : dto.ReadingUnit,
            NextServiceReading = dto.NextServiceReading,
            BatteryNumber = dto.BatteryNumber,
            MakeModel = !string.IsNullOrWhiteSpace(dto.MakeModel)
                ? dto.MakeModel
                : $"{vehicle.VehicleManufacturer?.Name} {vehicle.VehicleModel?.Name}".Trim(),
            FuelInTank = dto.FuelInTank,
            SealNumber = dto.SealNumber,
            DepartureTime = dto.DepartureTime,
            ArrivalTime = dto.ArrivalTime,
            AntiTheftCheckedDeparture = dto.AntiTheftCheckedDeparture ?? false,
            AntiTheftCheckedArrival = dto.AntiTheftCheckedArrival ?? false,
            KeysInEnvelopeChecked = dto.KeysInEnvelopeChecked ?? false,
            Status = "Draft",
            Remarks = dto.Remarks,
            SenderName = dto.SenderName,
            SenderFunction = dto.SenderFunction,
            ReceiverName = dto.ReceiverName,
            ReceiverFunction = dto.ReceiverFunction,
            ApprovedBy = dto.ApprovedBy,
            WorkshopManagerSign = dto.WorkshopManagerSign,
            GpsDeviceId = dto.GpsDeviceId,
            GpsDeviceCondition = dto.GpsDeviceCondition,
            GpsDeviceWorking = dto.GpsDeviceWorking ?? true,
            GpsDeviceRemarks = dto.GpsDeviceRemarks,
            FuelSensorId = dto.FuelSensorId,
            FuelSensorCondition = dto.FuelSensorCondition,
            FuelSensorWorking = dto.FuelSensorWorking ?? true,
            FuelSensorRemarks = dto.FuelSensorRemarks,
            VehicleManufacturer = dto.VehicleManufacturer,
            VehicleModelName = dto.VehicleModelName,
            CreatedBy = dto.UserId,
            DateCreated = DateTime.UtcNow
        };

        if (dto.ServiceFilterParts != null)
        {
            transfer.ServiceFilterParts = dto.ServiceFilterParts.Count > 0
                ? JsonSerializer.Serialize(dto.ServiceFilterParts)
                : null;
        }

        if (dto.DocumentFile != null)
        {
            try
            {
                transfer.DocumentUrl = await _fileHandlingService.UploadFileAsync(dto.DocumentFile, "vehicle-transfers");
                transfer.DocumentFileName = dto.DocumentFile.FileName;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to upload draft document for vehicle transfer draft creation");
            }
        }

        if (dto.CheckupItems?.Count > 0)
        {
            foreach (var item in dto.CheckupItems)
            {
                transfer.CheckupItems.Add(new Domain.Entities.Features.VehicleManagement.VehicleTransferCheckupItem
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
                });
            }
        }

        if (dto.TyreDetails?.Count > 0)
        {
            foreach (var tyre in dto.TyreDetails)
            {
                transfer.TyreDetails.Add(new Domain.Entities.Features.VehicleManagement.VehicleTransferTyreDetail
                {
                    Position = tyre.Position,
                    Brand = tyre.Brand,
                    Size = tyre.Size,
                    Condition = tyre.Condition,
                    Remarks = tyre.Remarks
                });
            }
        }

        if (dto.BatteryDetails?.Count > 0)
        {
            foreach (var battery in dto.BatteryDetails)
            {
                transfer.BatteryDetails.Add(new Domain.Entities.Features.VehicleManagement.VehicleTransferBatteryDetail
                {
                    BatteryNumber = battery.BatteryNumber,
                    Condition = battery.Condition,
                    Voltage = battery.Voltage,
                    Remarks = battery.Remarks
                });
            }
        }

        _context.Set<Domain.Entities.Features.VehicleManagement.VehicleTransfer>().Add(transfer);
        await _context.SaveChangesAsync(cancellationToken);

        await LoadRelatedDataAsync(transfer, cancellationToken);
        var response = _mapper.Map<VehicleTransferDTO>(transfer);
        return FMSResponse<VehicleTransferDTO>.Success(response, "Draft created successfully");
    }

    private async Task<FMSResponse<VehicleTransferDTO>> UpdateDraftAsync(SaveTransferDraftDTO dto, CancellationToken cancellationToken)
    {
        var transfer = await _context.Set<Domain.Entities.Features.VehicleManagement.VehicleTransfer>()
            .Include(t => t.CheckupItems)
            .Include(t => t.TyreDetails)
            .Include(t => t.BatteryDetails)
            .FirstOrDefaultAsync(t => t.TransferId == dto.TransferId!.Value, cancellationToken);

        if (transfer == null)
        {
            return FMSResponse<VehicleTransferDTO>.Failed($"Transfer with ID {dto.TransferId.Value} not found", "NOT_FOUND");
        }

        if (!string.Equals(transfer.Status, "Draft", StringComparison.OrdinalIgnoreCase))
        {
            return FMSResponse<VehicleTransferDTO>.Failed("Only draft transfers can be edited", "VALIDATION_ERROR");
        }

        if (dto.VehicleId.HasValue)
        {
            var vehicleExists = await _context.Vehicles.AnyAsync(v => v.VehicleId == dto.VehicleId.Value, cancellationToken);
            if (!vehicleExists)
            {
                return FMSResponse<VehicleTransferDTO>.Failed($"Vehicle with ID {dto.VehicleId.Value} not found", "NOT_FOUND");
            }
            transfer.VehicleId = dto.VehicleId.Value;
        }

        if (dto.FromSiteId.HasValue)
        {
            var fromSiteExists = await _context.Sites.AnyAsync(site => site.Id == dto.FromSiteId.Value, cancellationToken);
            if (!fromSiteExists)
            {
                return FMSResponse<VehicleTransferDTO>.Failed($"From Site with ID {dto.FromSiteId.Value} not found", "NOT_FOUND");
            }
            transfer.FromSiteId = dto.FromSiteId.Value;
        }

        if (dto.ToSiteId.HasValue)
        {
            var toSiteExists = await _context.Sites.AnyAsync(site => site.Id == dto.ToSiteId.Value, cancellationToken);
            if (!toSiteExists)
            {
                return FMSResponse<VehicleTransferDTO>.Failed($"To Site with ID {dto.ToSiteId.Value} not found", "NOT_FOUND");
            }
            transfer.ToSiteId = dto.ToSiteId.Value;
        }

        if (transfer.FromSiteId == transfer.ToSiteId)
        {
            return FMSResponse<VehicleTransferDTO>.Failed("Cannot transfer vehicle to the same site", "VALIDATION_ERROR");
        }

        if (dto.TransferDate.HasValue) transfer.TransferDate = dto.TransferDate.Value;
        if (dto.DriverId.HasValue) transfer.DriverId = dto.DriverId;
        if (dto.DriverName != null) transfer.DriverName = dto.DriverName;
        if (dto.DriverPhone != null) transfer.DriverPhone = dto.DriverPhone;
        if (dto.DeliveryNoteNumber != null) transfer.DeliveryNoteNumber = dto.DeliveryNoteNumber;
        if (dto.JobNumber != null) transfer.JobNumber = dto.JobNumber;
        if (dto.CurrentReading.HasValue) transfer.CurrentReading = dto.CurrentReading;
        if (dto.ReadingUnit != null) transfer.ReadingUnit = dto.ReadingUnit;
        if (dto.NextServiceReading.HasValue) transfer.NextServiceReading = dto.NextServiceReading;
        if (dto.BatteryNumber != null) transfer.BatteryNumber = dto.BatteryNumber;
        if (dto.MakeModel != null) transfer.MakeModel = dto.MakeModel;
        if (dto.FuelInTank.HasValue) transfer.FuelInTank = dto.FuelInTank;
        if (dto.SealNumber != null) transfer.SealNumber = dto.SealNumber;
        if (dto.DepartureTime.HasValue) transfer.DepartureTime = dto.DepartureTime;
        if (dto.ArrivalTime.HasValue) transfer.ArrivalTime = dto.ArrivalTime;
        if (dto.AntiTheftCheckedDeparture.HasValue) transfer.AntiTheftCheckedDeparture = dto.AntiTheftCheckedDeparture.Value;
        if (dto.AntiTheftCheckedArrival.HasValue) transfer.AntiTheftCheckedArrival = dto.AntiTheftCheckedArrival.Value;
        if (dto.KeysInEnvelopeChecked.HasValue) transfer.KeysInEnvelopeChecked = dto.KeysInEnvelopeChecked.Value;
        if (dto.Remarks != null) transfer.Remarks = dto.Remarks;
        if (dto.SenderName != null) transfer.SenderName = dto.SenderName;
        if (dto.SenderFunction != null) transfer.SenderFunction = dto.SenderFunction;
        if (dto.ReceiverName != null) transfer.ReceiverName = dto.ReceiverName;
        if (dto.ReceiverFunction != null) transfer.ReceiverFunction = dto.ReceiverFunction;
        if (dto.ApprovedBy != null) transfer.ApprovedBy = dto.ApprovedBy;
        if (dto.WorkshopManagerSign != null) transfer.WorkshopManagerSign = dto.WorkshopManagerSign;
        if (dto.GpsDeviceId != null) transfer.GpsDeviceId = dto.GpsDeviceId;
        if (dto.GpsDeviceCondition != null) transfer.GpsDeviceCondition = dto.GpsDeviceCondition;
        if (dto.GpsDeviceWorking.HasValue) transfer.GpsDeviceWorking = dto.GpsDeviceWorking.Value;
        if (dto.GpsDeviceRemarks != null) transfer.GpsDeviceRemarks = dto.GpsDeviceRemarks;
        if (dto.FuelSensorId != null) transfer.FuelSensorId = dto.FuelSensorId;
        if (dto.FuelSensorCondition != null) transfer.FuelSensorCondition = dto.FuelSensorCondition;
        if (dto.FuelSensorWorking.HasValue) transfer.FuelSensorWorking = dto.FuelSensorWorking.Value;
        if (dto.FuelSensorRemarks != null) transfer.FuelSensorRemarks = dto.FuelSensorRemarks;
        if (dto.VehicleManufacturer != null) transfer.VehicleManufacturer = dto.VehicleManufacturer;
        if (dto.VehicleModelName != null) transfer.VehicleModelName = dto.VehicleModelName;

        if (dto.ServiceFilterParts != null)
        {
            transfer.ServiceFilterParts = dto.ServiceFilterParts.Count > 0
                ? JsonSerializer.Serialize(dto.ServiceFilterParts)
                : null;
        }

        if (dto.DocumentFile != null)
        {
            try
            {
                transfer.DocumentUrl = await _fileHandlingService.UploadFileAsync(dto.DocumentFile, "vehicle-transfers");
                transfer.DocumentFileName = dto.DocumentFile.FileName;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to upload draft document for transfer {TransferId}", transfer.TransferId);
            }
        }

        if (dto.CheckupItems != null)
        {
            _context.Set<Domain.Entities.Features.VehicleManagement.VehicleTransferCheckupItem>().RemoveRange(transfer.CheckupItems);
            transfer.CheckupItems.Clear();
            foreach (var item in dto.CheckupItems)
            {
                transfer.CheckupItems.Add(new Domain.Entities.Features.VehicleManagement.VehicleTransferCheckupItem
                {
                    TransferId = transfer.TransferId,
                    SerialNo = item.SerialNo,
                    Description = item.Description,
                    CheckType = item.CheckType,
                    IsGood = item.IsGood,
                    IsFair = item.IsFair,
                    IsDamaged = item.IsDamaged,
                    IsWorn = item.IsWorn,
                    WornPercentage = item.WornPercentage,
                    Remarks = item.Remarks
                });
            }
        }

        if (dto.TyreDetails != null)
        {
            _context.Set<Domain.Entities.Features.VehicleManagement.VehicleTransferTyreDetail>().RemoveRange(transfer.TyreDetails);
            transfer.TyreDetails.Clear();
            foreach (var tyre in dto.TyreDetails)
            {
                transfer.TyreDetails.Add(new Domain.Entities.Features.VehicleManagement.VehicleTransferTyreDetail
                {
                    TransferId = transfer.TransferId,
                    Position = tyre.Position,
                    Brand = tyre.Brand,
                    Size = tyre.Size,
                    Condition = tyre.Condition,
                    Remarks = tyre.Remarks
                });
            }
        }

        if (dto.BatteryDetails != null)
        {
            _context.Set<Domain.Entities.Features.VehicleManagement.VehicleTransferBatteryDetail>().RemoveRange(transfer.BatteryDetails);
            transfer.BatteryDetails.Clear();
            foreach (var battery in dto.BatteryDetails)
            {
                transfer.BatteryDetails.Add(new Domain.Entities.Features.VehicleManagement.VehicleTransferBatteryDetail
                {
                    TransferId = transfer.TransferId,
                    BatteryNumber = battery.BatteryNumber,
                    Condition = battery.Condition,
                    Voltage = battery.Voltage,
                    Remarks = battery.Remarks
                });
            }
        }

        transfer.ModifiedBy = dto.UserId;
        transfer.DateModified = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        await LoadRelatedDataAsync(transfer, cancellationToken);
        var response = _mapper.Map<VehicleTransferDTO>(transfer);
        return FMSResponse<VehicleTransferDTO>.Success(response, "Draft updated successfully");
    }

    private async Task LoadRelatedDataAsync(Domain.Entities.Features.VehicleManagement.VehicleTransfer transfer, CancellationToken cancellationToken)
    {
        await _context.Entry(transfer).Reference(t => t.Vehicle).LoadAsync(cancellationToken);
        await _context.Entry(transfer).Reference(t => t.FromSite).LoadAsync(cancellationToken);
        await _context.Entry(transfer).Reference(t => t.ToSite).LoadAsync(cancellationToken);

        if (!_context.Entry(transfer).Collection(t => t.CheckupItems).IsLoaded)
        {
            await _context.Entry(transfer).Collection(t => t.CheckupItems).LoadAsync(cancellationToken);
        }

        if (!_context.Entry(transfer).Collection(t => t.TyreDetails).IsLoaded)
        {
            await _context.Entry(transfer).Collection(t => t.TyreDetails).LoadAsync(cancellationToken);
        }

        if (!_context.Entry(transfer).Collection(t => t.BatteryDetails).IsLoaded)
        {
            await _context.Entry(transfer).Collection(t => t.BatteryDetails).LoadAsync(cancellationToken);
        }
    }
}
