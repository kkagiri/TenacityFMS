using AutoMapper;
using FMS.Application.Features.Site.DTOs;
using FMS.Domain.Entities;

namespace FMS.Application.MappingProfile
{
    public class SiteMappingProfile : Profile
    {
        public SiteMappingProfile()
        {
            CreateMap<Site, SiteDTO>()
                .ForMember(dest => dest.Name, opt => opt.MapFrom(src => src.Name.ToUpper()))
                .ForMember(dest => dest.IsActive, opt => opt.MapFrom(src => src.IsActive))
                .ForMember(dest => dest.SiteAdministratorId, opt => opt.MapFrom(src => src.SiteAdministratorId))
                .ForMember(dest => dest.SiteAdministratorName, opt => opt.MapFrom(src =>
                    src.SiteAdministrator != null ? src.SiteAdministrator.UserName : null))
                .ForMember(dest => dest.GpsGateTagId, opt => opt.MapFrom(src => src.GpsGateTagId))
                .ForMember(dest => dest.GpsGateTagName, opt => opt.MapFrom(src => src.GpsGateTagName))
                .ForMember(dest => dest.AutoUpdateGpsGateTag, opt => opt.MapFrom(src => src.AutoUpdateGpsGateTag))
                .ReverseMap();

            CreateMap<CreateSiteDTO, Site>()
                .ForMember(dest => dest.IsActive, opt => opt.MapFrom(src => src.IsActive))
                .ForMember(dest => dest.SiteAdministratorId, opt => opt.MapFrom(src => src.SiteAdministratorId))
                .ForMember(dest => dest.GpsGateTagId, opt => opt.MapFrom(src => src.GpsGateTagId))
                .ForMember(dest => dest.GpsGateTagName, opt => opt.MapFrom(src => src.GpsGateTagName))
                .ForMember(dest => dest.AutoUpdateGpsGateTag, opt => opt.MapFrom(src => src.AutoUpdateGpsGateTag))
                .ReverseMap();

            CreateMap<UpdateSiteDTO, Site>()
                .ForMember(dest => dest.IsActive, opt => opt.MapFrom(src => src.IsActive))
                .ForMember(dest => dest.SiteAdministratorId, opt => opt.MapFrom(src => src.SiteAdministratorId))
                .ForMember(dest => dest.GpsGateTagId, opt => opt.MapFrom(src => src.GpsGateTagId))
                .ForMember(dest => dest.GpsGateTagName, opt => opt.MapFrom(src => src.GpsGateTagName))
                .ForMember(dest => dest.AutoUpdateGpsGateTag, opt => opt.MapFrom(src => src.AutoUpdateGpsGateTag))
                .ReverseMap();
        }
    }
}