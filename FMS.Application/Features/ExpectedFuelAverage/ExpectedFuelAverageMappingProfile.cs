using AutoMapper;
using FMS.Application.Features.ExpectedFuelAverage.DTOs;
using FMS.Domain.Entities;

namespace FMS.Application.Features.ExpectedFuelAverage;

/// <summary>
/// AutoMapper profile for Expected Fuel Average related entities
/// </summary>
public class ExpectedFuelAverageMappingProfile : Profile
{
    public ExpectedFuelAverageMappingProfile()
    {
        // FuelRoute mappings
        CreateMap<FuelRoute, FuelRouteDTO>()
            .ForMember(dest => dest.SiteName, opt => opt.MapFrom(src => src.Site != null ? src.Site.Name : null));

        CreateMap<FuelRouteDTO, FuelRoute>()
            .ForMember(dest => dest.Site, opt => opt.Ignore())
            .ForMember(dest => dest.ExpectedFuelAverageTemplates, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedAt, opt => opt.Ignore());

        // LoadClassification mappings
        CreateMap<LoadClassification, LoadClassificationDTO>();
        CreateMap<LoadClassificationDTO, LoadClassification>()
            .ForMember(dest => dest.ExpectedFuelAverageTemplates, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedAt, opt => opt.Ignore());

        // UsageIntensity mappings
        CreateMap<UsageIntensity, UsageIntensityDTO>();
        CreateMap<UsageIntensityDTO, UsageIntensity>()
            .ForMember(dest => dest.ExpectedFuelAverageTemplates, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedAt, opt => opt.Ignore());

        // ExpectedFuelAverageTemplate mappings
        CreateMap<ExpectedFuelAverageTemplate, ExpectedFuelAverageTemplateDTO>()
            .ForMember(dest => dest.VehicleTypeName, opt => opt.MapFrom(src => src.VehicleType != null ? src.VehicleType.Name : null))
            .ForMember(dest => dest.VehicleManufacturerName, opt => opt.MapFrom(src => src.VehicleManufacturer != null ? src.VehicleManufacturer.Name : null))
            .ForMember(dest => dest.VehicleModelName, opt => opt.MapFrom(src => src.VehicleModel != null ? src.VehicleModel.Name : null))
            .ForMember(dest => dest.SiteName, opt => opt.MapFrom(src => src.Site != null ? src.Site.Name : null))
            .ForMember(dest => dest.FuelRouteName, opt => opt.MapFrom(src => src.FuelRoute != null ? src.FuelRoute.Name : null))
            .ForMember(dest => dest.LoadClassificationName, opt => opt.MapFrom(src => src.LoadClassification != null ? src.LoadClassification.Name : null))
            .ForMember(dest => dest.UsageIntensityName, opt => opt.MapFrom(src => src.UsageIntensity != null ? src.UsageIntensity.Name : null));

        CreateMap<ExpectedFuelAverageTemplateDTO, ExpectedFuelAverageTemplate>()
            .ForMember(dest => dest.VehicleType, opt => opt.Ignore())
            .ForMember(dest => dest.VehicleManufacturer, opt => opt.Ignore())
            .ForMember(dest => dest.VehicleModel, opt => opt.Ignore())
            .ForMember(dest => dest.Site, opt => opt.Ignore())
            .ForMember(dest => dest.FuelRoute, opt => opt.Ignore())
            .ForMember(dest => dest.LoadClassification, opt => opt.Ignore())
            .ForMember(dest => dest.UsageIntensity, opt => opt.Ignore())
            .ForMember(dest => dest.VehicleAssignments, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedAt, opt => opt.Ignore());

        // VehicleExpectedAverageAssignment mappings
        CreateMap<VehicleExpectedAverageAssignment, VehicleExpectedAverageAssignmentDTO>()
            .ForMember(dest => dest.VehicleHyoungNo, opt => opt.MapFrom(src => src.Vehicle != null ? src.Vehicle.HyoungNo : null))
            .ForMember(dest => dest.VehicleNumberPlate, opt => opt.MapFrom(src => src.Vehicle != null ? src.Vehicle.NumberPlate : null))
            .ForMember(dest => dest.TemplateName, opt => opt.MapFrom(src => src.ExpectedFuelAverageTemplate != null ? src.ExpectedFuelAverageTemplate.Name : null))
            .ForMember(dest => dest.Template, opt => opt.MapFrom(src => src.ExpectedFuelAverageTemplate));

        CreateMap<VehicleExpectedAverageAssignmentDTO, VehicleExpectedAverageAssignment>()
            .ForMember(dest => dest.Vehicle, opt => opt.Ignore())
            .ForMember(dest => dest.ExpectedFuelAverageTemplate, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedAt, opt => opt.Ignore());
    }
}
