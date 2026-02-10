/**
 * File: DeliveryMappingProfile.cs
 * Purpose: AutoMapper profile for delivery/fuel-refill DTO transformations.
 * Dependencies: AutoMapper, Domain entities, FuelRefilDTO
 * Last Modified: 2026-02-09
 *
 * Key Mappings:
 * - FuelRefill -> FuelRefilDTO includes site display name and unit mode.
 */
using System;
using AutoMapper;
using FMS.Application.Features.FMS.Delivery.cs;
using FMS.Application.Features.FMS.FuelRefil;
using FMS.Application.Features.FMS.Supplier;
using FMS.Domain.Entities;

namespace FMS.Application.MappingProfile
{
    public class DeliveryMappingProfile : Profile
    {
        public DeliveryMappingProfile()
        {
            CreateMap<Delivery, DeliveryDTO>().ReverseMap();
            CreateMap<Supplier, SupplierDTO>().ReverseMap();

            CreateMap<FuelRefill, FuelRefilDTO>()
                .ForMember(dest => dest.IsModified, opt => opt.MapFrom(src => src.IsModified.HasValue && src.IsModified.Value != 0))
                .ForMember(dest => dest.Date, opt => opt.MapFrom(src => src.Date.HasValue && src.Date.Value.Year > 1900 ? src.Date : (DateTime?)null))
                .ForMember(dest => dest.DateCreated, opt => opt.MapFrom(src => src.DateCreated.ToString("yyyy-MM-ddTHH:mm:ssZ")))
                .ForMember(dest => dest.HyoungNo, opt => opt.MapFrom(src => src.Vehicle != null ? src.Vehicle.HyoungNo : null))
                .ForMember(dest => dest.SiteName, opt => opt.MapFrom(src => src.Site != null ? src.Site.Name : null))
                .ForMember(dest => dest.IsKmPerLiter, opt => opt.MapFrom(src => src.Vehicle != null && src.Vehicle.AverageKmL))
                .ReverseMap()
                // CRITICAL: Ignore all navigation properties on reverse map to prevent
                // AutoMapper unflattening from creating new entity instances (e.g., SiteName → new Site { Name = ... })
                // which EF Core would then try to INSERT as new records.
                .ForMember(dest => dest.Site, opt => opt.Ignore())
                .ForMember(dest => dest.Vehicle, opt => opt.Ignore())
                .ForMember(dest => dest.Tank, opt => opt.Ignore())
                .ForMember(dest => dest.Driver, opt => opt.Ignore())
                .ForMember(dest => dest.FuelByNavigation, opt => opt.Ignore())
                .ForMember(dest => dest.DeletedByNavigation, opt => opt.Ignore())
                .ForMember(dest => dest.PumpTranscation, opt => opt.Ignore())
                .ForMember(dest => dest.TagNavigation, opt => opt.Ignore())
                .ForMember(dest => dest.CorrectsRecord, opt => opt.Ignore())
                .ForMember(dest => dest.CorrectionRecords, opt => opt.Ignore())
                .ForMember(dest => dest.TagId, opt => opt.MapFrom(src => src.TagId))
                .ForMember(dest => dest.IsModified, opt => opt.MapFrom(src => src.IsModified ? (sbyte)1 : (sbyte)0));
        }
    }
}
