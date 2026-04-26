using System.Linq;
using AutoMapper;
using FMS.Application.Features.Vehicle.DTOs;
using FMS.Domain.Entities;

namespace FMS.Application.MappingProfile
{
    public class VehicleMappingProfile : Profile
    {
        public VehicleMappingProfile()
        {
            CreateMap<Vehicle, VehicleDTO>()
                .ForMember(dest => dest.IsCompanyVehicle, opt => opt.MapFrom(src => src.IsCompanyVehicle.HasValue && src.IsCompanyVehicle.Value != 0))
                .ForMember(dest => dest.IsActive, opt => opt.MapFrom(src => src.IsActive.HasValue && src.IsActive.Value != 0))
                .ForMember(dest => dest.Tags, opt => opt.MapFrom(src => src.Tags.Select(t => t.Name).ToList()))
                .ForMember(dest => dest.FuelTankCapacity, opt => opt.MapFrom(src => src.FuelTankCapacity))
                .ForMember(dest => dest.IsFullTankPolicy, opt => opt.MapFrom(src => src.IsFullTankPolicy))
                .ReverseMap()
                .ForMember(dest => dest.IsCompanyVehicle, opt => opt.MapFrom(src => ConvertBoolToSbyte(src.IsCompanyVehicle)))
                .ForMember(dest => dest.IsActive, opt => opt.MapFrom(src => ConvertBoolToSbyte(src.IsActive)));

            CreateMap<Vehicle, SimpleVehicleDto>()
                .ForMember(dest => dest.VehicleId, opt => opt.MapFrom(src => src.VehicleId))
                .ForMember(dest => dest.VehicleCode, opt => opt.MapFrom(src => src.VehicleCode))
                .ReverseMap();

            CreateMap<Vehiclemodel, VehicleModelDto>()
                .ForMember(dest => dest.Id, opt => opt.MapFrom(src => src.Id))
                .ForMember(dest => dest.Name, opt => opt.MapFrom(src => src.Name))
                .ForMember(dest => dest.ManufacturerId, opt => opt.MapFrom(src => src.ManufacturerId))
                .ReverseMap();
        }

        private static sbyte? ConvertBoolToSbyte(bool? value)
        {
            return value.HasValue ? (sbyte?)(value.Value ? 1 : 0) : null;
        }
    }
}