using AutoMapper;
using FMS.Application.Command.DatabaseCommand.ConsumtionCmd.Update;
using FMS.Application.Features.FMS.Consumption;
using FMS.Application.Features.Vehicle.DTOs;
using FMS.Domain.Entities;

namespace FMS.Application.MappingProfile
{
    public class ConsumptionMappingProfile : Profile
    {
        public ConsumptionMappingProfile()
        {
            CreateMap<Vehicleconsumption, HistoryConsumptionDTO>()
                .ForMember(dest => dest.Id, opt => opt.MapFrom(src => src.Id))
                .ForMember(dest => dest.TotalFuel, opt => opt.MapFrom(src => src.TotalFuel))
                .ForMember(dest => dest.ExpectedAveraged, opt => opt.MapFrom(src => src.ExpectedConsumption))
                .ForMember(dest => dest.Employee, opt => opt.MapFrom(src => src.EmployeeName))
                .ForMember(dest => dest.Site, opt => opt.MapFrom(src => src.Site.Name))
                .ForMember(dest => dest.ExcessWorkingHrCost, opt => opt.MapFrom(src => src.ExcessWorkingHrsCost))
                .ForMember(dest => dest.Date, opt => opt.MapFrom(src => src.Date))
                .ForMember(dest => dest.MaxSpeed, opt => opt.MapFrom(src => src.MaxSpeed))
                .ForMember(dest => dest.AvgSpeed, opt => opt.MapFrom(src => src.AvgSpeed))
                .ForMember(dest => dest.TotalDistance, opt => opt.MapFrom(src => src.TotalDistance))
                .ForMember(dest => dest.FlowMeterFuelUsed, opt => opt.MapFrom(src => src.FlowMeterFuelUsed))
                .ForMember(dest => dest.FlowMeterFuelLost, opt => opt.MapFrom(src => src.FlowMeterFuelLost))
                .ForMember(dest => dest.FlowMeterEngineHrs, opt => opt.MapFrom(src => src.FlowMeterEngineHrs))
                .ForMember(dest => dest.IsAverageKm, opt => opt.MapFrom(src => src.IsKmperLiter != 0))
                .ForMember(dest => dest.IsNightShift, opt => opt.MapFrom(src => src.IsNightShift != 0))
                .ForMember(dest => dest.EngHours, opt => opt.MapFrom(src => src.EngHours))
                .ForMember(dest => dest.Comments, opt => opt.MapFrom(src => src.Comments));

            CreateMap<ComsumptionUpdateCmd, Vehicleconsumption>()
                .ForMember(dest => dest.VehicleId, opt => opt.MapFrom(src => src.VehicleId))
                .ForMember(dest => dest.TotalFuel, opt => opt.MapFrom(src => src.TotalFuel))
                .ForMember(dest => dest.ExpectedConsumption, opt => opt.MapFrom(src => src.ExcessWorkingHrsCost))
                .ForMember(dest => dest.EmployeeName, opt => opt.Ignore())
                .ForMember(dest => dest.Date, opt => opt.MapFrom(src => src.Date))
                .ForMember(dest => dest.MaxSpeed, opt => opt.MapFrom(src => src.MaxSpeed))
                .ForMember(dest => dest.AvgSpeed, opt => opt.MapFrom(src => src.AvgSpeed))
                .ForMember(dest => dest.TotalDistance, opt => opt.MapFrom(src => src.TotalDistance))
                .ForMember(dest => dest.IsKmperLiter, opt => opt.MapFrom(src => src.IsKmperLiter))
                .ForMember(dest => dest.FuelLost, opt => opt.MapFrom(src => src.FuelLost))
                .ForMember(dest => dest.FlowMeterFuelUsed, opt => opt.MapFrom(src => src.FlowMeterFuelUsed))
                .ForMember(dest => dest.FlowMeterEffiency, opt => opt.MapFrom(src => src.FlowMeterEffiency))
                .ForMember(dest => dest.FuelEfficiency, opt => opt.MapFrom(src => src.FuelEfficiency))
                .ForMember(dest => dest.EngHours, opt => opt.MapFrom(src => src.EngHours))
                .ForMember(dest => dest.FlowMeterEngineHrs, opt => opt.MapFrom(src => src.FlowMeterEngineHrs))
                .ReverseMap();

            CreateMap<Vehicleconsumption, VehicleConsumptionInfoDTO>()
                .ForMember(dest => dest.VehicleId, opt => opt.MapFrom(src => src.VehicleId))
                .ForMember(dest => dest.TotalFuel, opt => opt.MapFrom(src => src.TotalFuel))
                .ForMember(dest => dest.VehicleCode, opt => opt.MapFrom(src => src.Vehicle.VehicleCode))
                .ForMember(dest => dest.VehicleType, opt => opt.MapFrom(src => src.Vehicle.VehicleType.Abbvr))
                .ForMember(dest => dest.VehicleManufacturer, opt => opt.MapFrom(src => src.Vehicle.VehicleManufacturer.Name))
                .ForMember(dest => dest.VehicleModel, opt => opt.MapFrom(src => src.Vehicle.VehicleModel.Name))
                .ForMember(dest => dest.Date, opt => opt.MapFrom(src => src.Date))
                .ForMember(dest => dest.MaxSpeed, opt => opt.MapFrom(src => src.MaxSpeed))
                .ForMember(dest => dest.AvgSpeed, opt => opt.MapFrom(src => src.AvgSpeed))
                .ForMember(dest => dest.TotalDistance, opt => opt.MapFrom(src => src.TotalDistance))
                .ForMember(dest => dest.IsAverageKm, opt => opt.MapFrom(src => src.IsKmperLiter != 0))
                .ForMember(dest => dest.FuelLost, opt => opt.MapFrom(src => src.FuelLost))
                .ForMember(dest => dest.FlowMeterFuelUsed, opt => opt.MapFrom(src => src.FlowMeterFuelUsed))
                .ForMember(dest => dest.FlowMeterEffiency, opt => opt.MapFrom(src => src.FlowMeterEffiency))
                .ForMember(dest => dest.EngHours, opt => opt.MapFrom(src => src.EngHours))
                .ForMember(dest => dest.IsModified, opt => opt.MapFrom(src => src.IsModified))
                .ForMember(dest => dest.Site, opt => opt.MapFrom(src => src.Site))
                .ForMember(dest => dest.FlowMeterEngineHrs, opt => opt.MapFrom(src => src.FlowMeterEngineHrs))
                .ReverseMap();

            CreateMap<ConsumptionDTO, Vehicleconsumption>()
                .ForMember(dest => dest.EmployeeName, opt => opt.MapFrom(src => src.EmployeeName))
                .ForMember(dest => dest.IsKmperLiter, opt => opt.MapFrom(src => src.IsKmperLiter ? 1UL : 0UL))
                .ForMember(dest => dest.IsNightShift, opt => opt.MapFrom(src => src.IsNightShift ? 1UL : 0UL))
                .ForMember(dest => dest.IsModified, opt => opt.MapFrom(src => src.IsModified))
                .ForMember(dest => dest.Id, opt => opt.Ignore())
                .ForMember(dest => dest.Site, opt => opt.Ignore())
                .ForMember(dest => dest.Vehicle, opt => opt.Ignore())
                .ReverseMap()
                .ForMember(dest => dest.IsKmperLiter, opt => opt.MapFrom(src => src.IsKmperLiter != 0))
                .ForMember(dest => dest.IsNightShift, opt => opt.MapFrom(src => src.IsNightShift != 0))
                .ForMember(dest => dest.OverwriteExisting, opt => opt.Ignore());
        }
    }
}