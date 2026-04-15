using System;
using AutoMapper;
using FMS.Application.Features.FMS.Tank;
using FMS.Application.Features.FMS.TankReconciliation;
using FMS.Application.Features.FMS.TankStock;
using FMS.Application.Features.FMS.TankTransfer;
using FMS.Application.Features.FMS.TankVolumeHistory;
using FMS.Domain.Entities;
using FMS.Domain.Entities.Enums;
using FMS.Domain.Entities.Features.TankStockManagement;

namespace FMS.Application.MappingProfile
{
    public class TankMappingProfile : Profile
    {
        public TankMappingProfile()
        {
            CreateMap<Tank, TankDTO>()
                .ForMember(dest => dest.SiteName, opt => opt.MapFrom(src => src.Site.Name))
                .ForMember(dest => dest.UseBookKeeping, opt => opt.MapFrom(src => src.UseBookKeeping.HasValue && src.UseBookKeeping.Value != 0))
                .ForMember(dest => dest.HasAutomaticBookKeeping, opt => opt.MapFrom(src => src.HasAutomaticBookKeeping.HasValue && src.HasAutomaticBookKeeping.Value != 0))
                .ForMember(dest => dest.LastStockUpdate, opt => opt.MapFrom(src => EnsureUtc(src.LastStockUpdate)))
                .ForMember(dest => dest.LastPhysicalStockUpdate, opt => opt.MapFrom(src => EnsureNullableUtc(src.LastPhysicalStockUpdate)))
                .ForMember(dest => dest.TankType, opt => opt.MapFrom(src => src.TankType.ToString()))
                .ForMember(dest => dest.LinkedVehicleName, opt => opt.MapFrom(src =>
                    src.LinkedVehicle != null
                        ? (src.LinkedVehicle.HyoungNo ?? src.LinkedVehicle.NumberPlate ?? "Unknown")
                        : null))
                .ReverseMap()
                .ForMember(dest => dest.UseBookKeeping, opt => opt.MapFrom(src => ConvertBoolToSbyte(src.UseBookKeeping)))
                .ForMember(dest => dest.HasAutomaticBookKeeping, opt => opt.MapFrom(src => ConvertBoolToSbyte(src.HasAutomaticBookKeeping)))
                .ForMember(dest => dest.TankType, opt => opt.MapFrom(src => ParseTankType(src.TankType)));

            CreateMap<Tankstock, TankStockDTO>()
                .ForMember(dest => dest.EntryType, opt => opt.MapFrom(src => src.EntryType.ToString()))
                .ReverseMap();

            CreateMap<TankTransfer, TankTransferDTO>()
                .ForMember(dest => dest.Date, opt => opt.MapFrom(src =>
                    src.TransferDate != null
                        ? DateTime.SpecifyKind(src.TransferDate ?? default, DateTimeKind.Utc)
                        : (DateTime?)null))
                .ReverseMap();

            CreateMap<TankVolumeHistory, TankVolumeHistoryDTO>()
                .ForMember(dest => dest.ChangeReason, opt => opt.MapFrom(src => src.ChangeReason.ToString()))
                .ForMember(dest => dest.Site, opt => opt.MapFrom(src => src.Tank.Site.Name))
                .ForMember(dest => dest.SiteId, opt => opt.MapFrom(src => src.Tank.Site.Id))
                .ReverseMap();

            CreateMap<Dailytankreconciliation, TankReconcillationDTO>()
                .ForMember(dest => dest.TankName, opt => opt.MapFrom(src => src.Tank.Name))
                .ForMember(dest => dest.SiteName, opt => opt.MapFrom(src => src.Tank.Site.Name))
                .ReverseMap();
        }

        private static sbyte? ConvertBoolToSbyte(bool? value)
        {
            return value.HasValue ? (sbyte?)(value.Value ? 1 : 0) : null;
        }

        private static TankType ParseTankType(string tankType)
        {
            if (string.IsNullOrEmpty(tankType))
                return TankType.Stationary;

            return Enum.TryParse<TankType>(tankType, out var result) ? result : TankType.Stationary;
        }

        private static DateTime EnsureUtc(DateTime value)
        {
            return value.Kind == DateTimeKind.Utc
                ? value
                : DateTime.SpecifyKind(value, DateTimeKind.Utc);
        }

        private static DateTime? EnsureNullableUtc(DateTime? value)
        {
            if (!value.HasValue)
            {
                return null;
            }

            return EnsureUtc(value.Value);
        }
    }
}