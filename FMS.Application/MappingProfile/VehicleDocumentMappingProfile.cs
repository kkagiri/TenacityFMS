using AutoMapper;
using FMS.Application.Features.VehicleDocumentManagement.Dtos;
using FMS.Domain.Entities.Features.VehicleDocumentManagement;

namespace FMS.Application.MappingProfile;

public class VehicleDocumentMappingProfile : Profile
{
    public VehicleDocumentMappingProfile()
    {
        CreateMap<VehicleDocument, VehicleDocumentDto>()
            .ForMember(dest => dest.DocumentTypeName, opt => opt.MapFrom(src => src.DocumentType.ToString()))
            .ForMember(dest => dest.VehicleRegistration, opt => opt.MapFrom(src => src.Vehicle.HyoungNo));

        CreateMap<CreateVehicleDocumentDto, VehicleDocument>();
        CreateMap<UpdateVehicleDocumentDto, VehicleDocument>();
    }
}
