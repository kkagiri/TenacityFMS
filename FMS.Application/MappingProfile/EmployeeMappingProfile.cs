using System.Linq;
using AutoMapper;
using FMS.Application.Features.FMS.Employee;
using FMS.Domain.Entities;

namespace FMS.Application.MappingProfile
{
    public class EmployeeMappingProfile : Profile
    {
        public EmployeeMappingProfile()
        {
            CreateMap<Employee, EmployeeDto>()
                .ForMember(dest => dest.SiteId, opt => opt.MapFrom(src => src.SiteId))
                .ForMember(dest => dest.FullName, opt => opt.MapFrom(src => src.FullName))
                .ForMember(dest => dest.EmployeeWorkNo, opt => opt.MapFrom(src => src.EmployeeWorkNo))
                .ForMember(dest => dest.Position, opt => opt.MapFrom(src => src.Position))
                .ForMember(dest => dest.EmployeephoneNumber, opt => opt.MapFrom(src => src.EmployeephoneNumber))
                .ForMember(dest => dest.Employeestatus, opt => opt.MapFrom(src => src.Employeestatus))
                .ForMember(dest => dest.Vehicles, opt => opt.MapFrom(src => src.Vehicles.Select(v => v.VehicleId)))
                .ForMember(dest => dest.IsModified, opt => opt.MapFrom(src => src.IsModified.HasValue && src.IsModified.Value != 0))
                .ReverseMap()
                .ForMember(dest => dest.Position, opt => opt.MapFrom(src => string.IsNullOrWhiteSpace(src.Position) ? null : src.Position.Trim()))
                .ForMember(dest => dest.Vehicles, opt => opt.MapFrom(src => src.Vehicles.Select(id => new Vehicle { VehicleId = id })))
                .ForMember(dest => dest.IsModified, opt => opt.MapFrom(src => ConvertBoolToSbyte(src.IsModified)));
        }

        private static sbyte? ConvertBoolToSbyte(bool? value)
        {
            return value.HasValue ? (sbyte?)(value.Value ? 1 : 0) : null;
        }
    }
}