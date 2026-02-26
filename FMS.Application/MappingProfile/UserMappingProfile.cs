using AutoMapper;
using FMS.Application.Features.FMS.UserActivities;
using FMS.Application.Features.FMS.UserManagement;
using FMS.Domain.Entities;

namespace FMS.Application.MappingProfile
{
    public class UserMappingProfile : Profile
    {
        public UserMappingProfile()
        {
            CreateMap<User, UserDto>().ReverseMap();

            CreateMap<UserActivity, UserActivityDTO>()
                .ForMember(dest => dest.UserName, opt => opt.MapFrom(src => src.User != null ? src.User.UserName : "Unknown"))
                .ReverseMap();

            CreateMap<Loginactivity, LoginActivityDTO>().ReverseMap();

            CreateMap<Role, RoleDto>()
                .ForMember(dest => dest.Id, opt => opt.MapFrom(src => src.Id))
                .ForMember(dest => dest.Name, opt => opt.MapFrom(src => src.Name))
                .ForMember(dest => dest.Description, opt => opt.MapFrom(src => src.Description))
                .ReverseMap();

            CreateMap<Permission, PermissionDTO>().ReverseMap();
        }
    }
}