using System;
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
            .ForMember(dest => dest.ComplianceCategoryName, opt => opt.MapFrom(src => src.ComplianceCategory.ToString()))
            .ForMember(dest => dest.VehicleRegistration, opt => opt.MapFrom(src => src.Vehicle.HyoungNo))
            .ForMember(dest => dest.DocumentFileUrl, opt => opt.MapFrom(src => NormalizeFileUrl(src.DocumentFileUrl)));

        CreateMap<CreateVehicleDocumentDto, VehicleDocument>();
        CreateMap<UpdateVehicleDocumentDto, VehicleDocument>();
    }

    /// <summary>
    /// Normalizes file URLs for backward compatibility.
    /// Old records have "vehicle-documents/abc.pdf", new records have "/api/v1/files/vehicle-documents/abc.pdf".
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
