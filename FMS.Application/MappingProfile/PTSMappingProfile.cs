using AutoMapper;
using FMS.Application.Features.PTSDevice.DTOs;
using FMS.Domain.Entities;

namespace FMS.Application.MappingProfile
{
    public class PTSMappingProfile : Profile
    {
        public PTSMappingProfile()
        {
            CreateMap<CreatePTSDeviceDTO, Ptsdevice>().ReverseMap();

            // Ptsdevice to Ptsdevice mapping for update operations
            // Ignore navigation properties and read-only fields
            CreateMap<Ptsdevice, Ptsdevice>()
                .ForMember(dest => dest.Configuration, opt => opt.Ignore())
                .ForMember(dest => dest.Intankdeliveries, opt => opt.Ignore())
                .ForMember(dest => dest.PtsDevicePendingCommands, opt => opt.Ignore())
                .ForMember(dest => dest.Pumptransactions, opt => opt.Ignore())
                .ForMember(dest => dest.Tanks, opt => opt.Ignore())
                .ForMember(dest => dest.DeviceConnections, opt => opt.Ignore())
                .ForMember(dest => dest.SiteNavigation, opt => opt.Ignore())
                .ForMember(dest => dest.Notifications, opt => opt.Ignore())
                .ForMember(dest => dest.NotificationPolicies, opt => opt.Ignore());
        }
    }
}