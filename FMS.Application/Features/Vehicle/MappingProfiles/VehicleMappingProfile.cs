using System.Linq;
using AutoMapper;
using FMS.Application.Features.Vehicle.DTOs;
using FMS.Domain.Entities;

namespace FMS.Application.Features.Vehicle.MappingProfiles {
    public class VehicleMappingProfile : Profile {
        public VehicleMappingProfile () {
            CreateMap<Domain.Entities.Vehicle, VehicleDTO> ()
                .ForMember (dest => dest.HasGPSInstalled, opt => opt.MapFrom (src => src.HasGPSInstalled == 1))
                .ForMember (dest => dest.GpsgategeneratedId, opt => opt.MapFrom (src => src.GpsgategeneratedId == 1))
                .ForMember (dest => dest.IsCompanyVehicle, opt => opt.MapFrom (src => src.IsCompanyVehicle == 1))
                .ForMember (dest => dest.IsActive, opt => opt.MapFrom (src => src.IsActive == 1))
                .ForMember (dest => dest.Tags, opt => opt.MapFrom (src => src.Tags.Select (t => t.Name).ToList ()))

                .ForMember (dest => dest.ExpectedAverageValue, opt => opt.MapFrom (src => src.DefaultExptdAvg.ExpectedAverageValue));

            CreateMap<VehicleDTO, Domain.Entities.Vehicle> ()
                .ForMember (dest => dest.HasGPSInstalled, opt => opt.MapFrom (src => src.HasGPSInstalled ? (sbyte) 1 : (sbyte) 0))
                .ForMember (dest => dest.GpsgategeneratedId, opt => opt.MapFrom (src => src.GpsgategeneratedId ? (sbyte) 1 : (sbyte) 0))
                .ForMember (dest => dest.IsCompanyVehicle, opt => opt.MapFrom (src => src.IsCompanyVehicle.HasValue?(sbyte) 1: (sbyte) 0))
                .ForMember (dest => dest.IsActive, opt => opt.MapFrom (src => src.IsActive.HasValue ? (sbyte) 1 : (sbyte) 0));
        }
    }
}