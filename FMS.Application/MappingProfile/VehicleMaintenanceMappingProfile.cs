using AutoMapper;
using FMS.Application.Features.VehicleMaintenance.DTOs;
using FMS.Domain.Entities.Features.VehicleManagement;

namespace FMS.Application.MappingProfile;

/// <summary>
/// AutoMapper profile for Vehicle Maintenance entities
/// </summary>
public class VehicleMaintenanceMappingProfile : Profile
{
    public VehicleMaintenanceMappingProfile()
    {
        // VehicleMaintenance mappings
        CreateMap<VehicleMaintenance, VehicleMaintenanceDTO>()
            .ForMember(dest => dest.VehicleName, opt => opt.MapFrom(src => src.Vehicle != null ? src.Vehicle.VehicleCode : null))
            .ForMember(dest => dest.NumberPlate, opt => opt.MapFrom(src => src.Vehicle != null ? src.Vehicle.NumberPlate : null))
            .ForMember(dest => dest.MaintenanceScheduleName, opt => opt.MapFrom(src => src.MaintenanceSchedule != null ? src.MaintenanceSchedule.MaintenanceType : null))
            .ForMember(dest => dest.Issues, opt => opt.MapFrom(src => src.Issues))
            .ReverseMap()
            .ForMember(dest => dest.Vehicle, opt => opt.Ignore())
            .ForMember(dest => dest.MaintenanceSchedule, opt => opt.Ignore())
            .ForMember(dest => dest.Issues, opt => opt.Ignore());

        // MaintenanceSchedule mappings
        CreateMap<MaintenanceSchedule, MaintenanceScheduleDTO>()
            .ForMember(dest => dest.VehicleTypeName, opt => opt.MapFrom(src => src.VehicleType != null ? src.VehicleType.Name : null))
            .ForMember(dest => dest.VehicleName, opt => opt.MapFrom(src => src.Vehicle != null ? src.Vehicle.VehicleCode : null))
            .ReverseMap()
            .ForMember(dest => dest.Vehicle, opt => opt.Ignore())
            .ForMember(dest => dest.VehicleType, opt => opt.Ignore())
            .ForMember(dest => dest.MaintenanceRecords, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedByNavigation, opt => opt.Ignore())
            .ForMember(dest => dest.ModifiedByNavigation, opt => opt.Ignore());

        // MaintenanceIssue mappings
        CreateMap<MaintenanceIssue, MaintenanceIssueDTO>()
            .ReverseMap()
            .ForMember(dest => dest.Maintenance, opt => opt.Ignore());
    }
}
