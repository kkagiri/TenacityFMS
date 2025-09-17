using AutoMapper;
using FMS.Application.Features.FMS.Tank;
using FMS.Application.Features.FMS.TankReconciliation;
using FMS.Application.Features.FMS.TankStock;
using FMS.Application.Features.FMS.TankTransfer;
using FMS.Application.Features.FMS.TankVolumeHistory;
using FMS.Domain.Entities;
using FMS.Domain.Entities.Features.TankStockManagement;

namespace FMS.Application.MappingProfile {
    public class TankMappingProfile : Profile {
        public TankMappingProfile () {
            CreateMap<Tank, TankDTO> ()
                .ForMember (dest => dest.SiteName, opt => opt.MapFrom (src => src.Site.Name))
                .ForMember (dest => dest.UseBookKeeping, opt => opt.MapFrom (src => src.UseBookKeeping.HasValue && src.UseBookKeeping.Value != 0))
                .ReverseMap ()
                .ForMember (dest => dest.UseBookKeeping, opt => opt.MapFrom (src => ConvertBoolToSbyte (src.UseBookKeeping)));

            CreateMap<Tankstock, TankStockDTO> ()
                .ForMember (dest => dest.EntryType, opt => opt.MapFrom (src => src.EntryType.ToString ()))
                .ReverseMap ();

            CreateMap<TankTransfer, TankTransferDTO> ()
                .ForMember (dest => dest.Date, opt => opt.MapFrom (src => src.TransferDate.Value.ToString ("yyyy-MM-ddTHH:mm:ssZ")))
                .ReverseMap ();

            CreateMap<TankVolumeHistory, TankVolumeHistoryDTO> ()
                .ForMember (dest => dest.ChangeReason, opt => opt.MapFrom (src => src.ChangeReason.ToString ()))
                .ForMember (dest => dest.Site, opt => opt.MapFrom (src => src.Tank.Site.Name))
                .ForMember (dest => dest.SiteId, opt => opt.MapFrom (src => src.Tank.Site.Id))
                .ReverseMap ();

            CreateMap<Dailytankreconciliation, TankReconcillationDTO> ()
                .ForMember (dest => dest.TankName, opt => opt.MapFrom (src => src.Tank.Name))
                .ForMember (dest => dest.SiteName, opt => opt.MapFrom (src => src.Tank.Site.Name))
                .ReverseMap ();
        }

        private static sbyte? ConvertBoolToSbyte (bool? value) {
            return value.HasValue ? (sbyte?) (value.Value ? 1 : 0) : null;
        }
    }
}