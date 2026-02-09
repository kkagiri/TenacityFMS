using System;
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
                (src.Driver != null ? src.Driver.FullName : null)))
            .ForMember(dest => dest.DocumentUrl, opt => opt.MapFrom(src => NormalizeFileUrl(src.DocumentUrl)));

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

    /// <summary>
    /// Normalizes file URLs for backward compatibility.
    /// Old records have "vehicle-transfers/abc.pdf", new records have "/api/v1/files/vehicle-transfers/abc.pdf".
    /// Ensures all URLs are returned in the API-routable format.
    /// </summary>
    private static string NormalizeFileUrl(string url)
    {
        if (string.IsNullOrEmpty(url))
            return url;

        // Already in correct format
        if (url.StartsWith("/api/v1/files/", StringComparison.OrdinalIgnoreCase))
            return url;

        // Strip leading slash if present
        var normalized = url.TrimStart('/');

        // Strip /uploads/ prefix if present (intermediate format)
        if (normalized.StartsWith("uploads/", StringComparison.OrdinalIgnoreCase))
            normalized = normalized.Substring("uploads/".Length);

        return $"/api/v1/files/{normalized}";
    }
}
