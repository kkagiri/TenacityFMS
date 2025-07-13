using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using AutoMapper;
using FMS.Application.ModelsDTOs.ATG;
using FMS.Application.ModelsDTOs.Configuration;
using FMS.Application.ModelsDTOs.FMS;
using FMS.Application.ModelsDTOs.PTS;
using FMS.Domain.Entities;

namespace FMS.Application.MappingProfile {

    public class AutomatedFuelingConfigurationProfile : Profile {
        public AutomatedFuelingConfigurationProfile () {
            CreateMap<AutomatedFuelingConfiguration, AutomatedFuelingConfigurationDto> ()
                .ForMember (dest => dest.SiteName, opt => opt.MapFrom (src => src.Site != null ? src.Site.Name : null));

            CreateMap<CreateAutomatedFuelingConfigurationDto, AutomatedFuelingConfiguration> ()
                .ForMember (dest => dest.Id, opt => opt.Ignore ())
                .ForMember (dest => dest.CreatedOn, opt => opt.Ignore ())
                .ForMember (dest => dest.ModifiedOn, opt => opt.Ignore ())
                .ForMember (dest => dest.CreatedBy, opt => opt.Ignore ())
                .ForMember (dest => dest.ModifiedBy, opt => opt.Ignore ())
                .ForMember (dest => dest.Site, opt => opt.Ignore ());

            CreateMap<UpdateAutomatedFuelingConfigurationDto, AutomatedFuelingConfiguration> ()
                .ForMember (dest => dest.SiteId, opt => opt.Ignore ())
                .ForMember (dest => dest.CreatedOn, opt => opt.Ignore ())
                .ForMember (dest => dest.ModifiedOn, opt => opt.Ignore ())
                .ForMember (dest => dest.CreatedBy, opt => opt.Ignore ())
                .ForMember (dest => dest.ModifiedBy, opt => opt.Ignore ())
                .ForMember (dest => dest.Site, opt => opt.Ignore ());

            CreateMap<AutomatedFuelingConfigurationDto, AutomatedFuelingConfiguration> ()
                .ForMember (dest => dest.Site, opt => opt.Ignore ());
        }
    }
}