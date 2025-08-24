using AutoMapper;
using FMS.Application.ModelsDTOs.Dashboard;
using FMS.Domain.Entities.Dashboard;

namespace FMS.Application.MappingProfile {
    public class DashboardMappingProfile : Profile {
        public DashboardMappingProfile () {
            CreateMap<DashboardTickerTemplate, DashboardTickerTemplateDto> ();
            CreateMap<UserDashboardPreference, UserDashboardPreferenceDto> ();
        }
    }
}