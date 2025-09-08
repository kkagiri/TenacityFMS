using AutoMapper;
using FMS.Application.ModelsDTOs.Dashboard;
using FMS.Domain.Entities.Dashboard;

namespace FMS.Application.MappingProfile {
    public class DashboardMappingProfile : Profile {
        public DashboardMappingProfile () {

            // New widget mappings
            CreateMap<DashboardWidgetTemplate, DashboardWidgetTemplateDto> ();
            CreateMap<DashboardWidgetInstance, DashboardWidgetInstanceDto> ()
                .ForMember (dest => dest.Template, opt => opt.MapFrom (src => src.Template));
            CreateMap<UserDashboardLayout, UserDashboardLayoutDto> ();
        }
    }
}