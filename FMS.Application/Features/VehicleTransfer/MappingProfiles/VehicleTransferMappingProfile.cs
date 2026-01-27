using AutoMapper;
using FMS.Application.Features.VehicleTransfer.DTOs;
using FMS.Domain.Entities.Features.VehicleManagement;

namespace FMS.Application.Features.VehicleTransfer.MappingProfiles;

public class VehicleTransferMappingProfile : Profile
{
    public VehicleTransferMappingProfile()
    {
        // VehicleTransfer -> VehicleTransferDTO
        CreateMap<Domain.Entities.Features.VehicleManagement.VehicleTransfer, VehicleTransferDTO>()
            .ForMember(dest => dest.VehicleHyoungNo, opt => opt.MapFrom(src => src.Vehicle != null ? src.Vehicle.HyoungNo : null))
            .ForMember(dest => dest.VehicleNumberPlate, opt => opt.MapFrom(src => src.Vehicle != null ? src.Vehicle.NumberPlate : null))
            .ForMember(dest => dest.FromSiteName, opt => opt.MapFrom(src => src.FromSite != null ? src.FromSite.Name : null))
            .ForMember(dest => dest.ToSiteName, opt => opt.MapFrom(src => src.ToSite != null ? src.ToSite.Name : null))
            .ForMember(dest => dest.DriverName, opt => opt.MapFrom(src =>
                !string.IsNullOrEmpty(src.DriverName) ? src.DriverName :
                (src.Driver != null ? src.Driver.FullName : null)));

        // VehicleTransferCheckupItem -> VehicleTransferCheckupItemDTO
        CreateMap<VehicleTransferCheckupItem, VehicleTransferCheckupItemDTO>();

        // VehicleTransferTyreDetail -> VehicleTransferTyreDetailDTO
        CreateMap<VehicleTransferTyreDetail, VehicleTransferTyreDetailDTO>();

        // VehicleTransferBatteryDetail -> VehicleTransferBatteryDetailDTO
        CreateMap<VehicleTransferBatteryDetail, VehicleTransferBatteryDetailDTO>();

        // Reverse mappings for create/update
        CreateMap<VehicleTransferDTO, Domain.Entities.Features.VehicleManagement.VehicleTransfer>();
        CreateMap<VehicleTransferCheckupItemDTO, VehicleTransferCheckupItem>();
        CreateMap<VehicleTransferTyreDetailDTO, VehicleTransferTyreDetail>();
        CreateMap<VehicleTransferBatteryDetailDTO, VehicleTransferBatteryDetail>();

        // Create DTOs to entities
        CreateMap<CreateCheckupItemDTO, VehicleTransferCheckupItem>();
        CreateMap<CreateTyreDetailDTO, VehicleTransferTyreDetail>();
        CreateMap<CreateBatteryDetailDTO, VehicleTransferBatteryDetail>();
    }
}
