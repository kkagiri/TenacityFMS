using System;
using AutoMapper;
using FMS.Application.Features.FMS.Delivery.cs;
using FMS.Application.Features.FMS.FuelRefil;
using FMS.Application.Features.FMS.Supplier;
using FMS.Domain.Entities;

namespace FMS.Application.MappingProfile {
    public class DeliveryMappingProfile : Profile {
        public DeliveryMappingProfile () {
            CreateMap<Delivery, DeliveryDTO> ().ReverseMap ();
            CreateMap<Supplier, SupplierDTO> ().ReverseMap ();

            CreateMap<FuelRefill, FuelRefilDTO> ()
                .ForMember (dest => dest.IsModified, opt => opt.MapFrom (src => src.IsModified.HasValue && src.IsModified.Value != 0))
                .ForMember (dest => dest.Date, opt => opt.MapFrom (src => src.Date.HasValue && src.Date.Value.Year > 1900 ? src.Date : (DateTime?) null))
                .ForMember (dest => dest.DateCreated, opt => opt.MapFrom (src => src.DateCreated.ToString ("yyyy-MM-ddTHH:mm:ssZ")))
                .ForMember (dest => dest.HyoungNo, opt => opt.MapFrom (src => src.Vehicle != null ? src.Vehicle.HyoungNo : null))
                .ReverseMap ()
                .ForMember (dest => dest.TagId, opt => opt.MapFrom (src => src.TagId))
                .ForMember (dest => dest.IsModified, opt => opt.MapFrom (src => src.IsModified ? (sbyte) 1 : (sbyte) 0));
        }
    }
}