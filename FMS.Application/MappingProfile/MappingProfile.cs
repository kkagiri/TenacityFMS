using System;
using System.Linq;
using AutoMapper;
using FMS.Application.Command.DatabaseCommand.ConsumtionCmd.Update;
using FMS.Application.Command.DatabaseCommand.TankStockCommand;
using FMS.Application.Models;
using FMS.Application.ModelsDTOs.ATG;
using FMS.Application.ModelsDTOs.FMS;
using FMS.Application.ModelsDTOs.FMS.Consumption;
using FMS.Application.ModelsDTOs.FMS.Delivery.cs;
using FMS.Application.ModelsDTOs.FMS.Employee;
using FMS.Application.ModelsDTOs.FMS.ExpectedAVG;
using FMS.Application.ModelsDTOs.FMS.FuelRefil;
using FMS.Application.ModelsDTOs.FMS.PTSDevice;
using FMS.Application.ModelsDTOs.FMS.Supplier;
using FMS.Application.ModelsDTOs.FMS.Tag;
using FMS.Application.ModelsDTOs.FMS.Tank;
using FMS.Application.ModelsDTOs.FMS.TankReconciliation;
using FMS.Application.ModelsDTOs.FMS.TankStock;
using FMS.Application.ModelsDTOs.FMS.TankTransfer;
using FMS.Application.ModelsDTOs.FMS.TankVolumeHistory;
using FMS.Application.ModelsDTOs.FMS.UserActivities;
using FMS.Application.ModelsDTOs.FMS.UserManagement;
using FMS.Application.ModelsDTOs.FMS.Vehicle;
using FMS.Application.ModelsDTOs.Vehicle;
using FMS.Application.Queries.Database.FMSQuery.UserManagement.UserQueries;
using FMS.Domain.Entities;

namespace FMS.Application.MappingProfile {
    public class MainMappingProfile : Profile {
        public MainMappingProfile () {
            // Site mappings
            CreateMap<Site, SiteDTO> ()
                .ForMember (dest => dest.Name, opt => opt.MapFrom (scr => scr.Name.ToUpper ()))
                .ReverseMap ();

            // User mappings
            CreateMap<User, UserDto> ().ReverseMap ();

            // UserActivity mappings
            CreateMap<UserActivity, UserActivityDTO> ()
                .ForMember (dest => dest.UserName, opt => opt.MapFrom (src => src.User != null ? src.User.UserName : "Unknown"))
                .ReverseMap ();

            // Delivery mappings
            CreateMap<Delivery, DeliveryDTO> ().ReverseMap ();

            // Supplier mappings
            CreateMap<Supplier, SupplierDTO> ().ReverseMap ();

            // TankStock mappings
            CreateMap<Tankstock, TankStockDTO> ()
                .ForMember (dest => dest.EntryType, opt => opt.MapFrom (src => src.EntryType.ToString ()))
                .ReverseMap ();

            // TankTransfer mappings
            CreateMap<TankTransfer, TankTransferDTO> ()
                .ForMember (dest => dest.Date, opt => opt.MapFrom (src => src.TransferDate.Value.ToString ("yyyy-MM-ddTHH:mm:ssZ")))
                .ReverseMap ();

            // TankVolumeHistory mappings
            CreateMap<TankVolumeHistory, TankVolumeHistoryDTO> ()
                .ForMember (dest => dest.ChangeReason, opt => opt.MapFrom (src => src.ChangeReason.ToString ()))
                .ForMember (dest => dest.Site, opt => opt.MapFrom (src => src.Tank.Site.Name))
                .ForMember (dest => dest.SiteId, opt => opt.MapFrom (src => src.Tank.Site.Id))
                .ReverseMap ();

            // TankReconciliation mappings
            CreateMap<Dailytankreconciliation, TankReconcillationDTO> ()
                .ForMember (dest => dest.TankName, opt => opt.MapFrom (src => src.Tank.Name))
                .ForMember (dest => dest.SiteName, opt => opt.MapFrom (src => src.Tank.Site.Name))
                .ReverseMap ();

            // Permission mappings
            CreateMap<Permission, PermissionDTO> ().ReverseMap ();

            // Vehicle mappings
            CreateMap<Vehicle, VehicleDTO> ()
                .ForMember (dest => dest.IsCompanyVehicle, opt => opt.MapFrom (src => src.IsCompanyVehicle.HasValue && src.IsCompanyVehicle.Value != 0))
                .ForMember (dest => dest.IsActive, opt => opt.MapFrom (src => src.IsActive.HasValue && src.IsActive.Value != 0))
                .ForMember (dest => dest.Tags, opt => opt.MapFrom (src => src.Tags.Select (t => t.Name).ToList ()))
                .ReverseMap ()
                .ForMember (dest => dest.IsCompanyVehicle, opt => opt.MapFrom (src => src.IsCompanyVehicle.HasValue ? (sbyte?) (src.IsCompanyVehicle.Value ? 1 : 0) : null))
                .ForMember (dest => dest.IsActive, opt => opt.MapFrom (src => src.IsActive.HasValue ? (sbyte?) (src.IsActive.Value ? 1 : 0) : null));
            CreateMap<Vehicle, SimpleVehicleDto> ()
                .ForMember (dest => dest.VehicleId, opt => opt.MapFrom (src => src.VehicleId))
                .ForMember (dest => dest.HyoungNo, opt => opt.MapFrom (src => src.HyoungNo))

                .ReverseMap ();

            // FuelRefil mappings
            CreateMap<Fuelrefil, FuelRefilDTO> ()
                .ForMember (dest => dest.IsModified, opt => opt.MapFrom (src => src.IsModified.HasValue && src.IsModified.Value != 0))
                .ForMember (dest => dest.Date, opt => opt.MapFrom (src => src.Date.HasValue && src.Date.Value.Year > 1900 ? src.Date : (DateTime?) null))
                .ForMember (dest => dest.DateCreated, opt => opt.MapFrom (src => src.DateCreated.ToString ("yyyy-MM-ddTHH:mm:ssZ")))
                .ReverseMap ()
                .ForMember (d => d.TagId, opt => opt.MapFrom (src => src.TagId))
                .ForMember (dest => dest.IsModified, opt => opt.MapFrom (src => src.IsModified ? (sbyte) 1 : (sbyte) 0));

            // Role mappings
            CreateMap<Role, RoleDto> ()
                .ForMember (dest => dest.Id, opt => opt.MapFrom (src => src.Id))
                .ForMember (dest => dest.Name, opt => opt.MapFrom (src => src.Name))
                .ForMember (dest => dest.Description, opt => opt.MapFrom (src => src.Description))
                .ReverseMap ();

            // Employee mappings
            CreateMap<Employee, EmployeeDto> ()
                .ForMember (dest => dest.SiteId, opt => opt.MapFrom (src => src.SiteId))
                .ForMember (dest => dest.FullName, opt => opt.MapFrom (src => src.FullName))
                .ForMember (dest => dest.EmployeeWorkNo, opt => opt.MapFrom (src => src.EmployeeWorkNo))
                .ForMember (dest => dest.EmployeephoneNumber, opt => opt.MapFrom (src => src.EmployeephoneNumber))
                .ForMember (dest => dest.Employeestatus, opt => opt.MapFrom (src => src.Employeestatus))
                .ForMember (dest => dest.Vehicles, opt => opt.MapFrom (src => src.Vehicles.Select (v => v.VehicleId)))
                .ForMember (dest => dest.IsModified, opt => opt.MapFrom (src => src.IsModified.HasValue && src.IsModified.Value != 0))
                .ReverseMap ()
                .ForMember (dest => dest.Vehicles, opt => opt.MapFrom (src => src.Vehicles.Select (id => new Vehicle { VehicleId = id })))
                .ForMember (dest => dest.IsModified, opt => opt.MapFrom (src => (sbyte?) (src.IsModified ? (sbyte) 1 : (sbyte) 0)));

            // Tank mappings
            CreateMap<Tank, TankDTO> ()
                .ForMember (dest => dest.SiteName, opt => opt.MapFrom (src => src.Site.Name))
                .ForMember (dest => dest.UseBookKeeping, opt => opt.MapFrom (src => src.UseBookKeeping.HasValue && src.UseBookKeeping.Value != 0))
                .ReverseMap ()
                .ForMember (dest => dest.UseBookKeeping, opt => opt.MapFrom (src => (sbyte?) (src.UseBookKeeping ? (sbyte) 1 : (sbyte) 0)));

            // VehicleModel mappings
            CreateMap<Vehiclemodel, FMS.Application.ModelsDTOs.FMS.VehicleModelDto> ()
                .ForMember (dest => dest.Id, opt => opt.MapFrom (src => src.Id))
                .ForMember (dest => dest.Name, opt => opt.MapFrom (src => src.Name))
                .ForMember (dest => dest.ManufacturerId, opt => opt.MapFrom (src => src.ManufacturerId));
            CreateMap<FMS.Application.ModelsDTOs.FMS.VehicleModelDto, Vehiclemodel> ()
                .ForMember (dest => dest.Id, opt => opt.MapFrom (src => src.Id))
                .ForMember (dest => dest.Name, opt => opt.MapFrom (src => src.Name))
                .ForMember (dest => dest.ManufacturerId, opt => opt.MapFrom (src => src.ManufacturerId));

            // ExpectedAverage mappings
            CreateMap<Expectedaverage, ExpectedAVGDto> ()
                .ForMember (dest => dest.Id, opt => opt.MapFrom (src => src.Id))
                .ForMember (dest => dest.VehicleId, opt => opt.MapFrom (src => src.VehicleId))
                .ForMember (dest => dest.ExpectedAverageValue, opt => opt.MapFrom (src => src.ExpectedAverageValue))
                .ForMember (dest => dest.ExpectedAverageClassificationId, opt => opt.MapFrom (src => src.ExpectedAverageClassificationId))
                .ForMember (dest => dest.ExpectedAverageclassificationName, opt => opt.MapFrom (src => src.ExpectedAverageClassification.Name))
                .ReverseMap ();
            CreateMap<Expectedaverageclassification, FMS.Application.ModelsDTOs.FMS.ExpectedAVGClassficationDTO> ().ReverseMap ();

            // VehicleConsumption mappings
            CreateMap<Vehicleconsumption, HistoryConsumptionDTO> ()
                .ForMember (dest => dest.Id, opt => opt.MapFrom (src => src.Id))
                .ForMember (dest => dest.TotalFuel, opt => opt.MapFrom (src => src.TotalFuel))
                .ForMember (dest => dest.ExpectedAveraged, opt => opt.MapFrom (src => src.ExpectedConsumption))
                .ForMember (dest => dest.Employee, opt => opt.MapFrom (src => src.EmployeeName))
                .ForMember (dest => dest.Site, opt => opt.MapFrom (src => src.Site.Name))
                .ForMember (dest => dest.ExcessWorkingHrCost, opt => opt.MapFrom (src => src.ExcessWorkingHrsCost))
                .ForMember (dest => dest.Date, opt => opt.MapFrom (src => src.Date))
                .ForMember (dest => dest.MaxSpeed, opt => opt.MapFrom (src => src.MaxSpeed))
                .ForMember (dest => dest.AvgSpeed, opt => opt.MapFrom (src => src.AvgSpeed))
                .ForMember (dest => dest.TotalDistance, opt => opt.MapFrom (src => src.TotalDistance))
                .ForMember (dest => dest.FlowMeterFuelUsed, opt => opt.MapFrom (src => src.FlowMeterFuelUsed))
                .ForMember (dest => dest.FlowMeterFuelLost, opt => opt.MapFrom (src => src.FlowMeterFuelLost))
                .ForMember (dest => dest.FlowMeterEngineHrs, opt => opt.MapFrom (src => src.FlowMeterEngineHrs))
                .ForMember (dest => dest.IsAverageKm, opt => opt.MapFrom (src => src.IsKmperhr != 0))
                .ForMember (dest => dest.IsNightShift, opt => opt.MapFrom (src => src.IsNightShift != 0))
                .ForMember (dest => dest.EngHours, opt => opt.MapFrom (src => src.EngHours))
                .ForMember (dest => dest.Comments, opt => opt.MapFrom (src => src.Comments))
                .ForMember (dest => dest.ExcessWorkingHrCost, opt => opt.MapFrom (src => src.ExcessWorkingHrsCost));

            CreateMap<ComsumptionUpdateCmd, Vehicleconsumption> ()
                .ForMember (dest => dest.VehicleId, opt => opt.MapFrom (src => src.VehicleId))
                .ForMember (dest => dest.TotalFuel, opt => opt.MapFrom (src => src.TotalFuel))
                .ForMember (dest => dest.ExpectedConsumption, opt => opt.MapFrom (src => src.ExcessWorkingHrsCost))
                .ForMember (dest => dest.EmployeeName, opt => opt.Ignore ())
                .ForMember (dest => dest.Date, opt => opt.MapFrom (src => src.Date))
                .ForMember (dest => dest.MaxSpeed, opt => opt.MapFrom (src => src.MaxSpeed))
                .ForMember (dest => dest.AvgSpeed, opt => opt.MapFrom (src => src.AvgSpeed))
                .ForMember (dest => dest.TotalDistance, opt => opt.MapFrom (src => src.TotalDistance))
                .ForMember (dest => dest.IsKmperhr, opt => opt.MapFrom (src => src.IsKmperhr))
                .ForMember (dest => dest.FuelLost, opt => opt.MapFrom (src => src.FuelLost))
                .ForMember (dest => dest.FlowMeterFuelUsed, opt => opt.MapFrom (src => src.FlowMeterFuelUsed))
                .ForMember (dest => dest.FlowMeterEffiency, opt => opt.MapFrom (src => src.FlowMeterEffiency))
                .ForMember (dest => dest.FuelEfficiency, opt => opt.MapFrom (src => src.FuelEfficiency))
                .ForMember (dest => dest.EngHours, opt => opt.MapFrom (src => src.EngHours))
                .ForMember (dest => dest.FlowMeterEngineHrs, opt => opt.MapFrom (src => src.FlowMeterEngineHrs))
                .ReverseMap ();

            CreateMap<Vehicleconsumption, FMS.Application.ModelsDTOs.FMS.VehicleConsumptionInfoDTO> ()
                .ForMember (dest => dest.VehicleId, opt => opt.MapFrom (src => src.VehicleId))
                .ForMember (dest => dest.TotalFuel, opt => opt.MapFrom (src => src.TotalFuel))
                .ForMember (dest => dest.HyoungNo, opt => opt.MapFrom (src => src.Vehicle.HyoungNo))
                .ForMember (dest => dest.VehicleType, opt => opt.MapFrom (src => src.Vehicle.VehicleType.Abbvr))
                .ForMember (dest => dest.VehicleManufacturer, opt => opt.MapFrom (src => src.Vehicle.VehicleManufacturer.Name))
                .ForMember (dest => dest.VehicleModel, opt => opt.MapFrom (src => src.Vehicle.VehicleModel.Name))
                .ForMember (dest => dest.Date, opt => opt.MapFrom (src => src.Date))
                .ForMember (dest => dest.MaxSpeed, opt => opt.MapFrom (src => src.MaxSpeed))
                .ForMember (dest => dest.AvgSpeed, opt => opt.MapFrom (src => src.AvgSpeed))
                .ForMember (dest => dest.TotalDistance, opt => opt.MapFrom (src => src.TotalDistance))
                .ForMember (dest => dest.IsAverageKm, opt => opt.MapFrom (src => src.IsKmperhr != 0))
                .ForMember (dest => dest.FuelLost, opt => opt.MapFrom (src => src.FuelLost))
                .ForMember (dest => dest.FlowMeterFuelUsed, opt => opt.MapFrom (src => src.FlowMeterFuelUsed))
                .ForMember (dest => dest.FlowMeterEffiency, opt => opt.MapFrom (src => src.FlowMeterEffiency))
                .ForMember (dest => dest.EngHours, opt => opt.MapFrom (src => src.EngHours))
                .ForMember (dest => dest.IsModified, opt => opt.MapFrom (src => src.IsModified))
                .ForMember (dest => dest.Site, opt => opt.MapFrom (src => src.Site))
                .ForMember (dest => dest.FlowMeterEngineHrs, opt => opt.MapFrom (src => src.FlowMeterEngineHrs))
                .ReverseMap ();

            // Tag mappings
            CreateMap<Tag, TagDTO> ()
                .ForMember (dest => dest.IsMaster, opt => opt.MapFrom (src => src.IsMaster != 0))
                .ReverseMap ()
                .ForMember (dest => dest.IsMaster, opt => opt.MapFrom (src => src.IsMaster ? (sbyte) 1 : (sbyte) 0));

            // PTS Device mappings - mapping from CreatePTSDeviceDTO to Ptsdevice
            CreateMap<CreatePTSDeviceDTO, Ptsdevice> ().ReverseMap ();

            // Cursor: New specific mapping for ConsumptionDTO Import/Result
            CreateMap<ConsumptionDTO, Vehicleconsumption> ()
                .ForMember (dest => dest.EmployeeName, opt => opt.MapFrom (src => src.EmployeeName))
                .ForMember (dest => dest.IsKmperhr, opt => opt.MapFrom (src => src.IsKmPerHr ? 1UL : 0UL))
                .ForMember (dest => dest.IsNightShift, opt => opt.MapFrom (src => src.IsNightShift ? 1UL : 0UL))
                .ForMember (dest => dest.IsModified, opt => opt.MapFrom (src => src.IsModified))
                .ForMember (dest => dest.Id, opt => opt.Ignore ())
                .ForMember (dest => dest.Site, opt => opt.Ignore ())
                .ForMember (dest => dest.Vehicle, opt => opt.Ignore ())
                .ReverseMap ();

            CreateMap<Vehicleconsumption, ConsumptionDTO> ()
                .ForMember (dest => dest.EmployeeName, opt => opt.MapFrom (src => src.EmployeeName))
                .ForMember (dest => dest.IsKmPerHr, opt => opt.MapFrom (src => src.IsKmperhr != 0))
                .ForMember (dest => dest.IsNightShift, opt => opt.MapFrom (src => src.IsNightShift != 0))
                .ForMember (dest => dest.IsModified, opt => opt.MapFrom (src => src.IsModified))
                .ForMember (dest => dest.OverwriteExisting, opt => opt.Ignore ());
        }
    }
}