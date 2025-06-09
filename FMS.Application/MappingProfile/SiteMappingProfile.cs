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
                .ReverseMap();

            CreateMap<CreateSiteDTO, Site>().ReverseMap();
            CreateMap<UpdateSiteDTO, Site>().ReverseMap();
        }
    }
}