using AutoMapper;
using FMS.Application.Features.GPSGate.DTOs;
using FMS.Domain.Entities.GPSGate;

namespace FMS.Application.MappingProfile
{
    public class GPSGateMappingProfile : Profile
    {
        public GPSGateMappingProfile()
        {
            // Session mappings
            CreateMap<GPSGateSession, GPSGateSessionDto>();
            CreateMap<GPSGateSessionDto, GPSGateSession>();

            // Report mappings
            CreateMap<GPSGateReport, GPSGateReportDto>();
            CreateMap<GPSGateReportDto, GPSGateReport>();
        }
    }
}
