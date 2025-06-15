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
        }
    }
}