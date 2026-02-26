/**
 * File: SiteMappingProfile.cs
 * Purpose: AutoMapper profile for Site domain and Site DTO mappings.
 * Dependencies: AutoMapper, Site DTOs, Site entity.
 * Last Modified: 2026-02-26
 */
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
                .ForMember(dest => dest.GpsGeofenceId, opt => opt.MapFrom(src => src.GpsGeofenceId))
                .ForMember(dest => dest.GpsGeofenceName, opt => opt.MapFrom(src => src.GpsGeofenceName))
                .ForMember(dest => dest.GpsGeofenceType, opt => opt.MapFrom(src => src.GpsGeofenceType))
                .ForMember(dest => dest.GpsGeofenceCenterLatitude, opt => opt.MapFrom(src => src.GpsGeofenceCenterLatitude))
                .ForMember(dest => dest.GpsGeofenceCenterLongitude, opt => opt.MapFrom(src => src.GpsGeofenceCenterLongitude))
                .ReverseMap();

            CreateMap<CreateSiteDTO, Site>()
                .ForMember(dest => dest.IsActive, opt => opt.MapFrom(src => src.IsActive))
                .ForMember(dest => dest.SiteAdministratorId, opt => opt.MapFrom(src => src.SiteAdministratorId))
                .ForMember(dest => dest.GpsGateTagId, opt => opt.MapFrom(src => src.GpsGateTagId))
                .ForMember(dest => dest.GpsGateTagName, opt => opt.MapFrom(src => src.GpsGateTagName))
                .ForMember(dest => dest.AutoUpdateGpsGateTag, opt => opt.MapFrom(src => src.AutoUpdateGpsGateTag))
                .ForMember(dest => dest.GpsGeofenceId, opt => opt.MapFrom(src => src.GpsGeofenceId))
                .ForMember(dest => dest.GpsGeofenceName, opt => opt.MapFrom(src => src.GpsGeofenceName))
                .ForMember(dest => dest.GpsGeofenceType, opt => opt.MapFrom(src => src.GpsGeofenceType))
                .ForMember(dest => dest.GpsGeofenceCenterLatitude, opt => opt.MapFrom(src => src.GpsGeofenceCenterLatitude))
                .ForMember(dest => dest.GpsGeofenceCenterLongitude, opt => opt.MapFrom(src => src.GpsGeofenceCenterLongitude))
                .ReverseMap();

            CreateMap<UpdateSiteDTO, Site>()
                .ForMember(dest => dest.IsActive, opt => opt.MapFrom(src => src.IsActive))
                .ForMember(dest => dest.SiteAdministratorId, opt => opt.MapFrom(src => src.SiteAdministratorId))
                .ForMember(dest => dest.GpsGateTagId, opt => opt.MapFrom(src => src.GpsGateTagId))
                .ForMember(dest => dest.GpsGateTagName, opt => opt.MapFrom(src => src.GpsGateTagName))
                .ForMember(dest => dest.AutoUpdateGpsGateTag, opt => opt.MapFrom(src => src.AutoUpdateGpsGateTag))
                .ForMember(dest => dest.GpsGeofenceId, opt => opt.MapFrom(src => src.GpsGeofenceId))
                .ForMember(dest => dest.GpsGeofenceName, opt => opt.MapFrom(src => src.GpsGeofenceName))
                .ForMember(dest => dest.GpsGeofenceType, opt => opt.MapFrom(src => src.GpsGeofenceType))
                .ForMember(dest => dest.GpsGeofenceCenterLatitude, opt => opt.MapFrom(src => src.GpsGeofenceCenterLatitude))
                .ForMember(dest => dest.GpsGeofenceCenterLongitude, opt => opt.MapFrom(src => src.GpsGeofenceCenterLongitude))
                .ReverseMap();
        }
    }
}
