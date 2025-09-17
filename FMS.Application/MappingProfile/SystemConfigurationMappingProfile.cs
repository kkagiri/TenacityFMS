using AutoMapper;
using FMS.Application.Features.SystemConfiguration;
using FMS.Domain.Entities;

namespace FMS.Application.MappingProfile {
    public class SystemConfigurationMappingProfile : Profile {
        public SystemConfigurationMappingProfile () {
            // Entity to DTO mappings
            CreateMap<SystemConfiguration, SystemConfigurationDto> ()
                .ReverseMap ()
                .ForMember (dest => dest.CreatedAt, opt => opt.Ignore ())
                .ForMember (dest => dest.UpdatedAt, opt => opt.Ignore ())
                .ForMember (dest => dest.CreatedBy, opt => opt.Ignore ())
                .ForMember (dest => dest.UpdatedBy, opt => opt.Ignore ());

            // Create DTO to Entity mapping
            CreateMap<CreateSystemConfigurationDto, SystemConfiguration> ()
                .ForMember (dest => dest.Id, opt => opt.Ignore ())
                .ForMember (dest => dest.CreatedAt, opt => opt.Ignore ())
                .ForMember (dest => dest.UpdatedAt, opt => opt.Ignore ())
                .ForMember (dest => dest.CreatedBy, opt => opt.Ignore ())
                .ForMember (dest => dest.UpdatedBy, opt => opt.Ignore ());

            // Update DTO to Entity mapping
            CreateMap<UpdateSystemConfigurationDto, SystemConfiguration> ()
                .ForMember (dest => dest.CreatedAt, opt => opt.Ignore ())
                .ForMember (dest => dest.UpdatedAt, opt => opt.Ignore ())
                .ForMember (dest => dest.CreatedBy, opt => opt.Ignore ())
                .ForMember (dest => dest.UpdatedBy, opt => opt.Ignore ());
        }
    }
}