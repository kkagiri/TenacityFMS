using AutoMapper;
using FMS.Application.Features.FuelTagManagement.FuelingTags.DTOs;
using FMS.Domain.Entities;

namespace FMS.Application.MappingProfile {
    public class TagMappingProfile : Profile {
        public TagMappingProfile () {
            CreateMap<FuelTag, FuelTagDTO> ()
                .ForMember (dest => dest.IsMaster, opt => opt.MapFrom (src => src.IsMaster != 0))
                .ReverseMap ()
                .ForMember (dest => dest.IsMaster, opt => opt.MapFrom (src => src.IsMaster ? (sbyte) 1 : (sbyte) 0));
        }
    }
}